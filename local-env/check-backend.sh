#!/bin/bash

# Backend Diagnostic Script
# Checks why the backend isn't running

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Backend Diagnostic Check${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if docker-compose command exists
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo -e "${YELLOW}1. Checking container status...${NC}"
sudo $COMPOSE_CMD -f "$COMPOSE_FILE" ps backend 2>&1 | grep -v "pfxMSaMjPWg1ppylnmTmlO" || true
echo ""

echo -e "${YELLOW}2. Checking if port 3333 is listening...${NC}"
if lsof -i :3333 >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Port 3333 is in use${NC}"
    lsof -i :3333
else
    echo -e "${RED}✗ Port 3333 is NOT listening${NC}"
fi
echo ""

echo -e "${YELLOW}3. Backend container logs (last 50 lines)...${NC}"
echo -e "${BLUE}--- Backend Logs ---${NC}"
sudo docker logs goknown-backend --tail=50 2>&1 | tail -50
echo ""

echo -e "${YELLOW}4. Checking backend container exit code...${NC}"
EXIT_CODE=$(sudo docker inspect goknown-backend --format='{{.State.ExitCode}}' 2>/dev/null || echo "N/A")
STATUS=$(sudo docker inspect goknown-backend --format='{{.State.Status}}' 2>/dev/null || echo "N/A")
echo "Status: $STATUS"
echo "Exit Code: $EXIT_CODE"
echo ""

echo -e "${YELLOW}5. Checking database connectivity from backend...${NC}"
sudo docker exec goknown-postgres pg_isready -U root -d defaultdb 2>/dev/null && echo -e "${GREEN}✓ PostgreSQL is ready${NC}" || echo -e "${RED}✗ PostgreSQL is not ready${NC}"
echo ""

echo -e "${YELLOW}6. Checking Redis connectivity...${NC}"
sudo docker exec goknown-redis redis-cli ping 2>/dev/null | grep -q PONG && echo -e "${GREEN}✓ Redis is responding${NC}" || echo -e "${RED}✗ Redis is not responding${NC}"
echo ""

echo -e "${YELLOW}7. Recent backend container events...${NC}"
sudo docker events --filter container=goknown-backend --since 5m 2>/dev/null | head -10 || echo "No recent events"
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Recommendations${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ "$STATUS" != "running" ]; then
    echo -e "${YELLOW}Backend container is not running. Try:${NC}"
    echo "  cd $(dirname $SCRIPT_DIR)/local-env"
    echo "  ./start.sh --restart"
    echo ""
fi

if [ "$EXIT_CODE" != "0" ] && [ "$EXIT_CODE" != "N/A" ]; then
    echo -e "${YELLOW}Backend exited with code $EXIT_CODE. Common causes:${NC}"
    echo "  • Database connection failed"
    echo "  • Missing environment variables"
    echo "  • Application startup error"
    echo "  • Port already in use"
    echo ""
    echo "Check the logs above for specific error messages."
    echo ""
fi

echo -e "${BLUE}To view live logs:${NC}"
echo "  sudo docker logs -f goknown-backend"
echo ""


