"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check, Database } from "lucide-react"
import { supabase } from "@/lib/supabase-client"

export default function SetupDatabasePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const setupDatabase = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Create tables based on the schema provided by the user
      const { error } = await supabase.rpc("exec_sql", {
        sql: `
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          fullName TEXT,
          email TEXT,
          role TEXT NOT NULL,
          createdAt TIMESTAMPTZ NOT NULL
        );

        -- Leads table
        CREATE TABLE IF NOT EXISTS leads (
          id SERIAL PRIMARY KEY,
          email TEXT,
          firstName TEXT,
          lastName TEXT,
          phone TEXT,
          companyName TEXT,
          taxId TEXT,
          address TEXT,
          city TEXT,
          state TEXT,
          zipCode TEXT,
          country TEXT,
          leadSource TEXT,
          leadStatus TEXT,
          leadScore INTEGER,
          leadCost NUMERIC,
          exclusivity BOOLEAN,
          exclusivityNotes TEXT,
          uploadBatchId INTEGER,
          clientId INTEGER,
          supplierId INTEGER,
          metaData JSONB,
          tags TEXT[],
          createdAt TIMESTAMPTZ NOT NULL,
          updatedAt TIMESTAMPTZ
        );

        -- Upload batches table
        CREATE TABLE IF NOT EXISTS upload_batches (
          id SERIAL PRIMARY KEY,
          fileName TEXT NOT NULL,
          fileType TEXT NOT NULL,
          status TEXT NOT NULL,
          totalLeads INTEGER,
          cleanedLeads INTEGER,
          duplicateLeads INTEGER,
          dncMatches INTEGER,
          errorMessage TEXT,
          originalHeaders TEXT[],
          mappingRules JSONB,
          uploadedBy INTEGER,
          processingProgress INTEGER,
          supplierId INTEGER,
          sourceName TEXT,
          createdAt TIMESTAMPTZ NOT NULL,
          completedAt TIMESTAMPTZ
        );

        -- DNC lists table
        CREATE TABLE IF NOT EXISTS dnc_lists (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          description TEXT,
          isActive BOOLEAN,
          createdAt TIMESTAMPTZ NOT NULL,
          lastUpdated TIMESTAMPTZ
        );

        -- DNC entries table
        CREATE TABLE IF NOT EXISTS dnc_entries (
          id SERIAL PRIMARY KEY,
          value TEXT NOT NULL,
          valueType TEXT NOT NULL,
          source TEXT,
          reason TEXT,
          dncListId INTEGER NOT NULL,
          createdAt TIMESTAMPTZ NOT NULL,
          expiryDate TIMESTAMPTZ
        );

        -- Clients table
        CREATE TABLE IF NOT EXISTS clients (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          contactPerson TEXT,
          deliveryFormat TEXT,
          deliverySchedule TEXT,
          percentAllocation INTEGER,
          fixedAllocation INTEGER,
          exclusivitySettings JSONB,
          isActive BOOLEAN,
          createdAt TIMESTAMPTZ NOT NULL
        );

        -- Suppliers table
        CREATE TABLE IF NOT EXISTS suppliers (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          contactPerson TEXT,
          apiKey TEXT,
          status TEXT,
          leadCost TEXT,
          createdAt TIMESTAMPTZ NOT NULL
        );

        -- Insert sample data
        INSERT INTO suppliers (name, email, contactPerson, status, leadCost, createdAt)
        SELECT 'Lead Gen Pro', 'contact@leadgenpro.com', 'Sarah Sales', 'Active', '2.50', NOW()
        WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Lead Gen Pro');

        INSERT INTO suppliers (name, email, contactPerson, status, leadCost, createdAt)
        SELECT 'Data Partners Inc', 'info@datapartners.com', 'Mike Marketing', 'Active', '3.00', NOW()
        WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Data Partners Inc');

        INSERT INTO dnc_lists (name, type, description, isActive, createdAt)
        SELECT 'Internal DNC', 'internal', 'Company-wide do not contact list', TRUE, NOW()
        WHERE NOT EXISTS (SELECT 1 FROM dnc_lists WHERE name = 'Internal DNC');

        INSERT INTO dnc_lists (name, type, description, isActive, createdAt)
        SELECT 'Federal DNC', 'federal', 'Federal do not call registry', TRUE, NOW()
        WHERE NOT EXISTS (SELECT 1 FROM dnc_lists WHERE name = 'Federal DNC');

        INSERT INTO clients (name, email, contactPerson, deliveryFormat, deliverySchedule, percentAllocation, isActive, createdAt)
        SELECT 'Acme Corporation', 'leads@acme.com', 'John Manager', 'CSV', 'Daily', 30, TRUE, NOW()
        WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Acme Corporation');

        INSERT INTO clients (name, email, contactPerson, deliveryFormat, deliverySchedule, percentAllocation, isActive, createdAt)
        SELECT 'XYZ Industries', 'leads@xyz.com', 'Jane Director', 'JSON', 'Weekly', 50, TRUE, NOW()
        WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'XYZ Industries');
        `,
      })

      if (error) {
        throw error
      }

      setSuccess(true)
    } catch (err: any) {
      console.error("Error setting up database:", err)
      setError(err.message || "Failed to set up database")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Setup Database</CardTitle>
          <CardDescription>Initialize the database schema for the Lead Management System</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success</AlertTitle>
              <AlertDescription className="text-green-700">Database setup completed successfully!</AlertDescription>
            </Alert>
          )}

          <div className="text-center py-6">
            <Database className="h-16 w-16 mx-auto mb-4 text-blue-600" />
            <p className="text-sm text-gray-600 mb-4">
              This will create all necessary tables and initial data for the Lead Management System.
            </p>
            <p className="text-xs text-gray-500">
              Note: This operation is safe to run multiple times. It will not duplicate data if tables already exist.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={setupDatabase} disabled={loading || success} className="w-full">
            {loading ? "Setting up..." : success ? "Setup Complete" : "Setup Database"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
