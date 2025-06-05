import logging
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

class AuditLogger:
    """Service for logging audit events to database and file."""
    
    def __init__(self, db_client=None):
        """
        Initialize the audit logger.
        
        Args:
            db_client: Database client for storing audit logs
        """
        self.db_client = db_client
        self.log_file = os.environ.get("AUDIT_LOG_FILE", "audit.log")
        
    async def log_event(self, event_type: str, user_id: Optional[str] = None, 
                      details: Optional[Dict[str, Any]] = None, 
                      resource_type: Optional[str] = None,
                      resource_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Log an audit event.
        
        Args:
            event_type: Type of event (e.g., 'create', 'update', 'delete', 'login')
            user_id: ID of the user who performed the action
            details: Additional details about the event
            resource_type: Type of resource affected (e.g., 'lead', 'user', 'dnc_list')
            resource_id: ID of the resource affected
            
        Returns:
            Dictionary with the logged event data
        """
        try:
            # Create event data
            event_data = {
                "event_type": event_type,
                "user_id": user_id,
                "timestamp": datetime.now().isoformat(),
                "details": details or {},
                "resource_type": resource_type,
                "resource_id": resource_id,
                "ip_address": self._get_ip_address(),
                "user_agent": self._get_user_agent()
            }
            
            # Log to database if client is available
            if self.db_client:
                await self._log_to_database(event_data)
            
            # Log to file
            self._log_to_file(event_data)
            
            # Log to application logs
            logger.info(f"Audit: {event_type} by user {user_id} on {resource_type} {resource_id}")
            
            return event_data
            
        except Exception as e:
            logger.error(f"Error logging audit event: {str(e)}")
            # Still return the event data even if logging failed
            return {
                "event_type": event_type,
                "user_id": user_id,
                "timestamp": datetime.now().isoformat(),
                "details": details or {},
                "resource_type": resource_type,
                "resource_id": resource_id,
                "error": str(e)
            }
    
    async def get_events(self, filters: Optional[Dict[str, Any]] = None, 
                       limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Get audit events with optional filtering.
        
        Args:
            filters: Dictionary of filters to apply
            limit: Maximum number of events to return
            offset: Offset for pagination
            
        Returns:
            List of audit events
        """
        if not self.db_client:
            logger.warning("Database client not available for retrieving audit logs")
            return []
        
        try:
            # This is a placeholder for a real database query
            # In a real implementation, you would query the database with filters
            
            # Mock response for demonstration
            return [
                {
                    "id": "1",
                    "event_type": "create",
                    "user_id": "user123",
                    "timestamp": "2023-01-01T12:00:00",
                    "details": {"field1": "value1"},
                    "resource_type": "lead",
                    "resource_id": "lead123",
                    "ip_address": "192.168.1.1",
                    "user_agent": "Mozilla/5.0"
                },
                {
                    "id": "2",
                    "event_type": "update",
                    "user_id": "user456",
                    "timestamp": "2023-01-02T12:00:00",
                    "details": {"field1": "old_value", "field2": "new_value"},
                    "resource_type": "user",
                    "resource_id": "user789",
                    "ip_address": "192.168.1.2",
                    "user_agent": "Chrome/90.0"
                }
            ]
            
        except Exception as e:
            logger.error(f"Error retrieving audit events: {str(e)}")
            return []
    
    async def _log_to_database(self, event_data: Dict[str, Any]) -> None:
        """
        Log event to database.
        
        Args:
            event_data: Event data to log
        """
        try:
            # This is a placeholder for a real database insert
            # In a real implementation, you would insert into the database
            
            # Example with a hypothetical database client
            if hasattr(self.db_client, 'log_activity'):
                await self.db_client.log_activity(event_data)
                
        except Exception as e:
            logger.error(f"Error logging to database: {str(e)}")
    
    def _log_to_file(self, event_data: Dict[str, Any]) -> None:
        """
        Log event to file.
        
        Args:
            event_data: Event data to log
        """
        try:
            with open(self.log_file, 'a') as f:
                f.write(json.dumps(event_data) + '\n')
                
        except Exception as e:
            logger.error(f"Error logging to file: {str(e)}")
    
    def _get_ip_address(self) -> str:
        """
        Get the client IP address.
        
        Returns:
            IP address string
        """
        # This is a placeholder
        # In a real implementation, you would get this from the request context
        return "127.0.0.1"
    
    def _get_user_agent(self) -> str:
        """
        Get the client user agent.
        
        Returns:
            User agent string
        """
        # This is a placeholder
        # In a real implementation, you would get this from the request context
        return "Unknown"
