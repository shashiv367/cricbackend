#!/bin/bash

echo "🛡️  Configuring Firewall for Cricapp..."

# 1. Allow critical ports first
echo "🔓 Allowing SSH (Port 22)..."
sudo ufw allow 22/tcp

echo "🔓 Allowing HTTP/HTTPS (Port 80, 443)..."
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 2. Allow Application Port
echo "🔓 Allowing Backend (Port 3000)..."
sudo ufw allow 3000/tcp

# 3. Enable firewall if not active
echo "🔥 Enabling firewall..."
# --force avoids the "Command may disrupt existing ssh connections" prompt
# since we explicitly allowed port 22 above.
sudo ufw --force enable

# 4. Show status
echo "📊 Firewall Status:"
sudo ufw status verbose

echo ""
echo "✅ Firewall updated! Port 3000 is now open."
echo "👉 Try accessing http://103.233.73.55:3000/api/health from your browser."
