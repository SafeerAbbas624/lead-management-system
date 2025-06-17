import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BatchDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: any | null;
}

export default function BatchDetailsModal({ open, onOpenChange, batch }: BatchDetailsModalProps) {
  if (!batch) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Batch Details</DialogTitle>
          <DialogDescription>Details for batch <b>{batch.fileName || batch.filename}</b></DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <div><b>ID:</b> {batch.id}</div>
          <div><b>File Name:</b> {batch.fileName || batch.filename}</div>
          <div><b>Status:</b> {batch.status}</div>
          <div><b>Total Leads:</b> {batch.totalLeads ?? batch.totalleads}</div>
          <div><b>Cleaned Leads:</b> {batch.cleanedLeads ?? batch.cleanedleads}</div>
          <div><b>Duplicate Leads:</b> {batch.duplicateLeads ?? batch.duplicateleads}</div>
          <div><b>DNC Matches:</b> {batch.dncMatches ?? batch.dncmatches}</div>
          <div><b>Created At:</b> {batch.createdAt ?? batch.createdat}</div>
          <div><b>Completed At:</b> {batch.completedAt ?? batch.completedat}</div>
          {batch.errormessage && <div className="text-destructive"><b>Error:</b> {batch.errormessage}</div>}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
