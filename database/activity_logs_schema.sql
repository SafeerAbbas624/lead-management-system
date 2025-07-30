-- Activity Logs Table for Audit Trail
-- This table stores all user activities and system events for auditing purposes

-- Create sequence for activity_logs table
CREATE SEQUENCE IF NOT EXISTS public.activity_logs_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id integer NOT NULL DEFAULT nextval('activity_logs_id_seq'::regclass),
  
  -- Activity Information
  activitytype text NOT NULL, -- 'login', 'logout', 'create', 'update', 'delete', 'upload', 'download', 'distribute_leads', etc.
  userid integer, -- References users table
  
  -- Resource Information
  resourcetype text, -- 'lead', 'user', 'supplier', 'client', 'batch', 'dnc_entry', 'auth', etc.
  resourceid text, -- ID of the resource being acted upon
  
  -- Activity Details
  details jsonb, -- Additional details about the activity (flexible JSON structure)
  
  -- Request Information
  ipaddress inet, -- IP address of the user
  useragent text, -- User agent string from the browser
  
  -- Timestamps
  createdat timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Primary Key
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id)
);

-- Foreign Key Constraints
ALTER TABLE public.activity_logs 
ADD CONSTRAINT fk_activity_logs_userid 
FOREIGN KEY (userid) REFERENCES public.users(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_userid ON public.activity_logs(userid);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activitytype ON public.activity_logs(activitytype);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resourcetype ON public.activity_logs(resourcetype);
CREATE INDEX IF NOT EXISTS idx_activity_logs_createdat ON public.activity_logs(createdat);
CREATE INDEX IF NOT EXISTS idx_activity_logs_ipaddress ON public.activity_logs(ipaddress);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_activity ON public.activity_logs(userid, activitytype);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON public.activity_logs(resourcetype, resourceid);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date_activity ON public.activity_logs(createdat, activitytype);

-- Comments for documentation
COMMENT ON TABLE public.activity_logs IS 'Stores all user activities and system events for auditing purposes';
COMMENT ON COLUMN public.activity_logs.activitytype IS 'Type of activity performed (login, create, update, delete, etc.)';
COMMENT ON COLUMN public.activity_logs.userid IS 'ID of the user who performed the activity';
COMMENT ON COLUMN public.activity_logs.resourcetype IS 'Type of resource being acted upon (lead, user, supplier, etc.)';
COMMENT ON COLUMN public.activity_logs.resourceid IS 'ID of the specific resource being acted upon';
COMMENT ON COLUMN public.activity_logs.details IS 'Additional details about the activity in JSON format';
COMMENT ON COLUMN public.activity_logs.ipaddress IS 'IP address from which the activity was performed';
COMMENT ON COLUMN public.activity_logs.useragent IS 'Browser user agent string';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT ON public.activity_logs TO your_app_user;
-- GRANT USAGE ON public.activity_logs_id_seq TO your_app_user;

-- Example activity log entries for reference:
/*
INSERT INTO public.activity_logs (activitytype, userid, resourcetype, resourceid, details, ipaddress, useragent) VALUES
('login', 1, 'auth', 'session_123', '{"method": "password", "success": true}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
('upload', 1, 'batch', '456', '{"filename": "leads_batch_1.csv", "total_leads": 1000, "clean_leads": 950}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
('create', 2, 'user', '789', '{"username": "newuser", "role": "viewer"}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'),
('update', 1, 'lead', '123', '{"field": "status", "old_value": "New", "new_value": "Contacted"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
('distribute_leads', 2, 'batch', '456', '{"client_ids": [1, 2, 3], "total_leads": 150, "distribution_method": "percentage"}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
*/
