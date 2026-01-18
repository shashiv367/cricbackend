#!/bin/bash
set -e

# Detect Docker Compose command
if docker compose version > /dev/null 2>&1; then
    COMPOSE="docker compose"
    echo "✅ Using Docker Compose Plugin (v2)"
elif command -v docker-compose > /dev/null 2>&1; then
    COMPOSE="docker-compose"
    echo "✅ Using Legacy Docker Compose (v1)"
else
    echo "❌ Error: Neither 'docker compose' nor 'docker-compose' found."
    echo "   Please install it: sudo apt-get install docker-compose-plugin"
    exit 1
fi

echo "🚀 Deploying Cricket Backend..."

# Pull latest images
echo "📥 Pulling latest Docker images..."
$COMPOSE -f docker-compose.prod.yml --env-file .env.production pull

# Restart services
echo "🔄 Restarting services..."
$COMPOSE -f docker-compose.prod.yml --env-file .env.production up -d

# Wait for health check
echo "⏳ Waiting for services..."
sleep 10

# Check health
echo "🏥 Checking backend health..."
# We check localhost because we are ON the server
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy!"
    $COMPOSE -f docker-compose.prod.yml ps
else
    echo "❌ Backend health check failed!"
    $COMPOSE -f docker-compose.prod.yml logs --tail=50 backend
    exit 1
fi
