"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save } from "lucide-react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // General Settings
    companyName: "Lead Management Pro",
    supportEmail: "support@leadmanagement.com",
    timezone: "America/New_York",

    // Data Processing Settings
    autoDeduplication: true,
    strictPhoneValidation: false,
    emailDomainCorrection: true,
    requireManualReview: false,
    compressionEnabled: true,

    // DNC Settings
    enableDncChecking: true,
    federalDncEnabled: true,
    customDncEnabled: true,
    dncUpdateFrequency: "daily",

    // Distribution Settings
    autoDistribution: false,
    maxLeadsPerBatch: 1000,
    distributionSchedule: "manual",

    // Notification Settings
    emailNotifications: true,
    slackNotifications: false,
    smsNotifications: false,
    slackWebhookUrl: "",

    // API Settings
    apiRateLimit: 100,
    apiKeyExpiration: 365,
    webhookTimeout: 30,
  })

  const handleSave = () => {
    // Save settings logic here
    console.log("Saving settings:", settings)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="processing">Data Processing</TabsTrigger>
          <TabsTrigger value="dnc">DNC Settings</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic system configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Processing Settings</CardTitle>
              <CardDescription>Configure how lead data is processed and cleaned</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Deduplication</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically remove duplicate leads during processing
                  </p>
                </div>
                <Switch
                  checked={settings.autoDeduplication}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoDeduplication: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Strict Phone Validation</Label>
                  <p className="text-sm text-muted-foreground">Reject leads with invalid phone number formats</p>
                </div>
                <Switch
                  checked={settings.strictPhoneValidation}
                  onCheckedChange={(checked) => setSettings({ ...settings, strictPhoneValidation: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Domain Correction</Label>
                  <p className="text-sm text-muted-foreground">Automatically fix common email domain typos</p>
                </div>
                <Switch
                  checked={settings.emailDomainCorrection}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailDomainCorrection: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compression</Label>
                  <p className="text-sm text-muted-foreground">Compress files after processing to save storage space</p>
                </div>
                <Switch
                  checked={settings.compressionEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, compressionEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dnc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>DNC (Do Not Contact) Settings</CardTitle>
              <CardDescription>Configure DNC list management and checking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable DNC Checking</Label>
                  <p className="text-sm text-muted-foreground">Check all leads against DNC lists during processing</p>
                </div>
                <Switch
                  checked={settings.enableDncChecking}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableDncChecking: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Federal DNC List</Label>
                  <p className="text-sm text-muted-foreground">Check against the federal Do Not Call registry</p>
                </div>
                <Switch
                  checked={settings.federalDncEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, federalDncEnabled: checked })}
                />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="dncUpdateFrequency">DNC Update Frequency</Label>
                <Select
                  value={settings.dncUpdateFrequency}
                  onValueChange={(value) => setSettings({ ...settings, dncUpdateFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lead Distribution Settings</CardTitle>
              <CardDescription>Configure how leads are distributed to clients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Distribution</Label>
                  <p className="text-sm text-muted-foreground">Automatically distribute leads after processing</p>
                </div>
                <Switch
                  checked={settings.autoDistribution}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoDistribution: checked })}
                />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="maxLeadsPerBatch">Max Leads Per Batch</Label>
                <Input
                  id="maxLeadsPerBatch"
                  type="number"
                  value={settings.maxLeadsPerBatch}
                  onChange={(e) => setSettings({ ...settings, maxLeadsPerBatch: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="distributionSchedule">Distribution Schedule</Label>
                <Select
                  value={settings.distributionSchedule}
                  onValueChange={(value) => setSettings({ ...settings, distributionSchedule: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how you receive system notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Slack Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send notifications to Slack channel</p>
                </div>
                <Switch
                  checked={settings.slackNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, slackNotifications: checked })}
                />
              </div>
              {settings.slackNotifications && (
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="slackWebhookUrl">Slack Webhook URL</Label>
                  <Input
                    id="slackWebhookUrl"
                    value={settings.slackWebhookUrl}
                    onChange={(e) => setSettings({ ...settings, slackWebhookUrl: e.target.value })}
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
