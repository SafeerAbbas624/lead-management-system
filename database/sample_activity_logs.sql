-- Sample Activity Logs Data
-- This script inserts sample activity log entries for testing and demonstration

-- First, ensure the activity_logs table exists
-- (Run activity_logs_schema.sql first if needed)

-- Insert sample activity logs
INSERT INTO public.activity_logs (activitytype, userid, resourcetype, resourceid, details, ipaddress, useragent, createdat) VALUES

-- Recent login activities
('login', 1, 'auth', 'session_001', '{"method": "password", "success": true, "browser": "Chrome"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', NOW() - INTERVAL '1 hour'),

('login', 2, 'auth', 'session_002', '{"method": "password", "success": true, "browser": "Firefox"}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0', NOW() - INTERVAL '2 hours'),

-- File upload activities
('upload', 1, 'batch', '13', '{"filename": "leads_batch_december.csv", "total_leads": 500, "clean_leads": 485, "duplicates": 15, "file_size": "2.3MB"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '3 hours'),

('upload', 2, 'batch', '12', '{"filename": "supplier_leads_nov.csv", "total_leads": 750, "clean_leads": 720, "duplicates": 30, "file_size": "3.1MB"}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0', NOW() - INTERVAL '1 day'),

-- Lead distribution activities
('distribute_leads', 1, 'batch', '13', '{"client_ids": [1, 2], "total_leads": 485, "distribution_method": "percentage", "client_1_leads": 242, "client_2_leads": 243}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '2 hours'),

('distribute_leads', 2, 'batch', '12', '{"client_ids": [1, 3], "total_leads": 720, "distribution_method": "fixed", "client_1_leads": 360, "client_3_leads": 360}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0', NOW() - INTERVAL '1 day'),

-- User management activities
('create', 1, 'user', '3', '{"username": "newuser", "role": "viewer", "fullname": "New User"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '2 days'),

('update', 1, 'user', '2', '{"field": "role", "old_value": "viewer", "new_value": "manager", "updated_by": "admin"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '3 days'),

-- Lead management activities
('update', 2, 'lead', '1001', '{"field": "status", "old_value": "New", "new_value": "Contacted", "notes": "Initial contact made"}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0', NOW() - INTERVAL '4 hours'),

('update', 1, 'lead', '1002', '{"field": "status", "old_value": "Contacted", "new_value": "Qualified", "notes": "Lead shows interest"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '5 hours'),

-- DNC management activities
('create', 1, 'dnc_entry', 'email_001', '{"type": "email", "value": "donotcontact@example.com", "reason": "User request", "source": "manual"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '6 hours'),

('delete', 1, 'dnc_entry', 'phone_001', '{"type": "phone", "value": "+1234567890", "reason": "Expired request", "deleted_by": "admin"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '1 day'),

-- Export activities
('export', 2, 'lead', 'export_001', '{"format": "CSV", "total_records": 150, "client_id": 1, "date_range": "last_30_days"}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0', NOW() - INTERVAL '8 hours'),

('export', 1, 'batch', 'export_002', '{"format": "Excel", "total_records": 500, "batch_id": 13, "include_duplicates": false}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '12 hours'),

-- System configuration activities
('system_config', 1, 'system', 'settings_001', '{"setting": "max_upload_size", "old_value": "10MB", "new_value": "25MB", "reason": "Increased file size requirements"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '2 days'),

-- Supplier management activities
('create', 1, 'supplier', '6', '{"name": "New Lead Source Inc", "email": "contact@newleadsource.com", "lead_cost": 2.50}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '3 days'),

('update', 1, 'supplier', '5', '{"field": "lead_cost", "old_value": 2.00, "new_value": 2.25, "reason": "Price adjustment"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '4 days'),

-- Client management activities
('create', 1, 'client', '4', '{"name": "New Client Corp", "email": "admin@newclient.com", "allocation_type": "percentage", "allocation_value": 15}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '5 days'),

-- Failed login attempts (for security monitoring)
('login', NULL, 'auth', 'failed_001', '{"method": "password", "success": false, "username": "unknown_user", "reason": "invalid_credentials"}', '192.168.1.200', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '6 hours'),

-- Logout activities
('logout', 1, 'auth', 'session_001', '{"session_duration": "2h 15m", "reason": "user_initiated"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '30 minutes'),

('logout', 2, 'auth', 'session_002', '{"session_duration": "1h 45m", "reason": "user_initiated"}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0', NOW() - INTERVAL '1 hour');

-- Add some older activities for historical data
INSERT INTO public.activity_logs (activitytype, userid, resourcetype, resourceid, details, ipaddress, useragent, createdat) VALUES

-- Activities from last week
('upload', 1, 'batch', '11', '{"filename": "weekly_leads_batch.csv", "total_leads": 300, "clean_leads": 285}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '1 week'),

('distribute_leads', 1, 'batch', '11', '{"client_ids": [1, 2, 3], "total_leads": 285}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '1 week' + INTERVAL '1 hour'),

-- Activities from last month
('upload', 2, 'batch', '10', '{"filename": "monthly_leads_october.csv", "total_leads": 1000, "clean_leads": 950}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0', NOW() - INTERVAL '1 month'),

('system_config', 1, 'system', 'backup_001', '{"action": "database_backup", "size": "2.5GB", "status": "completed"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '1 month' + INTERVAL '2 days');

-- Verify the data was inserted
-- SELECT COUNT(*) as total_logs FROM public.activity_logs;
-- SELECT activitytype, COUNT(*) as count FROM public.activity_logs GROUP BY activitytype ORDER BY count DESC;
