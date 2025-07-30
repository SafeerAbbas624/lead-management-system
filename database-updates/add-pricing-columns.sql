-- Add pricing columns to upload_batches table
-- Run this in your Supabase SQL editor

-- Add the missing pricing columns to upload_batches table
ALTER TABLE public.upload_batches 
ADD COLUMN total_buying_price numeric DEFAULT 0,
ADD COLUMN buying_price_per_lead numeric DEFAULT 0;

-- Add comments to document the columns
COMMENT ON COLUMN public.upload_batches.total_buying_price IS 'Total amount paid for the entire batch/sheet';
COMMENT ON COLUMN public.upload_batches.buying_price_per_lead IS 'Calculated price per lead (total_buying_price / totalleads)';

-- Update existing records to set default values
UPDATE public.upload_batches 
SET 
  total_buying_price = 0,
  buying_price_per_lead = 0
WHERE total_buying_price IS NULL OR buying_price_per_lead IS NULL;

-- Verify the changes
SELECT 
  id,
  filename,
  totalleads,
  total_buying_price,
  buying_price_per_lead,
  createdat
FROM public.upload_batches 
ORDER BY createdat DESC 
LIMIT 5;
