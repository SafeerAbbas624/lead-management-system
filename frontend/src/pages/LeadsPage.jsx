import React, { useEffect, useState } from "react";
import LeadsTable from "../components/LeadsTable";
import {
  Container,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Stack
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import AddIcon from "@mui/icons-material/Add";
import { fetchLeads, addLead, editLead, changeLeadStatus, deleteLead } from "../services/leadService";

const LeadsPage = () => {
  console.log("LeadsPage component rendering");
  
  const [leads, setLeads] = useState([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    email: "",
    firstname: "",
    lastname: "",
    phone: "",
    companyname: "",
    leadstatus: ""
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    console.log("LeadsPage useEffect running");
    loadLeads();
  }, []);

  const loadLeads = async () => {
    console.log("loadLeads function called");
    try {
      const data = await fetchLeads();
      console.log("Fetched leads data:", data);
      setLeads(data);
    } catch (error) {
      console.error("Error loading leads:", error);
      setSnackbar({
        open: true,
        message: "Failed to load leads",
        severity: "error"
      });
    }
  };

  // --- Table Actions ---
  const handleView = (lead) => {
    console.log("handleView called with lead:", lead);
    // Already handled by LeadsTable dialog
  };

  const handleEdit = async (lead) => {
    console.log("handleEdit called with lead:", lead);
    try {
      const res = await editLead(lead);
      console.log("Edit lead response:", res);
      if (res) {
        setSnackbar({ open: true, message: "Lead updated.", severity: "success" });
        loadLeads();
      } else {
        setSnackbar({ open: true, message: "Failed to update lead.", severity: "error" });
      }
    } catch (error) {
      console.error("Error editing lead:", error);
      setSnackbar({ open: true, message: "Error updating lead.", severity: "error" });
    }
  };

  const handleChangeStatus = async (lead, newStatus) => {
    console.log("handleChangeStatus called with:", { lead, newStatus });
    try {
      const res = await changeLeadStatus(lead.id, newStatus);
      console.log("Change status response:", res);
      if (res) {
        setSnackbar({ open: true, message: "Status updated.", severity: "success" });
        loadLeads();
      } else {
        setSnackbar({ open: true, message: "Failed to update status.", severity: "error" });
      }
    } catch (error) {
      console.error("Error changing lead status:", error);
      setSnackbar({ open: true, message: "Error updating status.", severity: "error" });
    }
  };

  const handleDelete = async (lead) => {
    console.log("handleDelete called with lead:", lead);
    try {
      const res = await deleteLead(lead.id);
      console.log("Delete lead response:", res);
      if (res) {
        setSnackbar({ open: true, message: "Lead deleted.", severity: "success" });
        loadLeads();
      } else {
        setSnackbar({ open: true, message: "Failed to delete lead.", severity: "error" });
      }
    } catch (error) {
      console.error("Error deleting lead:", error);
      setSnackbar({ open: true, message: "Error deleting lead.", severity: "error" });
    }
  };

  // --- Add Lead ---
  const handleAddLeadOpen = () => {
    console.log("handleAddLeadOpen called");
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
    console.log("handleAddLeadSave called with newLead:", newLead);
    try {
      const res = await addLead(newLead);
      console.log("Add lead response:", res);
      if (res) {
        setSnackbar({ open: true, message: "Lead added.", severity: "success" });
        loadLeads();
        setAddDialogOpen(false);
      } else {
        setSnackbar({ open: true, message: "Failed to add lead.", severity: "error" });
      }
    } catch (error) {
      console.error("Error adding lead:", error);
      setSnackbar({ open: true, message: "Error adding lead.", severity: "error" });
    }
  };

  // --- Export ---
  const handleExport = () => {
    console.log("handleExport called with leads:", leads);
    if (!leads.length) {
      console.log("No leads to export");
      return;
    }
    const header = Object.keys(leads[0]);
    const csvRows = [header.join(",")];
    for (const lead of leads) {
      const values = header.map((field) => `"${(lead[field] ?? "").toString().replace(/"/g, '""')}"`);
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

  console.log("Current leads state:", leads);
  console.log("Current addDialogOpen state:", addDialogOpen);
  console.log("Current newLead state:", newLead);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Stack direction="row" spacing={2} mb={3}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddLeadOpen}
        >
          Add Lead
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
        >
          Export
        </Button>
      </Stack>

      <LeadsTable
        leads={leads}
        onView={handleView}
        onEdit={handleEdit}
        onChangeStatus={handleChangeStatus}
        onDelete={handleDelete}
      />

      {/* Add Lead Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Add Lead</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Email"
            fullWidth
            value={newLead.email}
            onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
          />
          <TextField
            margin="dense"
            label="First Name"
            fullWidth
            value={newLead.firstname}
            onChange={(e) => setNewLead({ ...newLead, firstname: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Last Name"
            fullWidth
            value={newLead.lastname}
            onChange={(e) => setNewLead({ ...newLead, lastname: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Phone"
            fullWidth
            value={newLead.phone}
            onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Company"
            fullWidth
            value={newLead.companyname}
            onChange={(e) => setNewLead({ ...newLead, companyname: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Status"
            fullWidth
            value={newLead.leadstatus}
            onChange={(e) => setNewLead({ ...newLead, leadstatus: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddLeadSave} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default LeadsPage; 