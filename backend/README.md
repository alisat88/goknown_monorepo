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

# Email (AWS SES)
MAIL_DRIVER=ses
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1

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
