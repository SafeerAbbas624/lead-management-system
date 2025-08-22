import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'support@insaneagent.ai'

if (!SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY is not configured')
}

sgMail.setApiKey(SENDGRID_API_KEY || '')

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { distribution_id, client_emails, distribution_name } = body

    console.log('Sending email for distribution:', distribution_id, 'to clients:', client_emails)

    if (!SENDGRID_API_KEY) {
      return NextResponse.json(
        { error: 'SendGrid API key is not configured' },
        { status: 500 }
      )
    }

    if (!client_emails || !Array.isArray(client_emails) || client_emails.length === 0) {
      return NextResponse.json(
        { error: 'No client emails provided' },
        { status: 400 }
      )
    }

    // Get CSV content from backend
    const csvResponse = await fetch(`${BACKEND_URL}/api/distribution/export-csv/${distribution_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!csvResponse.ok) {
      const errorText = await csvResponse.text()
      console.error('Backend error:', csvResponse.status, errorText)
      return NextResponse.json(
        { error: `Failed to generate CSV: ${csvResponse.status} ${errorText}` },
        { status: csvResponse.status }
      )
    }

    // Get CSV content and filename
    const csvContent = await csvResponse.text()
    const contentDisposition = csvResponse.headers.get('content-disposition')
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : `distribution_${distribution_id}.csv`

    // Convert CSV content to base64 for attachment
    const csvBase64 = Buffer.from(csvContent).toString('base64')

    // Prepare email data
    const emailSubject = `Lead Distribution: ${distribution_name || `Distribution #${distribution_id}`}`
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Lead Distribution Delivery</h2>
        
        <p>Dear Client,</p>
        
        <p>Please find attached your lead distribution file.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #495057;">Distribution Details:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Distribution Name:</strong> ${distribution_name || `Distribution #${distribution_id}`}</li>
            <li><strong>File Name:</strong> ${filename}</li>
            <li><strong>Delivery Date:</strong> ${new Date().toLocaleDateString()}</li>
          </ul>
        </div>
        
        <p>The attached CSV file contains your leads in the standard format with the following columns:</p>
        <p style="font-family: monospace; background-color: #f8f9fa; padding: 10px; border-radius: 3px;">
          s.no, firstname, lastname, email, phone, companyname, taxid, address, city, state, zipcode, country
        </p>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>
        Lead Management Team<br>
        <a href="mailto:${SENDGRID_FROM_EMAIL}">${SENDGRID_FROM_EMAIL}</a></p>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
        <p style="font-size: 12px; color: #6c757d;">
          This email was sent automatically by the Lead Management System. 
          Please do not reply to this email.
        </p>
      </div>
    `

    // Send emails to all clients
    const emailPromises = client_emails.map(async (clientEmail: string) => {
      const msg = {
        to: clientEmail,
        from: SENDGRID_FROM_EMAIL,
        subject: emailSubject,
        html: emailContent,
        attachments: [
          {
            content: csvBase64,
            filename: filename,
            type: 'text/csv',
            disposition: 'attachment'
          }
        ]
      }

      try {
        await sgMail.send(msg)
        console.log(`Email sent successfully to ${clientEmail}`)
        return { email: clientEmail, status: 'sent', error: null }
      } catch (error: any) {
        console.error(`Failed to send email to ${clientEmail}:`, error)
        return { 
          email: clientEmail, 
          status: 'failed', 
          error: error.message || 'Unknown error' 
        }
      }
    })

    // Wait for all emails to be sent
    const results = await Promise.all(emailPromises)
    
    // Count successful and failed sends
    const successful = results.filter(r => r.status === 'sent').length
    const failed = results.filter(r => r.status === 'failed').length

    console.log(`Email sending complete: ${successful} successful, ${failed} failed`)

    return NextResponse.json({
      success: true,
      message: `Emails sent successfully to ${successful} client(s)${failed > 0 ? `, ${failed} failed` : ''}`,
      results: results,
      distribution_id: distribution_id,
      filename: filename
    })

  } catch (error: any) {
    console.error('Error sending emails:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send emails' },
      { status: 500 }
    )
  }
}
