'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Eye, Pencil, Trash, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Lead {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  companyname: string;
  leadstatus: string;
  [key: string]: any;
}

interface LeadsTableProps {
  leads: Lead[];
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onChangeStatus: (lead: Lead, newStatus: string) => void;
  onDelete: (lead: Lead) => void;
}

export default function LeadsTable({ leads, onView, onEdit, onChangeStatus, onDelete }: LeadsTableProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const handleView = (lead: Lead) => {
    setSelectedLead(lead);
    setViewDialogOpen(true);
    onView(lead);
  };

  const handleViewClose = () => {
    setViewDialogOpen(false);
    setSelectedLead(null);
  };

  const handleEdit = (lead: Lead) => {
    console.log("Edit clicked for lead:", lead);
    onEdit(lead);
  };

  const handleChangeStatus = (lead: Lead, newStatus: string) => {
    console.log("Change status clicked for lead:", lead, "to status:", newStatus);
    onChangeStatus(lead, newStatus);
  };

  const handleDelete = (lead: Lead) => {
    console.log("Delete clicked for lead:", lead);
    onDelete(lead);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-500';
      case 'contacted':
        return 'bg-yellow-500';
      case 'qualified':
        return 'bg-green-500';
      case 'unqualified':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const renderField = (label: string, value: any, className: string = '') => (
    <div className={`p-4 ${className}`}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value || value === 0 ? value : '-'}</p>
    </div>
  );

  const renderStatusBadge = (status: string) => (
    <Badge className={`${getStatusColor(status)}`}>
      {status}
    </Badge>
  );
  
  const renderLeadDetails = (lead: Lead) => (
    <div className="space-y-6 py-2">
      {/* Personal Information */}
      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-lg">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {renderField('First Name', lead.firstname)}
          {renderField('Last Name', lead.lastname)}
          {renderField('Email', lead.email)}
          {renderField('Phone', lead.phone)}
          {renderField('Company', lead.companyname)}
          {renderField('Tax ID', lead.taxid)}
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-lg">Address Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {renderField('Address', lead.address)}
          {renderField('City', lead.city)}
          {renderField('State', lead.state)}
          {renderField('Zip Code', lead.zipcode)}
          {renderField('Country', lead.country)}
        </CardContent>
      </Card>

      {/* Lead Information */}
      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-lg">Lead Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          <div className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <div className="mt-1">
              {renderStatusBadge(lead.leadstatus)}
            </div>
          </div>
          {renderField('Lead Source', lead.leadsource)}
          {renderField('Lead Score', lead.leadscore)}
          {renderField('Lead Cost', lead.leadcost ? `$${lead.leadcost}` : null)}
          {renderField('Exclusive', lead.exclusivity ? 'Yes' : 'No')}
          {lead.exclusivity && renderField('Exclusivity Notes', lead.exclusivitynotes)}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-lg">Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {renderField('Client ID', lead.clientid)}
          {renderField('Supplier ID', lead.supplierid)}
          {renderField('DNC', lead.dnc ? 'Yes' : 'No')}
          {lead.createdat && renderField('Created At', new Date(lead.createdat).toLocaleString())}
          {lead.updatedat && renderField('Updated At', new Date(lead.updatedat).toLocaleString())}
          {lead.tags?.length > 0 && renderField('Tags', lead.tags.join(', '))}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>{`${lead.firstname} ${lead.lastname}`}</TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.phone}</TableCell>
                <TableCell>{lead.companyname}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(lead.leadstatus)}>
                    {lead.leadstatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(lead)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(lead)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleChangeStatus(lead, 'new')}>
                        <Badge className="mr-2 bg-blue-500">New</Badge>
                        Mark as New
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleChangeStatus(lead, 'contacted')}>
                        <Badge className="mr-2 bg-yellow-500">Contacted</Badge>
                        Mark as Contacted
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleChangeStatus(lead, 'qualified')}>
                        <Badge className="mr-2 bg-green-500">Qualified</Badge>
                        Mark as Qualified
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleChangeStatus(lead, 'unqualified')}>
                        <Badge className="mr-2 bg-red-500">Unqualified</Badge>
                        Mark as Unqualified
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(lead)}>
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Lead Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">Lead Details</DialogTitle>
              <Button variant="ghost" size="icon" onClick={handleViewClose} aria-label="Close">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>
          <DialogDescription className="sr-only">
            Detailed information about the selected lead
          </DialogDescription>
          {selectedLead && renderLeadDetails(selectedLead)}
        </DialogContent>
      </Dialog>
    </div>
  );
}