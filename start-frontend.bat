@echo off
echo =====================================================
echo  Smart Campus Incident Hub — Frontend Startup
echo =====================================================
echo.
echo Starting React dev server on http://localhost:5173
echo.
cd /d "%~dp0frontend"
call npm install
call npm run dev
pause
