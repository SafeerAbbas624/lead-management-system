-- Migration: Rename total_cost to selling_price_per_sheet in lead_distributions table
-- This changes the column name to better reflect that it represents selling price per sheet
-- and the total selling price is calculated by summing all selling_price_per_sheet values

BEGIN;

-- Rename the column from total_cost to selling_price_per_sheet
ALTER TABLE public.lead_distributions 
RENAME COLUMN total_cost TO selling_price_per_sheet;

-- Add a comment to clarify the purpose of this column
COMMENT ON COLUMN public.lead_distributions.selling_price_per_sheet IS 
'The selling price per sheet/distribution. Sum of all selling_price_per_sheet values gives total selling price.';

-- Verify the change
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'lead_distributions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

COMMIT;
