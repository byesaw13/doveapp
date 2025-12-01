'use client';

import { useState, useEffect } from 'react';
import { Check, X, Clock, User, Calendar, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';

interface TimeEntry {
  id: string;
  technician_name: string;
  job_id?: string;
  start_time: string;
  end_time?: string;
  total_hours?: number;
  notes?: string;
  status: 'active' | 'completed' | 'approved' | 'rejected' | 'paid';
  job?: {
    id: string;
    title: string;
    job_number: string;
    client?: {
      first_name: string;
      last_name: string;
    };
  };
}

interface TimeApproval {
  id: string;
  time_entry_id: string;
  approver_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_hours?: number;
  approval_notes?: string;
  rejection_reason?: string;
  created_at: string;
  time_entry: TimeEntry;
}

export function TimeApprovals() {
  const { toast } = useToast();
  const [approvals, setApprovals] = useState<TimeApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<TimeApproval | null>(
    null
  );
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        '/api/time-tracking?action=pending_approvals'
      );
      if (response.ok) {
        const data = await response.json();
        setApprovals(data.approvals || []);
      }
    } catch (error) {
      console.error('Failed to load approvals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending approvals.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approval: TimeApproval) => {
    try {
      const response = await fetch('/api/time-tracking?action=approve_time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time_entry_id: approval.time_entry_id,
          approver_name: 'Admin', // TODO: Get from auth context
          status: 'approved',
          approved_hours: approval.time_entry.total_hours,
          approval_notes: approvalNotes,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Approved',
          description: 'Time entry has been approved.',
        });
        setShowApprovalDialog(false);
        setSelectedApproval(null);
        setApprovalNotes('');
        await loadPendingApprovals();
      } else {
        throw new Error('Failed to approve time entry');
      }
    } catch (error) {
      console.error('Failed to approve:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve time entry.',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (approval: TimeApproval) => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/time-tracking?action=approve_time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time_entry_id: approval.time_entry_id,
          approver_name: 'Admin', // TODO: Get from auth context
          status: 'rejected',
          rejection_reason: rejectionReason,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Rejected',
          description: 'Time entry has been rejected.',
        });
        setShowApprovalDialog(false);
        setSelectedApproval(null);
        setRejectionReason('');
        await loadPendingApprovals();
      } else {
        throw new Error('Failed to reject time entry');
      }
    } catch (error) {
      console.error('Failed to reject:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject time entry.',
        variant: 'destructive',
      });
    }
  };

  const formatDuration = (hours?: number) => {
    if (!hours) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Time Approvals</h2>
          <p className="text-muted-foreground">
            Review and approve technician time entries
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {approvals.length} Pending
        </Badge>
      </div>

      {approvals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Pending Approvals</h3>
            <p className="text-muted-foreground text-center">
              All time entries have been reviewed. New entries will appear here
              for approval.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Pending Time Approvals</CardTitle>
            <CardDescription>
              Review technician time entries before they are finalized
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Technician</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {approval.time_entry.technician_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {approval.time_entry.job ? (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {approval.time_entry.job.job_number}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {approval.time_entry.job.title}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          No job assigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div>
                            {formatDateTime(approval.time_entry.start_time)}
                          </div>
                          {approval.time_entry.end_time && (
                            <div className="text-sm text-muted-foreground">
                              to{' '}
                              {new Date(
                                approval.time_entry.end_time
                              ).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatDuration(approval.time_entry.total_hours)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedApproval(approval);
                            setShowApprovalDialog(true);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Time Entry</DialogTitle>
            <DialogDescription>
              Review the time entry details and approve or reject it.
            </DialogDescription>
          </DialogHeader>

          {selectedApproval && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-medium">Technician</Label>
                  <p>{selectedApproval.time_entry.technician_name}</p>
                </div>
                <div>
                  <Label className="font-medium">Duration</Label>
                  <p>
                    {formatDuration(selectedApproval.time_entry.total_hours)}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="font-medium">Time Period</Label>
                  <p>
                    {formatDateTime(selectedApproval.time_entry.start_time)}
                    {selectedApproval.time_entry.end_time &&
                      ` - ${new Date(selectedApproval.time_entry.end_time).toLocaleTimeString()}`}
                  </p>
                </div>
                {selectedApproval.time_entry.notes && (
                  <div className="col-span-2">
                    <Label className="font-medium">Notes</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedApproval.time_entry.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="approval-notes">
                    Approval Notes (Optional)
                  </Label>
                  <Textarea
                    id="approval-notes"
                    placeholder="Add any notes about this approval..."
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleApprove(selectedApproval)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const reason = prompt('Reason for rejection:');
                      if (reason) {
                        setRejectionReason(reason);
                        handleReject(selectedApproval);
                      }
                    }}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
