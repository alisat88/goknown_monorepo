# GoKnown Project

This project consists of a full-stack application with a Node.js backend and React frontend, using Docker for containerization.

## Prerequisites

- Docker
- Docker Compose
- Node.js (for local development)
- Yarn (for local development)

## Quick Start with Docker Hub Image

The easiest way to run the application is using the pre-built image from Docker Hub. This image contains the latest stable build with all environment configurations included.

```bash
# Pull and run the latest image
docker run -p 3333:3333 -p 3000:3000 \
  --name goknown-full \
  docker.io/dappgenius/goknown-full
```

This will:
- Pull the latest image from Docker Hub
- Start the container with both frontend and backend
- Expose ports 3333 (backend) and 3000 (frontend)
- Use the pre-configured environment variables

Note: The Docker Hub image is automatically updated with each successful build and contains the latest stable version of the application.

## Project Structure

```
goknown/
├── backend/          # Node.js backend application
├── frontend/         # React frontend application
└── local-env/        # Docker configuration files
    ├── backend.Dockerfile
    ├── frontend.Dockerfile
    ├── production.Dockerfile
    ├── docker-compose.yml
    ├── docker-compose.build.yml
    ├── backend.env
    ├── frontend.env
    └── build-and-push.sh
```

## Building and Pushing Images

To build and push images to Docker Hub:

```bash
# From the local-env directory
cd local-env
./build-and-push.sh
```

This will:
- Build backend, frontend, and full app images
- Tag images with version and latest
- Push images to Docker Hub
- Use environment variables from local-env

## Running with Docker Compose

Docker Compose is the recommended way to run the entire application stack locally. It will set up all necessary services (backend, frontend, Redis, and PostgreSQL) with proper networking and volume mounts.

### Start the Application

```bash
# From the project root directory
cd local-env
docker-compose up --build
```

This will:
- Build all Docker images
- Start all services
- Set up the network between containers
- Mount volumes for hot-reloading
- Run database migrations
- Start the applications

### Stop the Application

```bash
# From the local-env directory
docker-compose down
```

## Running with Docker Run

You can also run individual services using `docker run`. This is useful for testing specific components or running in production.

### Backend Service

```bash
# Build the backend image
docker build -t goknown-backend -f local-env/backend.Dockerfile .

# Run the backend container
docker run -p 3333:3333 \
  --env-file local-env/backend.env \
  --network goknown-network \
  --name goknown-backend \
  goknown-backend
```

### Frontend Service

```bash
# Build the frontend image
docker build -t goknown-frontend -f local-env/frontend.Dockerfile .

# Run the frontend container
docker run -p 3000:3000 \
  --env-file local-env/frontend.env \
  --network goknown-network \
  --name goknown-frontend \
  goknown-frontend
```

## Environment Variables

The project uses environment variables for configuration. These are stored in:

- `local-env/backend.env` - Backend configuration
- `local-env/frontend.env` - Frontend configuration

## Services

The application consists of the following services:

1. **Backend** (Port 3333)
   - Node.js application
   - TypeORM for database access
   - Redis for caching
   - PostgreSQL for data storage

2. **Frontend** (Port 3000)
   - React application
   - Hot reloading enabled
   - Connected to backend API

3. **Redis** (Port 6379)
   - Used for caching and session storage
   - Password protected

4. **PostgreSQL** (Port 5432)
   - Main database
   - Persistent volume for data storage

## Development Tips

- Use `docker-compose up --build` when you make changes to the Dockerfiles
- Use `docker-compose logs -f` to follow the logs of all services
- Use `docker-compose restart <service>` to restart a specific service
- The backend supports hot-reloading for development
- The frontend supports hot-reloading for development

## Production Deployment

For production deployment, use the `production.Dockerfile` which creates an optimized image with both frontend and backend:

```bash
docker build -t goknown-production -f local-env/production.Dockerfile .
```

## Troubleshooting

1. **Database Connection Issues**
   - Check if PostgreSQL is running
   - Verify environment variables in backend.env
   - Check network connectivity between containers

2. **Build Failures**
   - Clear Docker cache: `docker-compose build --no-cache`
   - Check for missing dependencies in package.json
   - Verify Dockerfile paths

3. **Container Not Starting**
   - Check logs: `docker-compose logs <service>`
   - Verify port availability
   - Check for volume mount permissions 