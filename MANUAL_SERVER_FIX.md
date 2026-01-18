deploy.sh# 🛠️ Manual Server Fix
Since the local update script didn't run, the server still has the old, broken files. Let's fix them directly on the server.

You are already logged in to the server (`grahmindubuntu@...`), so just run these commands there.

## 1. Fix `deploy.sh`
Run this command to create the correct deployment script:

```bash
cat << 'EOF' > /opt/cricapp/deploy.sh
#!/bin/bash
set -e

# Auto-detect docker compose command
cd /opt/cricapp

if docker compose version > /dev/null 2>&1; then
    DC="docker compose"
elif command -v docker-compose > /dev/null 2>&1; then
    DC="docker-compose"
else
    echo "❌ Docker Compose not found. Installing plugin..."
    sudo apt-get update && sudo apt-get install -y docker-compose-plugin
    DC="docker compose"
fi

echo "🚀 Deploying with $DC..."

# Pull and Start
$DC -f docker-compose.prod.yml --env-file .env.production pull
$DC -f docker-compose.prod.yml --env-file .env.production up -d

# Health Check
echo "⏳ Waiting for startup..."
sleep 15
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Success! Backend is healthy."
    $DC -f docker-compose.prod.yml ps
else
    echo "❌ Health check failed. Last 20 logs:"
    $DC -f docker-compose.prod.yml logs --tail=20 backend
    exit 1
fi
EOF

chmod +x /opt/cricapp/deploy.sh
```

## 2. Fix `docker-compose.prod.yml`
Run this to ensure you have the correct Docker configuration:

```bash
cat << 'EOF' > /opt/cricapp/docker-compose.prod.yml
version: '3.8'

services:
  backend:
    image: shashiv456/cricapp-backend:latest
    container_name: cricapp-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: ${DATABASE_URL}
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      JWT_SECRET: ${JWT_SECRET}
    volumes:
      - backend_logs:/app/logs
      - backend_uploads:/app/uploads
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  backend_logs:
    driver: local
  backend_uploads:
    driver: local
EOF
```

## 3. Run Deployment
Now that the files are fixed, run:

```bash
cd /opt/cricapp
./deploy.sh
```
