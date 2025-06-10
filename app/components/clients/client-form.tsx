'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ClientFormData } from './client-dialog';

// Type for form values matching the database schema
type ClientFormValues = {
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
  createdat?: string; // Will be set on the server if not provided
};

const clientFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  contactperson: z.string().optional().nullable(),
  deliveryformat: z.string().optional().nullable(),
  deliveryschedule: z.string().optional().nullable(),
  percentallocation: z.union([
    z.number().int().nonnegative('Must be a non-negative integer').nullable(),
    z.string().regex(/^\d*$/, 'Must be a number').transform(Number).nullable()
  ]).optional().nullable(),
  fixedallocation: z.union([
    z.number().int().nonnegative('Must be a non-negative integer').nullable(),
    z.string().regex(/^\d*$/, 'Must be a number').transform(Number).nullable()
  ]).optional().nullable(),
  exclusivitysettings: z.record(z.any()).optional().nullable(),
  isactive: z.boolean().default(true),
  createdat: z.string().optional() // Will be set on the server if not provided
});

interface ClientFormProps {
  initialData?: ClientFormData;
  onSubmit: (data: ClientFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ClientForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: ClientFormProps): JSX.Element {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone ?? "",
      contactperson: initialData?.contactperson ?? "",
      deliveryformat: initialData?.deliveryformat ?? "",
      deliveryschedule: initialData?.deliveryschedule ?? "",
      percentallocation: initialData?.percentallocation ?? 0,
      fixedallocation: initialData?.fixedallocation ?? 0,
      exclusivitysettings: initialData?.exclusivitysettings ?? {},
      isactive: initialData?.isactive ?? true,
    },
  });

  const handleSubmit = form.handleSubmit(async (formData) => {
    try {
      // Convert form data to match the expected type
      const data: ClientFormData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        contactperson: formData.contactperson || null,
        deliveryformat: formData.deliveryformat || null,
        deliveryschedule: formData.deliveryschedule || null,
        percentallocation: formData.percentallocation ? Number(formData.percentallocation) : null,
        fixedallocation: formData.fixedallocation ? Number(formData.fixedallocation) : null,
        exclusivitysettings: formData.exclusivitysettings || null,
        isactive: formData.isactive,
      };
      
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter client name" {...field} />
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
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactperson"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person</FormLabel>
                <FormControl>
                  <Input placeholder="Enter contact person" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deliveryformat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Format</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., CSV, API" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deliveryschedule"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Schedule</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Daily, Weekly" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="percentallocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Percent Allocation (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    max="100" 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    value={field.value === null ? '' : field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fixedallocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fixed Allocation</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    value={field.value === null ? '' : field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isactive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Is this client active and receiving leads?
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Client'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
