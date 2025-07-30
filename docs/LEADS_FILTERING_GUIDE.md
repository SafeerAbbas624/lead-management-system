# Leads Page - Advanced Filtering & Reporting Guide

## Overview
The Leads page now provides comprehensive filtering and reporting capabilities based on your database schema. Users can filter leads by multiple criteria and view detailed statistics.

## Statistics Cards

### Main Statistics
1. **Total Leads** - Total number of leads with month-over-month growth
2. **Leads by Supplier** - Top performing lead supplier with percentage
3. **Duplicates by Supplier** - Total duplicates with supplier breakdown
4. **Total Batches** - Batch statistics (processing, completed, failed)
5. **DNC Matches** - Do Not Contact matches
6. **Average Cost** - Average lead cost with total cost

### Detailed Breakdowns
- **Top Lead Suppliers** - Shows top 4 suppliers with counts and percentages
- **Lead Status Breakdown** - Shows top 4 statuses with counts and percentages

## Advanced Filtering Options

### Time-Based Filters
- **Last 1 Month** - Leads from the past 30 days
- **Last 3 Months** - Leads from the past 90 days
- **Last 6 Months** - Leads from the past 180 days
- **Last 1 Year** - Leads from the past 365 days
- **Custom Range** - User-defined date range with calendar picker

### Search & Text Filters
- **Global Search** - Search across firstname, lastname, email, and companyname
- **Case-insensitive** - Searches are not case-sensitive

### Supplier Filters
Available lead suppliers (dynamically loaded from database):
- Fetched from the `suppliers` table
- Only shows active suppliers
- Suppliers are the actual source/provider of leads
- Based on `leads.leadsource` and `leads.supplierid` fields

### Status Filters
Available lead statuses (checkboxes):
- New
- Contacted
- Qualified
- Converted
- DNC (Do Not Contact)
- Closed Lost

### Cost Filters
- **Minimum Cost** - Filter leads with cost >= specified amount
- **Maximum Cost** - Filter leads with cost <= specified amount
- **Range Support** - Can set both min and max for range filtering

### Batch Filters
- **Batch IDs** - Filter by specific upload batch IDs
- **Multiple Selection** - Can select multiple batches

### Advanced Database Filters
- **Supplier IDs** - Filter by specific supplier IDs
- **Client IDs** - Filter by specific client IDs
- **Tags** - Filter by lead tags (array field)
- **Exclusivity** - Filter by exclusivity status (boolean)
- **Lead Score Range** - Filter by minimum and maximum lead scores

## Database Schema Integration

### Tables Used
- **leads** - Main leads table with all lead information
- **upload_batches** - Batch processing information
- **suppliers** - Supplier information for lead sourcing
- **clients** - Client information for lead distribution

### Key Fields
- `createdat` - For time-based filtering
- `leadsource` - For source filtering and statistics
- `leadstatus` - For status filtering and statistics
- `leadcost` - For cost filtering and statistics
- `uploadbatchid` - For batch filtering
- `supplierid` - For supplier filtering
- `clientid` - For client filtering
- `tags` - For tag-based filtering
- `exclusivity` - For exclusivity filtering
- `leadscore` - For lead score filtering

## API Endpoints

### GET /api/leads/stats
Returns comprehensive statistics based on applied filters.

**Query Parameters:**
- `time_frame` - Predefined time frame (1month, 3months, 6months, 1year)
- `date_from` - Custom start date (YYYY-MM-DD)
- `date_to` - Custom end date (YYYY-MM-DD)
- `sources` - Comma-separated list of sources
- `statuses` - Comma-separated list of statuses
- `batch_ids` - Comma-separated list of batch IDs
- `supplier_ids` - Comma-separated list of supplier IDs
- `client_ids` - Comma-separated list of client IDs
- `cost_min` - Minimum cost filter
- `cost_max` - Maximum cost filter
- `lead_score_min` - Minimum lead score
- `lead_score_max` - Maximum lead score
- `tags` - Comma-separated list of tags
- `exclusivity` - Boolean exclusivity filter
- `search` - Global search term

**Response Format:**
```json
{
  "totalLeads": 1250,
  "leadsBySource": [
    {
      "source": "Website",
      "count": 450,
      "percentage": 36.0
    }
  ],
  "duplicatesBySource": [
    {
      "source": "Website",
      "duplicates": 45,
      "percentage": 10.0
    }
  ],
  "totalBatches": 25,
  "processingBatches": 2,
  "completedBatches": 22,
  "failedBatches": 1,
  "totalDuplicates": 125,
  "dncMatches": 89,
  "leadsByStatus": [
    {
      "status": "New",
      "count": 350,
      "percentage": 28.0
    }
  ],
  "leadsByCost": {
    "totalCost": 12500.00,
    "averageCost": 10.00,
    "minCost": 5.00,
    "maxCost": 25.00
  },
  "monthOverMonthGrowth": 15.5,
  "recentActivity": [
    {
      "id": "1",
      "type": "batch_completed",
      "description": "Batch completed with 450 leads",
      "timestamp": "2023-06-15T10:30:00Z"
    }
  ]
}
```

## Usage Examples

### Filter leads from last 6 months with specific sources
1. Select "Last 6 Months" from time frame dropdown
2. Check "Website" and "Social Media" in sources
3. Click "Apply Filters"

### Find high-value leads
1. Set minimum cost to $50
2. Select "Qualified" and "Converted" statuses
3. Apply filters

### Search for specific company leads
1. Enter company name in search box
2. Optionally add date range
3. Apply filters

### View batch-specific performance
1. Enter specific batch IDs
2. View statistics for those batches only
3. Compare performance across batches

## Performance Considerations
- Filters are applied at the database level for optimal performance
- Large date ranges may take longer to process
- Consider using pagination for large result sets
- Statistics are calculated in real-time based on current filters
