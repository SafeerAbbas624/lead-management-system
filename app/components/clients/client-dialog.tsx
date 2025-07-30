'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientForm } from './client-form'
import { Client } from '@/types/client';
import { useToast } from '@/hooks/use-toast';

export interface ClientFormData {
  name: string;
  email: string;
  phone?: string | null;
  contactperson?: string | null;
  deliveryformat?: string | null;
  deliveryschedule?: string | null;
  percentallocation?: number | null;
  fixedallocation?: number | null;
  exclusivitysettings?: Record<string, any> | null;
  isactive: boolean;
}

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: ClientFormData | null;
  onSave: (data: ClientFormData) => Promise<void>;
  onCSVUpload: (file: File) => Promise<void>;
  defaultTab?: string;
}

export function ClientDialog({ 
  open, 
  onOpenChange, 
  client, 
  onSave, 
  onCSVUpload,
  defaultTab = 'form'
}: ClientDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleSave = async (formData: ClientFormData) => {
    try {
      setIsSaving(true);
      // Ensure all required fields are present
      if (!formData.name || !formData.email) {
        throw new Error('Name and email are required');
      }

      // Prepare data according to database schema
      const data: ClientFormData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        contactperson: formData.contactperson?.trim() || null,
        deliveryformat: formData.deliveryformat?.trim() || null,
        deliveryschedule: formData.deliveryschedule?.trim() || null,
        percentallocation: formData.percentallocation ? parseInt(formData.percentallocation.toString(), 10) : null,
        fixedallocation: formData.fixedallocation ? parseInt(formData.fixedallocation.toString(), 10) : null,
        exclusivitysettings: formData.exclusivitysettings || null,
        isactive: formData.isactive,
        // createdat will be set by the server if not provided
      };
      
      await onSave(data);
      
      // Show success toast
      toast({
        title: 'Success',
        description: client ? 'Client updated successfully.' : 'Client created successfully.',
      });
      
      if (!client) {
        setActiveTab('manual');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error saving client:', error);
      // Show error toast
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save client.',
        variant: 'destructive',
      });
      throw error; // Re-throw to allow form to handle the error
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);
      await onCSVUpload(file);
      toast({
        title: 'Success',
        description: 'Clients imported successfully',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to import clients',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        setActiveTab('form');
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          <DialogDescription>
            {client ? 'Update the client details below.' : 'Choose how you want to add clients.'}
          </DialogDescription>
        </DialogHeader>
        
        {client ? (
          <ClientForm
            initialData={client}
            onSubmit={handleSave}
            onCancel={() => onOpenChange(false)}
            isLoading={isSaving}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="form">Manual Entry</TabsTrigger>
              <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            </TabsList>
            
            <TabsContent value="form" className="pt-4">
              <ClientForm
                onSubmit={handleSave}
                onCancel={() => onOpenChange(false)}
                isLoading={isSaving}
              />
            </TabsContent>
            
            <TabsContent value="csv" className="pt-4 space-y-4">
              <div className="space-y-2">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isSaving}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Uploading...' : 'Select CSV File'}
                  </Button>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Upload a CSV file with client data
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">CSV Format:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Required fields: name, email</li>
                    <li>Optional fields: phone, contact_person, delivery_format, delivery_schedule, percent_allocation, fixed_allocation</li>
                    <li>First row should be headers</li>
                    <li>Example: name,email,phone,contact_person</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
