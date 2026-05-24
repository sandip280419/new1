@echo off
title BULLSEYE AI - LAUNCHER
color 0A

echo ====================================================
echo   🐂 BULLSEYE TRADING AI - ONE-CLICK LAUNCHER
echo ====================================================
echo.

:: Check if Node.js is installed on user's machine
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not detected on your Windows system!
    echo.
    echo To run this dashboard, please download and install Node.js once.
    echo Node.js is free and takes less than 1 minute to install.
    echo.
    echo Opening official download page: https://nodejs.org/
    start https://nodejs.org/
    echo.
    echo After installing, please double-click this start_project.bat file again!
    pause
    exit
)

echo [✓] Node.js detected successfully.
echo.

:: Launch Backend Server in a new window
echo [1/3] Starting Express + WebSocket Backend...
start "BULLSEYE BACKEND - Port 5000" cmd /c "cd backend && echo Installing backend packages (this may take a few seconds on first run)... && npm install && echo Starting server... && npm run dev"

:: Launch Frontend Server in a new window
echo [2/3] Starting React + Vite Frontend...
start "BULLSEYE FRONTEND - Port 3000" cmd /c "cd frontend && echo Installing frontend packages (this may take a few seconds on first run)... && npm install && echo Starting client... && npm run dev"

:: Open Browser automatically
echo [3/3] Launching your web browser to http://localhost:3000...
timeout /t 5 >nul
start http://localhost:3000

echo.
echo ====================================================
echo   🟢 SUCCESS! The platform is booting up in the
echo   background. You can see the windows running.
echo ====================================================
echo.
pause
