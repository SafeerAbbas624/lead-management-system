# Column Rename Summary: total_cost → selling_price_per_sheet

## Overview
Changed the `total_cost` column in the `lead_distributions` table to `selling_price_per_sheet` to better reflect its purpose. The sum of all `selling_price_per_sheet` values gives the total selling price.

## Database Migration
**File**: `migrations/rename_total_cost_to_selling_price_per_sheet.sql`
- Renames the column from `total_cost` to `selling_price_per_sheet`
- Adds documentation comment explaining the purpose

## Files Updated

### Backend Files
1. **backend/app.py**
   - Line 238-239: Updated query to select `selling_price_per_sheet`
   - Line 264: Updated calculation to use `selling_price_per_sheet`

2. **backend/lead_distribution_api.py**
   - Line 249: Changed `'total_cost'` to `'selling_price_per_sheet'` in distribution_data
   - Line 398: Updated SELECT query to include `selling_price_per_sheet`
   - Line 435: Added both `total_cost` (for backward compatibility) and `selling_price_per_sheet`

### Frontend API Files
3. **app/api/analytics/client-distribution/route.ts**
   - Line 23: Updated SELECT query to use `selling_price_per_sheet`
   - Line 43: Updated revenue calculation to use `selling_price_per_sheet`

4. **app/api/analytics/trend-analysis/route.ts**
   - Line 30: Updated SELECT query to use `selling_price_per_sheet`
   - Line 86: Updated revenue calculation to use `selling_price_per_sheet`

### Frontend Components
5. **app/distribution/page.tsx**
   - Line 52: Added `selling_price_per_sheet` to interface (kept `total_cost` for compatibility)
   - Line 596: Updated display to show "Sheet Price" and use `selling_price_per_sheet`

### Database Schema Files
6. **database/clients_history_schema.sql**
   - Line 53: Changed `total_cost` to `selling_price_per_sheet`

7. **database/simple_schema.sql**
   - Line 54: Changed `total_cost` to `selling_price_per_sheet`

8. **database/step_by_step_schema.sql**
   - Line 106: Changed `total_cost` to `selling_price_per_sheet`

## Backward Compatibility
- The backend API still returns `total_cost` field for backward compatibility
- Frontend interfaces include both fields during transition period
- All calculations now use the new `selling_price_per_sheet` column

## Next Steps
1. Run the migration SQL script on your database
2. Test all affected endpoints and components
3. After confirming everything works, you can remove the backward compatibility fields

## Total Revenue Calculation
With this change, the total selling price is calculated as:
```sql
SELECT SUM(selling_price_per_sheet) as total_selling_price 
FROM lead_distributions;
```

This better reflects that each row represents a sheet/distribution with its own selling price.
