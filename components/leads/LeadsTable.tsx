'use client';

import React from 'react';
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
import { MoreVertical, Eye, Pencil, Trash } from "lucide-react";

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
  const handleView = (lead: Lead) => {
    console.log("View clicked for lead:", lead);
    onView(lead);
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

  return (
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
  );
} 