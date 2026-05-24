@echo off
title BULLSEYE AI - PHONE SHARING TUNNEL
color 0B

echo ====================================================
echo   🐂 BULLSEYE TRADING AI - MOBILE SHARING TUNNEL
echo ====================================================
echo.
echo This script will share your dashboard to the internet so
echo you can open it on your phone or any other device!
echo.
echo IMPORTANT: Make sure the Backend server is running first!
echo.
echo ----------------------------------------------------
echo [✓] Initializing secure public tunnel...
echo.
echo Please wait about 2-3 seconds.
echo A secure link ending in ".lhr.life" will appear below!
echo.
echo Copy the "https://xxxx.lhr.life" link and open it
echo in your phone's web browser!
echo ----------------------------------------------------
echo.

ssh -o StrictHostKeyChecking=no -R 80:localhost:5000 nokey@localhost.run

pause
