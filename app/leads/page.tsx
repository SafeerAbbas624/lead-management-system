"use client"

import React from 'react';
import LeadsTable from '@/components/leads/LeadsTable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Download, Plus, Search } from "lucide-react";
import { fetchLeads, addLead, editLead, changeLeadStatus, deleteLead, fetchLeadsWithSearch, Lead } from '@/services/leadService';

export default function LeadsPage() {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [newLead, setNewLead] = React.useState({
    email: "",
    firstname: "",
    lastname: "",
    phone: "",
    companyname: "",
    leadstatus: ""
  });
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();

  React.useEffect(() => {
    loadLeads();
  }, [searchTerm]);

  const loadLeads = async () => {
    try {
      let data: Lead[];
      if (searchTerm) {
        data = await fetchLeadsWithSearch(searchTerm);
      } else {
        data = await fetchLeads();
      }
      setLeads(data);
    } catch (error) {
      console.error("Error loading leads:", error);
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
    }
  };

  // --- Table Actions ---
  const handleView = (lead: Lead) => {
    console.log("View details clicked for lead ID:", lead.id);
  };

  const handleEdit = async (lead: Lead) => {
    console.log("Edit lead clicked for lead ID:", lead.id);
    try {
      const res = await editLead(lead);
      if (res) {
        toast({
          title: "Success",
          description: "Lead updated successfully",
        });
        loadLeads();
      } else {
        toast({
          title: "Error",
          description: "Failed to update lead",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error editing lead:", error);
      toast({
        title: "Error",
        description: "Error updating lead",
        variant: "destructive",
      });
    }
  };

  const handleChangeStatus = async (lead: Lead, newStatus: string) => {
    console.log("Change status clicked for lead ID:", lead.id);
    try {
      const res = await changeLeadStatus(lead.id, newStatus);
      if (res) {
        toast({
          title: "Success",
          description: "Status updated successfully",
        });
        loadLeads();
      } else {
        toast({
          title: "Error",
          description: "Failed to update status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error changing lead status:", error);
      toast({
        title: "Error",
        description: "Error updating status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (lead: Lead) => {
    console.log("Delete lead clicked for lead ID:", lead.id);
    try {
      await deleteLead(lead.id);
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
      loadLeads();
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast({
        title: "Error",
        description: "Error deleting lead",
        variant: "destructive",
      });
    }
  };

  // --- Add Lead ---
  const handleAddLeadOpen = () => {
    console.log("Add lead button clicked - header");
    setAddDialogOpen(true);
    setNewLead({
      email: "",
      firstname: "",
      lastname: "",
      phone: "",
      companyname: "",
      leadstatus: ""
    });
  };

  const handleAddLeadSave = async () => {
    try {
      const res = await addLead(newLead);
      if (res) {
        toast({
          title: "Success",
          description: "Lead added successfully",
        });
        loadLeads();
        setAddDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to add lead",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding lead:", error);
      toast({
        title: "Error",
        description: "Error adding lead",
        variant: "destructive",
      });
    }
  };

  // --- Export ---
  const handleExport = () => {
    console.log("Export leads clicked");
    if (!leads.length) return;
    const header = Object.keys(leads[0]);
    const csvRows = [header.join(",")];
    for (const lead of leads) {
      const values = header.map((field) => {
        const value = lead[field];
        return `"${(value != null ? value.toString() : "").replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    }
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "leads_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Leads</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads (Name, Email, Phone, Tags)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={handleAddLeadOpen}>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <LeadsTable
        leads={leads}
        onView={handleView}
        onEdit={handleEdit}
        onChangeStatus={handleChangeStatus}
        onDelete={handleDelete}
      />

      {/* Add Lead Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lead</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstname" className="text-right">
                First Name
              </Label>
              <Input
                id="firstname"
                value={newLead.firstname}
                onChange={(e) => setNewLead({ ...newLead, firstname: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastname" className="text-right">
                Last Name
              </Label>
              <Input
                id="lastname"
                value={newLead.lastname}
                onChange={(e) => setNewLead({ ...newLead, lastname: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                value={newLead.phone}
                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="companyname" className="text-right">
                Company
              </Label>
              <Input
                id="companyname"
                value={newLead.companyname}
                onChange={(e) => setNewLead({ ...newLead, companyname: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leadstatus" className="text-right">
                Status
              </Label>
              <Input
                id="leadstatus"
                value={newLead.leadstatus}
                onChange={(e) => setNewLead({ ...newLead, leadstatus: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLeadSave}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
