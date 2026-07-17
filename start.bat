@echo off
title QUIZ//FORGE launcher by DevDynasty
echo ⚡ Starting QUIZ//FORGE Servers...

:: Start Backend in a new window
echo ◈ Launching Backend Server on port 5000...
start "QUIZ//FORGE Backend" cmd /c "cd backend && node server.js"

:: Start Frontend in a new window
echo ◈ Launching Frontend Vite Server...
start "QUIZ//FORGE Frontend" cmd /c "cd frontend && npm run dev"

:: Wait a brief moment for servers to spin up
timeout /t 3 /nobreak > nul

:: Open browser
echo ◈ Launching Web App browser...
start http://localhost:5173/

echo 🚀 Done! Keep the terminal windows open to keep the servers running.
echo Press any key to exit this launcher.
pause > nul
