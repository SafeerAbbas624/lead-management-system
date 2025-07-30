-- Create sequence BEFORE the table
CREATE SEQUENCE IF NOT EXISTS duplicate_leads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Duplicate Leads Table
CREATE TABLE public.duplicate_leads (
  id integer NOT NULL DEFAULT nextval('duplicate_leads_id_seq'::regclass),
  
  -- Original lead data (same structure as leads table)
  email text,
  firstname text,
  lastname text,
  phone text,
  companyname text,
  taxid text,
  address text,
  city text,
  state text,
  zipcode text,
  country text,
  leadsource text,
  leadstatus text,
  leadscore integer,
  leadcost numeric,
  exclusivity boolean,
  exclusivitynotes text,
  metadata jsonb,
  tags text[],
  
  -- Duplicate tracking information
  original_lead_id integer, -- Reference to the original lead in leads table
  upload_batch_id integer, -- Which batch this duplicate was found in
  supplier_id integer, -- Which supplier sent this duplicate
  supplier_name text, -- Supplier name for easy tracking
  duplicate_type text NOT NULL, -- 'file_internal', 'database_existing', 'cross_batch'
  duplicate_reason text, -- Why it was marked as duplicate (email, phone, etc.)
  duplicate_fields jsonb, -- Which fields matched (for detailed analysis)
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  detected_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT duplicate_leads_pkey PRIMARY KEY (id),
  CONSTRAINT duplicate_leads_original_lead_fkey FOREIGN KEY (original_lead_id) REFERENCES public.leads(id),
  CONSTRAINT duplicate_leads_upload_batch_fkey FOREIGN KEY (upload_batch_id) REFERENCES public.upload_batches(id),
  CONSTRAINT duplicate_leads_supplier_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id)
);

-- Set sequence ownership AFTER table creation
ALTER SEQUENCE duplicate_leads_id_seq OWNED BY public.duplicate_leads.id;

-- Create indexes for better performance
CREATE INDEX idx_duplicate_leads_original_lead_id ON public.duplicate_leads(original_lead_id);
CREATE INDEX idx_duplicate_leads_upload_batch_id ON public.duplicate_leads(upload_batch_id);
CREATE INDEX idx_duplicate_leads_supplier_id ON public.duplicate_leads(supplier_id);
CREATE INDEX idx_duplicate_leads_email ON public.duplicate_leads(email);
CREATE INDEX idx_duplicate_leads_phone ON public.duplicate_leads(phone);
CREATE INDEX idx_duplicate_leads_duplicate_type ON public.duplicate_leads(duplicate_type);
CREATE INDEX idx_duplicate_leads_created_at ON public.duplicate_leads(created_at);