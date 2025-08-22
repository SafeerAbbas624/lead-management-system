# SendGrid Email Integration

This document describes the SendGrid email integration that automatically sends lead distribution files to clients via email instead of manual downloads.

## 🚀 Features

- **Automatic Email Delivery**: Lead CSV files are automatically emailed to selected clients
- **Professional Email Templates**: Clean, branded email templates with company information
- **Multiple Client Support**: Send to multiple clients simultaneously
- **CSV Attachments**: Lead files attached as standardized CSV format
- **Error Handling**: Comprehensive error handling and logging
- **Test Integration**: Admin panel test page to verify SendGrid setup

## 📧 How It Works

1. **Lead Distribution**: When you distribute leads to clients, the system:
   - Processes the lead distribution as usual
   - Generates the CSV file with lead data
   - Automatically sends emails to all selected clients
   - Attaches the CSV file to each email

2. **Email Content**: Each client receives:
   - Professional email with distribution details
   - CSV file attachment with leads
   - Standard 12-column format: `s.no, firstname, lastname, email, phone, companyname, taxid, address, city, state, zipcode, country`

## 🛠️ Installation

### Option 1: Run Installation Script

**Linux/Mac:**
```bash
chmod +x install-sendgrid.sh
./install-sendgrid.sh
```

**Windows:**
```cmd
install-sendgrid.bat
```

### Option 2: Manual Installation

**Install Node.js Dependencies:**
```bash
npm install @sendgrid/mail@^8.1.3
```

**Install Python Dependencies:**
```bash
cd backend
pip install sendgrid==6.11.0
cd ..
```

## ⚙️ Configuration

### Environment Variables

Add these variables to both frontend and backend `.env` files:

**Frontend (.env.local):**
```env
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="support@insaneagent.ai"
```

**Backend (backend/.env):**
```env
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="support@insaneagent.ai"
```

### Getting SendGrid API Key

1. **Sign up** at [SendGrid](https://sendgrid.com/)
2. **Navigate** to Settings → API Keys
3. **Create** a new API key with "Mail Send" permissions
4. **Copy** the API key and add to environment variables
5. **Verify** your sender email address in SendGrid

## 🧪 Testing

### Test SendGrid Integration

1. **Login** as admin user
2. **Navigate** to Admin → Test SendGrid
3. **Enter** a test email address
4. **Click** "Send Test Email"
5. **Check** your inbox for the test email

### Test Lead Distribution

1. **Go** to Lead Distribution page
2. **Select** batches and clients
3. **Click** "Distribute & Email to Clients"
4. **Verify** clients receive emails with CSV attachments

## 📋 Email Template

The system sends professional emails with:

```html
Subject: Lead Distribution: [Distribution Name]

Dear Client,

Please find attached your lead distribution file.

Distribution Details:
• Distribution Name: [Name]
• File Name: [filename.csv]
• Delivery Date: [Date]

The attached CSV file contains your leads in the standard format...

Best regards,
Lead Management Team
```

## 🔧 API Endpoints

### Send Distribution Email
```http
POST /api/distribution/send-email
Content-Type: application/json

{
  "distribution_id": 123,
  "client_emails": ["client1@example.com", "client2@example.com"],
  "distribution_name": "Weekly Leads Batch"
}
```

### Test SendGrid
```http
POST /api/test-sendgrid
Content-Type: application/json

{
  "test_email": "test@example.com"
}
```

## 🚨 Troubleshooting

### Common Issues

**1. API Key Invalid**
- Verify API key is correct in environment variables
- Check API key has "Mail Send" permissions
- Ensure sender email is verified in SendGrid

**2. Emails Not Sending**
- Check SendGrid dashboard for delivery status
- Verify client email addresses are valid
- Check spam/junk folders

**3. Environment Variables Not Loading**
- Restart development servers after adding variables
- Check `.env` file locations and syntax
- Verify no typos in variable names

### Error Messages

**"SendGrid API key is not configured"**
- Add `SENDGRID_API_KEY` to environment variables

**"Failed to send emails"**
- Check SendGrid API key permissions
- Verify sender email is authenticated

## 📊 Monitoring

### Email Delivery Status

The system logs all email sending attempts:
- Successful sends are logged with recipient email
- Failed sends include error details
- SendGrid dashboard shows delivery analytics

### Admin Test Page

Use the admin test page to:
- Verify API key configuration
- Test email delivery
- Check sender email status
- View configuration details

## 🔒 Security

- API keys are stored securely in environment variables
- Emails are sent via HTTPS through SendGrid
- No sensitive data is logged in email content
- Client email addresses are validated before sending

## 📈 Benefits

1. **Automation**: No more manual CSV downloads and email sending
2. **Professional**: Branded email templates with company information
3. **Reliable**: SendGrid's enterprise-grade email delivery
4. **Scalable**: Handle multiple clients and large distributions
5. **Trackable**: Full delivery tracking and analytics
6. **Compliant**: Professional email practices and formatting

## 🎯 Next Steps

After installation:
1. Configure SendGrid API key and sender email
2. Test the integration using the admin test page
3. Verify email delivery with a small test distribution
4. Train users on the new automated email workflow
5. Monitor delivery rates and client feedback

## 📞 Support

For issues with SendGrid integration:
1. Check the admin test page for configuration status
2. Review server logs for detailed error messages
3. Verify SendGrid dashboard for delivery analytics
4. Contact SendGrid support for API-related issues
