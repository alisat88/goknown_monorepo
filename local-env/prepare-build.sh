#!/bin/bash
set -e

# Get the absolute path of the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Copy environment files to project root
cp "$SCRIPT_DIR/backend.env" "$PROJECT_ROOT/backend.env"
cp "$SCRIPT_DIR/frontend.env" "$PROJECT_ROOT/frontend.env"

# Run build script
"$SCRIPT_DIR/build-and-push.sh"

# Clean up
rm "$PROJECT_ROOT/backend.env"
rm "$PROJECT_ROOT/frontend.env" 