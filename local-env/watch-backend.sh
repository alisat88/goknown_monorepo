#!/bin/bash

# Watch backend logs for errors
echo "Watching backend logs (Ctrl+C to exit)..."
echo "=========================================="
echo ""

sudo docker logs -f goknown-backend 2>&1 | grep -i --color=always -E "error|400|bad request|validation|failed|exception" || sudo docker logs -f goknown-backend


