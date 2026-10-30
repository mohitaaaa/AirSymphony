@echo off
title AirSymphony Studio
echo ==============================================
echo   Starting AirSymphony Studio...
echo ==============================================
cd /d "%~dp0"
echo Launching Python CNN+LSTM Neural Network Server...
start "AirSymphony Python AI Backend" cmd /c "python python_backend/server.py"

echo Opening browser at http://localhost:3000...
start http://localhost:3000
echo.
echo Starting Vite server...
npm run dev
pause
