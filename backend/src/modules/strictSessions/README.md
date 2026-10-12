# Isolated completed-login foundation

Development only. No ZTA handoff, frontend integration, legacy authentication change, or production activation is included.

## Identity and isolation

The committed Messenger MULTINODE_REPORT.md records that all three production backend nodes share PostgreSQL database `goknown`. This is repository evidence, not a new production inspection. Under that topology, the database-generated `users.id` is the canonical identity. Never regenerate existing IDs. Any independently stored node database needs a separate identity design before enablement.

The password step canonicalizes the supplied login email using the existing account-email rules, then looks up at most two matching rows. Exactly one match, a valid password, active status, no soft deletion, and the existing account two-factor setting are required. Email is a credential lookup input, never a client assertion of ownership. Case/whitespace-ambiguous records fail closed; historical records are not merged or rewritten. Ownership thereafter comes only from stored challenge/session `user_id`, never `sync_id`, email, role, or request flags.

Public registration, peer registration replication, legacy PIN fields, JWT issuance/validation, frontend storage/logout, Messenger sockets, and Digital Assets authentication are unchanged. Duplicate `sync_id` values do not affect strict identity. This does not repair legacy identity vulnerabilities.

## API (disabled by default)

Explicitly setting `STRICT_SESSIONS_ENABLED=true` enables only `/strict-sessions/*`. The migration must already exist. No ordinary client calls these routes today. Disabled routes return 404 without querying storage.

- POST `/strict-sessions/challenges`: exactly `{email,password}`. Requires fresh password proof, stores a separate challenge and emails an eight-digit cryptographically generated code. Returns `{challenge,expiresInSeconds:300}`. The challenge is a random 256-bit browser credential.
- POST `/strict-sessions/verify`: exactly `{challenge,code}`. Returns `{token,expiresAt}` only after challenge consumption and session creation commit. Five code attempts; five-minute expiration.
- GET `/strict-sessions/current`: strict Bearer token required; returns `{authenticated:true,expiresAt}`. Strict middleware puts canonical `userId` in `response.locals.strictIdentity` for future NEW endpoints only. No external identity selector is supported.
- POST `/strict-sessions/logout`: strict Bearer token, empty body; revokes that strict session before returning 204. Subsequent protected requests fail. Requests already authorized before logout cannot be retroactively recalled. Legacy JWTs and sockets are not revoked.

All responses are `Cache-Control: no-store`. Unexpected query parameters or identity fields are rejected. Invalid credentials return 401, malformed requests 400, rate limits 429, infrastructure failures 503. Responses never echo credentials or provider/database error details. Error and timing uniformity is not a guarantee against account enumeration; hardening network-level abuse controls is still required before public enablement.

## Credential and persistence design

Opaque `dgs1_` session tokens contain 256 random bits, expire after one hour, and are stored only as SHA-256 digests. They are not JWTs: no shared legacy signing key, JWT purpose, issuer, or audience is accepted. The distinct parser plus exclusive strict-session table provides protocol separation. A legacy or pre-auth JWT cannot be exchanged for strict proof. Future ZTA must use a separate handoff, not accept these credentials directly in a URL.

Verification codes use `crypto.randomInt` and salted scrypt hashes. Neither codes nor passwords nor raw challenge/session credentials are logged or stored. Strict email delivery bypasses the legacy code sender, refuses MAIL_BYPASS and non-SMTP/non-SES modes, and resolves the existing provider lazily. Local tests inject a mock mailer and need no mail credentials.

Three additive tables: `strict_login_challenges`, `strict_login_sessions`, and `strict_login_throttles`. Challenge/session owners reference `users.id`; deletion cascades only to the new records. New entities are explicitly listed in runtime TypeORM configuration and compiled migration configuration. Existing user columns are not modified. A second additive migration installs a PostgreSQL `AFTER UPDATE OF status` trigger on `users`; an inactive transition revokes all active strict sessions in the same transaction. Re-enabling the user does not restore those sessions, and rollback restores both status and revocations.

The store locks the authoritative user row first for all challenge/session writes and protected validation. Database time is sampled after lock acquisition. Code attempts commit on failure; code consumption and session creation share a transaction. Concurrent requests across processes serialize at PostgreSQL, not process memory. A new challenge supersedes old ones. A shared 60-second challenge cooldown and 10 password attempts per normalized-email digest per 15 minutes constrain guessing and mail abuse. Throttles do not lock legacy login.

Every protected request rechecks active/deleted state and a fingerprint of canonical ID, stored email, and password hash. Password/email changes invalidate outstanding proof; the database trigger durably revokes sessions on inactive transitions, including updates initiated by another application node or the legacy peer-replication path. No claims of global logout or legacy revocation are made.

## Validation and rollout prerequisites

Integration tests opt in with RUN_STRICT_LOCAL_PG=1 and connect only to the hard-coded disposable Unix socket `/private/tmp/dappgenius-strict-test-socket`, port 55439, user `strict_test`, database `strict_session_test`. They never read DATABASE_URL. Set up a fresh local cluster and database; tests create/drop their own fixture users table and apply/revert only the new migration there. Do not point the fixture at application data. Mail is mocked. Run with Node 22:

    RUN_STRICT_LOCAL_PG=1 node node_modules/jest/bin/jest.js --runInBand --runTestsByPath src/modules/strictSessions/__tests__/strict-sessions.test.ts

The separate legacy-compatibility suite uses mocks and needs no database. The PostgreSQL suite is intentionally skipped without the explicit opt-in.

Before production activation: re-confirm shared authoritative DB/schema and mail delivery; review migration and rollback; establish edge/IP abuse controls and retention/cleanup for expired challenges, sessions and throttle records; define account lifecycle revocation semantics. Add future browser transport/CSRF/CORS and handoff controls in a separate phase. Keep credentials out of URLs and browser persistent storage. Never relax the ZTA application guard, Nginx restrictions, or firewall for this work.
