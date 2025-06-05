"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function DataNormalization() {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    nameFormat: "proper",
    phoneFormat: "standard",
    addressFormat: "standard",
    emailFormat: "lowercase",
    dedupeStrategy: "email_phone",
    customDedupeFields: "",
    enableEnrichment: false,
    enrichmentProvider: "",
    enrichmentApiKey: "",
  })

  const handleChange = (key: keyof typeof settings, value: string | boolean) => {
    setSettings({
      ...settings,
      [key]: value,
    })
  }

  const handleSave = () => {
    // In a real application, you would save these settings to the database
    console.log("Saving data normalization settings:", settings)

    toast({
      title: "Settings saved",
      description: "Your data normalization configuration has been saved",
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Format Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nameFormat">Name Format</Label>
                <Select value={settings.nameFormat} onValueChange={(value) => handleChange("nameFormat", value)}>
                  <SelectTrigger id="nameFormat">
                    <SelectValue placeholder="Select name format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proper">Proper Case (John Doe)</SelectItem>
                    <SelectItem value="upper">Upper Case (JOHN DOE)</SelectItem>
                    <SelectItem value="lower">Lower Case (john doe)</SelectItem>
                    <SelectItem value="preserve">Preserve Original</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneFormat">Phone Format</Label>
                <Select value={settings.phoneFormat} onValueChange={(value) => handleChange("phoneFormat", value)}>
                  <SelectTrigger id="phoneFormat">
                    <SelectValue placeholder="Select phone format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">(555) 123-4567</SelectItem>
                    <SelectItem value="dashes">555-123-4567</SelectItem>
                    <SelectItem value="dots">555.123.4567</SelectItem>
                    <SelectItem value="international">+1 555 123 4567</SelectItem>
                    <SelectItem value="raw">5551234567</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailFormat">Email Format</Label>
                <Select value={settings.emailFormat} onValueChange={(value) => handleChange("emailFormat", value)}>
                  <SelectTrigger id="emailFormat">
                    <SelectValue placeholder="Select email format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lowercase">Lowercase</SelectItem>
                    <SelectItem value="preserve">Preserve Original</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressFormat">Address Format</Label>
                <Select value={settings.addressFormat} onValueChange={(value) => handleChange("addressFormat", value)}>
                  <SelectTrigger id="addressFormat">
                    <SelectValue placeholder="Select address format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (123 Main St)</SelectItem>
                    <SelectItem value="proper">Proper Case</SelectItem>
                    <SelectItem value="upper">Upper Case</SelectItem>
                    <SelectItem value="lower">Lower Case</SelectItem>
                    <SelectItem value="preserve">Preserve Original</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Deduplication Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dedupeStrategy">Deduplication Strategy</Label>
                <Select
                  value={settings.dedupeStrategy}
                  onValueChange={(value) => handleChange("dedupeStrategy", value)}
                >
                  <SelectTrigger id="dedupeStrategy">
                    <SelectValue placeholder="Select deduplication strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="phone">Phone Only</SelectItem>
                    <SelectItem value="email_phone">Email OR Phone</SelectItem>
                    <SelectItem value="email_and_phone">Email AND Phone</SelectItem>
                    <SelectItem value="custom">Custom Fields</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.dedupeStrategy === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="customDedupeFields">Custom Dedupe Fields</Label>
                  <Textarea
                    id="customDedupeFields"
                    placeholder="Enter field names separated by commas"
                    value={settings.customDedupeFields}
                    onChange={(e) => handleChange("customDedupeFields", e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter field names separated by commas (e.g., email,phone,taxId)
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-4">
                <Switch
                  id="enableEnrichment"
                  checked={settings.enableEnrichment}
                  onCheckedChange={(checked) => handleChange("enableEnrichment", checked)}
                />
                <Label htmlFor="enableEnrichment">Enable Data Enrichment</Label>
              </div>

              {settings.enableEnrichment && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="enrichmentProvider">Enrichment Provider</Label>
                    <Select
                      value={settings.enrichmentProvider}
                      onValueChange={(value) => handleChange("enrichmentProvider", value)}
                    >
                      <SelectTrigger id="enrichmentProvider">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clearbit">Clearbit</SelectItem>
                        <SelectItem value="zoominfo">ZoomInfo</SelectItem>
                        <SelectItem value="fullcontact">FullContact</SelectItem>
                        <SelectItem value="custom">Custom API</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="enrichmentApiKey">API Key</Label>
                    <Input
                      id="enrichmentApiKey"
                      type="password"
                      placeholder="Enter API key"
                      value={settings.enrichmentApiKey}
                      onChange={(e) => handleChange("enrichmentApiKey", e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Configuration
        </Button>
      </div>
    </div>
  )
}
