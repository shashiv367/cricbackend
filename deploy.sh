#!/bin/bash
set -e

echo "🚀 Deploying Cricket Backend..."

# Pull latest images
echo "📥 Pulling latest Docker images..."
docker-compose --env-file .env.production pull

# Restart services
echo "🔄 Restarting services..."
docker-compose --env-file .env.production up -d

# Wait for health check
echo "⏳ Waiting for services..."
sleep 10

# Check health
echo "🏥 Checking backend health..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy!"
    docker-compose ps
else
    echo "❌ Backend health check failed!"
    docker-compose logs --tail=50 backend
    exit 1
fi
