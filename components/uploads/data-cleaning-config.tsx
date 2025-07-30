"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Settings, Trash2 } from "lucide-react"

interface DataCleaningRule {
  id: string
  field: string
  type: 'remove_chars' | 'replace_text' | 'trim_whitespace' | 'format_phone' | 'format_email' | 'capitalize'
  pattern?: string
  replacement?: string
  enabled: boolean
}

interface DataCleaningConfigProps {
  sessionId: string
  onConfigUpdate: (config: DataCleaningRule[]) => void
}

const DEFAULT_RULES: DataCleaningRule[] = [
  {
    id: '1',
    field: 'email',
    type: 'format_email',
    enabled: true
  },
  {
    id: '2',
    field: 'phone',
    type: 'format_phone',
    enabled: true
  },
  {
    id: '3',
    field: 'firstname',
    type: 'capitalize',
    enabled: true
  },
  {
    id: '4',
    field: 'lastname',
    type: 'capitalize',
    enabled: true
  },
  {
    id: '5',
    field: 'companyname',
    type: 'capitalize',
    enabled: true
  },
  {
    id: '6',
    field: 'all',
    type: 'trim_whitespace',
    enabled: true
  }
]

const RULE_TYPES = [
  { value: 'trim_whitespace', label: 'Trim Whitespace', description: 'Remove leading/trailing spaces' },
  { value: 'format_email', label: 'Format Email', description: 'Convert to lowercase, validate format' },
  { value: 'format_phone', label: 'Format Phone', description: 'Remove non-numeric characters except +' },
  { value: 'capitalize', label: 'Capitalize Names', description: 'Proper case for names' },
  { value: 'remove_chars', label: 'Remove Characters', description: 'Remove specific characters' },
  { value: 'replace_text', label: 'Replace Text', description: 'Replace text patterns' }
]

const FIELD_OPTIONS = [
  'all', 'email', 'firstname', 'lastname', 'phone', 'companyname', 'address', 'city', 'state'
]

export function DataCleaningConfig({ sessionId, onConfigUpdate }: DataCleaningConfigProps) {
  const [rules, setRules] = useState<DataCleaningRule[]>(DEFAULT_RULES)
  const [newRule, setNewRule] = useState({
    field: 'all',
    type: 'trim_whitespace',
    pattern: '',
    replacement: ''
  })

  useEffect(() => {
    onConfigUpdate(rules)
  }, [rules, onConfigUpdate])

  const toggleRule = (ruleId: string) => {
    setRules(rules.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ))
  }

  const updateRule = (ruleId: string, updates: Partial<DataCleaningRule>) => {
    setRules(rules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ))
  }

  const deleteRule = (ruleId: string) => {
    setRules(rules.filter(rule => rule.id !== ruleId))
  }

  const addRule = () => {
    const rule: DataCleaningRule = {
      id: Date.now().toString(),
      field: newRule.field,
      type: newRule.type as any,
      pattern: newRule.pattern || undefined,
      replacement: newRule.replacement || undefined,
      enabled: true
    }
    setRules([...rules, rule])
    setNewRule({ field: 'all', type: 'trim_whitespace', pattern: '', replacement: '' })
  }

  const getRuleDescription = (rule: DataCleaningRule) => {
    const ruleType = RULE_TYPES.find(t => t.value === rule.type)
    let description = ruleType?.description || rule.type
    
    if (rule.pattern) {
      description += ` (Pattern: ${rule.pattern})`
    }
    if (rule.replacement) {
      description += ` (Replace with: ${rule.replacement})`
    }
    
    return description
  }

  const enabledRulesCount = rules.filter(rule => rule.enabled).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Data Cleaning Configuration
          <Badge variant="outline">
            {enabledRulesCount} rules enabled
          </Badge>
        </CardTitle>
        <CardDescription>
          Configure data cleaning rules to standardize and clean your lead data before processing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Rules */}
        <div className="space-y-4">
          <h4 className="font-medium">Active Cleaning Rules</h4>
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center gap-4 p-3 border rounded-lg">
              <Switch
                checked={rule.enabled}
                onCheckedChange={() => toggleRule(rule.id)}
              />
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant={rule.enabled ? "default" : "secondary"}>
                    {rule.field}
                  </Badge>
                  <span className="font-medium">
                    {RULE_TYPES.find(t => t.value === rule.type)?.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getRuleDescription(rule)}
                </p>
              </div>
              
              {rule.type === 'remove_chars' || rule.type === 'replace_text' ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Pattern"
                    value={rule.pattern || ''}
                    onChange={(e) => updateRule(rule.id, { pattern: e.target.value })}
                    className="w-24"
                  />
                  {rule.type === 'replace_text' && (
                    <Input
                      placeholder="Replace with"
                      value={rule.replacement || ''}
                      onChange={(e) => updateRule(rule.id, { replacement: e.target.value })}
                      className="w-24"
                    />
                  )}
                </div>
              ) : null}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteRule(rule.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Separator />

        {/* Add New Rule */}
        <div className="space-y-4">
          <h4 className="font-medium">Add New Rule</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Field</Label>
              <select
                value={newRule.field}
                onChange={(e) => setNewRule({ ...newRule, field: e.target.value })}
                className="w-full p-2 border rounded"
              >
                {FIELD_OPTIONS.map(field => (
                  <option key={field} value={field}>
                    {field === 'all' ? 'All Fields' : field}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label>Rule Type</Label>
              <select
                value={newRule.type}
                onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
                className="w-full p-2 border rounded"
              >
                {RULE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            {(newRule.type === 'remove_chars' || newRule.type === 'replace_text') && (
              <>
                <div>
                  <Label>Pattern</Label>
                  <Input
                    value={newRule.pattern}
                    onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                    placeholder="Characters or pattern to remove/replace"
                  />
                </div>
                
                {newRule.type === 'replace_text' && (
                  <div>
                    <Label>Replacement</Label>
                    <Input
                      value={newRule.replacement}
                      onChange={(e) => setNewRule({ ...newRule, replacement: e.target.value })}
                      placeholder="Replace with"
                    />
                  </div>
                )}
              </>
            )}
          </div>
          
          <Button onClick={addRule} className="w-full">
            Add Cleaning Rule
          </Button>
        </div>

        {/* Preview */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Cleaning Summary</h4>
          <div className="text-sm space-y-1">
            <p>• {enabledRulesCount} cleaning rules will be applied</p>
            <p>• Rules are applied in the order shown above</p>
            <p>• All fields will be processed according to their specific rules</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
