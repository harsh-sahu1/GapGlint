@echo off
title GapGlint Launcher
echo ===================================================
echo Starting GapGlint (Backend + Frontend) on Localhost
echo ===================================================

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "GapGlint Backend (Port 8000)" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --port 8000"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Vite React Frontend on http://localhost:5173 ...
start "GapGlint Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo GapGlint is now starting!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://127.0.0.1:8000/docs
echo ===================================================
pause

