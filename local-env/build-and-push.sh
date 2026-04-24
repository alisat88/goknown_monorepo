#!/bin/bash
set -e

# Define variables
DOCKER_HUB_USERNAME="dappgenius"
APP_VERSION=$(date +"%Y%m%d%H%M%S")
BACKEND_IMAGE_NAME="$DOCKER_HUB_USERNAME/goknown-backend"
FRONTEND_IMAGE_NAME="$DOCKER_HUB_USERNAME/goknown-frontend"
FULL_APP_IMAGE_NAME="$DOCKER_HUB_USERNAME/goknown-full"

# Get the absolute path of the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Building Docker images..."

# Build backend image
echo "Building backend image..."
cd "$SCRIPT_DIR" && docker-compose -f docker-compose.build.yml build backend-build
docker tag goknown-backend:latest "$BACKEND_IMAGE_NAME:$APP_VERSION"
docker tag goknown-backend:latest "$BACKEND_IMAGE_NAME:latest"

# Build frontend image
echo "Building frontend image..."
cd "$SCRIPT_DIR" && docker-compose -f docker-compose.build.yml build frontend-build
docker tag goknown-frontend:latest "$FRONTEND_IMAGE_NAME:$APP_VERSION"
docker tag goknown-frontend:latest "$FRONTEND_IMAGE_NAME:latest"

# Build full app image (optional)
echo "Do you want to build the full app image? (y/n)"
read build_full_app_image

if [ "$build_full_app_image" = "y" ]; then
  echo "Building full app image..."
  cd "$SCRIPT_DIR" && docker-compose -f docker-compose.build.yml build full-app-build
  docker tag goknown-full:latest "$FULL_APP_IMAGE_NAME:$APP_VERSION"
  docker tag goknown-full:latest "$FULL_APP_IMAGE_NAME:latest"
fi

# Push images to Docker Hub
echo "Pushing images to Docker Hub..."
docker push "$BACKEND_IMAGE_NAME:$APP_VERSION"
docker push "$BACKEND_IMAGE_NAME:latest"
docker push "$FRONTEND_IMAGE_NAME:$APP_VERSION"
docker push "$FRONTEND_IMAGE_NAME:latest"

if [ "$build_full_app_image" = "y" ]; then
  docker push "$FULL_APP_IMAGE_NAME:$APP_VERSION"
  docker push "$FULL_APP_IMAGE_NAME:latest"
fi

echo "Process completed successfully!"
echo "Version: $APP_VERSION" 