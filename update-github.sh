#!/bin/bash

echo "🚀 Updating GitHub Repository with SendGrid Integration"
echo "====================================================="

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository. Please run 'git init' first."
    exit 1
fi

# Check git status
echo "📋 Checking current git status..."
git status

# Add all changes
echo "📦 Adding all changes to git..."
git add .

# Show what will be committed
echo "📝 Files to be committed:"
git diff --cached --name-only

# Commit with detailed message
echo "💾 Committing changes..."
git commit -m "feat: Add SendGrid email integration for automated lead distribution

🚀 Major Features Added:
- SendGrid email service for automatic CSV delivery to clients
- Replace manual CSV downloads with professional email delivery
- Add source name input field for custom lead source naming
- Implement comprehensive error handling for duplicate lead prevention
- Add SendGrid test interface in admin panel
- Create professional email templates with distribution details
- Add installation scripts for easy setup
- Update documentation with SendGrid integration guide
- Support multiple client email delivery simultaneously
- Add proper error messages for duplicate lead scenarios

📁 New Files:
- backend/email_service.py - SendGrid email service class
- app/api/distribution/send-email/route.ts - Email sending API endpoint
- app/api/test-sendgrid/route.ts - SendGrid test endpoint
- app/admin/test-sendgrid/page.tsx - Admin test interface
- SENDGRID_INTEGRATION.md - Complete integration documentation
- SENDGRID_CHANGES_SUMMARY.md - Summary of all changes
- install-sendgrid.sh - Linux/Mac installation script
- install-sendgrid.bat - Windows installation script

📝 Modified Files:
- package.json - Added @sendgrid/mail dependency
- backend/requirements.txt - Added sendgrid dependency
- backend/lead_distribution_api.py - Added email endpoints and improved error handling
- app/distribution/page.tsx - Added email functionality and source name input
- components/layout/sidebar.tsx - Added SendGrid test menu item
- .env.local - Added SendGrid configuration
- backend/.env - Added SendGrid configuration
- README.md - Updated with SendGrid integration information

✨ Key Features:
✅ Automated email delivery with CSV attachments
✅ Professional email templates with branding
✅ Multiple client support
✅ Source name customization
✅ Duplicate lead prevention with clear error messages
✅ SendGrid test interface for admins
✅ Comprehensive error handling and logging
✅ Installation scripts and documentation

🎯 Business Impact:
- Eliminates manual CSV downloads and email sending
- Provides professional, branded email delivery
- Improves user experience with automated workflows
- Scales to handle multiple clients simultaneously
- Ensures data integrity with duplicate prevention
- Offers enterprise-grade email delivery via SendGrid"

# Check if commit was successful
if [ $? -eq 0 ]; then
    echo "✅ Commit successful!"
    
    # Push to GitHub
    echo "🚀 Pushing to GitHub..."
    
    # Get current branch name
    BRANCH=$(git branch --show-current)
    echo "📍 Current branch: $BRANCH"
    
    # Push to origin
    git push origin $BRANCH
    
    if [ $? -eq 0 ]; then
        echo "🎉 Successfully pushed to GitHub!"
        echo ""
        echo "🔗 Your repository has been updated with:"
        echo "   - SendGrid email integration"
        echo "   - Automated lead distribution via email"
        echo "   - Professional email templates"
        echo "   - Admin test interface"
        echo "   - Comprehensive documentation"
        echo "   - Installation scripts"
        echo ""
        echo "✨ The lead management system now automatically emails"
        echo "   CSV files to clients instead of manual downloads!"
    else
        echo "❌ Failed to push to GitHub. Please check your credentials and try again."
        echo "💡 You may need to run: git push --set-upstream origin $BRANCH"
    fi
else
    echo "❌ Commit failed. Please check the error messages above."
fi

echo ""
echo "🏁 Script completed!"
