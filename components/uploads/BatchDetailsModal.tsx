import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface BatchDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: any | null;
}

export default function BatchDetailsModal({ open, onOpenChange, batch }: BatchDetailsModalProps) {
  if (!batch) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batch Details</DialogTitle>
            <DialogDescription>Loading batch details...</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">Loading...</p>
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (batch.error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batch Details</DialogTitle>
            <DialogDescription>Error loading batch details</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-destructive">{batch.error}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Batch Details</DialogTitle>
          <DialogDescription>
            Details for batch: <strong>{batch.filename}</strong>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="font-semibold mb-3">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>ID:</strong> {batch.id}</div>
                <div><strong>File Name:</strong> {batch.filename}</div>
                <div><strong>File Type:</strong> {batch.filetype}</div>
                <div>
                  <strong>Status:</strong>
                  <Badge variant={batch.status === 'Completed' ? 'default' : 'secondary'} className="ml-2">
                    {batch.status}
                  </Badge>
                </div>
                <div><strong>Source:</strong> {batch.sourcename || 'Unknown'}</div>
                <div><strong>Supplier:</strong> {batch.supplier?.name || 'Unknown'}</div>
                <div><strong>Created:</strong> {formatDate(batch.createdat)}</div>
                <div><strong>Completed:</strong> {formatDate(batch.completedat)}</div>
              </div>
            </div>

            <Separator />

            {/* Statistics */}
            <div>
              <h4 className="font-semibold mb-3">Processing Statistics</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Total Leads:</strong> {batch.totalleads || 0}</div>
                <div><strong>Clean Leads:</strong> {batch.cleanedleads || 0}</div>
                <div><strong>Duplicate Leads:</strong> {batch.duplicateleads || 0}</div>
                <div><strong>DNC Matches:</strong> {batch.dncmatches || 0}</div>
              </div>
            </div>

            {/* Error Message */}
            {batch.errormessage && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3 text-destructive">Error Message</h4>
                  <p className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                    {batch.errormessage}
                  </p>
                </div>
              </>
            )}

            {/* Original Headers */}
            {batch.originalheaders && batch.originalheaders.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3">Original File Headers</h4>
                  <div className="flex flex-wrap gap-2">
                    {batch.originalheaders.map((header: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {header}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Sample Leads */}
            {batch.sampleLeads && batch.sampleLeads.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3">Sample Leads (First 5)</h4>
                  <div className="space-y-2">
                    {batch.sampleLeads.map((lead: any, index: number) => (
                      <div key={index} className="p-3 bg-muted rounded text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div><strong>Name:</strong> {lead.firstname} {lead.lastname}</div>
                          <div><strong>Email:</strong> {lead.email}</div>
                          <div><strong>Phone:</strong> {lead.phone}</div>
                          <div><strong>Company:</strong> {lead.companyname}</div>
                          {lead.leadcost && <div><strong>Cost:</strong> ${lead.leadcost}</div>}
                          {lead.tags && lead.tags.length > 0 && (
                            <div className="col-span-2">
                              <strong>Tags:</strong> {lead.tags.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Duplicate Leads */}
            {batch.duplicateLeads && batch.duplicateLeads.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3">Sample Duplicates (First 5)</h4>
                  <div className="space-y-2">
                    {batch.duplicateLeads.map((duplicate: any, index: number) => (
                      <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div><strong>Name:</strong> {duplicate.firstname} {duplicate.lastname}</div>
                          <div><strong>Email:</strong> {duplicate.email}</div>
                          <div><strong>Type:</strong> {duplicate.duplicate_type}</div>
                          <div className="col-span-2">
                            <strong>Reason:</strong> {duplicate.duplicate_reason}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
