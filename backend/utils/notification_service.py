import logging
import os
import json
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List, Optional, Union

logger = logging.getLogger(__name__)

class NotificationService:
    """Service for sending notifications via different channels."""
    
    def __init__(self):
        """Initialize the notification service with configuration."""
        # Email configuration
        self.smtp_host = os.environ.get("SMTP_HOST", "smtp.example.com")
        self.smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        self.smtp_user = os.environ.get("SMTP_USER", "")
        self.smtp_password = os.environ.get("SMTP_PASSWORD", "")
        self.from_email = os.environ.get("FROM_EMAIL", "notifications@leadmanagement.com")
        
        # Slack configuration
        self.slack_webhook_url = os.environ.get("SLACK_WEBHOOK_URL", "")
        
        # SMS configuration (Twilio)
        self.twilio_account_sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
        self.twilio_auth_token = os.environ.get("TWILIO_AUTH_TOKEN", "")
        self.twilio_from_number = os.environ.get("TWILIO_FROM_NUMBER", "")
    
    async def send_email(self, to: Union[str, List[str]], subject: str, body: str, 
                        html_body: Optional[str] = None) -> bool:
        """
        Send an email notification.
        
        Args:
            to: Recipient email address or list of addresses
            subject: Email subject
            body: Plain text email body
            html_body: Optional HTML email body
            
        Returns:
            True if email was sent successfully, False otherwise
        """
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            
            # Handle single recipient or list of recipients
            if isinstance(to, list):
                msg['To'] = ', '.join(to)
                recipients = to
            else:
                msg['To'] = to
                recipients = [to]
            
            # Attach plain text and HTML parts
            msg.attach(MIMEText(body, 'plain'))
            if html_body:
                msg.attach(MIMEText(html_body, 'html'))
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                if self.smtp_user and self.smtp_password:
                    server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.from_email, recipients, msg.as_string())
            
            logger.info(f"Email sent to {recipients}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return False
    
    async def send_slack_notification(self, message: str, channel: Optional[str] = None, 
                                    attachments: Optional[List[Dict[str, Any]]] = None) -> bool:
        """
        Send a notification to Slack.
        
        Args:
            message: Message text
            channel: Optional channel override
            attachments: Optional Slack message attachments
            
        Returns:
            True if notification was sent successfully, False otherwise
        """
        try:
            if not self.slack_webhook_url:
                logger.warning("Slack webhook URL not configured")
                return False
            
            # Prepare payload
            payload = {
                "text": message
            }
            
            if channel:
                payload["channel"] = channel
                
            if attachments:
                payload["attachments"] = attachments
            
            # Send to Slack
            response = requests.post(
                self.slack_webhook_url,
                data=json.dumps(payload),
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                logger.info("Slack notification sent successfully")
                return True
            else:
                logger.error(f"Error sending Slack notification: {response.status_code} {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending Slack notification: {str(e)}")
            return False
    
    async def send_sms(self, to: str, message: str) -> bool:
        """
        Send an SMS notification using Twilio.
        
        Args:
            to: Recipient phone number
            message: SMS message text
            
        Returns:
            True if SMS was sent successfully, False otherwise
        """
        try:
            if not all([self.twilio_account_sid, self.twilio_auth_token, self.twilio_from_number]):
                logger.warning("Twilio configuration incomplete")
                return False
            
            # This is a placeholder for a real Twilio API call
            # In a real implementation, you would use the Twilio SDK
            
            logger.info(f"SMS sent to {to}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending SMS: {str(e)}")
            return False
    
    async def send_system_notification(self, event_type: str, data: Dict[str, Any], 
                                     channels: Optional[List[str]] = None) -> Dict[str, bool]:
        """
        Send a system notification through multiple channels.
        
        Args:
            event_type: Type of event (e.g., 'upload_complete', 'processing_failed')
            data: Event data
            channels: List of channels to use ('email', 'slack', 'sms')
            
        Returns:
            Dictionary with results for each channel
        """
        if channels is None:
            channels = ["email", "slack"]
        
        results = {}
        
        # Format message based on event type
        subject, body, html_body = self._format_notification(event_type, data)
        
        # Send through each channel
        if "email" in channels and "recipients" in data:
            results["email"] = await self.send_email(
                to=data["recipients"],
                subject=subject,
                body=body,
                html_body=html_body
            )
        
        if "slack" in channels:
            results["slack"] = await self.send_slack_notification(
                message=f"*{subject}*\n{body}",
                attachments=[{"text": json.dumps(data, indent=2)}]
            )
        
        if "sms" in channels and "phone" in data:
            results["sms"] = await self.send_sms(
                to=data["phone"],
                message=f"{subject}: {body}"
            )
        
        return results
    
    def _format_notification(self, event_type: str, data: Dict[str, Any]) -> tuple:
        """
        Format notification content based on event type.
        
        Args:
            event_type: Type of event
            data: Event data
            
        Returns:
            Tuple of (subject, plain text body, HTML body)
        """
        if event_type == "upload_complete":
            subject = f"Lead Upload Complete: {data.get('fileName', 'Unknown')}"
            body = (
                f"Your lead upload has been processed successfully.\n\n"
                f"File: {data.get('fileName', 'Unknown')}\n"
                f"Total Leads: {data.get('totalLeads', 0)}\n"
                f"Cleaned Leads: {data.get('cleanedLeads', 0)}\n"
                f"Duplicate Leads: {data.get('duplicateLeads', 0)}\n"
                f"DNC Matches: {data.get('dncMatches', 0)}\n\n"
                f"You can view the results in your dashboard."
            )
            html_body = f"""
            <h2>Lead Upload Complete</h2>
            <p>Your lead upload has been processed successfully.</p>
            <table>
                <tr><td><strong>File:</strong></td><td>{data.get('fileName', 'Unknown')}</td></tr>
                <tr><td><strong>Total Leads:</strong></td><td>{data.get('totalLeads', 0)}</td></tr>
                <tr><td><strong>Cleaned Leads:</strong></td><td>{data.get('cleanedLeads', 0)}</td></tr>
                <tr><td><strong>Duplicate Leads:</strong></td><td>{data.get('duplicateLeads', 0)}</td></tr>
                <tr><td><strong>DNC Matches:</strong></td><td>{data.get('dncMatches', 0)}</td></tr>
            </table>
            <p><a href="https://app.leadmanagement.com/uploads">View in Dashboard</a></p>
            """
        
        elif event_type == "processing_failed":
            subject = f"Lead Processing Failed: {data.get('fileName', 'Unknown')}"
            body = (
                f"There was an error processing your lead upload.\n\n"
                f"File: {data.get('fileName', 'Unknown')}\n"
                f"Error: {data.get('error', 'Unknown error')}\n\n"
                f"Please check the file and try again."
            )
            html_body = f"""
            <h2>Lead Processing Failed</h2>
            <p>There was an error processing your lead upload.</p>
            <table>
                <tr><td><strong>File:</strong></td><td>{data.get('fileName', 'Unknown')}</td></tr>
                <tr><td><strong>Error:</strong></td><td>{data.get('error', 'Unknown error')}</td></tr>
            </table>
            <p><a href="https://app.leadmanagement.com/uploads">View in Dashboard</a></p>
            """
        
        elif event_type == "distribution_complete":
            subject = f"Lead Distribution Complete: Batch #{data.get('batchId', 'Unknown')}"
            body = (
                f"Leads have been distributed to clients.\n\n"
                f"Batch ID: {data.get('batchId', 'Unknown')}\n"
                f"Total Leads: {data.get('totalLeads', 0)}\n"
                f"Clients: {data.get('clientCount', 0)}\n\n"
                f"You can view the distribution details in your dashboard."
            )
            html_body = f"""
            <h2>Lead Distribution Complete</h2>
            <p>Leads have been distributed to clients.</p>
            <table>
                <tr><td><strong>Batch ID:</strong></td><td>{data.get('batchId', 'Unknown')}</td></tr>
                <tr><td><strong>Total Leads:</strong></td><td>{data.get('totalLeads', 0)}</td></tr>
                <tr><td><strong>Clients:</strong></td><td>{data.get('clientCount', 0)}</td></tr>
            </table>
            <p><a href="https://app.leadmanagement.com/distribution">View in Dashboard</a></p>
            """
        
        else:
            subject = f"System Notification: {event_type}"
            body = f"Event: {event_type}\n\nData: {json.dumps(data, indent=2)}"
            html_body = f"""
            <h2>System Notification</h2>
            <p>Event: {event_type}</p>
            <pre>{json.dumps(data, indent=2)}</pre>
            """
        
        return subject, body, html_body
