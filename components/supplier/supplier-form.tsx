"use client"

import { forwardRef, useImperativeHandle, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Copy, Check } from "lucide-react"

const supplierFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  contact_person: z.string().optional(),
  lead_cost: z.coerce.number().min(0).optional(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
})

type SupplierFormValues = z.infer<typeof supplierFormSchema>

interface SupplierFormProps {
  initialData?: any
  onSuccess?: (data: any) => void
  onCancel?: () => void
}

export interface SupplierFormRef {
  reset: () => void;
}

export const SupplierForm = forwardRef<SupplierFormRef, SupplierFormProps>(({ 
  initialData, 
  onSuccess, 
  onCancel 
}, ref) => {
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState(initialData?.api_key || "")
  const [copied, setCopied] = useState(false)

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      contact_person: initialData?.contact_person || "",
      lead_cost: initialData?.lead_cost || undefined,
      status: initialData?.status || "Active",
    },
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Copied!  ✅",
      description: "API key has been copied to your clipboard.",
    })
  }

  async function onSubmit(data: SupplierFormValues) {
    try {
      setLoading(true)
      const url = "/api/suppliers"
      const method = initialData ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(initialData ? { ...data, id: initialData.id } : data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save supplier")
      }

      const result = await response.json()
      
      // If this is a new supplier, show the API key
      if (!initialData && result.api_key) {
        setApiKey(result.api_key)
        toast({
          title: "Supplier Created Successfully!  ✅",
          description: "Please copy and save the API key. You won't be able to see it again.",
          duration: 10000,
        })
      } else {
        toast({
          title: "Success",
          description: initialData ? "Supplier updated successfully!" : "Supplier created successfully!",
        })
      }

      if (onSuccess) {
        onSuccess(result)
      }
    } catch (error) {
      console.error("Error saving supplier:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save supplier",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier Name</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Inc." {...field} disabled={!!apiKey} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contact@example.com" {...field} disabled={!!apiKey} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_person"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lead_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead Cost (Optional)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      className="pl-7"
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <FormMessage />
              </FormItem>
            )}
          />

          {apiKey && (
            <div className="col-span-full">
              <FormItem>
                <FormLabel>API Key</FormLabel>
                <div className="flex items-center space-x-2">
                  <Input 
                    value={apiKey} 
                    readOnly 
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(apiKey)}
                    className="h-10 w-10"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <FormDescription className="text-amber-600">
                  ⚠️ Please copy and save this API key. You won't be able to see it again after leaving this page.
                </FormDescription>
              </FormItem>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              {apiKey ? 'Close' : 'Cancel'}
            </Button>
          )}
          {!apiKey && (
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Update Supplier" : "Create Supplier"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
})

// Add display name for debugging
SupplierForm.displayName = 'SupplierForm'
