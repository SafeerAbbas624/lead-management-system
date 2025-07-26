"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SupplierForm } from "@/components/supplier/supplier-form"

export function SupplierDialog({
  children,
  initialData,
  onSuccess,
}: {
  children: React.ReactNode
  initialData?: any
  onSuccess?: (data?: any) => void
}) {
  const [open, setOpen] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const formRef = useRef<{ reset: () => void }>(null)

  const handleSuccess = (data?: any) => {
    if (data?.api_key) {
      setApiKey(data.api_key)
      // Don't close the dialog if we're showing the API key
      return
    }
    
    // Close the dialog and reset the form
    setOpen(false)
    setApiKey("")
    formRef.current?.reset()
    
    if (onSuccess) onSuccess(data)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && apiKey) {
      // If closing with API key shown, reset everything
      setApiKey("")
      formRef.current?.reset()
    }
    setOpen(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button onClick={() => setOpen(true)}>{children}</Button>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {apiKey ? "API Key Generated" : initialData ? "Edit Supplier" : "Add New Supplier"}
          </DialogTitle>
          <DialogDescription>
            {apiKey 
              ? "Please copy and save the API key below. You won't be able to see it again after closing this dialog."
              : initialData
                ? "Update the supplier details below."
                : "Fill in the details to add a new supplier."
            }
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {apiKey ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-md relative">
                <code className="break-all font-mono text-sm">{apiKey}</code>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey)
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="text-sm text-amber-600">
                ⚠️ This is the only time you'll see this API key. Please save it in a secure location.
              </p>
              <DialogFooter>
                <Button onClick={() => handleSuccess()}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <SupplierForm
              ref={formRef}
              initialData={initialData}
              onSuccess={handleSuccess}
              onCancel={() => setOpen(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
