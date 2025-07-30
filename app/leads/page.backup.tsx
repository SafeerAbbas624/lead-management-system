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
import { useToast } from "@/hooks/use-toast";
import { Download, Plus, Search, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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

  const handleView = (lead: Lead) => {
    console.log("View details clicked for lead ID:", lead.id);
    setSelectedLead(lead);
    setViewDialogOpen(true);
  };

  const handleViewClose = () => {
    setViewDialogOpen(false);
    setSelectedLead(null);
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

const handleViewClose = () => {
  setViewDialogOpen(false);
  setSelectedLead(null);
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
    </div>
  </div>

  <div className="relative">
    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
    <Input
      type="search"
      placeholder="Search leads..."
      className="w-full pl-8"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
        placeholder="Search leads..."
        className="w-full pl-8"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* View Lead Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Lead Details</DialogTitle>
              <Button variant="ghost" size="icon" onClick={handleViewClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          {selectedLead && (
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
                    <p className="text-sm font-medium text-muted-foreground">State</p>
                    <p className="mt-1 text-sm font-medium">{selectedLead.state || '-'}</p>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Zip Code</p>
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
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Client ID</p>
                    <p className="mt-1 text-sm font-medium">{selectedLead.clientid || '-'}</p>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Supplier ID</p>
                    <p className="mt-1 text-sm font-medium">{selectedLead.supplierid || '-'}</p>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Created At</p>
                    <p className="mt-1 text-sm font-medium">
                      {selectedLead.createdat ? new Date(selectedLead.createdat).toLocaleString() : '-'}
                    </p>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Updated At</p>
                    <p className="mt-1 text-sm font-medium">
                      {selectedLead.updatedat ? new Date(selectedLead.updatedat).toLocaleString() : '-'}
                    </p>
                  </div>
                  {selectedLead.tags?.length > 0 && (
                    <div className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">Tags</p>
                      <p className="mt-1 text-sm font-medium">
                        {selectedLead.tags.join(', ')}
                      </p>
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">DNC</p>
                    <p className="mt-1 text-sm font-medium">
                      {selectedLead.dnc ? 'Yes' : 'No'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
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
                className="col-span-3 border rounded-md p-2"
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
    </div>
  );
}
