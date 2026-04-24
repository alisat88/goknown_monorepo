#!/bin/bash
# Clean all Docker instances for goknown project

set -e

echo "🧹 Cleaning Docker instances..."

# Navigate to local-env directory
cd "$(dirname "$0")"

# Stop and remove all containers, volumes, and networks
echo "📦 Stopping and removing containers..."
docker-compose down -v --remove-orphans 2>/dev/null || sudo docker-compose down -v --remove-orphans

# Remove any remaining goknown containers
echo "🗑️  Removing remaining goknown containers..."
docker ps -a --filter "name=goknown" --format "{{.Names}}" 2>/dev/null | xargs -r docker rm -f 2>/dev/null || \
sudo docker ps -a --filter "name=goknown" --format "{{.Names}}" 2>/dev/null | xargs -r sudo docker rm -f 2>/dev/null || true

# Remove volumes
echo "💾 Removing volumes..."
docker volume ls --filter "name=local-env" --format "{{.Name}}" 2>/dev/null | xargs -r docker volume rm 2>/dev/null || \
sudo docker volume ls --filter "name=local-env" --format "{{.Name}}" 2>/dev/null | xargs -r sudo docker volume rm 2>/dev/null || true

docker volume ls --filter "name=goknown" --format "{{.Name}}" 2>/dev/null | xargs -r docker volume rm 2>/dev/null || \
sudo docker volume ls --filter "name=goknown" --format "{{.Name}}" 2>/dev/null | xargs -r sudo docker volume rm 2>/dev/null || true

# Remove networks
echo "🌐 Removing networks..."
docker network ls --filter "name=goknown" --format "{{.Name}}" 2>/dev/null | xargs -r docker network rm 2>/dev/null || \
sudo docker network ls --filter "name=goknown" --format "{{.Name}}" 2>/dev/null | xargs -r sudo docker network rm 2>/dev/null || true

# Optional: Prune system (uncomment if you want to clean everything)
# echo "🧼 Pruning Docker system..."
# docker system prune -f --volumes 2>/dev/null || sudo docker system prune -f --volumes

echo "✅ Cleanup complete!"
echo ""
echo "To start fresh, run:"
echo "  docker-compose up -d --build"
echo "  or"
echo "  sudo docker-compose up -d --build"





