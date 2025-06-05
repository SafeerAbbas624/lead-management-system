import os
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import json
from supabase import create_client, Client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

class SupabaseClient:
    def __init__(self):
        """
        Initialize the Supabase client.
        """
        # Get Supabase credentials from environment variables
        self.supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        self.supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            logger.warning("Supabase credentials not found. Using mock data.")
            self.client = None
            self.use_mock = True
        else:
            try:
                self.client: Client = create_client(self.supabase_url, self.supabase_key)
                self.use_mock = False
                logger.info("Supabase client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {str(e)}")
                self.client = None
                self.use_mock = True
    
    # Upload Batch methods
    def get_upload_batch(self, batch_id: int) -> Dict[str, Any]:
        """
        Get upload batch by ID.
        
        Args:
            batch_id: ID of the batch
            
        Returns:
            Upload batch data
        """
        if self.use_mock:
            # Return mock data
            return self._get_mock_upload_batch(batch_id)
        
        try:
            response = self.client.table("upload_batches").select("*").eq("id", batch_id).execute()
            
            if not response.data:
                raise ValueError(f"Upload batch with ID {batch_id} not found")
            
            return response.data[0]
        except Exception as e:
            logger.error(f"Error getting upload batch: {str(e)}")
            raise
    
    def create_upload_batch(self, batch_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new upload batch."""
        if not self.client:
            logger.warning("No Supabase client available. Returning mock batch ID.")
            self.use_mock = True
            return {**batch_data, "id": 1}
            
        try:
            response = self.client.table("upload_batches").insert(batch_data).execute()
            
            if not response.data:
                raise ValueError("Failed to create upload batch")
            
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
        if self.use_mock:
            # Return mock data
            return self._update_mock_batch_status(batch_id, status, **kwargs)
        
        try:
            update_data = {"status": status, **kwargs}
            
            response = self.client.table("upload_batches").update(update_data).eq("id", batch_id).execute()
            
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
        if self.use_mock:
            # Return mock data
            return self._get_mock_upload_batches(limit, status)
        
        try:
            query = self.client.table("upload_batches").select("*").order("createdat", desc=True).limit(limit)
            
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
        if self.use_mock:
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
        if self.use_mock:
            # Return mock data
            return {**list_data, "id": 1}
        
        try:
            response = self.client.table("dnc_lists").insert(list_data).execute()
            
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
        if self.use_mock:
            # Return mock data
            return self._get_mock_dnc_lists(active_only)
        
        try:
            query = self.client.table("dnc_lists").select("*")
            
            if active_only:
                query = query.eq("isactive", True)
            
            response = query.execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error getting DNC lists: {str(e)}")
            return []
    
    def get_or_create_dnc_list(self, name: str, list_type: str) -> int:
        """
        Get a DNC list by name, or create it if it doesn't exist.
        
        Args:
            name: Name of the DNC list
            list_type: Type of the DNC list (e.g., 'manual', 'upload')
            
        Returns:
            ID of the DNC list
        """
        if self.use_mock:
            logger.warning("No Supabase client available. Returning mock DNC list ID.")
            # In mock mode, simulate creating/getting a list
            # A simple mock ID is sufficient for the flow
            return 123 # Mock list ID
            
        try:
            # Try to get the list by name
            response = self.client.table("dnc_lists").select("id").eq("name", name).limit(1).execute()
            
            if response.data:
                # List found, return its ID
                return response.data[0]["id"]
            else:
                # List not found, create it
                logger.info(f"DNC list '{name}' not found, creating.")
                new_list_data = {
                    "name": name,
                    "type": list_type,
                    "description": f"Automatically created list for {list_type} entries.",
                    "isactive": True,
                    "createdat": datetime.now().isoformat()
                }
                create_response = self.client.table("dnc_lists").insert(new_list_data).execute()
                
                if not create_response.data:
                    raise ValueError(f"Failed to create DNC list '{name}'")
                    
                return create_response.data[0]["id"]
                
        except Exception as e:
            logger.error(f"Error getting or creating DNC list '{name}': {str(e)}")
            # Depending on desired error handling, you might raise, return a default, or handle differently
            raise # Re-raise the exception to be handled by the caller
    
    def add_dnc_entry(self, entry_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add a new entry to a DNC list.
        
        Args:
            entry_data: DNC entry data
            
        Returns:
            Created DNC entry
        """
        if self.use_mock:
            # Return mock data
            return {**entry_data, "id": 1}
        
        try:
            response = self.client.table("dnc_entries").insert(entry_data).execute()
            
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
        if self.use_mock:
            # Return mock data
            return self._get_mock_dnc_entries(list_id, limit, offset)
        
        try:
            response = self.client.table("dnc_entries").select("*").eq("dnclistid", list_id).range(offset, offset + limit - 1).execute()
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
        if self.use_mock:
            # Return mock data
            return True
        
        try:
            response = self.client.table("dnc_entries").delete().eq("id", entry_id).execute()
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
        if self.use_mock:
            # Return mock data
            return len(entries)
        
        try:
            # Insert entries in chunks to avoid hitting limits
            chunk_size = 100
            added_count = 0
            
            for i in range(0, len(entries), chunk_size):
                chunk = entries[i:i+chunk_size]
                response = self.client.table("dnc_entries").insert(chunk).execute()
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
        if self.use_mock:
            # Return mock data
            return self._get_mock_leads_by_batch(batch_id, limit, offset)
        
        try:
            response = self.client.table("leads").select("*").eq("uploadbatchid", batch_id).range(offset, offset + limit - 1).execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error getting leads by batch: {str(e)}")
            return []
    
    def get_leads(self, limit: int = 100, offset: int = 0, search: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get leads with optional search."""
        if not self.client:
            raise ValueError("Supabase client not initialized")
            
        query = self.client.table("leads").select("*").order("createdat", desc=True).limit(limit).offset(offset)
        
        if search:
            query = query.or_(
                f"firstname.ilike.%{search}%,lastname.ilike.%{search}%,email.ilike.%{search}%,phone.ilike.%{search}%,companyname.ilike.%{search}%"
            )
            
        response = query.execute()
        
        return response.data or []
    
    def update_lead_tags(self, lead_ids: List[int], tags: List[str]) -> int:
        """Update tags for multiple leads."""
        if not self.client:
            raise ValueError("Supabase client not initialized")
            
        updated_count = 0
        for lead_id in lead_ids:
            response = self.client.table("leads").update({"tags": tags}).eq("id", lead_id).execute()
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
        if self.use_mock:
            # Return mock data
            return {"id": lead_id, "revenue": revenue}
        
        try:
            response = self.client.table("leads").update({"revenue": revenue, "updatedat": datetime.now().isoformat()}).eq("id", lead_id).execute()
            
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
        if self.use_mock:
            # Return mock data
            return self._get_mock_clients(client_ids, active_only)
        
        try:
            query = self.client.table("clients").select("*")
            
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
        if not self.client:
            raise ValueError("Supabase client not initialized")
            
        response = self.client.table("clients").insert(client_data).execute()
        
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
        if self.use_mock:
            # Return mock data
            return {**distribution_data, "id": 1}
        
        try:
            response = self.client.table("lead_distributions").insert(distribution_data).execute()
            
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
        if self.use_mock:
            # Return mock data
            return self._get_mock_distributions(batch_id, client_id, limit)
        
        try:
            query = self.client.table("lead_distributions").select("*").order("createdat", desc=True).limit(limit)
            
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
        if self.use_mock:
            # Return mock data
            return len(lead_ids)
        
        try:
            # Update leads in chunks to avoid hitting limits
            chunk_size = 100
            tagged_count = 0
            
            for i in range(0, len(lead_ids), chunk_size):
                chunk = lead_ids[i:i+chunk_size]
                
                # Get current tags for each lead
                leads_response = self.client.table("leads").select("id, tags").in_("id", chunk).execute()
                leads = leads_response.data or []
                
                # Update tags for each lead
                for lead in leads:
                    lead_id = lead["id"]
                    current_tags = lead.get("tags", []) or []
                    
                    if tag not in current_tags:
                        current_tags.append(tag)
                        
                        # Update the lead
                        update_response = self.client.table("leads").update({"tags": current_tags}).eq("id", lead_id).execute()
                        
                        if update_response.data:
                            tagged_count += 1
            
            return tagged_count
        except Exception as e:
            logger.error(f"Error tagging leads: {str(e)}")
            raise
    
    # Supplier methods
    def get_suppliers(self, active_only: bool = True) -> List[Dict[str, Any]]:
        """Get all suppliers."""
        if not self.client:
            raise ValueError("Supabase client not initialized")
            
        query = self.client.table("suppliers").select("*")
        
        if active_only:
            query = query.eq("status", "Active")
            
        response = query.execute()
        
        return response.data or []
    
    def create_supplier(self, supplier_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new supplier."""
        if not self.client:
            raise ValueError("Supabase client not initialized")
            
        response = self.client.table("suppliers").insert(supplier_data).execute()
        
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
        if self.use_mock:
            # Return mock data
            return self._get_mock_roi_metrics()
        
        try:
            # Build the query
            query = self.client.table("leads").select("leadcost, revenue, leadsource, supplierid, leadstatus")
            
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
        if self.use_mock:
            # Return mock data
            return self._get_mock_supplier_performance()
        
        try:
            # Build the query
            query = self.client.table("leads").select("leadcost, revenue, supplierid, leadstatus")
            
            if start_date:
                query = query.gte("createdat", start_date)
            
            if end_date:
                query = query.lte("createdat", end_date)
            
            # Execute the query
            response = query.execute()
            leads = response.data or []
            
            # Get supplier details
            suppliers_response = self.client.table("suppliers").select("id, name").execute()
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
        if self.use_mock:
            # Return mock data
            return {**user_data, "id": 1}
        
        try:
            response = self.client.table("users").insert(user_data).execute()
            
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
        if self.use_mock:
            # Return mock data
            return self._get_mock_users(role)
        
        try:
            query = self.client.table("users").select("*")
            
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
        
        Args:
            api_key_data: API key data
            
        Returns:
            Created API key
        """
        if self.use_mock:
            # Return mock data
            return {**api_key_data, "id": 1}
        
        try:
            response = self.client.table("api_keys").insert(api_key_data).execute()
            
            if not response.data:
                raise ValueError("Failed to create API key")
            
            return response.data[0]
        except Exception as e:
            logger.error(f"Error creating API key: {str(e)}")
            raise
    
    def get_api_keys(self, active_only: bool = True) -> List[Dict[str, Any]]:
        """
        Get all API keys.
        
        Args:
            active_only: Only return active API keys
            
        Returns:
            List of API keys
        """
        if self.use_mock:
            # Return mock data
            return self._get_mock_api_keys(active_only)
        
        try:
            query = self.client.table("api_keys").select("*")
            
            if active_only:
                query = query.eq("isactive", True)
            
            response = query.execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error getting API keys: {str(e)}")
            return []
    
    def log_activity(self, activity_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Log user activity.
        
        Args:
            activity_data: Activity data
            
        Returns:
            Created activity log
        """
        if self.use_mock:
            # Return mock data
            return {**activity_data, "id": 1}
        
        try:
            response = self.client.table("activity_logs").insert(activity_data).execute()
            
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
        if self.use_mock:
            # Return mock data
            return self._get_mock_activity_logs(user_id, limit)
        
        try:
            query = self.client.table("activity_logs").select("*").order("createdat", desc=True).limit(limit)
            
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
        if self.use_mock:
            # Return mock data
            return b"Mock file data"
        
        try:
            # Extract bucket and path from file_path
            parts = file_path.split('/', 1)
            bucket = parts[0]
            path = parts[1] if len(parts) > 1 else file_path
            
            response = self.client.storage.from_(bucket).download(path)
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
        if self.use_mock:
            # Return mock data
            return f"https://mock-storage.com/{bucket}/{path}"
        
        try:
            response = self.client.storage.from_(bucket).upload(path, file_data)
            
            # Get the public URL
            public_url = self.client.storage.from_(bucket).get_public_url(path)
            
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
        if not self.client:
            return []
        
        try:
            response = self.client.table("leads").select(field).in_(field, values).execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error checking duplicates for field {field}: {str(e)}")
            return []

    def insert_leads_batch(self, leads: List[Dict[str, Any]]) -> int:
        """Insert a batch of leads into the database."""
        if not self.client:
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
            
            response = self.client.table("leads").insert(processed_leads).execute()
            return len(response.data) if response.data else 0
        except Exception as e:
            logger.error(f"Error inserting leads batch: {str(e)}")
            raise

    def create_upload_batch(self, batch_data: Dict[str, Any]) -> int:
        """Create an upload batch record."""
        if not self.client:
            logger.warning("No Supabase client available. Returning mock batch ID.")
            return 1
        
        try:
            response = self.client.table("upload_batches").insert(batch_data).execute()
            return response.data[0]["id"] if response.data else 1
        except Exception as e:
            logger.error(f"Error creating upload batch: {str(e)}")
            return 1

    def get_dashboard_stats(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """Get dashboard statistics from the database."""
        if not self.client:
            logger.warning("No Supabase client available. Returning mock stats.")
            return self._get_mock_dashboard_stats()
        
        try:
            # Get total leads count
            leads_query = self.client.table("leads").select("*", count="exact", head=True)
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
        if not self.client:
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
        if not self.client:
            return self._get_mock_status_distribution()
        
        try:
            response = self.client.table("leads").select("leadstatus").execute()
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
        if not self.client:
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
        if not self.client:
            return self._get_mock_recent_uploads(limit)
        
        try:
            response = self.client.table("upload_batches").select("*").order("createdat", desc=True).limit(limit).execute()
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
