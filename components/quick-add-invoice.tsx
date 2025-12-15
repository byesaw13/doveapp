'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { Receipt, Check, X } from 'lucide-react';

interface QuickAddInvoiceProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function QuickAddInvoice({
  open = false,
  onOpenChange,
}: QuickAddInvoiceProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);

  const [selectedJobId, setSelectedJobId] = useState('');

  useEffect(() => {
    if (open) {
      // Load completed jobs that don't have invoices yet
      fetch('/api/jobs?status=completed')
        .then((res) => res.json())
        .then((data) =>
          setJobs(
            Array.isArray(data)
              ? data.filter((job: any) => job.status === 'completed')
              : []
          )
        )
        .catch((error) => console.error('Failed to load jobs:', error));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/jobs/${selectedJobId}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create invoice');
      }

      toast({
        title: 'Success',
        description: 'Invoice created successfully!',
      });

      setSelectedJobId('');
      onOpenChange?.(false);
    } catch (error) {
      console.error('Failed to create invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invoice',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Receipt className="h-5 w-5 text-orange-600" />
              Create Invoice
            </DialogTitle>
            <DialogDescription>
              Create an invoice from a completed job
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Job Selection */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Select Completed Job *
              </label>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job to invoice" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title} - {job.client?.first_name}{' '}
                      {job.client?.last_name}
                      {job.total && ` ($${job.total})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {jobs.length === 0 && (
                <p className="text-sm text-slate-500 mt-2">
                  No completed jobs available for invoicing
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange?.(false)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedJobId}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                <Check className="h-4 w-4 mr-1" />
                {isSubmitting ? 'Creating...' : 'Create Invoice'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
