import { EntityManager } from 'typeorm';
import AppError from '@shared/errors/AppError';
import {
  estimatedInterval,
  EXPIRY_MS,
  fingerprint,
  Observation,
} from './policy';

export type Identity = {
  actor_user_id: string;
  actor_sync_id: string;
  asset_id: string;
  asset_sync_id: string;
};
export type Authorize = (actor: string, asset: string) => Promise<Identity>;

export class ActivityLedger {
  constructor(
    private db: EntityManager,
    private authorize: Authorize,
    private sourceNode: string,
  ) {
    if (!/^[a-zA-Z0-9_.-]{1,64}$/.test(sourceNode))
      throw new Error('Invalid activity source node');
  }

  private async append(
    tx: EntityManager,
    session: any,
    type: string,
    sequence: number,
    hash: string,
    reason: string,
    credit: number,
    at: Date,
    incomplete = false,
  ): Promise<any> {
    const [event] = await tx.query(
      `INSERT INTO activity_events
      (event_type, recorded_at, actor_user_id, actor_sync_id, asset_id, asset_sync_id, source_node,
       access_session_id, correlation_id, sequence, outcome, request_fingerprint, metadata)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)
      RETURNING id, access_session_id, sequence, event_type, recorded_at, outcome, metadata`,
      [
        type,
        at,
        session.actor_user_id,
        session.actor_sync_id,
        session.asset_id,
        session.asset_sync_id,
        session.source_node,
        session.id,
        session.request_id,
        sequence,
        incomplete ? 'incomplete' : 'observed',
        hash,
        JSON.stringify({
          estimated_active_ms: credit,
          reason,
          measurement: 'bounded_foreground_v1',
        }),
      ],
    );
    return event;
  }

  async start(actor: string, asset: string, requestId: string): Promise<any> {
    const identity = await this.authorize(actor, asset);
    return this.db.transaction(async tx => {
      // UNIQUE(actor, request) serializes concurrent start retries across instances.
      await tx.query(
        `INSERT INTO activity_access_sessions
        (request_id, actor_user_id, actor_sync_id, asset_id, asset_sync_id, source_node)
        VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (actor_user_id, request_id) DO NOTHING`,
        [
          requestId,
          identity.actor_user_id,
          identity.actor_sync_id,
          identity.asset_id,
          identity.asset_sync_id,
          this.sourceNode,
        ],
      );
      const [session] = await tx.query(
        'SELECT * FROM activity_access_sessions WHERE actor_user_id=$1 AND request_id=$2 FOR UPDATE',
        [identity.actor_user_id, requestId],
      );
      if (session.asset_id !== identity.asset_id)
        throw new AppError('Conflicting activity retry', 409);
      const [existing] = await tx.query(
        `SELECT id, access_session_id, sequence, event_type, recorded_at, outcome, metadata
        FROM activity_events WHERE access_session_id=$1 AND sequence=0`,
        [session.id],
      );
      if (existing) return existing;
      return this.append(
        tx,
        session,
        'asset.access_started',
        0,
        fingerprint('start', { request_id: requestId }),
        'ready',
        0,
        session.last_observed_at,
      );
    });
  }

  async observe(
    actor: string,
    asset: string,
    sessionId: string,
    action: 'heartbeat' | 'end',
    input: Observation,
  ): Promise<any> {
    const identity = await this.authorize(actor, asset); // Existing preview authorization on EVERY write, including retries.
    const result = await this.db.transaction(async tx => {
      const [session] = await tx.query(
        `SELECT * FROM activity_access_sessions
        WHERE id=$1 AND actor_user_id=$2 AND asset_id=$3 FOR UPDATE`,
        [sessionId, identity.actor_user_id, identity.asset_id],
      );
      if (!session) throw new AppError('Activity session not found', 404);
      const hash = fingerprint(action, input);
      const [existing] = await tx.query(
        `SELECT id, access_session_id, sequence, event_type, recorded_at, outcome, metadata, request_fingerprint
        FROM activity_events WHERE access_session_id=$1 AND sequence=$2`,
        [sessionId, input.sequence],
      );
      if (existing) {
        if (existing.request_fingerprint !== hash)
          throw new AppError('Conflicting activity retry', 409);
        delete existing.request_fingerprint;
        return existing;
      }
      const [{ now }] = await tx.query('SELECT clock_timestamp() AS now');
      if (session.ended) throw new AppError('Activity session ended', 409);
      if (
        now.getTime() - new Date(session.last_observed_at).getTime() >=
        EXPIRY_MS
      )
        throw new AppError('Activity session expired', 409);
      if (input.sequence !== session.last_sequence + 1)
        throw new AppError('Activity sequence out of order', 409);
      const credit = estimatedInterval(
        now.getTime() - new Date(session.last_observed_at).getTime(),
        input.elapsed_ms,
        input.reason,
      );
      const event = await this.append(
        tx,
        session,
        action === 'end' ? 'asset.access_ended' : 'asset.access_heartbeat',
        input.sequence,
        hash,
        input.reason,
        credit,
        now,
        action === 'end' &&
          ['offline', 'error', 'sleep'].includes(input.reason),
      );
      await tx.query(
        'UPDATE activity_access_sessions SET last_sequence=$2, last_observed_at=$3, ended=$4 WHERE id=$1',
        [sessionId, input.sequence, now, action === 'end'],
      );
      return event;
    });
    if (!result) throw new AppError('Activity session expired', 409);
    return result;
  }

  async list(
    actorId: string,
    limit: number,
    before?: { at: string; id: string },
  ): Promise<{ events: any[]; incomplete_sessions: any[] }> {
    // History reads are side-effect free. Stale projections are represented as
    // incomplete sessions; a separate maintenance process may later append a
    // terminal timeout event without changing the meaning of this read.
    const [{ now }] = await this.db.query('SELECT clock_timestamp() AS now');
    const stale = await this.db.query(
      `SELECT id, actor_user_id, actor_sync_id, asset_id, asset_sync_id,
        source_node, last_observed_at
       FROM activity_access_sessions
       WHERE actor_user_id=$1 AND NOT ended
         AND last_observed_at < clock_timestamp() - interval '45 seconds'
       ORDER BY id LIMIT 100`,
      [actorId],
    );
    const events = await this.db.query(
        `SELECT id, schema_version, event_type, recorded_at, actor_user_id, actor_sync_id,
        asset_id, asset_sync_id, source_node, access_session_id, correlation_id, sequence, outcome, metadata
        FROM activity_events WHERE actor_user_id=$1
        ${before ? 'AND (recorded_at, id) < ($3::timestamptz, $4::uuid)' : ''}
        ORDER BY recorded_at DESC, id DESC LIMIT $2`,
        before ? [actorId, limit, before.at, before.id] : [actorId, limit],
    );
    return {
      events,
      incomplete_sessions: stale.map((session: any) => ({
        access_session_id: session.id,
        actor_user_id: session.actor_user_id,
        actor_sync_id: session.actor_sync_id,
        asset_id: session.asset_id,
        asset_sync_id: session.asset_sync_id,
        source_node: session.source_node,
        last_observed_at: session.last_observed_at,
        outcome: 'incomplete',
        reason: 'timeout',
        estimated_active_ms: 0,
        measurement: 'ESTIMATED ACTIVE PREVIEW TIME',
        as_of: now,
      })),
    };
  }
}
