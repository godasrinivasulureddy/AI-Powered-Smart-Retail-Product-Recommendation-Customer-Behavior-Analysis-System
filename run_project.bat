@echo off
title RetailIQ AI Application Launcher
echo ============================================================
echo           RetailIQ AI System Launcher
echo ============================================================
echo.

echo Starting Backend Server (FastAPI on Port 8000)...
start "RetailIQ AI - Backend (FastAPI)" cmd /k "cd /d %~dp0backend && uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo Starting Frontend Server (React + Vite on Port 3000)...
start "RetailIQ AI - Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================================
echo RetailIQ AI Services Launched Successfully!
echo.
echo  - Frontend Application : http://localhost:3000
echo  - Backend API Docs    : http://localhost:8000/docs
echo ============================================================
echo.
echo Press any key to close this launcher window (servers will remain running).
pause > nul
