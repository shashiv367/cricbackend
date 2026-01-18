#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Running Server Diagnostics...${NC}"

echo -e "\n${YELLOW}1. Checking UFW Firewall Status:${NC}"
sudo ufw status | grep 3000
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Port 3000 is ALLOWED in UFW.${NC}"
else
    echo -e "${RED}❌ Port 3000 is NOT found in UFW status!${NC}"
fi

echo -e "\n${YELLOW}2. Checking if Docker Container is Running:${NC}"
# Check if container named 'cricapp-backend' or similar is running
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Docker containers are UP.${NC}"
    docker compose ps
else
    echo -e "${RED}❌ Docker containers are NOT running!${NC}"
    echo "Attempting to show all containers:"
    docker compose ps -a
fi

echo -e "\n${YELLOW}3. Checking if Port 3000 is Listening:${NC}"
if sudo ss -tuln | grep -q ":3000"; then
    echo -e "${GREEN}✅ A service is LISTENING on port 3000.${NC}"
else
    echo -e "${RED}❌ NOTHING is listening on port 3000!${NC}"
    echo "This is likely why you see CONNECTION REFUSED."
fi

echo -e "\n${YELLOW}4. Testing Local Connectivity (curl):${NC}"
curl -v http://localhost:3000/api/health
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Local connection SUCCESSFUL.${NC}"
else
    echo -e "\n${RED}❌ Local connection FAILED.${NC}"
fi

echo -e "\n${YELLOW}5. Checking Backend Logs (Last 20 lines):${NC}"
docker compose logs --tail=20 backend
