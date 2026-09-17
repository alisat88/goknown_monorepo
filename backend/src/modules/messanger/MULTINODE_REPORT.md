# Messenger multi-node update

This supersedes the process-local delivery and HTTP mirroring sections of `IMPLEMENTATION_REPORT.md`.

## Verified production topology

The operator confirmed all three backend nodes use one DigitalOcean Managed PostgreSQL cluster, database `goknown`, port `25060`, with one PM2 fork per node. BFT names are `node-a`, `node-b`, and `node-c`; neither `.env` nor PM2 supplies `NODE_NAME`. Peer URLs are direct private URLs. This update does not change BFT/consensus configuration or any other application's synchronization.

A shared DigitalOcean Managed Valkey cluster is provisioned for production. All three backend nodes are Trusted Sources, have the same `MESSENGER_REDIS_URL`, and have returned `PONG` over the private TLS connection. The disposable Redis used by integration tests is not a production solution.

## New flow (direct and group)

1. Any backend node authenticates the HTTP request using the existing JWT.
2. Membership is checked server-side.
3. The existing PostgreSQL transaction appends one message and increments each recipient's unread entry once.
4. After commit, the backend emits the saved message with its conversation ID to each recipient's authenticated user room.
5. The official Redis adapter forwards those room events to sockets on every backend process. All recipient tabs/devices receive the same saved message ID. The sender's user room is excluded, including the sender's other devices.
6. History/read acknowledgements and unread summaries use the shared PostgreSQL state.

Messenger controllers no longer import `config/nodes` or the peer HTTP API. Direct conversation creation, group creation, message creation, and read-state updates do not forward peer database writes. The legacy `syncNodeMessanger` helper is detached from Messenger routes; synchronization used by other applications is untouched. Conversation IDs are generated server-side.

## Socket startup and Redis

Socket.io initializes on every backend process, independent of `NODE_NAME` or `BFT_NODE_NAME`. HTTP does not start listening until adapter initialization completes. Production startup without a configured shared adapter, or with a failed connection/subscription/publish check, logs a credential-free error and exits nonzero. PM2 may retry; this is deliberately not a silent in-memory fallback.

`@socket.io/redis-adapter` is pinned to `8.3.0`. Installed Socket.io is `4.8.3` (declared range `^4.4.0`), Socket.io adapter is `2.5.6`, and ioredis is `4.31.0`. Two dedicated ioredis connections serve publishing and subscription; the cache provider is not reused as an adapter. The local npm and Yarn lockfiles were updated by npm; both are ignored by the repository and must be included in the eventual release packaging.

Configure one of these on all three nodes (no environment files were edited):

- `MESSENGER_REDIS_URL`: the shared `rediss://` connection URL for managed TLS Redis/Valkey, supplied through the deployment secret mechanism. `redis://` is also supported for appropriately protected private services.
- To reuse the existing cache endpoint **only after confirming it is shared**, set `MESSENGER_REDIS_SHARED=true` and supply existing `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASS`; optional `REDIS_USERNAME` and `REDIS_TLS=true` support authenticated TLS services.

Optional `MESSENGER_REDIS_CHANNEL_PREFIX` defaults to `goknown:messenger:socket.io`. Use the same prefix on the three nodes and distinct prefixes for unrelated deployments. Configure private connectivity, TLS/authentication, and suitable Redis Pub/Sub ACLs; the adapter is trusted internal infrastructure, not a public relay.

Development/test without shared Redis configuration retains an explicitly logged single-process adapter. Production cannot select that fallback through these environment settings.

While either Redis connection is unavailable, new Messenger writes return 503. Adapter command errors latch an unavailable state until repair/restart. Events that race with an outage after database commit are logged and not intentionally broadcast only locally; committed history is still readable. Redis Pub/Sub is not a durable outbox, so a crash or disconnect between commit and broadcast can still miss a transient event. Reload/reconnect recovers history. No exactly-once HTTP retry guarantee is introduced.

## Presence and transports

Presence uses adapter-backed `fetchSockets()` across the cluster, on connections, disconnections, and presence requests. A periodic refresh reconciles abrupt process loss. Failed global queries never substitute a node-local list. JWT auth payloads are cleared after authentication so `fetchSockets()` does not serialize those tokens into presence requests.

Frontend transports are unchanged: polling and WebSocket upgrade remain enabled. The DigitalOcean load balancer must preserve affinity for Engine.IO polling sessions. Actual affinity settings have not been verified. Cookie-based cross-origin affinity also requires verifying client credentials and CORS compatibility; the current client/server do not explicitly configure credentialed cross-origin cookies. Sticky sessions do not replace the shared adapter. WebSocket-only transport could avoid the polling affinity requirement but removes fallback; it was not changed without review.

## Migration and rollout prerequisites

The existing group migration is unchanged and unexecuted: `type` defaults to `direct`, while `name` and `created_by` are nullable. No new schema migration or speculative index was added. Target column types are still not independently inspected.

Before deployment:

1. Confirm the shared Valkey URL and private TLS connectivity remain configured on all three nodes.
2. Verify actual load-balancer routing, polling affinity, and any cross-origin cookie requirements.
3. Verify the target schema and apply the separately reviewed group migration through the approved release procedure.
4. Package the dependency lockfiles and use the project's supported Node 22 runtime.
5. Coordinate the cutover across all nodes or suspend Messenger writes during the upgrade: old nodes still running peer-write mirroring can create duplicate database writes during a mixed-version rollout.
6. Perform a staging test with HTTP and recipient sockets deliberately distributed across nodes, including Redis failure/recovery.

No production connection, migration, deployment, restart, commit, push, or environment change was performed. Local Docker Desktop was started with permission solely for disposable integration-test infrastructure.
