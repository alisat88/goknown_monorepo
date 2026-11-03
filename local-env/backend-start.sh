#!/bin/sh
# Copyright (C) 2026 GoKnown LLC. All rights reserved.
#
# This software and documentation constitute an unpublished work and contain
# valuable trade secrets and proprietary information belonging to GoKnown LLC.
# None of this material may be copied, duplicated, or disclosed without the
# express written permission of GoKnown LLC.

# Backend startup script with proper logging
set -e

echo "=========================================="
echo "Starting GoKnown Backend"
echo "=========================================="
echo ""

echo "[1/3] Running database migrations..."
yarn typeorm migration:run
MIGRATION_EXIT=$?
if [ $MIGRATION_EXIT -ne 0 ]; then
    echo "ERROR: Migrations failed with exit code $MIGRATION_EXIT"
    exit $MIGRATION_EXIT
fi
echo "✓ Migrations completed successfully"
echo ""

echo "[2/3] Building application..."
yarn build
BUILD_EXIT=$?
if [ $BUILD_EXIT -ne 0 ]; then
    echo "ERROR: Build failed with exit code $BUILD_EXIT"
    exit $BUILD_EXIT
fi
echo "✓ Build completed successfully"
echo ""

echo "[3/3] Starting server..."
echo "Server will start on port 3333"
echo "=========================================="
yarn start


