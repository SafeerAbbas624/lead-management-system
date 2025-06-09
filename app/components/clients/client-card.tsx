'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';

import { Client } from '@/types/client';

interface ClientCardProps {
  client: Client & {
    id: number; // Make id required for the card since we'll only render cards for existing clients
    createdat: string; // Make createdat required for display
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{client.name}</CardTitle>
            <CardDescription className="mt-1">{client.email}</CardDescription>
          </div>
          <Badge variant={client.isactive ? 'default' : 'secondary'}>
            {client.isactive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {client.phone && (
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p>{client.phone}</p>
            </div>
          )}
          {client.contactperson && (
            <div>
              <p className="text-muted-foreground">Contact Person</p>
              <p>{client.contactperson}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Member Since</p>
            <p>{format(new Date(client.createdat), 'MMM d, yyyy')}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-2" /> Edit
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
