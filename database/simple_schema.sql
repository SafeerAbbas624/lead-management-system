-- Run these commands ONE BY ONE in Supabase SQL Editor

-- 1. Create the sequence first
CREATE SEQUENCE IF NOT EXISTS public.clients_history_id_seq;

-- 2. Create the clients_history table
CREATE TABLE IF NOT EXISTS public.clients_history (
  id integer NOT NULL DEFAULT nextval('clients_history_id_seq'::regclass),
  client_id integer NOT NULL,
  distribution_id integer NOT NULL,
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
  selling_cost numeric NOT NULL,
  source_batch_id integer,
  source_supplier_id integer,
  source_name text,
  distributed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- 3. Add foreign key constraints (run each separately if needed)
ALTER TABLE public.clients_history 
ADD CONSTRAINT clients_history_client_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(id);

ALTER TABLE public.clients_history 
ADD CONSTRAINT clients_history_lead_fkey 
FOREIGN KEY (lead_id) REFERENCES public.leads(id);

ALTER TABLE public.clients_history 
ADD CONSTRAINT clients_history_batch_fkey 
FOREIGN KEY (source_batch_id) REFERENCES public.upload_batches(id);

ALTER TABLE public.clients_history 
ADD CONSTRAINT clients_history_supplier_fkey 
FOREIGN KEY (source_supplier_id) REFERENCES public.suppliers(id);

-- 4. Link sequence to table
ALTER SEQUENCE public.clients_history_id_seq OWNED BY public.clients_history.id;

-- 5. Enhance lead_distributions table (run each separately)
ALTER TABLE public.lead_distributions ADD COLUMN IF NOT EXISTS distribution_name text;
ALTER TABLE public.lead_distributions ADD COLUMN IF NOT EXISTS selling_price_per_sheet numeric;
ALTER TABLE public.lead_distributions ADD COLUMN IF NOT EXISTS selling_price_per_lead numeric;
ALTER TABLE public.lead_distributions ADD COLUMN IF NOT EXISTS blend_enabled boolean DEFAULT false;
ALTER TABLE public.lead_distributions ADD COLUMN IF NOT EXISTS batch_percentages jsonb;
ALTER TABLE public.lead_distributions ADD COLUMN IF NOT EXISTS exported_filename text;
ALTER TABLE public.lead_distributions ADD COLUMN IF NOT EXISTS exported_at timestamp with time zone;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_history_client_id ON public.clients_history(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_history_lead_id ON public.clients_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_clients_history_email ON public.clients_history(email);
CREATE INDEX IF NOT EXISTS idx_clients_history_phone ON public.clients_history(phone);
CREATE INDEX IF NOT EXISTS idx_clients_history_distributed_at ON public.clients_history(distributed_at);

-- 7. Verify everything worked
SELECT 'Setup complete!' as message;
SELECT table_name FROM information_schema.tables WHERE table_name = 'clients_history';
SELECT column_name FROM information_schema.columns WHERE table_name = 'lead_distributions' AND column_name LIKE '%distribution%';
