import os
import base64
from datetime import datetime
from typing import List, Dict, Any
from fastapi import HTTPException
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.api_key = os.getenv('SENDGRID_API_KEY')
        self.from_email = os.getenv('SENDGRID_FROM_EMAIL', 'support@insaneagent.ai')
        
        if not self.api_key:
            logger.error("SENDGRID_API_KEY environment variable is not set")
            raise ValueError("SendGrid API key is required")
        
        self.sg = SendGridAPIClient(api_key=self.api_key)
        logger.info(f"EmailService initialized with from_email: {self.from_email}")

    def send_distribution_email(
        self, 
        client_emails: List[str], 
        csv_content: str, 
        filename: str,
        distribution_name: str = None,
        distribution_id: int = None
    ) -> Dict[str, Any]:
        """
        Send distribution CSV file to multiple client emails
        
        Args:
            client_emails: List of client email addresses
            csv_content: CSV file content as string
            filename: Name of the CSV file
            distribution_name: Name of the distribution
            distribution_id: ID of the distribution
            
        Returns:
            Dictionary with sending results
        """
        try:
            # Prepare email content
            subject = f"Lead Distribution: {distribution_name or f'Distribution #{distribution_id}'}"
            
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Lead Distribution Delivery</h2>
                
                <p>Dear Client,</p>
                
                <p>Please find attached your lead distribution file.</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #495057;">Distribution Details:</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li><strong>Distribution Name:</strong> {distribution_name or f'Distribution #{distribution_id}'}</li>
                        <li><strong>File Name:</strong> {filename}</li>
                        <li><strong>Delivery Date:</strong> {datetime.now().strftime('%B %d, %Y')}</li>
                    </ul>
                </div>
                
                <p>The attached CSV file contains your leads in the standard format with the following columns:</p>
                <p style="font-family: monospace; background-color: #f8f9fa; padding: 10px; border-radius: 3px;">
                    s.no, firstname, lastname, email, phone, companyname, taxid, address, city, state, zipcode, country
                </p>
                
                <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
                
                <p>Best regards,<br>
                Lead Management Team<br>
                <a href="mailto:{self.from_email}">{self.from_email}</a></p>
                
                <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
                <p style="font-size: 12px; color: #6c757d;">
                    This email was sent automatically by the Lead Management System. 
                    Please do not reply to this email.
                </p>
            </div>
            """
            
            # Prepare CSV attachment
            csv_base64 = base64.b64encode(csv_content.encode()).decode()
            attachment = Attachment(
                FileContent(csv_base64),
                FileName(filename),
                FileType('text/csv'),
                Disposition('attachment')
            )
            
            # Send emails to all clients
            results = []
            successful_sends = 0
            failed_sends = 0
            
            for client_email in client_emails:
                try:
                    # Create mail object for each client
                    message = Mail(
                        from_email=self.from_email,
                        to_emails=client_email,
                        subject=subject,
                        html_content=html_content
                    )
                    
                    # Add attachment
                    message.attachment = attachment
                    
                    # Send email
                    response = self.sg.send(message)
                    
                    if response.status_code in [200, 201, 202]:
                        logger.info(f"Email sent successfully to {client_email}")
                        results.append({
                            'email': client_email,
                            'status': 'sent',
                            'status_code': response.status_code,
                            'error': None
                        })
                        successful_sends += 1
                    else:
                        logger.warning(f"Unexpected status code {response.status_code} for {client_email}")
                        results.append({
                            'email': client_email,
                            'status': 'warning',
                            'status_code': response.status_code,
                            'error': f'Unexpected status code: {response.status_code}'
                        })
                        
                except Exception as e:
                    logger.error(f"Failed to send email to {client_email}: {str(e)}")
                    results.append({
                        'email': client_email,
                        'status': 'failed',
                        'status_code': None,
                        'error': str(e)
                    })
                    failed_sends += 1
            
            return {
                'success': True,
                'message': f'Emails sent to {successful_sends} client(s){f", {failed_sends} failed" if failed_sends > 0 else ""}',
                'total_emails': len(client_emails),
                'successful_sends': successful_sends,
                'failed_sends': failed_sends,
                'results': results
            }
            
        except Exception as e:
            logger.error(f"Error in send_distribution_email: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to send emails: {str(e)}")

    def test_connection(self) -> Dict[str, Any]:
        """Test SendGrid connection"""
        try:
            # Try to get account information (this will test the API key)
            response = self.sg.client.user.get()
            return {
                'success': True,
                'message': 'SendGrid connection successful',
                'status_code': response.status_code
            }
        except Exception as e:
            logger.error(f"SendGrid connection test failed: {str(e)}")
            return {
                'success': False,
                'message': f'SendGrid connection failed: {str(e)}',
                'status_code': None
            }
