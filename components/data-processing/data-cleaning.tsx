"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function DataCleaning() {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    trimWhitespace: true,
    normalizeCase: true,
    removeDuplicates: true,
    validateEmail: true,
    validatePhone: true,
    correctCommonTypos: true,
    flagMissingFields: true,
    compressFiles: true,
    emailTypoCorrections: "gmial.com=gmail.com\nyaho.com=yahoo.com\nhotmial.com=hotmail.com",
  })

  const handleToggle = (key: keyof typeof settings) => {
    setSettings({
      ...settings,
      [key]: !settings[key as keyof typeof settings],
    })
  }

  const handleTextChange = (key: keyof typeof settings, value: string) => {
    setSettings({
      ...settings,
      [key]: value,
    })
  }

  const handleSave = () => {
    // In a real application, you would save these settings to the database
    console.log("Saving data cleaning settings:", settings)

    toast({
      title: "Settings saved",
      description: "Your data cleaning configuration has been saved",
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Basic Cleaning</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="trimWhitespace" className="flex-1">
                  Trim whitespace
                  <p className="text-sm text-muted-foreground">Remove leading and trailing spaces</p>
                </Label>
                <Switch
                  id="trimWhitespace"
                  checked={settings.trimWhitespace}
                  onCheckedChange={() => handleToggle("trimWhitespace")}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="normalizeCase" className="flex-1">
                  Normalize case
                  <p className="text-sm text-muted-foreground">Convert emails to lowercase, proper case for names</p>
                </Label>
                <Switch
                  id="normalizeCase"
                  checked={settings.normalizeCase}
                  onCheckedChange={() => handleToggle("normalizeCase")}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="removeDuplicates" className="flex-1">
                  Remove duplicates
                  <p className="text-sm text-muted-foreground">Identify and remove duplicate leads</p>
                </Label>
                <Switch
                  id="removeDuplicates"
                  checked={settings.removeDuplicates}
                  onCheckedChange={() => handleToggle("removeDuplicates")}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="compressFiles" className="flex-1">
                  Compress files
                  <p className="text-sm text-muted-foreground">Compress files after cleaning</p>
                </Label>
                <Switch
                  id="compressFiles"
                  checked={settings.compressFiles}
                  onCheckedChange={() => handleToggle("compressFiles")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Validation</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="validateEmail" className="flex-1">
                  Validate email format
                  <p className="text-sm text-muted-foreground">Check if emails are in a valid format</p>
                </Label>
                <Switch
                  id="validateEmail"
                  checked={settings.validateEmail}
                  onCheckedChange={() => handleToggle("validateEmail")}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="validatePhone" className="flex-1">
                  Validate phone numbers
                  <p className="text-sm text-muted-foreground">Check if phone numbers are in a valid format</p>
                </Label>
                <Switch
                  id="validatePhone"
                  checked={settings.validatePhone}
                  onCheckedChange={() => handleToggle("validatePhone")}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="correctCommonTypos" className="flex-1">
                  Correct common typos
                  <p className="text-sm text-muted-foreground">Fix common typos in email domains</p>
                </Label>
                <Switch
                  id="correctCommonTypos"
                  checked={settings.correctCommonTypos}
                  onCheckedChange={() => handleToggle("correctCommonTypos")}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="flagMissingFields" className="flex-1">
                  Flag missing essential fields
                  <p className="text-sm text-muted-foreground">Mark leads with missing required fields</p>
                </Label>
                <Switch
                  id="flagMissingFields"
                  checked={settings.flagMissingFields}
                  onCheckedChange={() => handleToggle("flagMissingFields")}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <Label htmlFor="emailTypoCorrections">Email Typo Corrections</Label>
        <Textarea
          id="emailTypoCorrections"
          placeholder="Enter corrections in format: typo=correction"
          value={settings.emailTypoCorrections}
          onChange={(e) => handleTextChange("emailTypoCorrections", e.target.value)}
          rows={5}
        />
        <p className="text-sm text-muted-foreground">Enter one correction per line in the format: typo=correction</p>
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
