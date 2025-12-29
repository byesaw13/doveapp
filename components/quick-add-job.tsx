'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Briefcase, Check, X } from 'lucide-react';

interface QuickAddJobProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function QuickAddJob({ open = false, onOpenChange }: QuickAddJobProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    description: '',
    service_date: '',
    scheduled_time: '09:00',
    status: 'scheduled' as const,
  });

  useEffect(() => {
    if (open) {
      // Load clients
      fetch('/api/clients')
        .then((res) => res.json())
        .then((data) => setClients(data))
        .catch((error) => console.error('Failed to load clients:', error));

      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      setFormData((prev) => ({ ...prev, service_date: today }));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: formData.client_id,
          title: formData.title,
          description: formData.description || null,
          scheduled_date: formData.service_date,
          scheduled_time: formData.scheduled_time,
          status: formData.status,
          subtotal: 0,
          tax: 0,
          total: 0,
          property_id: null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create job');
      }

      toast({
        title: 'Success',
        description: 'Job created successfully!',
      });

      // Reset form
      setFormData({
        client_id: '',
        title: '',
        description: '',
        service_date: new Date().toISOString().split('T')[0],
        scheduled_time: '09:00',
        status: 'scheduled',
      });
      onOpenChange?.(false);
    } catch (error) {
      console.error('Failed to create job:', error);
      toast({
        title: 'Error',
        description: 'Failed to create job',
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
              <Briefcase className="h-5 w-5 text-indigo-600" />
              Create New Job
            </DialogTitle>
            <DialogDescription>
              Quickly schedule a job for a client
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Client Selection */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Client *
              </label>
              <Select
                value={formData.client_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, client_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Job Title */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Job Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Lawn Maintenance"
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Additional details..."
                rows={3}
              />
            </div>

            {/* Service Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Service Date *
                </label>
                <Input
                  type="date"
                  value={formData.service_date}
                  onChange={(e) =>
                    setFormData({ ...formData, service_date: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Time
                </label>
                <Input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduled_time: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Status
              </label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quote">Quote</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
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
                disabled={
                  isSubmitting || !formData.client_id || !formData.title
                }
                className="flex-1 bg-indigo-500 hover:bg-indigo-600"
              >
                <Check className="h-4 w-4 mr-1" />
                {isSubmitting ? 'Creating...' : 'Create Job'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
