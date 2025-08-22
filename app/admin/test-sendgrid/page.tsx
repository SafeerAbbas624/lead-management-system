"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Mail, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TestSendGridPage() {
  const [testEmail, setTestEmail] = useState("")
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [configStatus, setConfigStatus] = useState<any>(null)
  const { toast } = useToast()

  // Check configuration status on component mount
  useEffect(() => {
    const checkConfig = async () => {
      try {
        const response = await fetch('/api/test-sendgrid', {
          method: 'GET'
        })
        const result = await response.json()
        setConfigStatus(result.config_status)
      } catch (error) {
        console.error('Error checking config:', error)
      }
    }
    checkConfig()
  }, [])

  const handleTest = async () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/test-sendgrid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test_email: testEmail }),
      })

      const result = await response.json()
      setTestResult(result)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Test error:', error)
      toast({
        title: "Error",
        description: "Failed to test SendGrid integration",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  const getStatusBadge = (status: boolean, label: string) => {
    return (
      <Badge variant={status ? "default" : "destructive"} className="flex items-center gap-1">
        {status ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        {label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">SendGrid Integration Test</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Test Email
            </CardTitle>
            <CardDescription>
              Test the SendGrid email integration by sending a test email to any address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">Test Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            
            <Button
              onClick={handleTest}
              disabled={testing || !testEmail}
              className="w-full"
            >
              {testing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending Test Email...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Test Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Status</CardTitle>
            <CardDescription>
              Current SendGrid configuration status and settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Key</span>
                {configStatus ?
                  getStatusBadge(configStatus.api_key, configStatus.api_key ? "Configured" : "Missing") :
                  <Badge variant="secondary">Checking...</Badge>
                }
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">From Email</span>
                {configStatus ?
                  getStatusBadge(configStatus.from_email, configStatus.from_email ? "Configured" : "Missing") :
                  <Badge variant="secondary">Checking...</Badge>
                }
              </div>

              {configStatus?.from_email_address && (
                <div className="text-xs text-muted-foreground">
                  From: {configStatus.from_email_address}
                </div>
              )}
            </div>

            {testResult && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Last Test Result</h4>
                {testResult.config_status && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>API Key Status</span>
                      {getStatusBadge(testResult.config_status.api_key, testResult.config_status.api_key ? "Valid" : "Invalid")}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>From Email Status</span>
                      {getStatusBadge(testResult.config_status.from_email, testResult.config_status.from_email ? "Valid" : "Invalid")}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant={testResult.success ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {testResult.message || testResult.error}
              </AlertDescription>
            </Alert>

            {testResult.sendgrid_error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-medium text-red-800 mb-2">SendGrid Error Details</h4>
                <pre className="text-xs text-red-700 overflow-auto">
                  {JSON.stringify(testResult.sendgrid_error, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            How to configure SendGrid for email delivery.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Environment Variables Required:</h4>
            <div className="bg-muted p-3 rounded-lg font-mono text-sm">
              <div>SENDGRID_API_KEY="your-sendgrid-api-key"</div>
              <div>SENDGRID_FROM_EMAIL="support@insaneagent.ai"</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">How it works:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>When leads are distributed, CSV files are automatically emailed to selected clients</li>
              <li>Each client receives a professional email with the lead file attached</li>
              <li>The system uses SendGrid's reliable email delivery service</li>
              <li>All email sending is logged and tracked for audit purposes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
