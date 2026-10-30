@echo off
title AirSymphony Python Neural Network Engine (CNN + LSTM)
echo ====================================================================
echo   AIRSYMPHONY: Starting Python CNN + LSTM Neural Network Backend
echo ====================================================================
cd /d "%~dp0"
echo Verifying Python environment...
python --version
echo.
echo Starting FastAPI & WebSocket Neural Network Inference Server on port 8000...
python python_backend/server.py
pause
