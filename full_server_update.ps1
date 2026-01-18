$User = "grahmindubuntu"
$Ip = "103.233.73.55"
$RemotePath = "/opt/cricapp"

Write-Host "🚀 Starting Full Server Update..." -ForegroundColor Cyan

# 1. Stop Legacy Containers
Write-Host "🛑 Stopping legacy MongoDB/Backend containers..." -ForegroundColor Yellow
ssh ${User}@${Ip} "sudo docker stop backend mongodb 2>/dev/null; sudo docker rm backend mongodb 2>/dev/null; sudo docker kill backend mongodb 2>/dev/null"

# 2. Create Directory
Write-Host "📁 Ensuring /opt/cricapp exists..." -ForegroundColor Yellow
ssh ${User}@${Ip} "sudo mkdir -p ${RemotePath}; sudo chown ${User}:${User} ${RemotePath}"

# 3. Upload Production Files (Using backslashes for Windows paths)
Write-Host "Cw Uploading configuration files..." -ForegroundColor Yellow
scp backend\docker-compose.prod.yml ${User}@${Ip}:${RemotePath}/
scp backend\deploy.sh ${User}@${Ip}:${RemotePath}/

# 4. Permissions
Write-Host "🔒 Setting permissions..." -ForegroundColor Yellow
ssh ${User}@${Ip} "chmod +x ${RemotePath}/deploy.sh"

Write-Host "`n✅ Update Files Complete!" -ForegroundColor Green
Write-Host "👉 NEXT STEPS:"
Write-Host "1. SSH into the server: ssh ${User}@${Ip}"
Write-Host "2. Edit your env file:  nano ${RemotePath}/.env.production"
Write-Host "3. Run the deployment:  cd ${RemotePath} && ./deploy.sh"
