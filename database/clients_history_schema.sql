-- Create sequence for clients_history FIRST
CREATE SEQUENCE IF NOT EXISTS public.clients_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Clients History Table for Lead Distribution Tracking
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
  created_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT clients_history_pkey PRIMARY KEY (id),
  CONSTRAINT clients_history_client_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT clients_history_lead_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT clients_history_batch_fkey FOREIGN KEY (source_batch_id) REFERENCES public.upload_batches(id),
  CONSTRAINT clients_history_supplier_fkey FOREIGN KEY (source_supplier_id) REFERENCES public.suppliers(id)
);

-- Link sequence to table
ALTER SEQUENCE public.clients_history_id_seq OWNED BY public.clients_history.id;

-- Lead Distributions Enhanced Table (update existing)
-- Add more tracking fields to existing lead_distributions table
ALTER TABLE public.lead_distributions ADD COLUMN IF NOT EXISTS distribution_name text;
ALTER TABLE public.lead_distributions ADD COLUMN IF NOT EXISTS selling_price_per_sheet numeric;
ALTER TABLE public.lead_distributions ADD COLUMN IF NOT EXISTS selling_price_per_lead numeric;
ALTER TABLE public.lead_distributions ADD COLUMN IF NOT EXISTS blend_enabled boolean DEFAULT false;
ALTER TABLE public.lead_distributions ADD COLUMN IF NOT EXISTS batch_percentages jsonb;
ALTER TABLE public.lead_distributions ADD COLUMN IF NOT EXISTS exported_filename text;
ALTER TABLE public.lead_distributions ADD COLUMN IF NOT EXISTS exported_at timestamp with time zone;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_history_client_id ON public.clients_history(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_history_lead_id ON public.clients_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_clients_history_email ON public.clients_history(email);
CREATE INDEX IF NOT EXISTS idx_clients_history_phone ON public.clients_history(phone);
CREATE INDEX IF NOT EXISTS idx_clients_history_distributed_at ON public.clients_history(distributed_at);

-- Comments for documentation
COMMENT ON TABLE public.clients_history IS 'Tracks all leads distributed to clients with complete history';
COMMENT ON COLUMN public.clients_history.selling_cost IS 'Price per lead charged to client';
COMMENT ON COLUMN public.clients_history.source_batch_id IS 'Original upload batch where lead came from';
COMMENT ON COLUMN public.clients_history.distribution_id IS 'Links to lead_distributions table';
