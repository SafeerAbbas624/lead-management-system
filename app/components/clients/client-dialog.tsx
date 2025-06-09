'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ClientForm, type ClientFormData } from './client-form';

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: ClientFormData;
  onSave: (data: ClientFormData) => Promise<void>;
}

export function ClientDialog({ open, onOpenChange, client, onSave }: ClientDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSave = async (data: ClientFormData) => {
    try {
      setIsSaving(true);
      await onSave(data);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          <DialogDescription>
            {client ? 'Update the client details below.' : 'Fill in the details to add a new client.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ClientForm
            initialData={client}
            onSubmit={handleSave}
            onCancel={() => onOpenChange(false)}
            isLoading={isSaving}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
