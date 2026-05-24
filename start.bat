@echo off
title Bullseye Trading AI - Launcher
color 0A
echo.
echo  ===========================================
echo   BULLSEYE TRADING AI - STARTING SERVERS
echo  ===========================================
echo.

set NODE="C:\Program Files\nodejs\node.exe"
set NPM="C:\Program Files\nodejs\npm.cmd"

:: Kill any old node processes
echo [1/3] Stopping old processes...
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

:: Start Backend
echo [2/3] Starting Backend on Port 5000...
start "Backend - Port 5000" cmd /k "%NODE% server.js"
cd /d "%~dp0backend"
start "" cmd /k "title Backend-5000 && %NODE% server.js"
cd /d "%~dp0"
timeout /t 4 /nobreak >nul

:: Start Frontend  
echo [3/3] Starting Frontend on Port 3000...
start "" cmd /k "title Frontend-3000 && cd /d "%~dp0frontend" && %NPM% run dev -- --port 3000 --host"
timeout /t 8 /nobreak >nul

:: Open browser
echo Opening dashboard in browser...
start "" "http://localhost:3000"

echo.
echo  =========================================
echo   ✅ Dashboard: http://localhost:3000
echo   ✅ Backend API: http://localhost:5000
echo  =========================================
echo.
pause
