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

# Database
DATABASE_URL=postgresql://user:password@host:port/database

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
