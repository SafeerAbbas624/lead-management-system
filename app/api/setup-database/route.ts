import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = "https://pyoeipqdkejhofhvwanq.supabase.co"
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5b2VpcHFka2VqaG9maHZ3YW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk1MDg2NSwiZXhwIjoyMDYzNTI2ODY1fQ.0_1s-etQtAusM0RVMq5ZvinTPSlfidk62UoSfVUnwSo"
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST() {
  try {
    // Read the SQL file content
    const sqlContent = `
    -- Create extension for UUID generation if it doesn't exist
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

    -- Insert suppliers if they don't exist
    INSERT INTO suppliers (name, email, contactPerson, apiKey, status, leadCost)
    SELECT 'Lead Gen Pro', 'contact@leadgenpro.com', 'Sarah Sales', 'lgp_api_12345', 'Active', 2.50
    WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Lead Gen Pro');

    INSERT INTO suppliers (name, email, contactPerson, apiKey, status, leadCost)
    SELECT 'Data Partners Inc', 'info@datapartners.com', 'Mike Marketing', 'dpi_api_67890', 'Active', 3.00
    WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Data Partners Inc');

    INSERT INTO suppliers (name, email, contactPerson, apiKey, status, leadCost)
    SELECT 'LeadSource Direct', 'support@leadsource.com', 'Lisa Leads', 'lsd_api_54321', 'Inactive', 1.75
    WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'LeadSource Direct');

    -- Insert DNC lists if they don't exist
    INSERT INTO dnc_lists (name, type, description, isActive)
    SELECT 'Internal DNC', 'internal', 'Company-wide do not contact list', TRUE
    WHERE NOT EXISTS (SELECT 1 FROM dnc_lists WHERE name = 'Internal DNC');

    INSERT INTO dnc_lists (name, type, description, isActive)
    SELECT 'Federal DNC', 'federal', 'Federal do not call registry', TRUE
    WHERE NOT EXISTS (SELECT 1 FROM dnc_lists WHERE name = 'Federal DNC');

    INSERT INTO dnc_lists (name, type, description, isActive)
    SELECT 'Client A DNC', 'client', 'Client-specific do not contact list', TRUE
    WHERE NOT EXISTS (SELECT 1 FROM dnc_lists WHERE name = 'Client A DNC');

    -- Insert clients if they don't exist
    INSERT INTO clients (name, email, phone, contactPerson, deliveryFormat, deliverySchedule, percentAllocation, fixedAllocation, isActive)
    SELECT 'Acme Corporation', 'leads@acme.com', '(555) 123-4567', 'John Manager', 'CSV', 'Daily', 30, NULL, TRUE
    WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Acme Corporation');

    INSERT INTO clients (name, email, phone, contactPerson, deliveryFormat, deliverySchedule, percentAllocation, fixedAllocation, isActive)
    SELECT 'XYZ Industries', 'leads@xyz.com', '(555) 987-6543', 'Jane Director', 'JSON', 'Weekly', 50, NULL, TRUE
    WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'XYZ Industries');

    INSERT INTO clients (name, email, phone, contactPerson, deliveryFormat, deliverySchedule, percentAllocation, fixedAllocation, isActive)
    SELECT '123 Enterprises', 'leads@123ent.com', '(555) 456-7890', 'Bob Executive', 'API', 'Real-time', NULL, 100, FALSE
    WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = '123 Enterprises');

    -- Insert sample leads if they don't exist
    INSERT INTO leads (firstName, lastName, email, phone, companyName, leadStatus, leadSource, exclusivity, createdAt)
    SELECT 'John', 'Doe', 'john.doe@example.com', '(555) 123-4567', 'Acme Inc', 'New', 'Website', FALSE, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM leads WHERE email = 'john.doe@example.com');

    INSERT INTO leads (firstName, lastName, email, phone, companyName, leadStatus, leadSource, exclusivity, createdAt)
    SELECT 'Jane', 'Smith', 'jane.smith@example.com', '(555) 987-6543', 'XYZ Corp', 'Qualified', 'Referral', TRUE, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM leads WHERE email = 'jane.smith@example.com');

    INSERT INTO leads (firstName, lastName, email, phone, companyName, leadStatus, leadSource, exclusivity, createdAt)
    SELECT 'Michael', 'Johnson', 'michael.johnson@example.com', '(555) 456-7890', 'Johnson LLC', 'Contacted', 'LinkedIn', FALSE, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM leads WHERE email = 'michael.johnson@example.com');

    INSERT INTO leads (firstName, lastName, email, phone, companyName, leadStatus, leadSource, exclusivity, createdAt)
    SELECT 'Emily', 'Williams', 'emily.williams@exclusivity.com', '(555) 234-5678', 'Williams Co', 'New', 'Google Ads', TRUE, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM leads WHERE email = 'emily.williams@exclusivity.com');

    INSERT INTO leads (firstName, lastName, email, phone, companyName, leadStatus, leadSource, exclusivity, createdAt)
    SELECT 'David', 'Brown', 'david.brown@example.com', '(555) 876-5432', 'Brown Industries', 'DNC', 'Facebook', FALSE, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM leads WHERE email = 'david.brown@example.com');
    `

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql: sqlContent })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, message: "Database setup completed successfully" })
  } catch (error: any) {
    console.error("Error setting up database:", error)
    return NextResponse.json({ error: error.message || "Failed to set up database" }, { status: 500 })
  }
}
