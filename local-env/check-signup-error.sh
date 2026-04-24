#!/bin/bash

# Check backend logs for signup errors

echo "=========================================="
echo "Checking Backend Logs for Signup Errors"
echo "=========================================="
echo ""

echo "Recent backend logs (last 50 lines):"
echo "-----------------------------------"
sudo docker logs goknown-backend --tail=50 2>&1 | tail -50
echo ""

echo "Searching for errors related to /users endpoint:"
echo "-----------------------------------"
sudo docker logs goknown-backend --tail=200 2>&1 | grep -i -A 5 -B 5 "users\|error\|400\|bad request" | tail -30
echo ""

echo "=========================================="
echo "To see live logs, run:"
echo "  sudo docker logs -f goknown-backend"
echo "=========================================="


