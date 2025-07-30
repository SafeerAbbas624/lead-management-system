"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Settings, Phone, Mail, MapPin, User } from "lucide-react"

interface NormalizationRule {
  field: string
  type: 'phone' | 'email' | 'name' | 'address' | 'state' | 'zipcode'
  format: string
  enabled: boolean
  options?: Record<string, any>
}

interface DataNormalizationConfigProps {
  sessionId: string
  onConfigUpdate: (config: NormalizationRule[]) => void
}

const DEFAULT_RULES: NormalizationRule[] = [
  {
    field: 'phone',
    type: 'phone',
    format: 'us_standard',
    enabled: true,
    options: { removeExtensions: true, addCountryCode: false }
  },
  {
    field: 'email',
    type: 'email',
    format: 'lowercase',
    enabled: true,
    options: { validateFormat: true, removeDots: false }
  },
  {
    field: 'firstname',
    type: 'name',
    format: 'proper_case',
    enabled: true,
    options: { handlePrefixes: true }
  },
  {
    field: 'lastname',
    type: 'name',
    format: 'proper_case',
    enabled: true,
    options: { handleSuffixes: true }
  },
  {
    field: 'companyname',
    type: 'name',
    format: 'title_case',
    enabled: true,
    options: { handleAbbreviations: true }
  },
  {
    field: 'address',
    type: 'address',
    format: 'standardized',
    enabled: true,
    options: { abbreviateStreetTypes: true, standardizeDirections: true }
  },
  {
    field: 'state',
    type: 'state',
    format: 'abbreviation',
    enabled: true,
    options: { convertToUppercase: true }
  },
  {
    field: 'zipcode',
    type: 'zipcode',
    format: 'us_standard',
    enabled: true,
    options: { addPlusFour: false, validateFormat: true }
  }
]

const FORMAT_OPTIONS = {
  phone: [
    { value: 'us_standard', label: '(123) 456-7890', description: 'US standard format with parentheses' },
    { value: 'us_dashes', label: '123-456-7890', description: 'US format with dashes' },
    { value: 'us_dots', label: '123.456.7890', description: 'US format with dots' },
    { value: 'international', label: '+1 123 456 7890', description: 'International format' },
    { value: 'digits_only', label: '1234567890', description: 'Digits only' }
  ],
  email: [
    { value: 'lowercase', label: 'lowercase', description: 'Convert to lowercase' },
    { value: 'as_is', label: 'As-is', description: 'Keep original case' }
  ],
  name: [
    { value: 'proper_case', label: 'Proper Case', description: 'John Doe' },
    { value: 'title_case', label: 'Title Case', description: 'John Doe Inc.' },
    { value: 'uppercase', label: 'UPPERCASE', description: 'JOHN DOE' },
    { value: 'lowercase', label: 'lowercase', description: 'john doe' }
  ],
  address: [
    { value: 'standardized', label: 'Standardized', description: '123 Main St, Apt 4B' },
    { value: 'abbreviated', label: 'Abbreviated', description: '123 Main St Apt 4B' },
    { value: 'full_words', label: 'Full Words', description: '123 Main Street, Apartment 4B' }
  ],
  state: [
    { value: 'abbreviation', label: 'Abbreviation', description: 'CA, NY, TX' },
    { value: 'full_name', label: 'Full Name', description: 'California, New York, Texas' }
  ],
  zipcode: [
    { value: 'us_standard', label: 'US Standard', description: '12345 or 12345-6789' },
    { value: 'five_digit', label: 'Five Digit', description: '12345' },
    { value: 'nine_digit', label: 'Nine Digit', description: '12345-6789' }
  ]
}

export function DataNormalizationConfig({ sessionId, onConfigUpdate }: DataNormalizationConfigProps) {
  const [rules, setRules] = useState<NormalizationRule[]>(DEFAULT_RULES)

  useEffect(() => {
    onConfigUpdate(rules)
  }, [rules, onConfigUpdate])

  const toggleRule = (field: string) => {
    setRules(rules.map(rule => 
      rule.field === field ? { ...rule, enabled: !rule.enabled } : rule
    ))
  }

  const updateRuleFormat = (field: string, format: string) => {
    setRules(rules.map(rule => 
      rule.field === field ? { ...rule, format } : rule
    ))
  }

  const updateRuleOption = (field: string, optionKey: string, value: any) => {
    setRules(rules.map(rule => 
      rule.field === field 
        ? { ...rule, options: { ...rule.options, [optionKey]: value } }
        : rule
    ))
  }

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'phone': return <Phone className="h-4 w-4" />
      case 'email': return <Mail className="h-4 w-4" />
      case 'address': return <MapPin className="h-4 w-4" />
      case 'name': return <User className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const enabledRulesCount = rules.filter(rule => rule.enabled).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Data Normalization Configuration
          <Badge variant="outline">
            {enabledRulesCount} rules enabled
          </Badge>
        </CardTitle>
        <CardDescription>
          Configure data normalization rules to standardize formats across all lead data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {rules.map((rule) => (
          <div key={rule.field} className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Switch
                checked={rule.enabled}
                onCheckedChange={() => toggleRule(rule.field)}
              />
              
              <div className="flex items-center gap-2">
                {getFieldIcon(rule.type)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{rule.field}</span>
                    <Badge variant={rule.enabled ? "default" : "secondary"}>
                      {rule.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Format: {FORMAT_OPTIONS[rule.type]?.find(opt => opt.value === rule.format)?.label}
                  </p>
                </div>
              </div>
              
              <div className="flex-1">
                <Label className="text-sm">Format</Label>
                <Select
                  value={rule.format}
                  onValueChange={(value) => updateRuleFormat(rule.field, value)}
                  disabled={!rule.enabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS[rule.type]?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Rule-specific options */}
            {rule.enabled && rule.options && (
              <div className="ml-12 p-3 bg-muted rounded-lg">
                <h5 className="font-medium mb-2">Options</h5>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(rule.options).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        checked={value as boolean}
                        onCheckedChange={(checked) => updateRuleOption(rule.field, key, checked)}
                      />
                      <Label className="text-sm capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        <Separator />

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Normalization Summary</h4>
          <div className="text-sm space-y-1">
            <p>• {enabledRulesCount} normalization rules will be applied</p>
            <p>• Rules are applied after data cleaning but before duplicate checking</p>
            <p>• Standardized formats improve data quality and matching accuracy</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
