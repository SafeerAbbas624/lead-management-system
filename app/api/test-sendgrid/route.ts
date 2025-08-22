import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'support@insaneagent.ai'

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { test_email } = body

    if (!SENDGRID_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'SendGrid API key is not configured',
          config_status: {
            api_key: false,
            from_email: !!SENDGRID_FROM_EMAIL
          }
        },
        { status: 500 }
      )
    }

    if (!test_email) {
      return NextResponse.json(
        { success: false, error: 'Test email address is required' },
        { status: 400 }
      )
    }

    // Test email content
    const msg = {
      to: test_email,
      from: SENDGRID_FROM_EMAIL,
      subject: 'SendGrid Integration Test - Lead Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">SendGrid Integration Test</h2>
          
          <p>Hello!</p>
          
          <p>This is a test email from your Lead Management System to verify that the SendGrid integration is working correctly.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">Test Details:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Sent at:</strong> ${new Date().toLocaleString()}</li>
              <li><strong>From:</strong> ${SENDGRID_FROM_EMAIL}</li>
              <li><strong>To:</strong> ${test_email}</li>
              <li><strong>Service:</strong> SendGrid Email API</li>
            </ul>
          </div>
          
          <p>If you received this email, the SendGrid integration is working properly and you can now send lead distribution files to your clients automatically.</p>
          
          <p>Best regards,<br>
          Lead Management System<br>
          <a href="mailto:${SENDGRID_FROM_EMAIL}">${SENDGRID_FROM_EMAIL}</a></p>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          <p style="font-size: 12px; color: #6c757d;">
            This is a test email sent from the Lead Management System SendGrid integration.
          </p>
        </div>
      `
    }

    // Send test email
    await sgMail.send(msg)

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${test_email}`,
      config_status: {
        api_key: true,
        from_email: true,
        from_email_address: SENDGRID_FROM_EMAIL
      }
    })

  } catch (error: any) {
    console.error('SendGrid test error:', error)
    
    // Parse SendGrid specific errors
    let errorMessage = error.message || 'Unknown error'
    let statusCode = 500
    
    if (error.response && error.response.body) {
      errorMessage = error.response.body.errors?.[0]?.message || errorMessage
      statusCode = error.response.statusCode || statusCode
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        sendgrid_error: error.response?.body || null,
        config_status: {
          api_key: !!SENDGRID_API_KEY,
          from_email: !!SENDGRID_FROM_EMAIL,
          from_email_address: SENDGRID_FROM_EMAIL
        }
      },
      { status: statusCode }
    )
  }
}

export async function GET() {
  console.log('SendGrid Config Check:', {
    api_key_exists: !!SENDGRID_API_KEY,
    api_key_length: SENDGRID_API_KEY?.length || 0,
    from_email_exists: !!SENDGRID_FROM_EMAIL,
    from_email_value: SENDGRID_FROM_EMAIL
  })

  return NextResponse.json({
    success: true,
    message: 'SendGrid test endpoint is available',
    config_status: {
      api_key: !!SENDGRID_API_KEY,
      from_email: !!SENDGRID_FROM_EMAIL,
      from_email_address: SENDGRID_FROM_EMAIL,
      api_key_preview: SENDGRID_API_KEY ? `${SENDGRID_API_KEY.substring(0, 10)}...` : 'Not configured'
    }
  })
}
