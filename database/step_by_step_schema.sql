-- STEP 1: Create sequence first
CREATE SEQUENCE IF NOT EXISTS public.clients_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- STEP 2: Create clients_history table
CREATE TABLE IF NOT EXISTS public.clients_history (
  id integer NOT NULL DEFAULT nextval('clients_history_id_seq'::regclass),
  client_id integer NOT NULL,
  distribution_id integer NOT NULL,
  
  -- Lead Information (from leads table)
  lead_id integer NOT NULL,
  firstname text,
  lastname text,
  email text,
  phone text,
  companyname text,
  taxid text,
  address text,
  city text,
  state text,
  zipcode text,
  country text,
  
  -- Distribution Information
  selling_cost numeric NOT NULL,
  source_batch_id integer,
  source_supplier_id integer,
  source_name text,
  
  -- Tracking Information
  distributed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- STEP 3: Add primary key (only if table was just created)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'clients_history' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE public.clients_history ADD CONSTRAINT clients_history_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- STEP 4: Add foreign key constraints (only if they don't exist)
DO $$
BEGIN
    -- Client foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'clients_history' 
        AND constraint_name = 'clients_history_client_fkey'
    ) THEN
        ALTER TABLE public.clients_history 
        ADD CONSTRAINT clients_history_client_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id);
    END IF;
    
    -- Lead foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'clients_history' 
        AND constraint_name = 'clients_history_lead_fkey'
    ) THEN
        ALTER TABLE public.clients_history 
        ADD CONSTRAINT clients_history_lead_fkey 
        FOREIGN KEY (lead_id) REFERENCES public.leads(id);
    END IF;
    
    -- Batch foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'clients_history' 
        AND constraint_name = 'clients_history_batch_fkey'
    ) THEN
        ALTER TABLE public.clients_history 
        ADD CONSTRAINT clients_history_batch_fkey 
        FOREIGN KEY (source_batch_id) REFERENCES public.upload_batches(id);
    END IF;
    
    -- Supplier foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'clients_history' 
        AND constraint_name = 'clients_history_supplier_fkey'
    ) THEN
        ALTER TABLE public.clients_history 
        ADD CONSTRAINT clients_history_supplier_fkey 
        FOREIGN KEY (source_supplier_id) REFERENCES public.suppliers(id);
    END IF;
END $$;

-- STEP 5: Link sequence to table
ALTER SEQUENCE public.clients_history_id_seq OWNED BY public.clients_history.id;

-- STEP 6: Add new columns to existing lead_distributions table
ALTER TABLE public.lead_distributions ADD COLUMN IF NOT EXISTS distribution_name text;
ALTER TABLE public.lead_distributions ADD COLUMN IF NOT EXISTS selling_price_per_sheet numeric;
ALTER TABLE public.lead_distributions ADD COLUMN IF NOT EXISTS selling_price_per_lead numeric;
ALTER TABLE public.lead_distributions ADD COLUMN IF NOT EXISTS blend_enabled boolean DEFAULT false;
ALTER TABLE public.lead_distributions ADD COLUMN IF NOT EXISTS batch_percentages jsonb;
ALTER TABLE public.lead_distributions ADD COLUMN IF NOT EXISTS exported_filename text;
ALTER TABLE public.lead_distributions ADD COLUMN IF NOT EXISTS exported_at timestamp with time zone;

-- STEP 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_history_client_id ON public.clients_history(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_history_lead_id ON public.clients_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_clients_history_email ON public.clients_history(email);
CREATE INDEX IF NOT EXISTS idx_clients_history_phone ON public.clients_history(phone);
CREATE INDEX IF NOT EXISTS idx_clients_history_distributed_at ON public.clients_history(distributed_at);

-- STEP 8: Add comments for documentation
COMMENT ON TABLE public.clients_history IS 'Tracks all leads distributed to clients with complete history';
COMMENT ON COLUMN public.clients_history.selling_cost IS 'Price per lead charged to client';
COMMENT ON COLUMN public.clients_history.source_batch_id IS 'Original upload batch where lead came from';
COMMENT ON COLUMN public.clients_history.distribution_id IS 'Links to lead_distributions table';

-- STEP 9: Verify the setup
SELECT 
    'clients_history table created' as status,
    COUNT(*) as row_count 
FROM public.clients_history;

SELECT 
    'lead_distributions enhanced' as status,
    COUNT(*) as existing_distributions 
FROM public.lead_distributions;
