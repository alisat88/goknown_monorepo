# Phase 1 release preparation — review artifact, not deployment approval

No production connection, migration, infrastructure inspection, fetch, deployment or restart was performed while preparing this change. All commands below describe a future approved release. Do not populate a production target or execute production commands during local review.

## Proposed architecture and scope

Use one authoritative PostgreSQL database for all three DAppGenius web nodes' activity sessions/events. Each web process uses a restricted runtime login. A separate short-lived release process receives migration-owner credentials and applies the additive ledger migration exactly once per authoritative database, before web rollout. PostgreSQL serialization and uniqueness constraints coordinate the nodes; the existing Redis adapter remains necessary for Messenger. Redis is not the durable activity ledger.

The actual three-node DigitalOcean topology, database sharing, role memberships, proxies, startup commands and managed-database TLS endpoints have NOT been inspected. If the nodes have independent databases, stop: this Phase 1 code does not replicate ledger events between them. Do not claim a global ledger, enable capture independently, or create a transport as part of this release. Decide/review the authoritative-database architecture first.

Use Node.js 22 build/runtime artifacts. Keep both flags explicitly false initially:

```
ACTIVITY_LEDGER_ENABLED=false
REACT_APP_ACTIVITY_LEDGER_ENABLED=false
```

The frontend flag is embedded at build time. Backend and frontend rollout can be separated. Assign distinct reviewed `ACTIVITY_LEDGER_SOURCE_NODE` values to the three web nodes; they must share the same database. Source-node labels are not credentials.

This is best-effort authenticated in-app preview telemetry and **estimated active preview time**, not proof of attention or a complete access audit. Direct file/object-storage links, downloads, caches, external viewers and forwarded URLs remain outside Phase 1 tracking. Authorization continues to use the existing asset service; this does not fix direct-content access discrepancies.

## Review evidence and branch divergence

At review start, branch `feature/dappgenius-activity-ledger` was clean at `16e4746073e3ca110aa1dfc93150fd991548e6ed`. Cached `origin/main` was `78dfac9b5d46e3f7344113febe2ca51910bb1609`: zero integration-only commits, one feature-only commit. Local `main` was older and is not the integration baseline. No network fetch was made; freshness of the upstream integration branch is an explicit release gate. The ZTA financial-lockdown commit `48b1da4` is an ancestor. No `apps/` or financial module changes are included in this preparation.

Local evidence reviewed:
- `.env.ledger-local-20261110/REPORT.md`: 115 tests; database protections; real image/PDF/audio/video previews; idle/offline behavior; outage/recovery; Node 22 builds.
- `.env.ledger-local-20261110/full-backend/REPORT.md`: unchanged full backend with isolated PostgreSQL/Redis; real password/email-code login; DigitalAssets upload/read; Socket.IO; ledger routes; actual hidden-tab transition; OS network isolation; all services stopped.

The second report supersedes the first report's full-parent/hidden-tab limitations. These ignored reports are local evidence, not tracked release assets; do not copy their secrets, private logs or browser profile into a release package. Production topology, live backups, actual role privileges, certificate trust and actual deployment control-plane behavior remain unverified.

## Startup inventory and changes

Previously automatic migrations ran in:
1. `backend/Procfile` before npm start.
2. `backend/docker-compose.yaml` API command.
3. `local-env/docker-compose.yml` backend command (also reached through root/local start helpers).
4. `local-env/backend-start.sh`.

These now build/start only. Empty databases must be provisioned separately; startup is intentionally no longer a database initializer. The local repair helper `local-env/fix-database.sh`, which could truncate migration history and rerun all migrations, now refuses to run. Never truncate the migrations table to repair deployment.

`npm start`, PM2's `backend/ecosystem.config.js`, backend/local Dockerfile CMDs, and direct `server.js` already start without migrations. TypeORM startup now explicitly sets `migrationsRun: false` as well as `synchronize: false`. Worker entrypoints do not run migrations. Legacy mutating TypeORM commands (`migration:run`, `migration:revert`, `schema:sync`, `schema:drop`) are rejected by backend/ormconfig.js before dotenv is read. Direct administrative SQL/tools can still bypass application tooling; restrict access to owner credentials rather than treating the guard as a security boundary against a privileged DBA.

No changes were made to copied ZTA startup files under apps/. They are outside this release. Do not execute their scripts or reuse their credentials. Existing remote process definitions outside this repository require a separate operator audit; this inventory cannot establish their contents.

## Dedicated migration commands

The ledger command is Phase-1-specific. Future DAppGenius migrations use the
general reviewed-plan workflow below. Neither workflow runs from web or worker
startup.

```sh
cd backend
npm run build
npm run release:ledger:verify -- /reviewed/path/target.json
# Only after checking the target evidence and approving the displayed confirmation:
npm run release:ledger:migrate -- /reviewed/path/target.json CONFIRMATION_FROM_VERIFY
```

For a future release containing non-ledger migrations, build the exact artifact,
create a private ordered plan containing every compiled migration (including
already-applied names), and review it with the same target manifest:

```sh
npm run build
npm run release:migrations:verify -- /reviewed/path/target.json /reviewed/path/migrations.json
# Only after independent target review and confirmation approval:
npm run release:migrations:migrate -- /reviewed/path/target.json /reviewed/path/migrations.json CONFIRMATION_FROM_VERIFY
```

The plan is mandatory and is bound to the confirmation together with every
compiled migration file. Unknown, omitted, duplicate, out-of-order, or newer
unapproved migrations fail closed. Already-recorded migration names are skipped;
only missing names in the reviewed order are applied. The migration-owner role
is used only by this short-lived release process. Web and worker processes use a
separate restricted runtime role and never receive the owner credential. The
general command shares the ledger command's manifest, credential, DNS/TLS,
identity, role, history, advisory-lock, rollback, and sanitized-error controls.

The secret manager must inject only `LEDGER_MIGRATION_DATABASE_URL` for this short-lived process. Do not place credentials in command arguments, tracked files, terminal history or logs. Remove ambient DATABASE_URL, PGOPTIONS and PGSERVICE. The script does not load dotenv, ormconfig or web providers. Owner credentials must never appear in web/worker environments. Runtime DATABASE_URL remains separate and unchanged in application semantics.

Create a private, reviewed manifest from `backend/release/target.example.json`; its placeholder values intentionally cannot run. Record exact host/port/database, independently obtained database OID, `activity_ledger` schema, migration-owner/runtime/application role names, all approved resolved IP addresses, TLS mode and reviewed CA file. Keep it outside Git if deployment metadata is sensitive. Obtain identity through a separately authorized read-only operator process; never infer it solely from the secret URL. Have a second operator match it to the approved infrastructure inventory and backup record.

The ledger guard:
- Requires Node 22 and explicit matching migration-owner URL; rejects URL query overrides and missing password.
- Validates every DNS answer against the manifest, then connects to a pinned IP (no second DNS lookup). Remote connections require certificate verification with the reviewed host name/CA; plaintext is allowed only for literal loopback local rehearsal.
- Uses a read-only transaction to compare actual database/OID/user/server address/port and writable-primary state. It checks safe role attributes, runtime owner/schema privileges and dangerous assumable memberships, uuid-ossp in public, and exact built migration history.
- Requires all earlier built migrations already present; refuses unknown history, missing prerequisites, timestamp inconsistencies or newer built migrations. It does not apply unrelated authentication, ZTA or financial migrations. Baseline discrepancies require a separately scoped release.
- Binds explicit confirmation to the manifest and hashes of all compiled migration files. Rebuild/manifest changes invalidate the confirmation.
- Rechecks on the same connection under a transaction-scoped advisory lock before applying only `CreateActivityLedger1792000000000`; table creation and TypeORM history insertion commit together. A repeated run validates the installed objects and becomes a no-op. It never calls down().
- Emits fixed error codes, never raw database errors, SQL or credentials.

Use a direct primary endpoint. A proxy/NAT or managed endpoint whose resolved IP/port differs from PostgreSQL's reported server address/port is intentionally rejected. Do not weaken the guard to make an unknown topology pass. Document and review a separate identity-verification design if the actual managed service requires a proxy. Failover/IP changes require renewed manifest review, not wildcard allowlists.

The guard trusts the reviewed application artifact and authorized operator. Confirmation is an accidental-target safeguard, not approval authentication. It does not prove backups exist, prevent a privileged DBA from bypassing it, or coordinate with other migration tools that ignore its advisory lock; serialize all schema work during the release window.

## Migration owner and runtime roles

### Activity Log viewer permission

The Activity Log is globally visible only to platform administrators or users
with an explicit row in `activity_log_viewers`. The additive migration
`1792100000000-CreateActivityLogViewers` stores the user, granting administrator,
and grant time. It does not change the user's role or grant any other admin
capability. Only an existing platform administrator can provision or revoke a
viewer through the authenticated Activity Log administration endpoint. Revoke
the row to remove access; do not infer access from organization membership.

The running application reads this table through the dedicated
`ACTIVITY_LEDGER_DATABASE_URL` connection and restricted ledger runtime role;
the legacy `DATABASE_URL` connection remains unchanged. Include this migration in the reviewed ordered general migration
plan; it is not run at backend startup and is not a production approval.

A DBA must provision dedicated role identities in a separately approved operation. Illustrative identities (not a ready-to-run provisioning script):

```sql
CREATE ROLE dappgenius_migration_owner LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE dappgenius_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT;
```

Set strong secrets through the approved secret manager; do not embed passwords here. If a suitable restricted runtime role already exists, prefer preserving it. Never alter existing user identities/permissions blindly or globally transfer ownership. The migration owner needs CONNECT, schema USAGE/CREATE, ownership of new ledger objects, and INSERT/sequence access to the existing migrations table. The public uuid-ossp extension must already exist. Baseline ownership/history access must be reviewed explicitly, not fixed by REASSIGN OWNED or granting SUPERUSER.

The runtime must not own the database/schema/ledger tables/trigger function, assume an owner/admin role, create in public, disable triggers, set replication bypass, or gain equivalent privileges through PUBLIC/group memberships. On older PostgreSQL installations PUBLIC may have schema CREATE by default: inventory affected clients, remediate separately, and revalidate. This release SQL deliberately does not revoke schema/database privileges globally.

Capture the existing application ACL/membership/default-privilege matrix first. Preserve required normal table/sequence/function operations: login modifies users; legacy Audit Logs need SELECT/INSERT/**UPDATE**; DigitalAssets operations need their existing table/related-table writes; Messenger, organizations and other features need their existing grants. Do not grant all tables merely to eliminate errors. Do not change financial or ZTA grants. If replacing an owner application login, a complete least-privilege migration of existing functionality is a production blocker until reviewed/tested.

Apply `backend/release/ledger-permissions.sql` after the ledger migration, using a separately authenticated, TLS-verified owner connection and explicit target variables:

```sh
# Credentials via approved pgpass/service configuration; never command-line passwords.
# psql endpoint and TLS identity must independently match the reviewed manifest.
psql -X -v ON_ERROR_STOP=1 \
  -v expected_database=REVIEWED_DB -v expected_oid=REVIEWED_OID \
  -v expected_address=REVIEWED_SERVER_IP -v expected_port=REVIEWED_PORT \
  -v ledger_schema=activity_ledger -v migration_owner=REVIEWED_OWNER \
  -v runtime_role=REVIEWED_RUNTIME -v application_role=REVIEWED_APPLICATION \
  -f backend/release/ledger-permissions.sql
```

The script starts a transaction, verifies actual target/owner/role attributes, preserves unrelated ACLs, strips PUBLIC/direct-runtime grants only on the new ledger objects, and grants:

| Object | Runtime privileges |
|---|---|
| activity_events | SELECT, INSERT |
| activity_access_sessions | SELECT, INSERT, UPDATE |
| auditlogs | UPDATE added; existing SELECT/INSERT and all other existing grants preserved |

It rejects dangerous effective/assumable roles and rolls back if privileges remain unsafe. No default privileges granting event UPDATE/DELETE/TRUNCATE are added. The trigger blocks owner DML too, but owners/administrators can alter/drop it: this is not tamper-proof against privileged administration. Audit Logs remain mutable by design and are distinct from immutable activity_events.

Verify effective privileges with the actual runtime login, including inherited/SET ROLE paths. On staging, prove event INSERT succeeds and UPDATE/DELETE/TRUNCATE/DDL/trigger disabling fail; probe with zero-row statements where appropriate, never mutate production historical rows. Confirm table/function ownership, indexes, enabled trigger, metadata constraints and no schema CREATE. Preserve grants evidence with the release ticket.

## Three-node future release checklist

1. **Approval and topology:** refresh/review integration refs in an authorized workflow, resolve any divergence without losing ZTA lockdown/financial changes, review this uncommitted patch, identify the three deployed artifacts and every actual startup path. Confirm one authoritative PostgreSQL database and Redis topology. Inventory all current flags, runtime roles, grants, source-node names, endpoints and certificates. No guessed hostnames or credentials.
2. **Backups and recovery:** take an approved consistent backup/PITR checkpoint and capture schema, roles/ACLs, migrations history and artifact/config versions. Verify restore procedures by restoring into a separate disposable environment; record recovery owner, retention, RPO/RTO and evidence. Confirm adequate disk/WAL capacity. Never test restore over the live database.
3. **Rehearsal:** on a production-equivalent isolated environment, test exact Node 22 artifacts, full parent startup, real login, Audit Logs updates, DigitalAssets upload, actor isolation, ledger metadata/immutability, Redis adapter, media lifecycle and failure recovery. Validate every normal runtime permission needed by the actual deployment. Keep both flags false throughout preparation.
4. **Role readiness:** provision/review migration-owner and runtime identities, preserve existing application ACLs, remove unsafe ownership/assumable privileges through a separately reviewed DBA plan. Confirm owner secret available only to release process and runtime secret available only to web/workers.
5. **Database first, once:** approve target manifest and independently verify it; run release:ledger:verify, review confirmation, then run release:ledger:migrate from one controlled release process. Apply reviewed ledger permission SQL. Confirm exactly one ledger migration record and additive schema/index/trigger creation. Abort on baseline drift, identity/TLS mismatch or unsafe privileges. Do not run migrations per node.
6. **Backend rolling rollout:** drain node 1 from load balancer, deploy reviewed artifact and runtime-only credentials, start without migrations with ACTIVITY_LEDGER_ENABLED=false. Check DB-dependent authentication/asset requests and Redis adapter, not health alone. Return to service only after checks; repeat nodes 2 and 3. Stop rollout on a regression; never compensate by handing owner credentials to the web process. Distinct source-node values; same authoritative DB.
7. **Frontend off build:** build/publish the reviewed frontend with REACT_APP_ACTIVITY_LEDGER_ENABLED=false and correct environment/API/Socket.IO values. Validate assets and authentication without ledger writes. Audit analytics/CDN configuration separately; the local preview copy is not the release artifact.
8. **Controlled activation:** approve privacy/retention/access policy and expected event volume. Enable backend capture consistently on all three nodes before serving an opt-in frontend build with capture enabled. The current flags are process/build-wide, not per-user cohort flags; use a separately reviewed isolated test frontend/routing plan for limited exposure or approve global enablement explicitly. Cached old bundles may remain off and undercount. Mixed enabled/disabled backend routing will lose events; do not treat that as a successful canary.
9. **Smoke and observe:** use approved synthetic accounts/assets, all four media types, separate tabs, failed loads, thumbnails and actual hidden/idle behavior. Check one start per session, bounded heartbeat intervals, end attempts, unauthorized denial, actor-only pagination and stale incomplete sessions; reads must not append history. Verify across load-balanced nodes. Do not use real user documents as smoke fixtures.
10. **Closeout:** record artifacts/target identity/migration/privilege evidence, node status, flag state, smoke results, monitoring ownership and rollback decision. Remove release credentials from the release job; retain immutable history and backups. Do not expose logs containing credentials or legacy login payloads.

Monitor sanitized capture 503/409/429 rates, request latency, DB connection failures, insert throughput, event/WAL/disk growth, lock contention, DB/Redis health, expired-session ratio, start/end ratios, node attribution and legacy login/asset/Audit Logs errors. Active previews generate roughly four heartbeat rows per minute plus starts/ends. Set reviewed thresholds and capacity budgets before enabling. Incomplete sessions are expected for dropped closes; they earn no inferred tail credit. This phase has no cleanup job or timeout-event appender.

## Rollback without deleting history

First disable backend capture on all nodes, then publish a frontend off build; the backend kill switch immediately stops writes even from cached on bundles. Confirm normal authentication/assets still work. Roll back backend/frontend application artifacts only to versions compatible with the additive schema and restricted role. If the prior artifact needs broader normal privileges, stop for a reviewed grant plan rather than reintroducing owner credentials.

Retain activity_events, activity_access_sessions, their permissions/triggers and the migrations history row. Never run migration:revert, destructive down(), TRUNCATE, drop tables, edit historical events, or truncate migration history. A failed guarded migration rolls back atomically; inspect and reverify before retrying. If a migration committed but permission SQL fails, leave capture off and resolve privileges; do not drop/reapply the schema. Backups/PITR restore are disaster recovery only, into an isolated replacement for review first; restoring over live data would discard newer history and requires separate incident authorization.

## Outstanding blockers / legacy concerns

**NO-GO for production operations now; GO for review and further release planning.** No production target, live privileges, backup restore evidence, actual three-node data topology, approved privacy policy or current upstream freshness has been verified.

Legacy authentication remains unchanged: the tested password/email-code flow is distinct from opt-in strict sessions. Legacy JWT authorization does not automatically become strict-session revocation. Login-code generation has a noted rate-limit TODO; development MAIL_BYPASS emits OTPs and must never be enabled in production. Production secrets must be strong/non-default and synthetic users/media excluded. Existing Audit Logs serialize sensitive user fields including password hashes; review minimization/redaction separately without rewriting immutable activity history. An asset upload can persist before a later Audit Logs failure returns an error; correct grants and transactional/error semantics deserve review. None of these findings authorizes weakening authentication, modifying ZTA handoff/security, or expanding Phase 1 tracking.

The generic Dockerfiles still use their existing Node image tags; the approved production build must explicitly prove Node 22 and pin reviewed artifacts rather than assuming those generic Dockerfiles satisfy the release. Do not silently change unrelated deployment images in this patch.
