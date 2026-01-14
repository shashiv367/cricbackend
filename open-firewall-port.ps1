# PowerShell script to open Windows Firewall port 4000 for Cricapp backend

Write-Host "Opening Windows Firewall port 4000 for Cricapp backend..." -ForegroundColor Yellow

# Check if rule already exists
$existingRule = Get-NetFirewallRule -DisplayName "Cricapp Backend Port 4000" -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "Firewall rule already exists. Removing old rule..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "Cricapp Backend Port 4000"
}

# Create new firewall rule
New-NetFirewallRule -DisplayName "Cricapp Backend Port 4000" `
    -Direction Inbound `
    -LocalPort 4000 `
    -Protocol TCP `
    -Action Allow `
    -Profile Any

if ($?) {
    Write-Host "✅ Firewall port 4000 opened successfully!" -ForegroundColor Green
    Write-Host "Your backend should now be accessible from your Android device." -ForegroundColor Green
} else {
    Write-Host "❌ Failed to open firewall port. You may need to run PowerShell as Administrator." -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator', then run this script again." -ForegroundColor Yellow
}







