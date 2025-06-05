-- Create tables for the lead management system

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  fullName TEXT,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  contactPerson TEXT,
  apiKey TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  leadCost DECIMAL(10, 2),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Upload batches table
CREATE TABLE IF NOT EXISTS upload_batches (
  id SERIAL PRIMARY KEY,
  fileName TEXT NOT NULL,
  fileType TEXT,
  status TEXT NOT NULL DEFAULT 'Uploaded',
  totalLeads INTEGER DEFAULT 0,
  cleanedLeads INTEGER DEFAULT 0,
  duplicateLeads INTEGER DEFAULT 0,
  dncMatches INTEGER DEFAULT 0,
  processingProgress INTEGER DEFAULT 0,
  supplierId INTEGER REFERENCES suppliers(id),
  sourceName TEXT,
  errorMessage TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completedAt TIMESTAMP WITH TIME ZONE
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  firstName TEXT,
  lastName TEXT,
  email TEXT,
  phone TEXT,
  companyName TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zipCode TEXT,
  country TEXT,
  leadStatus TEXT DEFAULT 'New',
  leadSource TEXT,
  uploadBatchId INTEGER REFERENCES upload_batches(id),
  exclusivity BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DNC Lists table
CREATE TABLE IF NOT EXISTS dnc_lists (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lastUpdated TIMESTAMP WITH TIME ZONE
);

-- DNC Entries table
CREATE TABLE IF NOT EXISTS dnc_entries (
  id SERIAL PRIMARY KEY,
  value TEXT NOT NULL,
  valueType TEXT NOT NULL,
  source TEXT,
  reason TEXT,
  dncListId INTEGER REFERENCES dnc_lists(id),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiryDate TIMESTAMP WITH TIME ZONE
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  contactPerson TEXT,
  deliveryFormat TEXT DEFAULT 'CSV',
  deliverySchedule TEXT DEFAULT 'Daily',
  percentAllocation INTEGER,
  fixedAllocation INTEGER,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead Distributions table
CREATE TABLE IF NOT EXISTS lead_distributions (
  id SERIAL PRIMARY KEY,
  batchId INTEGER REFERENCES upload_batches(id),
  clientId INTEGER REFERENCES clients(id),
  leadsAllocated INTEGER NOT NULL,
  deliveryStatus TEXT DEFAULT 'Pending',
  deliveryDate TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create some initial data

-- Insert suppliers
INSERT INTO suppliers (name, email, contactPerson, apiKey, status, leadCost)
VALUES
  ('Lead Gen Pro', 'contact@leadgenpro.com', 'Sarah Sales', 'lgp_api_12345', 'Active', 2.50),
  ('Data Partners Inc', 'info@datapartners.com', 'Mike Marketing', 'dpi_api_67890', 'Active', 3.00),
  ('LeadSource Direct', 'support@leadsource.com', 'Lisa Leads', 'lsd_api_54321', 'Inactive', 1.75);

-- Insert DNC lists
INSERT INTO dnc_lists (name, type, description, isActive)
VALUES
  ('Internal DNC', 'internal', 'Company-wide do not contact list', TRUE),
  ('Federal DNC', 'federal', 'Federal do not call registry', TRUE),
  ('Client A DNC', 'client', 'Client-specific do not contact list', TRUE);

-- Insert clients
INSERT INTO clients (name, email, phone, contactPerson, deliveryFormat, deliverySchedule, percentAllocation, fixedAllocation, isActive)
VALUES
  ('Acme Corporation', 'leads@acme.com', '(555) 123-4567', 'John Manager', 'CSV', 'Daily', 30, NULL, TRUE),
  ('XYZ Industries', 'leads@xyz.com', '(555) 987-6543', 'Jane Director', 'JSON', 'Weekly', 50, NULL, TRUE),
  ('123 Enterprises', 'leads@123ent.com', '(555) 456-7890', 'Bob Executive', 'API', 'Real-time', NULL, 100, FALSE);
