@echo off
echo 🚀 Installing SendGrid Email Integration for Lead Management System
echo ==================================================================

REM Install Node.js dependencies
echo 📦 Installing Node.js dependencies...
npm install @sendgrid/mail@^8.1.3

REM Install Python dependencies
echo 🐍 Installing Python dependencies...
cd backend
pip install sendgrid==6.11.0
cd ..

echo ✅ Dependencies installed successfully!
echo.
echo 📧 SendGrid Configuration Required:
echo ==================================
echo Please add the following environment variables to your .env files:
echo.
echo Frontend (.env.local):
echo SENDGRID_API_KEY="your-sendgrid-api-key"
echo SENDGRID_FROM_EMAIL="your-from-email@domain.com"
echo.
echo Backend (backend/.env):
echo SENDGRID_API_KEY="your-sendgrid-api-key"
echo SENDGRID_FROM_EMAIL="your-from-email@domain.com"
echo.
echo 🔧 How to get your SendGrid API Key:
echo 1. Sign up at https://sendgrid.com/
echo 2. Go to Settings ^> API Keys
echo 3. Create a new API key with 'Mail Send' permissions
echo 4. Copy the API key and add it to your environment variables
echo.
echo 🧪 Testing:
echo 1. Restart your development servers
echo 2. Login as admin and go to Admin ^> Test SendGrid
echo 3. Send a test email to verify the integration
echo.
echo ✨ Features Added:
echo - Lead distribution files are now emailed to clients automatically
echo - Professional email templates with CSV attachments
echo - SendGrid integration test page in admin panel
echo - Fallback error handling and logging
echo.
echo 🎉 Installation complete! Happy emailing!
pause
