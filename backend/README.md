# GoKnown Backend

This is the backend service for the GoKnown application, built with Node.js, TypeScript, and TypeORM.

## Prerequisites

- Node.js 16+
- Yarn package manager
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL database
- Redis cache

## Local Development

### Using Docker (Recommended)

1. **Start the application with Docker Compose:**

   ```bash
   docker-compose up -d
   ```

2. **Access the API:**

   - API: http://localhost:3333
   - Nginx Proxy Manager: http://localhost:8081 (admin interface)

3. **View logs:**
   ```bash
   docker-compose logs -f api
   ```

### Manual Setup

1. **Install dependencies:**

   ```bash
   yarn install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run database migrations:**

   ```bash
   yarn typeorm migration:run
   ```

4. **Start development server:**

   ```bash
   yarn dev:server
   ```

5. **Create a local login user (optional):**

   ```bash
   yarn seed:local-user
   ```

   The default local credentials are `local.test@goknown.dev` /
   `TestPassword123!`. Override them with `LOCAL_TEST_USER_EMAIL` and
   `LOCAL_TEST_USER_PASSWORD`. If you are using the Docker local environment,
   run `ALLOW_LOCAL_USER_SEED=true yarn seed:local-user` inside the backend
   container because that environment runs the built backend with
   `NODE_ENV=production`.

## Docker Configuration

### Dockerfile

The `Dockerfile` is optimized for production builds:

- Uses Alpine Linux for smaller image size
- Installs dependencies with `yarn install --frozen-lockfile`
- Builds the application with `yarn build`
- Runs the application with `yarn start`

### Docker Compose

The `docker-compose.yaml` includes:

- **API Service**: Main backend application
- **PostgreSQL**: Database
- **Redis**: Cache and session storage
- **Nginx Proxy Manager**: Reverse proxy with SSL support

### Windows Compatibility

The Docker configuration has been optimized for Windows:

- Uses forward slashes (/) in paths
- Removed Unix-specific commands (`sh -c`)
- Adjusted volume mounts for Windows compatibility
- Uses cross-platform commands

## Environment Variables

### Required Variables

```env
# Node Configuration
NODE_NUMBER=1
NODE_NAME=NODE1
NODE_UUID=your-uuid-here
NODE_ENV=development

# Application Settings
APP_NAME=goknown
APP_SECRET=your-secret-here
APP_WEB_URL=http://localhost:3000
APP_API_URL=http://localhost:3333
GOKNOWN_TEST_ADMIN_PASSWORD=temporary-admin-password-from-secret-store
ALLOWED_SIGNUP_EMAILS=atiselska@goknown.com,cgardner@enterprise-kc.com,leopoldojacobsen@gmail.com,mharold@goknown.com,cerlanger@goknown.com
ADMIN_SIGNUP_EMAILS=atiselska@goknown.com
DATABASE_URL=postgresql://user:password@host:port/database

# Database
# In production, Render should provide DATABASE_URL. DB_HOST/DB_PORT/DB_USER/DB_PASS
# are only used for local development fallback.

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASS=your-redis-password
```

### Optional Variables

```env
# Storage (DigitalOcean Spaces)
STORAGE_DRIVER=digitalocean
DO_SPACES_ENDPOINT=your-endpoint
DO_SPACES_KEY=your-key
DO_SPACES_SECRET=your-secret
DO_SPACES_BUCKET=your-bucket

# Email
# Production on Render should use a real transport. SMTP is the primary path:
MAIL_DRIVER=smtp
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
MAIL_FROM_EMAIL=no-reply@dappgenius.dev
MAIL_FROM_NAME=DAppGenius

# Optional alternate transport: AWS SES
# MAIL_DRIVER=ses
# AWS_ACCESS_KEY_ID=your-key
# AWS_SECRET_ACCESS_KEY=your-secret
# AWS_REGION=us-east-1

# Email bypass for local development only.
# When true, invite/setup links are printed by the production user seed instead
# of being sent by email.
MAIL_BYPASS=false

# Two-Factor Authentication (Twilio)
TWOFA_DRIVER=twilio
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_SERVICE_ID=your-service-id
```

## Available Scripts

- `yarn start`: Start production server
- `yarn dev:server`: Start development server with hot reload
- `yarn build`: Build the application
- `yarn typeorm`: Run TypeORM CLI commands
- `yarn queue`: Start queue worker
- `yarn swagger`: Generate Swagger documentation
- `yarn seed:production-users`: Bootstrap initial production users and setup links

## Production User Bootstrap

Run the production user seed after migrations are applied:

```bash
GOKNOWN_TEST_ADMIN_PASSWORD="set-from-secret-store" \
APP_WEB_URL="https://dappgenius.dev" \
yarn seed:production-users
```

The seed creates or updates:

- `atiselska@goknown.com` as `admin`, pending setup
- `admin@goknown.com` as `admin`, active test login

`admin@goknown.com` uses `GOKNOWN_TEST_ADMIN_PASSWORD`; no password is stored in
source code. Invited users receive setup/reset links and create their own
passwords. If `MAIL_BYPASS=true`, setup links are printed to stdout for local
development instead of being emailed.

## Signup and Login Verification

Production signup is controlled by email allowlists:

- `ALLOWED_SIGNUP_EMAILS`: comma-separated lowercase emails allowed to create accounts.
- `ADMIN_SIGNUP_EMAILS`: comma-separated emails that should receive the `admin` role at signup.

Users not listed in `ALLOWED_SIGNUP_EMAILS` receive a 403 response:
`This email is not authorized to create a DAppGenius account.`

Successful signup creates a `confirm_email` user and sends an email PIN. When
`MAIL_BYPASS=true`, the PIN is printed to server logs instead.

Every successful email/password login requires a backend email-code challenge:

1. `POST /sessions` validates email/password and sends or logs a short-lived login code.
2. `POST /sessions/verify-email-code` accepts `{ email, code }` and returns the JWT/user payload.

Login codes expire after 10 minutes and are cleared after successful use.
Rate limiting should be added at the edge or middleware layer for both endpoints.

## BFT-Inspired Transaction Consensus

DAppGenius supports an optional durable, node-to-node quorum layer for token
transfer approval. Enable it only for clustered deployments:

```bash
BFT_CONSENSUS_ENABLED=true
BFT_NODE_NAME=node-a
BFT_NODE_URL=https://node-a.example.com
BFT_CLUSTER_NODES=node-a:https://node-a.example.com,node-b:https://node-b.example.com,node-c:https://node-c.example.com
BFT_NODE_SHARED_SECRET="set-from-secret-store"
BFT_QUORUM_SIZE=2
BFT_REQUEST_TIMEOUT_MS=5000
BFT_MAX_MESSAGE_AGE_SECONDS=300
```

The existing node mirroring configuration is still required so peer nodes have
local transaction rows to finalize:

```bash
NODES_JSON='[{"name":"node-a","url":"https://node-a.example.com"},{"name":"node-b","url":"https://node-b.example.com"},{"name":"node-c","url":"https://node-c.example.com"}]'
NODE_NAME=node-a
```

For local development, leave `BFT_CONSENSUS_ENABLED=false` or unset. The legacy
transaction mirror plus `/votes` behavior remains active when consensus is not
enabled.

This is BFT-inspired 2-of-3 quorum consensus, not formal PBFT. Formal PBFT
tolerance of one Byzantine node requires `3f + 1` replicas, which means four
nodes for `f=1`. With three configured nodes, DAppGenius requires two matching
votes for the same deterministic proposal hash before finalizing a transaction.

Consensus flow when enabled:

1. The originating node creates the usual local pending transaction rows.
2. Existing node sync mirrors those pending rows to peer DAppGenius nodes.
3. The originating node creates a durable proposal in `consensus_proposals`.
4. The local node records its own validation vote in `consensus_votes`.
5. The originating node sends `POST /consensus/proposals` to peer nodes using
   HMAC headers: `x-bft-node-name`, `x-bft-timestamp`, `x-bft-signature`.
6. Peer nodes verify the HMAC, validate the deterministic payload, store their
   proposal/vote, and return a signed vote response.
7. Each node broadcasts its own vote to `POST /consensus/votes` so every node
   can store the same durable vote set and finalize its mirrored rows.
8. Two approvals mark the transaction `approved`; two rejections mark it
   `unapproved`. If quorum is not reached before timeout, the transaction
   remains `pending` and the proposal records a failure reason.

HMAC signing uses `BFT_NODE_SHARED_SECRET` and covers node name, timestamp,
HTTP path/action, and a deterministic SHA-256 body hash. Consensus endpoints do
not use normal user JWTs and should not be exposed as public client APIs.

Inspect consensus state in Render Shell:

```bash
psql "$DATABASE_URL" -c "SELECT proposal_id, transaction_sync_id, status, approval_count, rejection_count, failure_reason, created_at, finalized_at FROM consensus_proposals ORDER BY created_at DESC LIMIT 20;"
psql "$DATABASE_URL" -c "SELECT proposal_id, node_name, vote, reason, payload_hash, created_at FROM consensus_votes ORDER BY created_at DESC LIMIT 50;"
```

Safe recovery for a pending consensus item should be deliberate. First inspect
the proposal and votes. If a transaction should remain pending for retry, do not
change transaction rows. If an operator decides the transaction must be rejected,
set the proposal status to `failed` or `rejected` and use the existing
transaction recovery process to reconcile the paired transaction rows.

### Clear Login-Code State for One User

Use this in Render Shell only when a user is stuck with stale login-code state.
It does not change the password, account status, role, or any reset tokens.

```bash
EMAIL="user@example.com" node -e 'const { Client } = require("pg"); const email = (process.env.EMAIL || "").trim().toLowerCase(); if (!email) { throw new Error("EMAIL is required"); } const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); client.connect().then(async () => { const result = await client.query("UPDATE users SET pin = NULL, pin_created_at = NULL WHERE LOWER(email) = $1 RETURNING email, status, role", [email]); console.log(`Cleared login-code state for ${result.rowCount} user(s).`); result.rows.forEach(row => console.log(`${row.email} status=${row.status} role=${row.role}`)); }).finally(() => client.end());'
```

### Admin Account Recovery

Use this in Render Shell only after verifying the requester should already have
access. It never creates users and it preserves role and password hash. Set
`ACTIVATE=true` only when you intentionally want to move an existing user to
`active`; otherwise it only clears stale PIN state.

```bash
EMAIL="user@example.com" ACTIVATE="false" node -e 'const { Client } = require("pg"); const email = (process.env.EMAIL || "").trim().toLowerCase(); const activate = process.env.ACTIVATE === "true"; if (!email) { throw new Error("EMAIL is required"); } const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); client.connect().then(async () => { const statusSql = activate ? ", status = '\''active'\''" : ""; const result = await client.query(`UPDATE users SET pin = NULL, pin_created_at = NULL${statusSql} WHERE LOWER(email) = $1 RETURNING email, status, role`, [email]); if (result.rowCount !== 1) { throw new Error(`Expected one existing user, updated ${result.rowCount}.`); } const row = result.rows[0]; console.log(`Recovered ${row.email}: status=${row.status} role=${row.role}`); }).finally(() => client.end());'
```

## API Documentation

The API documentation is available at:

- Swagger UI: http://localhost:3333/api-docs
- OpenAPI JSON: http://localhost:3333/swagger.json

## Database Migrations

### Run migrations:

```bash
yarn typeorm migration:run
```

### Generate new migration:

```bash
yarn typeorm migration:generate -n MigrationName
```

### Revert migration:

```bash
yarn typeorm migration:revert
```

## Troubleshooting

### Docker Issues

1. **Permission denied errors (Windows):**

   - Run Docker Desktop as Administrator
   - Check file sharing settings in Docker Desktop

2. **Build context errors:**

   - Ensure you're in the correct directory
   - Check that all paths are correct

3. **Volume mounting issues:**
   - Enable file sharing in Docker Desktop
   - Use forward slashes (/) in paths

### Database Issues

1. **Connection refused:**

   - Check if PostgreSQL is running
   - Verify connection string in environment variables
   - Ensure database exists

2. **Migration errors:**
   - Check database permissions
   - Verify migration files are correct
   - Run migrations manually if needed

### Redis Issues

1. **Connection refused:**
   - Check if Redis is running
   - Verify Redis configuration
   - Check network connectivity

## Production Deployment

### Using Docker

1. **Build the image:**

   ```bash
   docker build -t goknown-backend .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3333:3333 --env-file .env goknown-backend
   ```

### Environment Setup

1. **Set NODE_ENV=production**
2. **Configure production database**
3. **Set up SSL certificates**
4. **Configure reverse proxy (Nginx)**
5. **Set up monitoring and logging**

## Architecture

The backend follows a modular architecture:

```
src/
├── modules/           # Feature modules
│   ├── users/        # User management
│   ├── organizations/# Organization management
│   └── ...
├── shared/           # Shared utilities
│   ├── container/    # Dependency injection
│   ├── errors/       # Error handling
│   ├── infra/        # Infrastructure (HTTP, database)
│   └── views/        # Email templates
└── utils/           # Utility functions
```

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Use conventional commits
5. Create pull requests for changes

## License

This project is proprietary software. All rights reserved.
