#!/bin/bash

echo "🧹 Cleaning up legacy containers..."

# Stop and remove specific legacy containers found
if sudo docker ps -a | grep -q "backend"; then
    echo "🛑 Stopping 'backend' container..."
    sudo docker stop backend
    sudo docker rm backend
fi

if sudo docker ps -a | grep -q "mongodb"; then
    echo "🛑 Stopping 'mongodb' container..."
    sudo docker stop mongodb
    sudo docker rm mongodb
fi

# Check for any rogue processes on port 3000
echo "🔍 Checking port 3000..."
PID=$(sudo lsof -t -i:3000)
if [ ! -z "$PID" ]; then
    echo "⚠️ Killing process on port 3000 (PID: $PID)..."
    sudo kill -9 $PID
fi

echo "✅ Cleanup complete. Ready to deploy new version."
