@echo off
echo Building client for Netlify deployment...
cd client
call npm install
call npm run build
echo.
echo ✅ Build complete! 
echo 📁 Upload the 'client/dist' folder to Netlify
echo 🌐 Don't forget to set VITE_API_BASE_URL in Netlify environment variables
pause