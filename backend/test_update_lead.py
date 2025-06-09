import os
import sys
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Import the database and models after setting up logging
from database import SupabaseClient

# Initialize the database client
db = SupabaseClient()

def test_update_lead(lead_id: int, update_data: Dict[str, Any]):
    """Test updating a lead with the given ID and update data."""
    try:
        logger.info(f"\n{'='*80}")
        logger.info(f"TESTING UPDATE FOR LEAD {lead_id}")
        logger.info(f"Update data: {json.dumps(update_data, indent=2, default=str)}")
        
        # 1. First get the current lead data
        logger.info("\n1. Fetching current lead data...")
        current_lead = db.supabase.table('leads').select('*').eq('id', lead_id).execute()
        
        if not current_lead.data:
            logger.error(f"Lead with ID {lead_id} not found")
            return False
            
        logger.info(f"Current lead data: {json.dumps(current_lead.data[0], indent=2, default=str)}")
        
        # 2. Update the lead
        logger.info("\n2. Updating lead...")
        updated_data = {
            **update_data,
            'updatedat': datetime.now(timezone.utc).isoformat()
        }
        
        # Remove any None values
        updated_data = {k: v for k, v in updated_data.items() if v is not None}
        
        logger.info(f"Sending update: {json.dumps(updated_data, indent=2, default=str)}")
        
        # 3. Execute the update
        result = db.supabase.table('leads').update(updated_data).eq('id', lead_id).execute()
        logger.info(f"Update result: {result}")
        
        # 4. Verify the update
        logger.info("\n3. Verifying update...")
        updated_lead = db.supabase.table('leads').select('*').eq('id', lead_id).execute()
        
        if not updated_lead.data:
            logger.error("Failed to fetch updated lead")
            return False
            
        logger.info(f"Updated lead data: {json.dumps(updated_lead.data[0], indent=2, default=str)}")
        
        # 5. Check if the fields were updated correctly
        all_updated = True
        for field, new_value in update_data.items():
            if field in updated_lead.data[0] and updated_lead.data[0][field] != new_value:
                logger.warning(f"Field {field} was not updated correctly. "
                             f"Expected: {new_value}, Got: {updated_lead.data[0].get(field)}")
                all_updated = False
        
        if all_updated:
            logger.info("✅ All fields updated successfully")
        else:
            logger.warning("⚠️ Some fields were not updated as expected")
        
        return all_updated
        
    except Exception as e:
        logger.error(f"Error in test_update_lead: {str(e)}", exc_info=True)
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Test lead update functionality')
    parser.add_argument('lead_id', type=int, help='ID of the lead to update')
    parser.add_argument('--firstname', type=str, help='New first name')
    parser.add_argument('--lastname', type=str, help='New last name')
    parser.add_argument('--email', type=str, help='New email')
    parser.add_argument('--company', type=str, help='New company name')
    parser.add_argument('--phone', type=str, help='New phone number')
    
    args = parser.parse_args()
    
    # Prepare update data from command line arguments
    update_data = {}
    if args.firstname:
        update_data['firstname'] = args.firstname
    if args.lastname:
        update_data['lastname'] = args.lastname
    if args.email:
        update_data['email'] = args.email
    if args.company:
        update_data['companyname'] = args.company
    if args.phone:
        update_data['phonenumber'] = args.phone
    
    if not update_data:
        print("No fields to update. Please provide at least one field to update.")
        print("Example: python test_update_lead.py 123 --firstname John --lastname Doe")
        sys.exit(1)
    
    # Run the test
    success = test_update_lead(args.lead_id, update_data)
    
    if success:
        print("\n✅ Test completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Test failed!")
        sys.exit(1)
