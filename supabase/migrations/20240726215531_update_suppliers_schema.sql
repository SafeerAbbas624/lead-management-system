-- Update suppliers table schema to match application conventions

-- First, update the data types and values before renaming columns
UPDATE public.suppliers 
SET 
    status = CASE 
        WHEN status IS NULL OR status = '' THEN 'Active' 
        ELSE status 
    END
WHERE 
    status IS NULL OR status = '';

-- Then rename the columns
ALTER TABLE IF EXISTS public.suppliers 
    RENAME COLUMN contactperson TO contact_person;

ALTER TABLE IF EXISTS public.suppliers 
    RENAME COLUMN leadcost TO lead_cost;

ALTER TABLE IF EXISTS public.suppliers 
    RENAME COLUMN createdat TO created_at;

-- Change lead_cost data type from text to numeric
ALTER TABLE IF EXISTS public.suppliers
    ALTER COLUMN lead_cost TYPE numeric(10,2) 
    USING NULLIF(lead_cost, '')::numeric(10,2);

-- Add check constraint for status field
ALTER TABLE IF EXISTS public.suppliers
    ADD CONSTRAINT status_check 
    CHECK (status IN ('Active', 'Inactive'));

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON public.suppliers(email);

-- Add comments for better documentation
COMMENT ON TABLE public.suppliers IS 'Stores information about suppliers in the system';
COMMENT ON COLUMN public.suppliers.contact_person IS 'Name of the primary contact person for the supplier';
COMMENT ON COLUMN public.suppliers.lead_cost IS 'Cost per lead in numeric format';
COMMENT ON COLUMN public.suppliers.status IS 'Current status of the supplier, either Active or Inactive';
COMMENT ON COLUMN public.suppliers.created_at IS 'Timestamp when the supplier record was created';
