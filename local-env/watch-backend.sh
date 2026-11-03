#!/bin/bash
# Copyright (C) 2026 GoKnown LLC. All rights reserved.
#
# This software and documentation constitute an unpublished work and contain
# valuable trade secrets and proprietary information belonging to GoKnown LLC.
# None of this material may be copied, duplicated, or disclosed without the
# express written permission of GoKnown LLC.

# Watch backend logs for errors
echo "Watching backend logs (Ctrl+C to exit)..."
echo "=========================================="
echo ""

sudo docker logs -f goknown-backend 2>&1 | grep -i --color=always -E "error|400|bad request|validation|failed|exception" || sudo docker logs -f goknown-backend


