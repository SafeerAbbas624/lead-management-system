-- Create Activity Logs Table
-- Run this script in the Supabase SQL Editor to create the activity_logs table

-- Create the activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id SERIAL PRIMARY KEY,
  activitytype text NOT NULL,
  userid integer,
  resourcetype text,
  resourceid text,
  details jsonb,
  ipaddress text,
  useragent text,
  createdat timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_userid ON public.activity_logs(userid);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activitytype ON public.activity_logs(activitytype);
CREATE INDEX IF NOT EXISTS idx_activity_logs_createdat ON public.activity_logs(createdat);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resourcetype ON public.activity_logs(resourcetype);

-- Insert sample data
INSERT INTO public.activity_logs (activitytype, userid, resourcetype, resourceid, details, ipaddress, useragent, createdat) VALUES
('login', 1, 'auth', 'session_001', '{"method": "password", "success": true, "browser": "Chrome"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '1 hour'),
('upload', 1, 'batch', '13', '{"filename": "leads_batch_december.csv", "total_leads": 500, "clean_leads": 485, "duplicates": 15}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '3 hours'),
('distribute_leads', 1, 'batch', '13', '{"client_ids": [1, 2], "total_leads": 485, "distribution_method": "percentage"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '2 hours'),
('create', 1, 'user', '3', '{"username": "newuser", "role": "viewer", "fullname": "New User"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '2 days'),
('update', 1, 'lead', '1001', '{"field": "status", "old_value": "New", "new_value": "Contacted", "notes": "Initial contact made"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '4 hours'),
('export', 1, 'lead', 'export_001', '{"format": "CSV", "total_records": 150, "client_id": 1, "date_range": "last_30_days"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '8 hours'),
('delete', 1, 'dnc_entry', 'phone_001', '{"type": "phone", "value": "+1234567890", "reason": "Expired request"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '1 day'),
('login', 2, 'auth', 'session_002', '{"method": "password", "success": true, "browser": "Firefox"}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0', NOW() - INTERVAL '2 hours'),
('logout', 1, 'auth', 'session_001', '{"session_duration": "2h 15m", "reason": "user_initiated"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '30 minutes'),
('system_config', 1, 'system', 'settings_001', '{"setting": "max_upload_size", "old_value": "10MB", "new_value": "25MB"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '3 days'),
('create', 1, 'supplier', '6', '{"name": "New Lead Source Inc", "email": "contact@newleadsource.com", "lead_cost": 2.50}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '4 days'),
('update', 1, 'supplier', '5', '{"field": "lead_cost", "old_value": 2.00, "new_value": 2.25, "reason": "Price adjustment"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '5 days'),
('create', 1, 'client', '4', '{"name": "New Client Corp", "email": "admin@newclient.com", "allocation_type": "percentage"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '6 days'),
('upload', 2, 'batch', '12', '{"filename": "supplier_leads_nov.csv", "total_leads": 750, "clean_leads": 720, "duplicates": 30}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0', NOW() - INTERVAL '1 week'),
('distribute_leads', 2, 'batch', '12', '{"client_ids": [1, 3], "total_leads": 720, "distribution_method": "fixed"}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0', NOW() - INTERVAL '1 week' + INTERVAL '1 hour');

-- Verify the table was created and data was inserted
SELECT 
  COUNT(*) as total_logs,
  COUNT(DISTINCT activitytype) as unique_activity_types,
  COUNT(DISTINCT userid) as unique_users,
  MIN(createdat) as earliest_log,
  MAX(createdat) as latest_log
FROM public.activity_logs;

-- Show sample of the data
SELECT 
  id,
  activitytype,
  userid,
  resourcetype,
  resourceid,
  createdat
FROM public.activity_logs 
ORDER BY createdat DESC 
LIMIT 10;
