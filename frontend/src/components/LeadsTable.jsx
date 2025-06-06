import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  InputLabel,
  FormControl
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const statusOptions = [
  "New",
  "Contacted",
  "Qualified",
  "Lost",
  "Customer"
];

const LeadsTable = ({
  leads,
  onView,
  onEdit,
  onChangeStatus,
  onDelete
}) => {
  console.log("LeadsTable rendering with leads:", leads);
  console.log("LeadsTable props:", { onView, onEdit, onChangeStatus, onDelete });

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editedLead, setEditedLead] = useState({});
  const [newStatus, setNewStatus] = useState("");

  const handleMenuClick = (event, lead) => {
    console.log("handleMenuClick called with lead:", lead);
    setAnchorEl(event.currentTarget);
    setSelectedLead(lead);
  };

  const handleMenuClose = () => {
    console.log("handleMenuClose called");
    setAnchorEl(null);
    setSelectedLead(null);
  };

  // --- Actions ---
  const handleView = () => {
    console.log("handleView called with selectedLead:", selectedLead);
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const handleEdit = () => {
    console.log("handleEdit called with selectedLead:", selectedLead);
    setEditedLead(selectedLead);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleChangeStatus = () => {
    console.log("handleChangeStatus called with selectedLead:", selectedLead);
    setNewStatus(selectedLead.leadstatus || "");
    setStatusDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    console.log("handleDelete called with selectedLead:", selectedLead);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  // --- Dialog Actions ---
  const handleEditSave = () => {
    console.log("handleEditSave called with editedLead:", editedLead);
    onEdit(editedLead);
    setEditDialogOpen(false);
  };

  const handleStatusSave = () => {
    console.log("handleStatusSave called with:", { selectedLead, newStatus });
    onChangeStatus(selectedLead, newStatus);
    setStatusDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    console.log("handleDeleteConfirm called with selectedLead:", selectedLead);
    onDelete(selectedLead);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>First Name</TableCell>
              <TableCell>Last Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.firstname}</TableCell>
                <TableCell>{lead.lastname}</TableCell>
                <TableCell>{lead.phone}</TableCell>
                <TableCell>{lead.companyname}</TableCell>
                <TableCell>{lead.leadstatus}</TableCell>
                <TableCell>
                  <IconButton onClick={(e) => handleMenuClick(e, lead)} size="small">
                    <MoreVertIcon fontSize="inherit" />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl) && selectedLead?.id === lead.id}
                    onClose={handleMenuClose}
                  >
                    <MenuItem onClick={handleView}>View Details</MenuItem>
                    <MenuItem onClick={handleEdit}>Edit Details</MenuItem>
                    <MenuItem onClick={handleChangeStatus}>Change Status</MenuItem>
                    <MenuItem onClick={handleDelete} sx={{ color: "red" }}>
                      Delete Lead
                    </MenuItem>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- View Dialog --- */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)}>
        <DialogTitle>Lead Details</DialogTitle>
        <DialogContent>
          {selectedLead && (
            <div style={{ minWidth: 320 }}>
              {Object.entries(selectedLead).map(([key, value]) => (
                <div key={key} style={{ marginBottom: 8 }}>
                  <strong>{key}:</strong> {value?.toString() || ""}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* --- Edit Dialog --- */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Lead</DialogTitle>
        <DialogContent>
          {editedLead && (
            <form>
              <TextField
                margin="dense"
                label="Email"
                type="email"
                fullWidth
                value={editedLead.email || ""}
                onChange={(e) => setEditedLead({ ...editedLead, email: e.target.value })}
              />
              <TextField
                margin="dense"
                label="First Name"
                fullWidth
                value={editedLead.firstname || ""}
                onChange={(e) => setEditedLead({ ...editedLead, firstname: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Last Name"
                fullWidth
                value={editedLead.lastname || ""}
                onChange={(e) => setEditedLead({ ...editedLead, lastname: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Phone"
                fullWidth
                value={editedLead.phone || ""}
                onChange={(e) => setEditedLead({ ...editedLead, phone: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Company"
                fullWidth
                value={editedLead.companyname || ""}
                onChange={(e) => setEditedLead({ ...editedLead, companyname: e.target.value })}
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Status</InputLabel>
                <Select
                  native
                  value={editedLead.leadstatus || ""}
                  onChange={(e) => setEditedLead({ ...editedLead, leadstatus: e.target.value })}
                >
                  <option value="" />
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </Select>
              </FormControl>
            </form>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* --- Status Dialog --- */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Change Lead Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Status</InputLabel>
            <Select
              native
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="" />
              {statusOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleStatusSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* --- Delete Dialog --- */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Lead</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this lead?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LeadsTable; 