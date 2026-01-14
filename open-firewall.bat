@echo off
echo ========================================
echo Opening Windows Firewall Port 4000
echo ========================================
echo.
echo This script needs Administrator privileges.
echo If prompted, click "Yes" to allow.
echo.

netsh advfirewall firewall add rule name="Cricapp Backend Port 4000" dir=in action=allow protocol=TCP localport=4000

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCCESS! Firewall port 4000 is now open.
    echo Your backend should now be accessible from your Android device.
    echo.
    echo Test by trying to sign up again from your Flutter app.
) else (
    echo.
    echo ❌ FAILED! You need to run this as Administrator.
    echo.
    echo Right-click this file and select "Run as administrator"
    echo.
)

pause







