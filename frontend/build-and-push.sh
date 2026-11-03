#!/bin/bash
# Copyright (C) 2026 GoKnown LLC. All rights reserved.
#
# This software and documentation constitute an unpublished work and contain
# valuable trade secrets and proprietary information belonging to GoKnown LLC.
# None of this material may be copied, duplicated, or disclosed without the
# express written permission of GoKnown LLC.
set -e

# Define variables
DOCKER_HUB_USERNAME="dappgenius"
APP_VERSION=$(date +"%Y%m%d%H%M%S")
FRONTEND_IMAGE_NAME="$DOCKER_HUB_USERNAME/goknown-frontend"

# Get the absolute path of the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Building Frontend Docker image..."

# Build frontend image
echo "Building frontend image..."
cd "$SCRIPT_DIR" && docker build -t goknown-frontend:latest .
docker tag goknown-frontend:latest "$FRONTEND_IMAGE_NAME:$APP_VERSION"
docker tag goknown-frontend:latest "$FRONTEND_IMAGE_NAME:latest"

# Push images to Docker Hub
echo "Pushing images to Docker Hub..."
docker push "$FRONTEND_IMAGE_NAME:$APP_VERSION"
docker push "$FRONTEND_IMAGE_NAME:latest"

echo "Process completed successfully!"
echo "Version: $APP_VERSION" 
