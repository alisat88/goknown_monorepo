#!/bin/bash
# Copyright (C) 2026 GoKnown LLC. All rights reserved.
#
# This software and documentation constitute an unpublished work and contain
# valuable trade secrets and proprietary information belonging to GoKnown LLC.
# None of this material may be copied, duplicated, or disclosed without the
# express written permission of GoKnown LLC.
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