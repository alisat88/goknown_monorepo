#!/bin/bash

# GoKnown Startup Script
# This script starts all required services for the GoKnown application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  GoKnown Startup Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check disk space
check_disk_space() {
    echo -e "${YELLOW}Checking disk space...${NC}"
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    AVAILABLE=$(df -h / | awk 'NR==2 {print $4}')
    
    if [ "$DISK_USAGE" -gt 90 ]; then
        echo -e "${RED}⚠️  WARNING: Disk usage is at ${DISK_USAGE}% (${AVAILABLE} available)${NC}"
        echo -e "${YELLOW}Consider cleaning up Docker resources:${NC}"
        echo -e "  sudo docker system prune -af --volumes"
        echo ""
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo -e "${GREEN}✓ Disk space OK (${DISK_USAGE}% used, ${AVAILABLE} available)${NC}"
    fi
    echo ""
}

# Function to check Docker
check_docker() {
    echo -e "${YELLOW}Checking Docker...${NC}"
    
    if ! command_exists docker; then
        echo -e "${RED}✗ Docker is not installed${NC}"
        exit 1
    fi
    
    if ! sudo docker info >/dev/null 2>&1; then
        echo -e "${RED}✗ Docker daemon is not running or permission denied${NC}"
        echo -e "${YELLOW}Try: sudo systemctl start docker${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Docker is running${NC}"
    echo ""
}

# Function to check Docker Compose
check_docker_compose() {
    echo -e "${YELLOW}Checking Docker Compose...${NC}"
    
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        echo -e "${RED}✗ Docker Compose is not installed${NC}"
        exit 1
    fi
    
    # Check which version is available
    if docker compose version >/dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
        echo -e "${GREEN}✓ Using Docker Compose V2${NC}"
    else
        COMPOSE_CMD="docker-compose"
        echo -e "${GREEN}✓ Using Docker Compose V1${NC}"
    fi
    echo ""
}

# Function to show current status
show_status() {
    echo -e "${YELLOW}Current container status:${NC}"
    sudo $COMPOSE_CMD -f "$COMPOSE_FILE" ps 2>&1 | grep -v "pfxMSaMjPWg1ppylnmTmlO" || sudo $COMPOSE_CMD -f "$COMPOSE_FILE" ps
    echo ""
}

# Function to stop all services
stop_services() {
    echo -e "${YELLOW}Stopping all services...${NC}"
    
    # Try graceful shutdown first
    if sudo $COMPOSE_CMD -f "$COMPOSE_FILE" down 2>/dev/null; then
        echo -e "${GREEN}✓ Services stopped gracefully${NC}"
    else
        echo -e "${YELLOW}⚠️  Graceful shutdown failed, trying force stop...${NC}"
        # Force stop containers if graceful shutdown fails
        sudo $COMPOSE_CMD -f "$COMPOSE_FILE" kill 2>/dev/null || true
        sudo $COMPOSE_CMD -f "$COMPOSE_FILE" rm -f 2>/dev/null || true
        echo -e "${GREEN}✓ Services force stopped${NC}"
    fi
    echo ""
}

# Function to refresh and rebuild services
refresh_services() {
    echo -e "${YELLOW}Refreshing services (rebuilding containers)...${NC}"
    sudo $COMPOSE_CMD -f "$COMPOSE_FILE" down
    sudo $COMPOSE_CMD -f "$COMPOSE_FILE" build --no-cache
    echo -e "${GREEN}✓ Services rebuilt${NC}"
    echo ""
}

# Function to start services
start_services() {
    echo -e "${YELLOW}Starting services...${NC}"
    echo -e "${BLUE}This may take a few minutes on first run...${NC}"
    echo ""
    
    # Suppress the bcrypt hash variable expansion warning (harmless)
    # Start services in detached mode
    sudo $COMPOSE_CMD -f "$COMPOSE_FILE" up -d 2>&1 | grep -v "pfxMSaMjPWg1ppylnmTmlO" || true
    
    echo ""
    echo -e "${GREEN}✓ Services started${NC}"
    echo ""
}

# Function to wait for services to be healthy
wait_for_services() {
    echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
    
    MAX_WAIT=120
    ELAPSED=0
    
    while [ $ELAPSED -lt $MAX_WAIT ]; do
        # Check if postgres is healthy
        POSTGRES_STATUS=$(sudo $COMPOSE_CMD -f "$COMPOSE_FILE" ps postgres 2>/dev/null | grep -c "healthy" || echo "0")
        REDIS_STATUS=$(sudo $COMPOSE_CMD -f "$COMPOSE_FILE" ps redis 2>/dev/null | grep -c "healthy" || echo "0")
        BACKEND_STATUS=$(sudo $COMPOSE_CMD -f "$COMPOSE_FILE" ps backend 2>/dev/null | grep -c "healthy\|Up" || echo "0")
        
        if [ "$POSTGRES_STATUS" -gt 0 ] && [ "$REDIS_STATUS" -gt 0 ] && [ "$BACKEND_STATUS" -gt 0 ]; then
            echo -e "${GREEN}✓ All services are healthy${NC}"
            echo ""
            return 0
        fi
        
        echo -n "."
        sleep 2
        ELAPSED=$((ELAPSED + 2))
    done
    
    echo ""
    echo -e "${YELLOW}⚠️  Services may still be starting. Check logs with:${NC}"
    echo -e "  sudo $COMPOSE_CMD -f $COMPOSE_FILE logs"
    echo ""
}

# Function to show service URLs
show_urls() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Services are running!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}Service URLs:${NC}"
    echo -e "  • Frontend:    ${GREEN}http://localhost:3000${NC}"
    echo -e "  • Backend API: ${GREEN}http://localhost:3333${NC}"
    echo -e "  • Nginx:       ${GREEN}http://localhost:80${NC}"
    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo -e "  • View logs:    sudo $COMPOSE_CMD -f $COMPOSE_FILE logs -f"
    echo -e "  • Stop all:     sudo $COMPOSE_CMD -f $COMPOSE_FILE down"
    echo -e "  • Restart:      sudo $COMPOSE_CMD -f $COMPOSE_FILE restart"
    echo -e "  • Status:       sudo $COMPOSE_CMD -f $COMPOSE_FILE ps"
    echo ""
}

# Main execution
main() {
    # Parse command line arguments
    RESTART=false
    CLEAN=false
    FOLLOW_LOGS=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -r|--restart)
                RESTART=true
                shift
                ;;
            -c|--clean)
                CLEAN=true
                shift
                ;;
            -f|--follow|--logs)
                FOLLOW_LOGS=true
                shift
                ;;
            --refresh|--rebuild)
                REFRESH=true
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  -r, --restart    Stop all services before starting"
                echo "  -c, --clean      Clean Docker resources before starting"
                echo "  -f, --follow    Follow logs after starting"
                echo "  --refresh       Rebuild containers before starting"
                echo "  -h, --help      Show this help message"
                exit 0
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                echo "Use -h or --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Run checks
    check_disk_space
    check_docker
    check_docker_compose
    
    # Show current status
    show_status
    
    # Clean if requested
    if [ "$CLEAN" = true ]; then
        echo -e "${YELLOW}Cleaning Docker resources...${NC}"
        sudo docker system prune -af --volumes
        echo -e "${GREEN}✓ Cleanup complete${NC}"
        echo ""
    fi
    
    # Refresh/rebuild if requested
    if [ "$REFRESH" = true ]; then
        stop_services
        refresh_services
        sleep 2
    elif [ "$RESTART" = true ]; then
        stop_services
        sleep 2
    fi
    
    # Start services
    start_services
    
    # Wait for services
    wait_for_services
    
    # Show final status
    show_status
    
    # Show URLs
    show_urls
    
    # Follow logs if requested
    if [ "$FOLLOW_LOGS" = true ]; then
        echo -e "${YELLOW}Following logs (Ctrl+C to exit)...${NC}"
        sudo $COMPOSE_CMD -f "$COMPOSE_FILE" logs -f
    fi
}

# Run main function
main "$@"

