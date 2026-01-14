#!/bin/bash

# Server Environment Setup Script for Supabase (Backend Centric)
# Run this on your production server: grahmindubuntu@103.233.73.55

echo "🚀 Setting up Cricket Backend Production Environment"
echo ""

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/cricapp
sudo chown $USER:$USER /opt/cricapp
cd /opt/cricapp

# Create environment file template if it doesn't exist
if [ ! -f .env.production ]; then
    echo "📝 Creating environment file template..."
    cat > .env.production << 'EOF'
# Supabase Configuration
DATABASE_URL=CHANGE_THIS_SUPABASE_DATABASE_URL
SUPABASE_URL=CHANGE_THIS_SUPABASE_URL
SUPABASE_ANON_KEY=CHANGE_THIS_SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY=CHANGE_THIS_SUPABASE_SERVICE_KEY

# JWT Secret
JWT_SECRET=CHANGE_THIS_SECRET

# Docker Hub Configuration
DOCKER_USERNAME=shashiv456

# Application Configuration
NODE_ENV=production
PORT=3000
EOF

    echo ""
    echo "🔑 Generating JWT secret..."
    JWT_SECRET=$(openssl rand -base64 64)
    sed -i "s/CHANGE_THIS_SECRET/$JWT_SECRET/g" .env.production
    echo "✅ JWT Secret generated and saved to .env.production"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Server directory ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next steps:"
echo "   1. Edit /opt/cricapp/.env.production and add Supabase credentials"
echo "   2. Ensure GitHub Actions build completes"
echo "   3. Run: ./deploy.sh on the server"
echo ""
