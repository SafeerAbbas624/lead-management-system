"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Save, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MappingRule {
  id: string
  sourceField: string
  targetField: string
  isRequired: boolean
}

const SYSTEM_FIELDS = [
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "companyName", label: "Company Name" },
  { value: "address", label: "Address" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "zipCode", label: "Zip Code" },
  { value: "country", label: "Country" },
  { value: "taxId", label: "Tax ID" },
  { value: "loanAmount", label: "Loan Amount" },
  { value: "revenue", label: "Revenue" },
]

export function CsvMapper() {
  const { toast } = useToast()
  const [mappingRules, setMappingRules] = useState<MappingRule[]>([
    {
      id: "1",
      sourceField: "given_name",
      targetField: "firstName",
      isRequired: true,
    },
    {
      id: "2",
      sourceField: "surname",
      targetField: "lastName",
      isRequired: true,
    },
    {
      id: "3",
      sourceField: "email_address",
      targetField: "email",
      isRequired: true,
    },
    {
      id: "4",
      sourceField: "mobile",
      targetField: "phone",
      isRequired: false,
    },
    {
      id: "5",
      sourceField: "address",
      targetField: "address",
      isRequired: false,
    },
  ])

  const [newSourceField, setNewSourceField] = useState("")
  const [newTargetField, setNewTargetField] = useState("")
  const [newIsRequired, setNewIsRequired] = useState(false)

  const handleAddRule = () => {
    if (!newSourceField || !newTargetField) {
      toast({
        title: "Error",
        description: "Source field and target field are required",
        variant: "destructive",
      })
      return
    }

    const newRule: MappingRule = {
      id: Date.now().toString(),
      sourceField: newSourceField,
      targetField: newTargetField,
      isRequired: newIsRequired,
    }

    setMappingRules([...mappingRules, newRule])
    setNewSourceField("")
    setNewTargetField("")
    setNewIsRequired(false)

    toast({
      title: "Mapping rule added",
      description: `Mapped ${newSourceField} to ${newTargetField}`,
    })
  }

  const handleDeleteRule = (id: string) => {
    setMappingRules(mappingRules.filter((rule) => rule.id !== id))

    toast({
      title: "Mapping rule deleted",
      description: "The mapping rule has been removed",
    })
  }

  const handleSaveRules = () => {
    // In a real application, you would save these rules to the database
    console.log("Saving mapping rules:", mappingRules)

    toast({
      title: "Mapping rules saved",
      description: "Your field mapping configuration has been saved",
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sourceField">Source Field</Label>
            <Input
              id="sourceField"
              placeholder="CSV column name"
              value={newSourceField}
              onChange={(e) => setNewSourceField(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetField">Target Field</Label>
            <Select value={newTargetField} onValueChange={setNewTargetField}>
              <SelectTrigger>
                <SelectValue placeholder="Select system field" />
              </SelectTrigger>
              <SelectContent>
                {SYSTEM_FIELDS.map((field) => (
                  <SelectItem key={field.value} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end space-x-4">
            <div className="flex items-center space-x-2">
              <Switch id="required" checked={newIsRequired} onCheckedChange={setNewIsRequired} />
              <Label htmlFor="required">Required</Label>
            </div>
            <Button onClick={handleAddRule}>
              <Plus className="mr-2 h-4 w-4" />
              Add Mapping
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source Field</TableHead>
              <TableHead>Target Field</TableHead>
              <TableHead>Required</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappingRules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>{rule.sourceField}</TableCell>
                <TableCell>
                  {SYSTEM_FIELDS.find((f) => f.value === rule.targetField)?.label || rule.targetField}
                </TableCell>
                <TableCell>{rule.isRequired ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(rule.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSaveRules}>
          <Save className="mr-2 h-4 w-4" />
          Save Configuration
        </Button>
      </div>
    </div>
  )
}
