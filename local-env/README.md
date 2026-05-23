# GoKnown - Docker Environment

This directory contains the necessary configurations to run the GoKnown application (frontend and backend) using Docker.

## Files

- `docker-compose.yml`: Service configurations (frontend, backend, redis and postgres)
- `frontend.Dockerfile`: Dockerfile for the frontend service
- `backend.Dockerfile`: Dockerfile for the backend service
- `production.Dockerfile`: Dockerfile for complete application build (frontend + backend)
- `backend.env`: Environment variables for the backend
- `frontend.env`: Environment variables for the frontend
- `build-and-push.sh`: Script to build and push images to Docker Hub (Linux/Mac)
- `build-and-push.bat`: Script to build and push images to Docker Hub (Windows)
- `prepare-build.sh`: Script to prepare build environment (Linux/Mac)
- `prepare-build.bat`: Script to prepare build environment (Windows)

## Running Locally

To start the application locally:

```bash
cd local-env
docker-compose up -d
```

The application will be available at:
- Frontend: http://localhost:3000
- API Backend: http://localhost:3333

## Local Login Testing

Local login uses the same backend `/sessions` endpoint as the app. The backend
checks the user email/password with bcrypt, rejects inactive users, and returns a
JWT signed with `APP_SECRET`. The frontend stores the returned token and user in
`localStorage` under `@GoKnown:token` and `@GoKnown:user`; private routes such
as `/dashboard` require that stored user.

### Option A: Create a User from the UI

The existing signup flow works for local development when the backend has:

```env
ENABLE_CREATE_USER=true
MAIL_BYPASS=true
```

With those values set, go to http://localhost:3000/signup, create an account,
then sign in at http://localhost:3000 and open http://localhost:3000/dashboard.

### Option B: Seed a Repeatable Local User

Use this when you want a known local account for route/sidebar testing:

```bash
cd backend
yarn seed:local-user
```

Default local-only credentials:

```text
email: local.test@goknown.dev
password: TestPassword123!
```

You can override them without editing code:

```bash
cd backend
LOCAL_TEST_USER_EMAIL=you@example.test LOCAL_TEST_USER_PASSWORD='another-local-password' yarn seed:local-user
```

The seed script creates the user as active, uses bcrypt for the password and PIN,
sets 2FA enabled so normal authentication can issue a JWT, and does not run
automatically. If your local backend environment has `NODE_ENV=production`, the
script refuses to run unless you explicitly mark the database as local:

```bash
cd backend
ALLOW_LOCAL_USER_SEED=true yarn seed:local-user
```

For the Docker local environment:

```bash
cd local-env
docker-compose up -d postgres redis backend frontend
docker-compose exec backend sh -c "ALLOW_LOCAL_USER_SEED=true yarn seed:local-user"
```

Then log in at http://localhost:3000 and navigate to `/dashboard`.

### Manual Local Development Commands

Backend:

```bash
cd backend
cp .env.example .env
yarn install
yarn typeorm migration:run
yarn dev:server
```

Frontend:

```bash
cd frontend
cp env.example .env
yarn install
yarn start
```

Required local values:

```env
# backend
APP_SECRET=local_dev_secret
APP_API_URL=http://localhost:3333
APP_WEB_URL=http://localhost:3000
ENABLE_CREATE_USER=true
MAIL_BYPASS=true
DB_HOST=localhost
DB_PORT=5432
DB_USER=root
DB_PASS=your-local-db-password
DB_NAME=defaultdb

# frontend
REACT_APP_ENVIRONMENT=development
REACT_APP_DEVELOPMENT_API=http://localhost:3333/
REACT_APP_BYPASS_SMS_2FA=true
REACT_APP_BYPASS_EMAIL=true
```

## Windows Compatibility

### Prerequisites for Windows

1. **Docker Desktop for Windows** must be installed and running
2. **WSL2** is recommended for better performance
3. **File sharing** must be enabled in Docker Desktop settings
4. **Drive sharing** must be enabled for the project directory

### Windows-Specific Instructions

1. **Enable WSL2** (recommended):
   ```powershell
   # Run as Administrator
   wsl --install
   ```

2. **Configure Docker Desktop**:
   - Open Docker Desktop
   - Go to Settings > Resources > WSL Integration
   - Enable WSL2 integration
   - Go to Settings > Resources > File Sharing
   - Add your project directory

3. **Run the application**:
   ```cmd
   cd local-env
   docker-compose up -d
   ```

4. **Build and push images** (Windows):
   ```cmd
   # Use the batch script instead of shell script
   build-and-push.bat
   ```

### Troubleshooting Windows Issues

1. **Permission denied errors**:
   - Run Docker Desktop as Administrator
   - Check file sharing settings in Docker Desktop

2. **Path issues**:
   - Use forward slashes (/) in paths, not backslashes (\)
   - Ensure project is in a shared drive

3. **Build context errors**:
   - Make sure you're running commands from the correct directory
   - Check that all paths in docker-compose.yml are correct

4. **Volume mounting issues**:
   - Enable file sharing in Docker Desktop
   - Use absolute paths if relative paths fail

## Environment Variables

### Frontend (frontend.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_ENVIRONMENT` | Execution environment | `development`, `staging`, `production` |
| `REACT_APP_DEVELOPMENT_API` | Development API URL | `http://backend.local-env.orb.local/` |
| `REACT_APP_PRODUCTION_API` | Production API URL | `https://api.goknown.com/` |
| `REACT_APP_STAGING_API` | Staging API URL | `https://staging-api.goknown.com/` |
| `REACT_APP_BALANCE_API` | Balance API URL (optional) | `https://balance-api.goknown.com/` |
| `GENERATE_SOURCEMAP` | Generate sourcemap for debugging | `FALSE` |
| `REACT_APP_BYPASS_SMS_2FA` | Bypass SMS 2FA authentication | `true` |

### Backend (backend.env)

#### General Settings

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_NUMBER` | Node number | `1` |
| `NODE_NAME` | Node name | `NODE1` |
| `NODE_UUID` | Node UUID | `61f17958-39ff-4284-9a80-bb7e4aad1063` |
| `NODE_ENV` | Execution environment | `development`, `production` |
| `APP_NAME` | Application name | `localhost` |
| `APP_SECRET` | JWT secret key | `your_app_secret_here` |
| `APP_WEB_URL` | Frontend URL | `http://frontend.local-env.orb.local/` |
| `APP_API_URL` | API URL | `http://backend.local-env.orb.local/` |
| `ENABLE_CREATE_USER` | Allow user creation | `true` |
| `CHARGE_AMOUNT` | Fee amount (if applicable) | `-1` |

#### Authentication and Security

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_TWO_FACTOR_AUTHENTICATION_APP_NAME` | 2FA app name | `GoKnown` |
| `PREAUTHENTICATION_PASSOWORD` | Pre-authentication password | `your_password_here` |
| `PREAUTHENTICATION_ID` | Pre-authentication ID | `your_preauthentication_id_here` |
| `TWOFA_DRIVER` | 2FA authentication driver | `google` |

#### Communication Services

| Variable | Description | Example |
|----------|-------------|---------|
| `MAIL_DRIVER` | Email service | `ethereal`, `ses` |
| `MAIL_BYPASS` | Bypass email sending | `true` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | `your_twilio_account_sid_here` |
| `TWILIO_AUTH_TOKEN` | Twilio authentication token | `your_twilio_auth_token_here` |
| `TWILIO_SERVICE_ID` | Twilio service ID | `your_twilio_service_id_here` |
| `TWILIO_BYPASS` | Bypass SMS sending | `true` |

#### AWS and Storage

| Variable | Description | Example |
|----------|-------------|---------|
| `STORAGE_DRIVER` | Storage driver | `digitalocean`, `local` |
| `AWS_ACCESS_KEY_ID` | AWS key ID | `your_aws_access_key_id_here` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `your_aws_secret_access_key_here` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `DO_SPACES_ENDPOINT` | DigitalOcean Spaces endpoint | `sfo3.digitaloceanspaces.com` |
| `DO_SPACES_KEY` | DigitalOcean Spaces key | `your_api_key_here` |
| `DO_SPACES_SECRET` | DigitalOcean Spaces secret | `your_api_key_here` |
| `DO_SPACES_BUCKET` | DigitalOcean Spaces bucket | `storage-goknown` |
| `DO_SPACE_URL` | DigitalOcean Spaces URL | `https://storage-goknown.sfo3.digitaloceanspaces.com` |

#### Database and Cache

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection URL | `your_database_url_here` |
| `REDIS_HOST` | Redis host | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASS` | Redis password | `redis` |

## How to Customize Environment Variables

1. **Local Development**:
   - Make a copy of `backend.env` and `frontend.env` files if needed
   - Edit variables according to your local configuration
   - Run `docker-compose up -d` to apply changes

2. **Production**:
   - Create specific environment files for production
   - Ensure passwords and API keys are secure
   - Use the `build-and-push.sh` (Linux/Mac) or `build-and-push.bat` (Windows) script to create images

3. **Docker Compose Configuration**:
   - The `docker-compose.yml` file is configured to use .env files
   - You can modify the environment file paths in the `env_file` section of each service

## Building and Pushing Images to Docker Hub

### Linux/Mac
1. Edit the `build-and-push.sh` file and change the `DOCKER_HUB_USERNAME` variable to your Docker Hub username.

2. Run the script:
```bash
./build-and-push.sh
```

### Windows
1. Edit the `build-and-push.bat` file and change the `DOCKER_HUB_USERNAME` variable to your Docker Hub username.

2. Run the script:
```cmd
build-and-push.bat
```

This script will:
1. Build frontend and backend images
2. Offer the option to build a complete image (frontend + backend)
3. Tag images with current date/time and 'latest'
4. Push images to Docker Hub

## Notes

- Make sure you are logged into Docker Hub before running the push script (`docker login`)
- You can adjust environment variables as needed for your specific environment
- Never share .env files with sensitive credentials in public repositories
- For Windows users, use the `.bat` scripts instead of `.sh` scripts
- Ensure Docker Desktop is properly configured for Windows compatibility 
