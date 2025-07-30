-- Update Activity Logs to use correct User IDs
-- This script updates the existing activity logs to use the actual user IDs from your users table

-- First, let's see what users we have
-- SELECT id, username, "fullName" FROM users ORDER BY id;

-- Update existing activity logs to use correct user IDs
-- Replace user ID 1 with user ID 8 (admin - Safeer Abbas)
UPDATE public.activity_logs 
SET userid = 8 
WHERE userid = 1;

-- Replace user ID 2 with user ID 10 (Ben - Nathen Ben)
UPDATE public.activity_logs 
SET userid = 10 
WHERE userid = 2;

-- Add some new activity logs with the correct user IDs
INSERT INTO public.activity_logs (activitytype, userid, resourcetype, resourceid, details, ipaddress, useragent, createdat) VALUES

-- Recent activities for Safeer Abbas (admin)
('login', 8, 'auth', 'session_admin_001', '{"method": "password", "success": true, "browser": "Chrome", "location": "Dashboard"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '30 minutes'),

('upload', 8, 'batch', '44', '{"filename": "test.csv", "total_leads": 1311, "clean_leads": 1311, "duplicates": 0, "file_size": "2.5MB"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '1 hour'),

('distribute_leads', 8, 'batch', '44', '{"client_ids": [1, 2, 3], "total_leads": 1311, "distribution_method": "percentage", "admin_action": true}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '45 minutes'),

-- Activities for Nathen Ben (manager)
('login', 10, 'auth', 'session_ben_001', '{"method": "password", "success": true, "browser": "Firefox", "location": "Analytics"}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0', NOW() - INTERVAL '2 hours'),

('export', 10, 'lead', 'export_ben_001', '{"format": "CSV", "total_records": 500, "client_filter": "active", "date_range": "last_7_days"}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0', NOW() - INTERVAL '1.5 hours'),

('update', 10, 'lead', '1001', '{"field": "status", "old_value": "New", "new_value": "Contacted", "notes": "Follow-up call scheduled", "manager_review": true}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0', NOW() - INTERVAL '3 hours'),

-- Activities for Nir Taube (viewer)
('login', 11, 'auth', 'session_nir_001', '{"method": "password", "success": true, "browser": "Safari", "location": "Leads"}', '192.168.1.102', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', NOW() - INTERVAL '4 hours'),

('read', 11, 'lead', 'view_leads_001', '{"action": "view_leads_list", "filters": {"status": "New", "source": "all"}, "total_viewed": 150}', '192.168.1.102', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', NOW() - INTERVAL '3.5 hours'),

('export', 11, 'lead', 'export_nir_001', '{"format": "Excel", "total_records": 50, "permission_level": "viewer", "approved_by": "manager"}', '192.168.1.102', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', NOW() - INTERVAL '5 hours'),

-- System activities by admin
('system_config', 8, 'system', 'settings_update_001', '{"setting": "user_session_timeout", "old_value": "30 minutes", "new_value": "60 minutes", "reason": "User request for longer sessions"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '1 day'),

('create', 8, 'user', '11', '{"username": "nir", "role": "Viewer", "fullname": "Nir Taube", "created_by": "admin"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '2 days'),

-- Recent logout activities
('logout', 10, 'auth', 'session_ben_001', '{"session_duration": "1h 30m", "reason": "user_initiated", "pages_visited": 5}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0', NOW() - INTERVAL '1 hour'),

('logout', 11, 'auth', 'session_nir_001', '{"session_duration": "45m", "reason": "session_timeout", "last_activity": "view_leads"}', '192.168.1.102', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', NOW() - INTERVAL '3 hours');

-- Verify the updates
SELECT 
  al.id,
  al.activitytype,
  al.userid,
  u.username,
  u."fullName",
  al.resourcetype,
  al.createdat
FROM public.activity_logs al
LEFT JOIN public.users u ON al.userid = u.id
ORDER BY al.createdat DESC
LIMIT 10;
