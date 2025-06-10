"use client"

import React from 'react';
import LeadsTable from '@/components/leads/LeadsTable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Download, Plus, Search, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchLeads, addLead, editLead, changeLeadStatus, deleteLead, fetchLeadsWithSearch, Lead, PaginatedResponse } from '@/services/leadService';

export default function LeadsPage() {
  const [leadsData, setLeadsData] = React.useState<PaginatedResponse<Lead>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editingLead, setEditingLead] = React.useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [newLead, setNewLead] = React.useState({
    email: "",
    firstname: "",
    lastname: "",
    phone: "",
    companyname: "",
    taxid: "",
    address: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    leadsource: "",
    leadstatus: "New",
    leadscore: 0,
    leadcost: 0,
    exclusivity: false,
    exclusivitynotes: ""
  });
  
  const { toast } = useToast();

  React.useEffect(() => {
    loadLeads();
  }, [searchTerm]);

  const loadLeads = async (page: number = 1, search: string = searchTerm) => {
    setIsLoading(true);
    try {
      let response;
      if (search && search.trim()) {
        response = await fetchLeadsWithSearch(search.trim(), page, leadsData.pageSize);
      } else {
        response = await fetchLeads(page, leadsData.pageSize);
      }
      setLeadsData(response);
    } catch (error) {
      console.error("Error loading leads:", error);
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    loadLeads(page);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadLeads(1, searchTerm);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-purple-100 text-purple-800';
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'unqualified':
        return 'bg-red-100 text-red-800';
      case 'customer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleView = (lead: Lead) => {
    setSelectedLead(lead);
    setViewDialogOpen(true);
  };

  const handleViewClose = () => {
    setViewDialogOpen(false);
    setSelectedLead(null);
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingLead) return;
    
    try {
      const updatedLead = await editLead(editingLead);
      setLeadsData(prev => ({
        ...prev,
        data: prev.data.map(l => l.id === updatedLead.id ? updatedLead : l)
      }));
      setEditDialogOpen(false);
      setEditingLead(null);
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
    } catch (error) {
      console.error("Error updating lead:", error);
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive",
      });
    }
  };

  const handleChangeStatus = async (lead: Lead, newStatus: string) => {
    try {
      const updatedLead = await changeLeadStatus(lead.id, newStatus);
      setLeadsData(prev => ({
        ...prev,
        data: prev.data.map(l => l.id === updatedLead.id ? updatedLead : l)
      }));
      toast({
        title: "Success",
        description: `Lead status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (lead: Lead) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await deleteLead(lead.id);
      // Reload the current page to reflect the deletion
      loadLeads(leadsData.page);
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      });
    }
  };

  const handleAddLeadOpen = () => {
    setNewLead({
      email: "",
      firstname: "",
      lastname: "",
      phone: "",
      companyname: "",
      taxid: "",
      address: "",
      city: "",
      state: "",
      zipcode: "",
      country: "",
      leadsource: "",
      leadstatus: "New",
      leadscore: 0,
      leadcost: 0,
      exclusivity: false,
      exclusivitynotes: ""
    });
    setAddDialogOpen(true);
  };

  const handleAddLeadSave = async () => {
    try {
      const createdLead = await addLead(newLead);
      // Reload the current page to show the new lead
      loadLeads(leadsData.page);
      setAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Lead added successfully",
      });
    } catch (error) {
      console.error("Error adding lead:", error);
      toast({
        title: "Error",
        description: "Failed to add lead",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    console.log("Export leads clicked");
    if (!leadsData.data.length) return;
    
    const header = Object.keys(leadsData.data[0]);
    const csvRows = [header.join(",")];
    
    for (const lead of leadsData.data) {
      const values = header.map((field) => {
        const value = lead[field as keyof typeof lead];
        return `"${(value != null ? value.toString() : "").replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    }
    
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Leads</h1>
        <div className="flex gap-2">
          <Button onClick={handleAddLeadOpen}>
            <Plus className="mr-2 h-4 w-4" /> Add Lead
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search leads..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </form>

      <div className="space-y-4">
        <div className="rounded-md border">
          <LeadsTable 
            leads={leadsData.data} 
            onView={handleView} 
            onEdit={handleEdit}
            onChangeStatus={handleChangeStatus}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        </div>
        
        {leadsData.total > 0 && (
          <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{(leadsData.page - 1) * leadsData.pageSize + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(leadsData.page * leadsData.pageSize, leadsData.total)}
              </span>{' '}
              of <span className="font-medium">{leadsData.total}</span> leads
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(leadsData.page - 1)}
                disabled={leadsData.page === 1 || isLoading}
              >
                Previous
              </Button>
              <div className="text-sm">
                Page {leadsData.page} of {leadsData.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(leadsData.page + 1)}
                disabled={leadsData.page >= leadsData.totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Lead Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Fill in the details below to add a new lead.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstname">First Name</Label>
                  <Input
                    id="firstname"
                    value={newLead.firstname}
                    onChange={(e) => setNewLead({ ...newLead, firstname: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastname">Last Name</Label>
                  <Input
                    id="lastname"
                    value={newLead.lastname}
                    onChange={(e) => setNewLead({ ...newLead, lastname: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="john.doe@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Company Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyname">Company Name</Label>
                  <Input
                    id="companyname"
                    value={newLead.companyname}
                    onChange={(e) => setNewLead({ ...newLead, companyname: e.target.value })}
                    placeholder="Acme Inc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxid">Tax ID</Label>
                  <Input
                    id="taxid"
                    value={newLead.taxid}
                    onChange={(e) => setNewLead({ ...newLead, taxid: e.target.value })}
                    placeholder="12-3456789"
                  />
                </div>
              </div>

              <h3 className="text-lg font-medium mt-6">Address</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={newLead.address}
                    onChange={(e) => setNewLead({ ...newLead, address: e.target.value })}
                    placeholder="123 Main St"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={newLead.city}
                      onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={newLead.state}
                      onChange={(e) => setNewLead({ ...newLead, state: e.target.value })}
                      placeholder="NY"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipcode">ZIP/Postal Code</Label>
                    <Input
                      id="zipcode"
                      value={newLead.zipcode}
                      onChange={(e) => setNewLead({ ...newLead, zipcode: e.target.value })}
                      placeholder="10001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={newLead.country}
                      onChange={(e) => setNewLead({ ...newLead, country: e.target.value })}
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-medium">Lead Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="leadsource">Lead Source</Label>
                <select
                  id="leadsource"
                  value={newLead.leadsource}
                  onChange={(e) => setNewLead({ ...newLead, leadsource: e.target.value })}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">Select a source</option>
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                  <option value="In Person">In Person</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadstatus">Status</Label>
                <select
                  id="leadstatus"
                  value={newLead.leadstatus}
                  onChange={(e) => setNewLead({ ...newLead, leadstatus: e.target.value })}
                  className="w-full border rounded-md p-2"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Unqualified">Unqualified</option>
                  <option value="Customer">Customer</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadscore">Lead Score</Label>
                <Input
                  id="leadscore"
                  type="number"
                  min="0"
                  max="100"
                  value={newLead.leadscore}
                  onChange={(e) => setNewLead({ ...newLead, leadscore: parseInt(e.target.value) || 0 })}
                  placeholder="0-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadcost">Lead Cost ($)</Label>
                <Input
                  id="leadcost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newLead.leadcost}
                  onChange={(e) => setNewLead({ ...newLead, leadcost: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="exclusivity"
                  checked={newLead.exclusivity}
                  onChange={(e) => setNewLead({ ...newLead, exclusivity: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Label htmlFor="exclusivity">Exclusive Lead</Label>
              </div>

              {newLead.exclusivity && (
                <div className="space-y-2">
                  <Label htmlFor="exclusivitynotes">Exclusivity Notes</Label>
                  <textarea
                    id="exclusivitynotes"
                    value={newLead.exclusivitynotes}
                    onChange={(e) => setNewLead({ ...newLead, exclusivitynotes: e.target.value })}
                    className="w-full border rounded-md p-2"
                    rows={3}
                    placeholder="Enter any exclusivity terms or notes..."
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLeadSave}>
              <Plus className="mr-2 h-4 w-4" /> Add Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Update the lead details below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstname">First Name</Label>
                  <Input
                    id="edit-firstname"
                    value={editingLead?.firstname || ''}
                    onChange={(e) => setEditingLead(prev => prev ? {...prev, firstname: e.target.value} : null)}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastname">Last Name</Label>
                  <Input
                    id="edit-lastname"
                    value={editingLead?.lastname || ''}
                    onChange={(e) => setEditingLead(prev => prev ? {...prev, lastname: e.target.value} : null)}
                    placeholder="Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingLead?.email || ''}
                    onChange={(e) => setEditingLead(prev => prev ? {...prev, email: e.target.value} : null)}
                    placeholder="john.doe@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={editingLead?.phone || ''}
                    onChange={(e) => setEditingLead(prev => prev ? {...prev, phone: e.target.value} : null)}
                    placeholder="(123) 456-7890"
                  />
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Company Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-company">Company Name</Label>
                  <Input
                    id="edit-company"
                    value={editingLead?.companyname || ''}
                    onChange={(e) => setEditingLead(prev => prev ? {...prev, companyname: e.target.value} : null)}
                    placeholder="Acme Inc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <select
                    id="edit-status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={editingLead?.leadstatus || 'New'}
                    onChange={(e) => setEditingLead(prev => prev ? {...prev, leadstatus: e.target.value} : null)}
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Unqualified">Unqualified</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-source">Lead Source</Label>
                  <Input
                    id="edit-source"
                    value={editingLead?.leadsource || ''}
                    onChange={(e) => setEditingLead(prev => prev ? {...prev, leadsource: e.target.value} : null)}
                    placeholder="e.g. Website, Referral, etc."
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Lead Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedLead && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>Lead Details</DialogTitle>
                  <Button variant="ghost" size="icon" onClick={handleViewClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">First Name</p>
                      <p className="mt-1 text-sm font-medium">{selectedLead.firstname || '-'}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">Last Name</p>
                      <p className="mt-1 text-sm font-medium">{selectedLead.lastname || '-'}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="mt-1 text-sm font-medium">{selectedLead.email || '-'}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="mt-1 text-sm font-medium">{selectedLead.phone || '-'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Company Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Company Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">Company</p>
                      <p className="mt-1 text-sm font-medium">{selectedLead.companyname || '-'}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">Tax ID</p>
                      <p className="mt-1 text-sm font-medium">{selectedLead.taxid || '-'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Address Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Address Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p className="mt-1 text-sm font-medium">{selectedLead.address || '-'}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">City</p>
                      <p className="mt-1 text-sm font-medium">{selectedLead.city || '-'}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">State/Province</p>
                      <p className="mt-1 text-sm font-medium">{selectedLead.state || '-'}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">ZIP/Postal Code</p>
                      <p className="mt-1 text-sm font-medium">{selectedLead.zipcode || '-'}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">Country</p>
                      <p className="mt-1 text-sm font-medium">{selectedLead.country || '-'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Lead Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lead Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge className={getStatusColor(selectedLead.leadstatus)}>
                        {selectedLead.leadstatus}
                      </Badge>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">Lead Source</p>
                      <p className="mt-1 text-sm font-medium">{selectedLead.leadsource || '-'}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">Lead Score</p>
                      <p className="mt-1 text-sm font-medium">{selectedLead.leadscore || '-'}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">Lead Cost</p>
                      <p className="mt-1 text-sm font-medium">
                        {selectedLead.leadcost ? `$${selectedLead.leadcost}` : '-'}
                      </p>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">Exclusivity</p>
                      <p className="mt-1 text-sm font-medium">
                        {selectedLead.exclusivity ? 'Yes' : 'No'}
                      </p>
                    </div>
                    {selectedLead.exclusivity && (
                      <div className="p-4">
                        <p className="text-sm font-medium text-muted-foreground">Exclusivity Notes</p>
                        <p className="mt-1 text-sm font-medium">
                          {selectedLead.exclusivitynotes || '-'}
                        </p>
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">Created At</p>
                      <p className="mt-1 text-sm font-medium">
                        {selectedLead.createdat ? new Date(selectedLead.createdat).toLocaleString() : '-'}
                      </p>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                      <p className="mt-1 text-sm font-medium">
                        {selectedLead.updatedat ? new Date(selectedLead.updatedat).toLocaleString() : '-'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
