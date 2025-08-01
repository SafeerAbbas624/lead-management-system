import os
import uuid
import re
from dotenv import load_dotenv
load_dotenv()
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timezone
import json
from supabase import create_client, Client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

class SupabaseClient:
    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        """
        Initialize the Supabase client.
        
        Args:
            supabase_url: Supabase URL (optional, will use environment variable if not provided)
            supabase_key: Supabase service role key (optional, will use environment variable if not provided)
        """
        try:
            # Use provided credentials or fall back to environment variables
            url = supabase_url or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
            key = supabase_key or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            
            if not url or not key:
                error_msg = "Missing Supabase URL or key. Please check your environment variables."
                logger.error(error_msg)
                raise ValueError(error_msg)
                
            logger.info(f"Initializing Supabase client with URL: {url[:20]}...")
            
            # Initialize Supabase client
            self.supabase = create_client(url, key)
            
            # Test the connection
            try:
                # Try a simple query to verify the connection
                self.supabase.table('leads').select('id').limit(1).execute()
                logger.info("Successfully connected to Supabase")
            except Exception as e:
                logger.error(f"Failed to connect to Supabase: {str(e)}")
                self.supabase = None
                raise
                
        except Exception as e:
            logger.error(f"Error initializing Supabase client: {str(e)}", exc_info=True)
            self.supabase = None
    
    def safe_execute(self, operation, *args, **kwargs):
        """
        Safely execute a database operation with error handling and logging.
        
        Args:
            operation: The database operation to execute (a method of supabase client)
            *args: Positional arguments to pass to the operation
            **kwargs: Keyword arguments to pass to the operation
            
        Returns:
            The result of the operation or None if it failed
        """
        if not self.supabase:
            logger.error("Cannot execute operation: Supabase client not initialized")
            return None
            
        try:
            logger.debug(f"Executing operation: {operation.__name__} with args: {args}, kwargs: {kwargs}")
            result = operation(*args, **kwargs)
            logger.debug(f"Operation result: {result}")
            return result
        except Exception as e:
            logger.error(f"Error executing {operation.__name__}: {str(e)}", exc_info=True)
            raise
    
    # Upload Batch methods
    def get_upload_batch(self, batch_id: int) -> Dict[str, Any]:
        """
        Get upload batch by ID.
        
        Args:
            batch_id: ID of the batch
            
        Returns:
            Upload batch data
        """
        if self.supabase is None:
            logger.warning("No Supabase client available. Returning mock data.")
            return self._get_mock_upload_batch(batch_id)
        
        try:
            response = self.supabase.table("upload_batches").select("*").eq("id", batch_id).execute()
            
            if not response.data:
                raise ValueError(f"Upload batch with ID {batch_id} not found")
            
            return response.data[0]
        except Exception as e:
            logger.error(f"Error getting upload batch: {str(e)}")
            raise
    
    def create_upload_batch(self, batch_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new upload batch."""
        if self.supabase is None:
            logger.warning("No Supabase client available. Returning mock batch ID.")
            return {**batch_data, "id": 1}
            
        try:
            response = self.supabase.table("upload_batches").insert(batch_data).execute()
            
            if not response.data:
                raise ValueError("Failed to create upload batch")
            
            # Return the first item from response.data as a dictionary
            return response.data[0]
        except Exception as e:
            logger.error(f"Error creating upload batch: {str(e)}")
            raise
    
    def update_batch_status(self, batch_id: int, status: str, **kwargs) -> Dict[str, Any]:
        """
        Update the status of an upload batch.
        
        Args:
            batch_id: ID of the batch
            status: New status
            **kwargs: Additional fields to update
            
        Returns:
            Updated batch data
        """
        if self.supabase is None:
            # Return mock data
            return self._update_mock_batch_status(batch_id, status, **kwargs)
        
        try:
            update_data = {"status": status, **kwargs}
            
            response = self.supabase.table("upload_batches").update(update_data).eq("id", batch_id).execute()
            
            if not response.data:
                raise ValueError(f"Upload batch with ID {batch_id} not found")
            
            return response.data[0]
        except Exception as e:
            logger.error(f"Error updating batch status: {str(e)}")
            raise
    
    def get_upload_batches(self, limit: int = 100, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get upload batches with optional filtering.
        
        Args:
            limit: Maximum number of batches to return
            status: Filter by status
            
        Returns:
            List of upload batches
        """
        if self.supabase is None:
            # Return mock data
            return self._get_mock_upload_batches(limit, status)
        
        try:
            query = self.supabase.table("upload_batches").select("*").order("createdat", desc=True).limit(limit)
            
            if status:
                query = query.eq("status", status)
            
            response = query.execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error getting upload batches: {str(e)}")
            return []
    
    # DNC methods
    def check_dnc(self, email: Optional[str] = None, phone: Optional[str] = None) -> tuple:
        """
        Check if an email or phone is in the DNC list.
        
        Args:
            email: Email to check
            phone: Phone to check
            
        Returns:
            Tuple of (is_dnc, dnc_lists)
        """
        if self.supabase is None:
            # Return mock data
            return self._check_mock_dnc(email, phone)
        
        try:
            # This would check against DNC tables
            # For now, return False (not in DNC)
            return False, []
        except Exception as e:
            logger.error(f"Error checking DNC: {str(e)}")
            return False, []
    
    def create_dnc_list(self, list_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new DNC list.
        
        Args:
            list_data: DNC list data
            
        Returns:
            Created DNC list
        """
        if self.supabase is None:
            # Return mock data
            return {**list_data, "id": 1}
        
        try:
            response = self.supabase.table("dnc_lists").insert(list_data).execute()
            
            if not response.data:
                raise ValueError("Failed to create DNC list")
            
            return response.data[0]
        except Exception as e:
            logger.error(f"Error creating DNC list: {str(e)}")
            raise
    
    def get_dnc_lists(self, active_only: bool = False) -> List[Dict[str, Any]]:
        """
        Get all DNC lists.
        
        Args:
            active_only: Only return active lists
            
        Returns:
            List of DNC lists
        """
        if self.supabase is None:
            # Return mock data
            return self._get_mock_dnc_lists(active_only)
        
        try:
            query = self.supabase.table("dnc_lists").select("*")
            
            if active_only:
                query = query.eq("isactive", True)
            
            response = query.execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error getting DNC lists: {str(e)}")
            return []
    
    def get_or_create_dnc_list(self, name: str, type: str) -> Dict[str, Any]:
        """Get or create a DNC list."""
        try:
            # Try to get existing list
            result = self.supabase.table("dnc_lists").select("*").eq("name", name).execute()
            if result.data:
                return result.data[0]
            
            # Create new list if not found
            new_list = {
                "name": name,
                "type": type,
                "description": f"Default {type} DNC list",
                "isactive": True,
                "createdat": datetime.now(timezone.utc).isoformat(),
                "lastupdated": datetime.now(timezone.utc).isoformat()
            }
            result = self.supabase.table("dnc_lists").insert(new_list).execute()
            return result.data[0] if result.data else {}
        except Exception as e:
            logger.error(f"Error getting/creating DNC list: {e}")
            raise
    
    def add_dnc_entry(self, entry_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add a new entry to a DNC list.
        
        Args:
            entry_data: DNC entry data
            
        Returns:
            Created DNC entry
        """
        if self.supabase is None:
            # Return mock data
            return {**entry_data, "id": 1}
        
        try:
            response = self.supabase.table("dnc_entries").insert(entry_data).execute()
            
            if not response.data:
                raise ValueError("Failed to add DNC entry")
            
            return response.data[0]
        except Exception as e:
            logger.error(f"Error adding DNC entry: {str(e)}")
            raise
    
    def get_dnc_entries(self, list_id: int, limit: int = 1000, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Get entries from a DNC list.
        
        Args:
            list_id: ID of the DNC list
            limit: Maximum number of entries to return
            offset: Offset for pagination
            
        Returns:
            List of DNC entries
        """
        if self.supabase is None:
            # Return mock data
            return self._get_mock_dnc_entries(list_id, limit, offset)
        
        try:
            response = self.supabase.table("dnc_entries").select("*").eq("dnclistid", list_id).range(offset, offset + limit - 1).execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error getting DNC entries: {str(e)}")
            return []
    
    def delete_dnc_entry(self, entry_id: int) -> bool:
        """
        Delete a DNC entry.
        
        Args:
            entry_id: ID of the entry
            
        Returns:
            True if successful
        """
        if self.supabase is None:
            # Return mock data
            return True
        
        try:
            response = self.supabase.table("dnc_entries").delete().eq("id", entry_id).execute()
            return bool(response.data)
        except Exception as e:
            logger.error(f"Error deleting DNC entry: {str(e)}")
            raise
    
    def add_dnc_entries_bulk(self, entries: List[Dict[str, Any]]) -> int:
        """
        Add multiple entries to DNC lists.
        
        Args:
            entries: List of DNC entry data
            
        Returns:
            Number of entries added
        """
        if self.supabase is None:
            # Return mock data
            return len(entries)
        
        try:
            # Insert entries in chunks to avoid hitting limits
            chunk_size = 100
            added_count = 0
            
            for i in range(0, len(entries), chunk_size):
                chunk = entries[i:i+chunk_size]
                response = self.supabase.table("dnc_entries").insert(chunk).execute()
                added_count += len(response.data or [])
            
            return added_count
        except Exception as e:
            logger.error(f"Error adding DNC entries in bulk: {str(e)}")
            raise
    
    # Lead methods
    def save_leads(self, leads: List[Dict[str, Any]]) -> int:
        """
        Save leads to the database.
        
        Args:
            leads: List of lead data
            
        Returns:
            Number of leads saved
        """
        try:
            return self.insert_leads_batch(leads)
        except Exception as e:
            logger.error(f"Error saving leads: {str(e)}")
            return False
    
    def get_leads_by_batch(self, batch_id: int, limit: int = 1000, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Get leads from a batch.
        
        Args:
            batch_id: ID of the batch
            limit: Maximum number of leads to return
            offset: Offset for pagination
            
        Returns:
            List of leads
        """
        if self.supabase is None:
            # Return mock data
            return self._get_mock_leads_by_batch(batch_id, limit, offset)
        
        try:
            response = self.supabase.table("leads").select("*").eq("uploadbatchid", batch_id).range(offset, offset + limit - 1).execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error getting leads by batch: {str(e)}")
            return []
    
    def get_leads(self, limit: int = 100, offset: int = 0, search: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get leads with pagination and optional search.
        
        Args:
            limit: Maximum number of leads to return
            offset: Number of leads to skip
            search: Optional search term to filter leads
            
        Returns:
            List of leads
        """
        if self.supabase is None:
            # Return mock data (consider adding search filtering to mock data)
            logger.warning("No Supabase client available. Returning mock data.")
            return []
        
        try:
            query = self.supabase.table("leads").select("*")
            
            if search:
                # Add search filtering across relevant fields (case-insensitive)
                # Supabase uses ILIKE for case-insensitive pattern matching
                search_term = f"%{search.lower()}%"
                query = query.or_(
                    f"firstname.ilike.{search_term}",
                    f"lastname.ilike.{search_term}",
                    f"email.ilike.{search_term}",
                    f"phone.ilike.{search_term}"
                    # Add more fields here if needed, like companyname, etc.
                    # Searching in JSONB tags might require ->> operator and specific indexing
                    # f"tags.cs.\"{{{'" + search.lower() + "'}}}" # Example for exact tag match (case-sensitive)
                )

            query = query.order("createdat", desc=True).range(offset, offset + limit - 1)
            
            response = query.execute()
            
            # Supabase response structure can be tricky, access data via .data
            return response.data if response.data is not None else []
        except Exception as e:
            logger.error(f"Error getting leads: {str(e)}")
            return []
    
    def update_lead_tags(self, lead_ids: List[int], tags: List[str]) -> int:
        """Update tags for multiple leads."""
        if self.supabase is None:
            raise ValueError("Supabase client not initialized")
            
        updated_count = 0
        for lead_id in lead_ids:
            response = self.supabase.table("leads").update({"tags": tags}).eq("id", lead_id).execute()
            if response.data:
                updated_count += 1
        
        return updated_count
    
    def update_lead_revenue(self, lead_id: int, revenue: float) -> Dict[str, Any]:
        """
        Update revenue for a lead.
        
        Args:
            lead_id: ID of the lead
            revenue: Revenue amount
            
        Returns:
            Updated lead data
        """
        if self.supabase is None:
            # Return mock data
            return {"id": lead_id, "revenue": revenue}
        
        try:
            response = self.supabase.table("leads").update({"revenue": revenue, "updatedat": datetime.now().isoformat()}).eq("id", lead_id).execute()
            
            if not response.data:
                raise ValueError(f"Lead with ID {lead_id} not found")
            
            return response.data[0]
        except Exception as e:
            logger.error(f"Error updating lead revenue: {str(e)}")
            raise
    
    # Client methods
    def get_clients(self, client_ids: Optional[List[int]] = None, active_only: bool = True) -> List[Dict[str, Any]]:
        """
        Get clients.
        
        Args:
            client_ids: List of client IDs to filter by
            active_only: Only return active clients
            
        Returns:
            List of clients
        """
        if self.supabase is None:
            # Return mock data
            return self._get_mock_clients(client_ids, active_only)
        
        try:
            query = self.supabase.table("clients").select("*")
            
            if active_only:
                query = query.eq("isactive", True)
            
            if client_ids:
                query = query.in_("id", client_ids)
            
            response = query.execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error getting clients: {str(e)}")
            return []
    
    def create_client(self, client_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new client."""
        if self.supabase is None:
            raise ValueError("Supabase client not initialized")
            
        response = self.supabase.table("clients").insert(client_data).execute()
        
        if not response.data:
            raise ValueError("Failed to create client")
            
        return response.data[0]
    
    def create_distribution(self, distribution_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a lead distribution record.
        
        Args:
            distribution_data: Distribution data
            
        Returns:
            Created distribution record
        """
        if self.supabase is None:
            # Return mock data
            return {**distribution_data, "id": 1}
        
        try:
            response = self.supabase.table("lead_distributions").insert(distribution_data).execute()
            
            if not response.data:
                raise ValueError("Failed to create distribution record")
            
            return response.data[0]
        except Exception as e:
            logger.error(f"Error creating distribution record: {str(e)}")
            raise
    
    def get_distributions(self, batch_id: Optional[int] = None, client_id: Optional[int] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get lead distributions with optional filtering.
        
        Args:
            batch_id: Filter by batch ID
            client_id: Filter by client ID
            limit: Maximum number of records to return
            
        Returns:
            List of distribution records
        """
        if self.supabase is None:
            # Return mock data
            return self._get_mock_distributions(batch_id, client_id, limit)
        
        try:
            query = self.supabase.table("lead_distributions").select("*").order("createdat", desc=True).limit(limit)
            
            if batch_id:
                query = query.eq("batchid", batch_id)
            
            if client_id:
                query = query.eq("clientid", client_id)
            
            response = query.execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error getting distributions: {str(e)}")
            return []
    
    def tag_leads(self, lead_ids: List[int], tag: str) -> int:
        """
        Tag leads with a specific tag.
        
        Args:
            lead_ids: List of lead IDs to tag
            tag: Tag to apply
            
        Returns:
            Number of leads tagged
        """
        if self.supabase is None:
            # Return mock data
            return len(lead_ids)
        
        try:
            # Update leads in chunks to avoid hitting limits
            chunk_size = 100
            tagged_count = 0
            
            for i in range(0, len(lead_ids), chunk_size):
                chunk = lead_ids[i:i+chunk_size]
                
                # Get current tags for each lead
                leads_response = self.supabase.table("leads").select("id, tags").in_("id", chunk).execute()
                leads = leads_response.data or []
                
                # Update tags for each lead
                for lead in leads:
                    lead_id = lead["id"]
                    current_tags = lead.get("tags", []) or []
                    
                    if tag not in current_tags:
                        current_tags.append(tag)
                        
                        # Update the lead
                        update_response = self.supabase.table("leads").update({"tags": current_tags}).eq("id", lead_id).execute()
                        
                        if update_response.data:
                            tagged_count += 1
            
            return tagged_count
        except Exception as e:
            logger.error(f"Error tagging leads: {str(e)}")
            raise
    
    # Supplier methods
    def get_suppliers(self, active_only: bool = True) -> List[Dict[str, Any]]:
        """Get all suppliers."""
        if self.supabase is None:
            raise ValueError("Supabase client not initialized")
            
        query = self.supabase.table("suppliers").select("*")
        
        if active_only:
            query = query.eq("status", "Active")
            
        response = query.execute()
        
        return response.data or []
    
    def create_supplier(self, supplier_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new supplier."""
        if self.supabase is None:
            raise ValueError("Supabase client not initialized")
            
        response = self.supabase.table("suppliers").insert(supplier_data).execute()
        
        if not response.data:
            raise ValueError("Failed to create supplier")
            
        return response.data[0]
    
    # ROI and Analytics methods
    def get_roi_metrics(self, start_date: Optional[str] = None, end_date: Optional[str] = None,
                       supplier_ids: Optional[List[int]] = None, client_ids: Optional[List[int]] = None,
                       sources: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Get ROI metrics with optional filters.
        
        Args:
            start_date: Start date for filtering
            end_date: End date for filtering
            supplier_ids: List of supplier IDs to filter by
            client_ids: List of client IDs to filter by
            sources: List of lead sources to filter by
            
        Returns:
            Dict with ROI metrics
        """
        if self.supabase is None:
            # Return mock data
            return self._get_mock_roi_metrics()
        
        try:
            # Build the query
            query = self.supabase.table("leads").select("leadcost, revenue, leadsource, supplierid, leadstatus")
            
            if start_date:
                query = query.gte("createdat", start_date)
            
            if end_date:
                query = query.lte("createdat", end_date)
            
            if supplier_ids:
                query = query.in_("supplierid", supplier_ids)
            
            if sources:
                query = query.in_("leadsource", sources)
            
            # Execute the query
            response = query.execute()
            leads = response.data or []
            
            # Calculate metrics
            total_cost = sum(float(lead.get("leadcost", 0) or 0) for lead in leads)
            total_revenue = sum(float(lead.get("revenue", 0) or 0) for lead in leads)
            total_leads = len(leads)
            converted_leads = sum(1 for lead in leads if lead.get("leadstatus") == "Converted")
            
            # Calculate by source
            source_metrics = {}
            for lead in leads:
                source = lead.get("leadsource", "Unknown")
                
                if source not in source_metrics:
                    source_metrics[source] = {
                        "source": source,
                        "totalLeads": 0,
                        "convertedLeads": 0,
                        "totalCost": 0,
                        "totalRevenue": 0,
                        "conversionRate": 0,
                        "roi": 0
                    }
                
                source_metrics[source]["totalLeads"] += 1
                if lead.get("leadstatus") == "Converted":
                    source_metrics[source]["convertedLeads"] += 1
                
                source_metrics[source]["totalCost"] += float(lead.get("leadcost", 0) or 0)
                source_metrics[source]["totalRevenue"] += float(lead.get("revenue", 0) or 0)
            
            # Calculate rates for each source
            for metrics in source_metrics.values():
                if metrics["totalLeads"] > 0:
                    metrics["conversionRate"] = metrics["convertedLeads"] / metrics["totalLeads"] * 100
                if metrics["totalCost"] > 0:
                    metrics["roi"] = (metrics["totalRevenue"] - metrics["totalCost"]) / metrics["totalCost"] * 100
            
            # Sort sources by ROI
            source_performance = list(source_metrics.values())
            source_performance.sort(key=lambda x: x["roi"], reverse=True)
            
            return {
                "totalLeads": total_leads,
                "convertedLeads": converted_leads,
                "conversionRate": (converted_leads / total_leads * 100) if total_leads > 0 else 0,
                "totalCost": total_cost,
                "totalRevenue": total_revenue,
                "netProfit": total_revenue - total_cost,
                "roi": (total_revenue - total_cost) / total_cost * 100 if total_cost > 0 else 0,
                "sourcePerformance": source_performance
            }
        except Exception as e:
            logger.error(f"Error getting ROI metrics: {str(e)}")
            return self._get_mock_roi_metrics()
    
    def get_supplier_performance(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Get performance metrics for suppliers.
        
        Args:
            start_date: Start date for filtering
            end_date: End date for filtering
            
        Returns:
            Dict with supplier performance metrics
        """
        if self.supabase is None:
            # Return mock data
            return self._get_mock_supplier_performance()
        
        try:
            # Build the query
            query = self.supabase.table("leads").select("leadcost, revenue, supplierid, leadstatus")
            
            if start_date:
                query = query.gte("createdat", start_date)
            
            if end_date:
                query = query.lte("createdat", end_date)
            
            # Execute the query
            response = query.execute()
            leads = response.data or []
            
            # Get supplier details
            suppliers_response = self.supabase.table("suppliers").select("id, name").execute()
            suppliers = {supplier["id"]: supplier["name"] for supplier in suppliers_response.data or []}
            
            # Calculate metrics by supplier
            supplier_metrics = {}
            for lead in leads:
                supplier_id = lead.get("supplierid")
                
                if not supplier_id:
                    continue
                
                supplier_name = suppliers.get(supplier_id, f"Supplier {supplier_id}")
                
                if supplier_id not in supplier_metrics:
                    supplier_metrics[supplier_id] = {
                        "id": supplier_id,
                        "name": supplier_name,
                        "totalLeads": 0,
                        "convertedLeads": 0,
                        "totalCost": 0,
                        "totalRevenue": 0,
                        "conversionRate": 0,
                        "roi": 0,
                        "avgLeadCost": 0
                    }
                
                supplier_metrics[supplier_id]["totalLeads"] += 1
                if lead.get("leadstatus") == "Converted":
                    supplier_metrics[supplier_id]["convertedLeads"] += 1
                
                supplier_metrics[supplier_id]["totalCost"] += float(lead.get("leadcost", 0) or 0)
                supplier_metrics[supplier_id]["totalRevenue"] += float(lead.get("revenue", 0) or 0)
            
            # Calculate rates for each supplier
            for metrics in supplier_metrics.values():
                if metrics["totalLeads"] > 0:
                    metrics["conversionRate"] = metrics["convertedLeads"] / metrics["totalLeads"] * 100
                    metrics["avgLeadCost"] = metrics["totalCost"] / metrics["totalLeads"]
                if metrics["totalCost"] > 0:
                    metrics["roi"] = (metrics["totalRevenue"] - metrics["totalCost"]) / metrics["totalCost"] * 100
            
            # Sort suppliers by ROI
            supplier_performance = list(supplier_metrics.values())
            supplier_performance.sort(key=lambda x: x["roi"], reverse=True)
            
            return {"supplierPerformance": supplier_performance}
        except Exception as e:
            logger.error(f"Error getting supplier performance: {str(e)}")
            return self._get_mock_supplier_performance()
    
    # User methods
    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new user.
        
        Args:
            user_data: User data
            
        Returns:
            Created user
        """
        if self.supabase is None:
            # Return mock data
            return {**user_data, "id": 1}
        
        try:
            response = self.supabase.table("users").insert(user_data).execute()
            
            if not response.data:
                raise ValueError("Failed to create user")
            
            return response.data[0]
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            raise
    
    def get_users(self, role: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get all users with optional role filter.
        
        Args:
            role: Filter by role
            
        Returns:
            List of users
        """
        if self.supabase is None:
            # Return mock data
            return self._get_mock_users(role)
        
        try:
            query = self.supabase.table("users").select("*")
            
            if role:
                query = query.eq("role", role)
            
            response = query.execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error getting users: {str(e)}")
            return []
    
    def create_api_key(self, api_key_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new API key.
        Note: API keys table doesn't exist in the actual schema, so this returns mock data.

        Args:
            api_key_data: API key data

        Returns:
            Mock API key data
        """
        # Since api_keys table doesn't exist in the actual schema, return mock data
        return {**api_key_data, "id": 1, "key": f"test_{uuid.uuid4().hex[:16]}", "isactive": True}
    
    def get_api_keys(self, active_only: bool = True) -> List[Dict[str, Any]]:
        """
        Get all API keys.
        Note: API keys table doesn't exist in the actual schema, so this returns mock data.

        Args:
            active_only: Only return active API keys

        Returns:
            List of mock API keys
        """
        # Since api_keys table doesn't exist in the actual schema, return mock data
        return self._get_mock_api_keys(active_only)
    
    def log_activity(self, activity_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Log user activity.
        
        Args:
            activity_data: Activity data
            
        Returns:
            Created activity log
        """
        if self.supabase is None:
            # Return mock data
            return {**activity_data, "id": 1}
        
        try:
            response = self.supabase.table("activity_logs").insert(activity_data).execute()
            
            if not response.data:
                raise ValueError("Failed to log activity")
            
            return response.data[0]
        except Exception as e:
            logger.error(f"Error logging activity: {str(e)}")
            raise
    
    def get_activity_logs(self, user_id: Optional[int] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get activity logs for a user or all logs.
        
        Args:
            user_id: Filter by user ID
            limit: Maximum number of logs to return
            
        Returns:
            List of activity logs
        """
        if self.supabase is None:
            # Return mock data
            return self._get_mock_activity_logs(user_id, limit)
        
        try:
            query = self.supabase.table("activity_logs").select("*").order("createdat", desc=True).limit(limit)
            
            if user_id:
                query = query.eq("userid", user_id)
            
            response = query.execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error getting activity logs: {str(e)}")
            return []
    
    def get_file_from_storage(self, file_path: str) -> bytes:
        """
        Get a file from Supabase storage.
        
        Args:
            file_path: Path to the file in storage
            
        Returns:
            File data as bytes
        """
        if self.supabase is None:
            # Return mock data
            return b"Mock file data"
        
        try:
            # Extract bucket and path from file_path
            parts = file_path.split('/', 1)
            bucket = parts[0]
            path = parts[1] if len(parts) > 1 else file_path
            
            response = self.supabase.storage.from_(bucket).download(path)
            return response
        except Exception as e:
            logger.error(f"Error getting file from storage: {str(e)}")
            raise
    
    def upload_file_to_storage(self, bucket: str, path: str, file_data: bytes) -> str:
        """
        Upload a file to Supabase storage.
        
        Args:
            bucket: Storage bucket
            path: File path within the bucket
            file_data: File data as bytes
            
        Returns:
            Public URL of the uploaded file
        """
        if self.supabase is None:
            # Return mock data
            return f"https://mock-storage.com/{bucket}/{path}"
        
        try:
            response = self.supabase.storage.from_(bucket).upload(path, file_data)
            
            # Get the public URL
            public_url = self.supabase.storage.from_(bucket).get_public_url(path)
            
            return public_url
        except Exception as e:
            logger.error(f"Error uploading file to storage: {str(e)}")
            raise
    
    # Mock data methods for development and testing
    def _get_mock_upload_batches(self, limit: int, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get mock upload batches."""
        batches = [
            {
                "id": 1,
                "filename": "leads_batch_1.csv",
                "uploadedby": "admin",
                "status": "Completed",
                "totalleads": 1000,
                "cleanedleads": 950,
                "duplicateleads": 50,
                "dncmatches": 20,
                "createdat": "2023-01-01T12:00:00",
                "completedat": "2023-01-01T12:05:00",
                "processingprogress": 100
            },
            {
                "id": 2,
                "filename": "leads_batch_2.xlsx",
                "uploadedby": "admin",
                "status": "Processing",
                "totalleads": 500,
                "cleanedleads": 0,
                "duplicateleads": 0,
                "dncmatches": 0,
                "createdat": "2023-01-02T12:00:00",
                "completedat": None,
                "processingprogress": 50
            },
            {
                "id": 3,
                "filename": "leads_batch_3.csv",
                "uploadedby": "admin",
                "status": "Failed",
                "totalleads": 0,
                "cleanedleads": 0,
                "duplicateleads": 0,
                "dncmatches": 0,
                "createdat": "2023-01-03T12:00:00",
                "completedat": None,
                "processingprogress": 0,
                "errormessage": "Invalid file format"
            }
        ]
        
        if status:
            batches = [batch for batch in batches if batch["status"] == status]
        
        return batches[:limit]
    
    def _get_mock_upload_batch(self, batch_id: int) -> Dict[str, Any]:
        """Get mock upload batch by ID."""
        batches = self._get_mock_upload_batches(10)
        
        for batch in batches:
            if batch["id"] == batch_id:
                return batch
        
        raise ValueError(f"Upload batch with ID {batch_id} not found")
    
    def _update_mock_batch_status(self, batch_id: int, status: str, **kwargs) -> Dict[str, Any]:
        """Update mock batch status."""
        batch = self._get_mock_upload_batch(batch_id)
        batch["status"] = status
        
        for key, value in kwargs.items():
            batch[key] = value
        
        return batch
    
    def _get_mock_leads_by_batch(self, batch_id: int, limit: int, offset: int) -> List[Dict[str, Any]]:
        """Get mock leads by batch."""
        leads = []
        
        for i in range(offset, offset + limit):
            leads.append({
                "id": i + 1,
                "firstname": f"John{i}",
                "lastname": f"Doe{i}",
                "email": f"john.doe{i}@example.com",
                "phone": f"+1555{i:07d}",
                "companyname": f"Company {i}",
                "leadstatus": "New",
                "leadsource": "CSV Upload",
                "leadcost": 5.0,
                "revenue": 0.0,
                "uploadbatchid": batch_id,
                "createdat": "2023-01-01T12:00:00"
            })
        
        return leads
    
    def _check_mock_dnc(self, email: Optional[str] = None, phone: Optional[str] = None) -> tuple:
        """Check mock DNC."""
        # For demonstration, check if email contains "dnc" or phone ends with "9999"
        is_dnc = False
        dnc_lists = []
        
        if email and "dnc" in email:
            is_dnc = True
            dnc_lists.append(1)
        
        if phone and phone.endswith("9999"):
            is_dnc = True
            dnc_lists.append(2)
        
        return is_dnc, dnc_lists
    
    def _get_mock_dnc_lists(self, active_only: bool) -> List[Dict[str, Any]]:
        """Get mock DNC lists."""
        lists = [
            {
                "id": 1,
                "name": "Global DNC",
                "type": "global",
                "description": "Global Do Not Call list",
                "isactive": True,
                "createdat": "2023-01-01T12:00:00",
                "lastupdated": "2023-01-01T12:00:00"
            },
            {
                "id": 2,
                "name": "Company DNC",
                "type": "company",
                "description": "Company-specific Do Not Call list",
                "isactive": True,
                "createdat": "2023-01-01T12:00:00",
                "lastupdated": "2023-01-01T12:00:00"
            },
            {
                "id": 3,
                "name": "Inactive DNC",
                "type": "custom",
                "description": "Inactive Do Not Call list",
                "isactive": False,
                "createdat": "2023-01-01T12:00:00",
                "lastupdated": "2023-01-01T12:00:00"
            }
        ]
        
        if active_only:
            lists = [lst for lst in lists if lst["isactive"]]
        
        return lists
    
    def _get_mock_dnc_entries(self, list_id: int, limit: int, offset: int) -> List[Dict[str, Any]]:
        """Get mock DNC entries."""
        entries = []
        
        for i in range(offset, offset + limit):
            if i % 2 == 0:
                entries.append({
                    "id": i + 1,
                    "value": f"john.doe{i}@example.com",
                    "valuetype": "email",
                    "source": "Manual Entry",
                    "reason": "Customer Request",
                    "dnclistid": list_id,
                    "createdat": "2023-01-01T12:00:00",
                    "expirydate": None
                })
            else:
                entries.append({
                    "id": i + 1,
                    "value": f"+1555{i:07d}",
                    "valuetype": "phone",
                    "source": "Manual Entry",
                    "reason": "Customer Request",
                    "dnclistid": list_id,
                    "createdat": "2023-01-01T12:00:00",
                    "expirydate": None
                })
        
        return entries
    
    def _get_mock_clients(self, client_ids: Optional[List[int]] = None, active_only: bool = True) -> List[Dict[str, Any]]:
        """Get mock clients."""
        clients = [
            {
                "id": 1,
                "name": "Client A",
                "contactname": "John Smith",
                "contactemail": "john@clienta.com",
                "contactphone": "+15551234567",
                "isactive": True,
                "fixedallocation": 100,
                "percentallocation": 0,
                "createdat": "2023-01-01T12:00:00"
            },
            {
                "id": 2,
                "name": "Client B",
                "contactname": "Jane Doe",
                "contactemail": "jane@clientb.com",
                "contactphone": "+15557654321",
                "isactive": True,
                "fixedallocation": 0,
                "percentallocation": 60,
                "createdat": "2023-01-01T12:00:00"
            },
            {
                "id": 3,
                "name": "Client C",
                "contactname": "Bob Johnson",
                "contactemail": "bob@clientc.com",
                "contactphone": "+15559876543",
                "isactive": True,
                "fixedallocation": 0,
                "percentallocation": 40,
                "createdat": "2023-01-01T12:00:00"
            },
            {
                "id": 4,
                "name": "Inactive Client",
                "contactname": "Alice Brown",
                "contactemail": "alice@inactiveclient.com",
                "contactphone": "+15553456789",
                "isactive": False,
                "fixedallocation": 0,
                "percentallocation": 0,
                "createdat": "2023-01-01T12:00:00"
            }
        ]
        
        if active_only:
            clients = [client for client in clients if client["isactive"]]
        
        if client_ids:
            clients = [client for client in clients if client["id"] in client_ids]
        
        return clients
    
    def _get_mock_distributions(self, batch_id: Optional[int] = None, client_id: Optional[int] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get mock distributions."""
        distributions = [
            {
                "id": 1,
                "batchid": 1,
                "clientid": 1,
                "leadsallocated": 100,
                "deliverystatus": "Delivered",
                "deliverydate": "2023-01-01T12:10:00",
                "createdat": "2023-01-01T12:05:00"
            },
            {
                "id": 2,
                "batchid": 1,
                "clientid": 2,
                "leadsallocated": 500,
                "deliverystatus": "Delivered",
                "deliverydate": "2023-01-01T12:10:00",
                "createdat": "2023-01-01T12:05:00"
            },
            {
                "id": 3,
                "batchid": 1,
                "clientid": 3,
                "leadsallocated": 350,
                "deliverystatus": "Delivered",
                "deliverydate": "2023-01-01T12:10:00",
                "createdat": "2023-01-01T12:05:00"
            }
        ]
        
        if batch_id:
            distributions = [dist for dist in distributions if dist["batchid"] == batch_id]
        
        if client_id:
            distributions = [dist for dist in distributions if dist["clientid"] == client_id]
        
        return distributions[:limit]
    
    def _get_mock_roi_metrics(self) -> Dict[str, Any]:
        """Get mock ROI metrics."""
        return {
            "totalLeads": 1000,
            "convertedLeads": 200,
            "conversionRate": 20.0,
            "totalCost": 5000.0,
            "totalRevenue": 15000.0,
            "netProfit": 10000.0,
            "roi": 200.0,
            "sourcePerformance": [
                {
                    "source": "Facebook",
                    "totalLeads": 400,
                    "convertedLeads": 100,
                    "totalCost": 2000.0,
                    "totalRevenue": 8000.0,
                    "conversionRate": 25.0,
                    "roi": 300.0
                },
                {
                    "source": "Google",
                    "totalLeads": 300,
                    "convertedLeads": 60,
                    "totalCost": 1500.0,
                    "totalRevenue": 4500.0,
                    "conversionRate": 20.0,
                    "roi": 200.0
                },
                {
                    "source": "LinkedIn",
                    "totalLeads": 200,
                    "convertedLeads": 30,
                    "totalCost": 1000.0,
                    "totalRevenue": 2000.0,
                    "conversionRate": 15.0,
                    "roi": 100.0
                },
                {
                    "source": "Other",
                    "totalLeads": 100,
                    "convertedLeads": 10,
                    "totalCost": 500.0,
                    "totalRevenue": 500.0,
                    "conversionRate": 10.0,
                    "roi": 0.0
                }
            ]
        }
    
    def _get_mock_supplier_performance(self) -> Dict[str, Any]:
        """Get mock supplier performance."""
        return {
            "supplierPerformance": [
                {
                    "id": 1,
                    "name": "Supplier A",
                    "totalLeads": 500,
                    "convertedLeads": 125,
                    "totalCost": 2500.0,
                    "totalRevenue": 10000.0,
                    "conversionRate": 25.0,
                    "roi": 300.0,
                    "avgLeadCost": 5.0
                },
                {
                    "id": 2,
                    "name": "Supplier B",
                    "totalLeads": 300,
                    "convertedLeads": 45,
                    "totalCost": 1500.0,
                    "totalRevenue": 3000.0,
                    "conversionRate": 15.0,
                    "roi": 100.0,
                    "avgLeadCost": 5.0
                },
                {
                    "id": 3,
                    "name": "Supplier C",
                    "totalLeads": 200,
                    "convertedLeads": 30,
                    "totalCost": 1000.0,
                    "totalRevenue": 2000.0,
                    "conversionRate": 15.0,
                    "roi":   1000.0,
                    "totalRevenue": 2000.0,
                    "conversionRate": 15.0,
                    "roi": 100.0,
                    "avgLeadCost": 5.0
                }
            ]
        }
    
    def _get_mock_users(self, role: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get mock users."""
        users = [
            {
                "id": 1,
                "username": "admin",
                "email": "admin@example.com",
                "fullname": "Admin User",
                "role": "admin",
                "createdat": "2023-01-01T12:00:00",
                "updatedat": "2023-01-01T12:00:00"
            },
            {
                "id": 2,
                "username": "manager",
                "email": "manager@example.com",
                "fullname": "Manager User",
                "role": "manager",
                "createdat": "2023-01-01T12:00:00",
                "updatedat": "2023-01-01T12:00:00"
            },
            {
                "id": 3,
                "username": "user",
                "email": "user@example.com",
                "fullname": "Regular User",
                "role": "user",
                "createdat": "2023-01-01T12:00:00",
                "updatedat": "2023-01-01T12:00:00"
            }
        ]
        
        if role:
            users = [user for user in users if user["role"] == role]
        
        return users
    
    def _get_mock_api_keys(self, active_only: bool = True) -> List[Dict[str, Any]]:
        """Get mock API keys."""
        api_keys = [
            {
                "id": 1,
                "name": "Production API Key",
                "permissions": ["read", "write"],
                "expirydate": "2024-01-01T12:00:00",
                "isactive": True,
                "createdat": "2023-01-01T12:00:00"
            },
            {
                "id": 2,
                "name": "Read-only API Key",
                "permissions": ["read"],
                "expirydate": "2024-01-01T12:00:00",
                "isactive": True,
                "createdat": "2023-01-01T12:00:00"
            },
            {
                "id": 3,
                "name": "Inactive API Key",
                "permissions": ["read", "write"],
                "expirydate": "2023-01-01T12:00:00",
                "isactive": False,
                "createdat": "2023-01-01T12:00:00"
            }
        ]
        
        if active_only:
            api_keys = [key for key in api_keys if key["isactive"]]
        
        return api_keys
    
    def _get_mock_activity_logs(self, user_id: Optional[int] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get mock activity logs."""
        logs = [
            {
                "id": 1,
                "activitytype": "login",
                "userid": 1,
                "details": {"ip": "192.168.1.1", "browser": "Chrome"},
                "createdat": "2023-01-01T12:00:00"
            },
            {
                "id": 2,
                "activitytype": "upload_file",
                "userid": 1,
                "details": {"fileName": "leads_batch_1.csv", "fileSize": 1024},
                "createdat": "2023-01-01T12:05:00"
            },
            {
                "id": 3,
                "activitytype": "login",
                "userid": 2,
                "details": {"ip": "192.168.1.2", "browser": "Firefox"},
                "createdat": "2023-01-01T12:10:00"
            },
            {
                "id": 4,
                "activitytype": "view_leads",
                "userid": 2,
                "details": {"batchId": 1, "count": 100},
                "createdat": "2023-01-01T12:15:00"
            }
        ]
        
        if user_id:
            logs = [log for log in logs if log["userid"] == user_id]
        
        return logs[:limit]

    def check_field_duplicates(self, field: str, values: List[str]) -> List[Dict]:
        """Check for duplicate values in a specific field."""
        if self.supabase is None:
            return []
        
        try:
            response = self.supabase.table("leads").select(field).in_(field, values).execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error checking duplicates for field {field}: {str(e)}")
            return []

    def insert_leads_batch(self, leads: List[Dict[str, Any]]) -> int:
        """Insert a batch of leads into the database."""
        if self.supabase is None:
            logger.warning("No Supabase client available. Simulating insert.")
            return len(leads)
        
        try:
            # Define the valid column names for the leads table
            valid_leads_columns = [
                "id", "email", "firstname", "lastname", "phone", "companyname", 
                "taxid", "address", "city", "state", "zipcode", "country", 
                "leadsource", "leadstatus", "leadscore", "leadcost", "exclusivity", 
                "exclusivitynotes", "uploadbatchid", "clientid", "supplierid", 
                "metadata", "tags", "createdat", "updatedat"
            ]
            
            processed_leads = []
            for lead in leads:
                processed_lead = {}
                # Filter keys to include only valid database columns
                for key, value in lead.items():
                    if key in valid_leads_columns:
                        if isinstance(value, datetime):
                            processed_lead[key] = value.isoformat()
                        elif isinstance(value, list):
                            processed_lead[key] = value  # Keep arrays as-is for tags
                        else:
                            processed_lead[key] = value
                processed_leads.append(processed_lead)
            
            response = self.supabase.table("leads").insert(processed_leads).execute()
            return len(response.data) if response.data else 0
        except Exception as e:
            logger.error(f"Error inserting leads batch: {str(e)}")
            raise

    def get_dashboard_stats(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """Get dashboard statistics from the database."""
        if self.supabase is None:
            logger.warning("No Supabase client available. Returning mock stats.")
            return self._get_mock_dashboard_stats()
        
        try:
            # Get total leads count
            leads_query = self.supabase.table("leads").select("*", count="exact", head=True)
            if start_date:
                leads_query = leads_query.gte("createdat", start_date)
            if end_date:
                leads_query = leads_query.lte("createdat", end_date)
            
            leads_response = leads_query.execute()
            total_leads = leads_response.count or 0

            # Get other stats similarly...
            # For now, return mock data with real total leads
            stats = self._get_mock_dashboard_stats()
            stats["totalLeads"] = total_leads
            
            return stats
        except Exception as e:
            logger.error(f"Error getting dashboard stats: {str(e)}")
            return self._get_mock_dashboard_stats()

    def get_lead_trends(self, period: str, days: int) -> List[Dict[str, Any]]:
        """Get lead trends over time."""
        if self.supabase is None:
            return self._get_mock_lead_trends(period, days)
        
        try:
            # Implementation for real data would go here
            # For now, return mock data
            return self._get_mock_lead_trends(period, days)
        except Exception as e:
            logger.error(f"Error getting lead trends: {str(e)}")
            return self._get_mock_lead_trends(period, days)

    def get_status_distribution(self) -> List[Dict[str, Any]]:
        """Get lead status distribution."""
        if self.supabase is None:
            return self._get_mock_status_distribution()
        
        try:
            response = self.supabase.table("leads").select("leadstatus").execute()
            leads = response.data or []
            
            status_counts = {}
            for lead in leads:
                status = lead.get("leadstatus", "Unknown")
                status_counts[status] = status_counts.get(status, 0) + 1
            
            total = len(leads)
            distribution = []
            for status, count in status_counts.items():
                distribution.append({
                    "name": status,
                    "value": count,
                    "percentage": (count / total * 100) if total > 0 else 0
                })
            
            return distribution
        except Exception as e:
            logger.error(f"Error getting status distribution: {str(e)}")
            return self._get_mock_status_distribution()

    def get_source_performance(self) -> List[Dict[str, Any]]:
        """Get lead source performance metrics."""
        if self.supabase is None:
            return self._get_mock_source_performance()
        
        try:
            # Implementation for real data would go here
            # For now, return mock data
            return self._get_mock_source_performance()
        except Exception as e:
            logger.error(f"Error getting source performance: {str(e)}")
            return self._get_mock_source_performance()

    def get_recent_uploads(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Get recent upload batches."""
        if self.supabase is None:
            return self._get_mock_recent_uploads(limit)
        
        try:
            response = self.supabase.table("upload_batches").select("*").order("createdat", desc=True).limit(limit).execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error getting recent uploads: {str(e)}")
            return self._get_mock_recent_uploads(limit)

    # Mock data methods
    def _get_mock_dashboard_stats(self) -> Dict[str, Any]:
        return {
            "totalLeads": 1250,
            "totalUploads": 45,
            "dncMatches": 87,
            "conversionRate": 12.5,
            "convertedLeads": 156,
            "totalCost": 5000,
            "totalRevenue": 15000,
            "netProfit": 10000,
            "roi": 200,
            "processingBatches": 2,
            "failedBatches": 1,
            "avgLeadCost": 4,
            "avgRevenue": 96.15,
        }

    def _get_mock_lead_trends(self, period: str, days: int) -> List[Dict[str, Any]]:
        import random
        from datetime import timedelta
        
        trends = []
        for i in range(days):
            date = datetime.now() - timedelta(days=i)
            trends.append({
                "date": date.strftime("%Y-%m-%d"),
                "totalLeads": random.randint(30, 80),
                "convertedLeads": random.randint(5, 20),
                "dncLeads": random.randint(1, 6),
                "totalCost": random.randint(100, 300),
                "totalRevenue": random.randint(300, 800),
            })
        
        trends.sort(key=lambda x: x["date"])
        return trends

    def _get_mock_status_distribution(self) -> List[Dict[str, Any]]:
        return [
            {"name": "New", "value": 450, "percentage": 36.0},
            {"name": "Contacted", "value": 300, "percentage": 24.0},
            {"name": "Qualified", "value": 200, "percentage": 16.0},
            {"name": "Converted", "value": 156, "percentage": 12.5},
            {"name": "DNC", "value": 87, "percentage": 7.0},
            {"name": "Lost", "value": 57, "percentage": 4.5},
        ]

    def _get_mock_source_performance(self) -> List[Dict[str, Any]]:
        return [
            {
                "source": "Google Ads",
                "totalLeads": 400,
                "convertedLeads": 60,
                "totalCost": 2000,
                "totalRevenue": 6000,
                "conversionRate": 15.0,
                "roi": 200.0
            },
            {
                "source": "Facebook Ads",
                "totalLeads": 350,
                "convertedLeads": 42,
                "totalCost": 1500,
                "totalRevenue": 4200,
                "conversionRate": 12.0,
                "roi": 180.0
            }
        ]

    def _get_mock_recent_uploads(self, limit: int) -> List[Dict[str, Any]]:
        from datetime import timedelta
        
        uploads = [
            {
                "id": 1,
                "filename": "leads_batch_1.csv",
                "status": "Completed",
                "totalleads": 150,
                "cleanedleads": 130,
                "duplicateleads": 15,
                "dncmatches": 5,
                "createdat": (datetime.now() - timedelta(days=1)).isoformat(),
                "processingprogress": 100,
                "errormessage": "",
            },
            {
                "id": 2,
                "filename": "leads_batch_2.xlsx",
                "status": "Processing",
                "totalleads": 200,
                "cleanedleads": 0,
                "duplicateleads": 0,
                "dncmatches": 0,
                "createdat": datetime.now().isoformat(),
                "processingprogress": 45,
                "errormessage": "",
            },
        ]
        
        return uploads[:limit]

    def add_dnc_entries(self, entries: List[Dict[str, Any]]) -> None:
        """Add entries to the DNC list."""
        if not entries:
            return
            
        try:
            # Insert entries into the dnc_entries table
            result = self.supabase.table("dnc_entries").insert(entries).execute()
            logger.info(f"Added {len(entries)} DNC entries")
            
            # Update lastupdated timestamp for affected DNC lists
            dnc_list_ids = {entry['dnclistid'] for entry in entries}
            for list_id in dnc_list_ids:
                self.supabase.table("dnc_lists").update({
                    "lastupdated": datetime.now(timezone.utc).isoformat()
                }).eq("id", list_id).execute()
        except Exception as e:
            logger.error(f"Error adding DNC entries: {e}")
            raise

    def get_leads_by_emails(self, emails: List[str]) -> List[Dict[str, Any]]:
        """Get leads by email addresses."""
        if not emails:
            return []
            
        try:
            result = self.supabase.table("leads").select("*").in_("email", emails).execute()
            return result.data
        except Exception as e:
            logger.error(f"Error getting leads by emails: {e}")
            return []

    def get_leads_by_phones(self, phones: List[str]) -> List[Dict[str, Any]]:
        """Get leads by phone numbers."""
        if not phones:
            return []
            
        try:
            result = self.supabase.table("leads").select("*").in_("phone", phones).execute()
            return result.data
        except Exception as e:
            logger.error(f"Error getting leads by phones: {e}")
            return []

    def insert_leads(self, leads: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Insert leads into the database."""
        if not leads:
            return {"data": []}
            
        try:
            result = self.supabase.table("leads").insert(leads).execute()
            # Ensure the result data is returned in a dictionary with 'data' key
            returned_data = {"data": result.data}
            logger.info(f"insert_leads returning: {returned_data}")
            return returned_data
        except Exception as e:
            logger.error(f"Error inserting leads: {e}")
            raise

    def insert_batch_record(self, batch_data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new batch record."""
        try:
            result = self.supabase.table("upload_batches").insert(batch_data).execute()
            return result
        except Exception as e:
            logger.error(f"Error inserting batch record: {e}")
            raise

    def update_batch_record(self, batch_id: int, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing batch record."""
        try:
            result = self.supabase.table("upload_batches").update(update_data).eq("id", batch_id).execute()
            return result.data[0] if result.data else {}
        except Exception as e:
            logger.error(f"Error updating batch record: {e}")
            raise

    # --- New Lead Management Methods --- #

    def get_lead_by_id(self, lead_id: int) -> Optional[Dict[str, Any]]:
        """Get a single lead by ID."""
        if self.supabase is None:
            logger.warning("No Supabase client available. Cannot get lead by ID.")
            return None
        try:
            response = self.supabase.table("leads").select("*").eq("id", lead_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error getting lead by ID {lead_id}: {e}")
            return None

    def add_lead(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add a new lead to the database.
        
        Args:
            lead_data: Lead data dictionary
        
        Returns:
            Added lead data
        """
        if self.supabase is None:
            logger.warning("No Supabase client available. Cannot add lead.")
            return {}
        
        try:
            # Check for duplicate email
            if "email" in lead_data and lead_data["email"]:
                existing_lead = self.supabase.table("leads").select("*").eq("email", lead_data["email"]).execute()
                if existing_lead.data and len(existing_lead.data) > 0:
                    raise ValueError(f"Lead with email {lead_data['email']} already exists")
            
            # Check DNC if phone is provided
            if "phone" in lead_data and lead_data["phone"]:
                # Check in dnc_entries table for phone numbers
                dnc_check = self.supabase.table("dnc_entries").select("*").eq("value", lead_data["phone"]).eq("valuetype", "phone").execute()
                if dnc_check.data and len(dnc_check.data) > 0:
                    raise ValueError(f"Phone number {lead_data['phone']} is in DNC list")
            
            # Add createdat timestamp
            lead_data["createdat"] = datetime.now(timezone.utc).isoformat()
            
            # Add the lead
            response = self.supabase.table("leads").insert(lead_data).execute()
            
            if not response.data:
                raise Exception("No data returned from insert operation")
                
            return response.data[0]
            
        except ValueError as ve:
            logger.error(f"Validation error adding lead: {str(ve)}")
            raise
        except Exception as e:
            logger.error(f"Error adding single lead: {str(e)}")
            raise

    def update_lead(self, lead_id: int, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an existing lead in the database."""
        if self.supabase is None:
            logger.warning("No Supabase client available. Simulating update lead.")
            # Simulate successful update with current timestamp
            return {**update_data, "id": lead_id, "updatedat": datetime.now(timezone.utc).isoformat()}
            
        try:
            # Ensure updatedat is set on update
            update_data["updatedat"] = datetime.now(timezone.utc).isoformat()

            response = self.supabase.table("leads").update(update_data).eq("id", lead_id).execute()
            if response.data:
                logger.info(f"Successfully updated lead with ID: {lead_id}")
                return response.data[0]
            else:
                logger.error(f"Failed to update lead with ID {lead_id}: No data returned")
                return None
        except Exception as e:
            logger.error(f"Error updating lead with ID {lead_id}: {e}")
            return None

    def update_lead_status(self, lead_id: int, new_status: str) -> Optional[Dict[str, Any]]:
        """Update the status of a lead."""
        if self.supabase is None:
            logger.warning("No Supabase client available. Simulating status update.")
            return {"id": lead_id, "leadstatus": new_status, "updatedat": datetime.now(timezone.utc).isoformat()}
            
        try:
            update_data = {
                "leadstatus": new_status,
                "updatedat": datetime.now(timezone.utc).isoformat()
            }
            response = self.supabase.table("leads").update(update_data).eq("id", lead_id).execute()
            if response.data:
                logger.info(f"Successfully updated status for lead ID {lead_id} to {new_status}")
                return response.data[0]
            else:
                logger.error(f"Failed to update status for lead ID {lead_id}: No data returned")
                return None
        except Exception as e:
            logger.error(f"Error updating lead status for ID {lead_id}: {e}")
            return None

    def delete_lead(self, lead_id: int) -> bool:
        """Delete a lead from the database."""
        if self.supabase is None:
            logger.warning("No Supabase client available. Simulating delete lead.")
            return True # Simulate success
            
        try:
            response = self.supabase.table("leads").delete().eq("id", lead_id).execute()
            # Supabase delete returns an empty list in data on success
            if response.data == []:
                 logger.info(f"Successfully deleted lead with ID: {lead_id}")
                 return True
            else:
                logger.error(f"Failed to delete lead with ID {lead_id}: {response.data}")
                return False
        except Exception as e:
            logger.error(f"Error deleting lead with ID {lead_id}: {e}")
            return False

    # Methods required for hybrid system
    async def get_suppliers(self) -> List[Dict[str, Any]]:
        """Get list of all suppliers"""
        try:
            response = self.supabase.table('suppliers').select('*').execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Error fetching suppliers: {e}")
            return []

    async def check_dnc_lists(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Check data against DNC lists"""
        try:
            # Get active DNC lists
            dnc_response = self.supabase.table('dnc_lists').select('*').eq('isactive', True).execute()
            if not dnc_response.data:
                return {
                    'dnc_matches': 0,
                    'matches': [],
                    'clean_data': data,
                    'stats': {'total_leads': len(data), 'dnc_matches': 0, 'clean_leads': len(data)}
                }

            # Get DNC entries
            dnc_list_ids = [dnc['id'] for dnc in dnc_response.data]
            entries_response = self.supabase.table('dnc_entries').select('*').in_('dnclistid', dnc_list_ids).execute()

            dnc_emails = set()
            dnc_phones = set()

            if entries_response.data:
                for entry in entries_response.data:
                    if entry['valuetype'] == 'email':
                        dnc_emails.add(entry['value'].lower())
                    elif entry['valuetype'] == 'phone':
                        dnc_phones.add(re.sub(r'\D', '', entry['value']))

            # Check data against DNC
            clean_data = []
            matches = []

            for lead in data:
                is_dnc = False

                if lead.get('email') and lead['email'].lower() in dnc_emails:
                    is_dnc = True
                    matches.append({'lead': lead, 'match_type': 'email', 'match_value': lead['email']})
                elif lead.get('phone'):
                    phone_clean = re.sub(r'\D', '', lead['phone'])
                    if phone_clean in dnc_phones:
                        is_dnc = True
                        matches.append({'lead': lead, 'match_type': 'phone', 'match_value': lead['phone']})

                if not is_dnc:
                    clean_data.append(lead)

            return {
                'dnc_matches': len(matches),
                'matches': matches,
                'clean_data': clean_data,
                'stats': {
                    'total_leads': len(data),
                    'dnc_matches': len(matches),
                    'clean_leads': len(clean_data)
                }
            }

        except Exception as e:
            logger.error(f"Error checking DNC lists: {e}")
            return {
                'dnc_matches': 0,
                'matches': [],
                'clean_data': data,
                'stats': {'total_leads': len(data), 'dnc_matches': 0, 'clean_leads': len(data)}
            }

    async def upload_leads(self, leads_data: List[Dict[str, Any]], supplier_id: int,
                          lead_cost: float, file_name: str) -> Dict[str, Any]:
        """Upload leads to database"""
        try:
            # Create upload batch
            batch_data = {
                'filename': file_name,
                'filetype': 'processed',
                'status': 'completed',
                'totalleads': len(leads_data),
                'cleanedleads': len(leads_data),
                'duplicateleads': 0,
                'dncmatches': 0,
                'supplierid': supplier_id,
                'createdat': datetime.utcnow().isoformat(),
                'completedat': datetime.utcnow().isoformat()
            }

            batch_response = self.supabase.table('upload_batches').insert(batch_data).execute()
            if not batch_response.data:
                raise Exception("Failed to create upload batch")

            batch_id = batch_response.data[0]['id']

            # Prepare leads for insertion
            leads_to_insert = []
            for lead in leads_data:
                lead_record = {
                    'email': lead.get('email'),
                    'firstname': lead.get('firstname'),
                    'lastname': lead.get('lastname'),
                    'phone': lead.get('phone'),
                    'companyname': lead.get('companyname'),
                    'address': lead.get('address'),
                    'city': lead.get('city'),
                    'state': lead.get('state'),
                    'zipcode': lead.get('zipcode'),
                    'country': lead.get('country'),
                    'leadcost': lead_cost,
                    'supplierid': supplier_id,
                    'uploadbatchid': batch_id,
                    'tags': lead.get('tags', []),
                    'createdat': datetime.utcnow().isoformat(),
                    'updatedat': datetime.utcnow().isoformat()
                }
                leads_to_insert.append(lead_record)

            # Insert leads in batches
            batch_size = 100
            inserted_count = 0

            for i in range(0, len(leads_to_insert), batch_size):
                batch = leads_to_insert[i:i + batch_size]
                response = self.supabase.table('leads').insert(batch).execute()
                if response.data:
                    inserted_count += len(response.data)

            return {
                'success': True,
                'batch_id': batch_id,
                'inserted_count': inserted_count,
                'total_leads': len(leads_data)
            }

        except Exception as e:
            logger.error(f"Error uploading leads: {e}")
            return {
                'success': False,
                'error': str(e),
                'inserted_count': 0,
                'total_leads': len(leads_data)
            }
