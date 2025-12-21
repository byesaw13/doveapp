'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, MapPin, Camera } from 'lucide-react';

interface EmergencyRequestData {
  location: string;
  description: string;
  urgency: string;
  contactPhone: string;
}

interface EmergencyRequestDialogProps {
  trigger?: React.ReactNode;
  onSubmit?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EmergencyRequestDialog({
  trigger,
  onSubmit,
  open: controlledOpen,
  onOpenChange,
}: EmergencyRequestDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState<EmergencyRequestData>({
    location: '',
    description: '',
    urgency: 'high',
    contactPhone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.location.trim() ||
      !formData.description.trim() ||
      !formData.contactPhone.trim()
    ) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/portal/emergency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to submit request' }));
        throw new Error(error.error || 'Failed to submit request');
      }

      setMessage({
        type: 'success',
        text: 'Emergency request submitted! Our team will contact you shortly.',
      });
      setFormData({
        location: '',
        description: '',
        urgency: 'high',
        contactPhone: '',
      });

      // Close dialog after success
      setTimeout(() => {
        setOpen(false);
        setMessage(null);
        onSubmit?.();
      }, 3000);
    } catch (error) {
      console.error('Emergency request submission error:', error);
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to submit request. Please call us directly.',
      });
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="destructive" size="sm">
      <AlertTriangle className="h-4 w-4 mr-2" />
      Emergency
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Emergency Service Request
          </DialogTitle>
        </DialogHeader>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800">
            <strong>Emergency services are available 24/7.</strong> If this is a
            life-threatening emergency, please call 911 immediately. For urgent
            service needs, submit this form and we'll respond as quickly as
            possible.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <Alert
              className={
                message.type === 'error'
                  ? 'border-red-200 bg-red-50'
                  : 'border-green-200 bg-green-50'
              }
            >
              <AlertDescription
                className={
                  message.type === 'error' ? 'text-red-800' : 'text-green-800'
                }
              >
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="location" className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              Location *
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Address or location description"
              required
            />
          </div>

          <div>
            <Label htmlFor="urgency">Urgency Level *</Label>
            <select
              id="urgency"
              value={formData.urgency}
              onChange={(e) =>
                setFormData({ ...formData, urgency: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            >
              <option value="high">High - Respond within 1 hour</option>
              <option value="urgent">Urgent - Respond within 30 minutes</option>
              <option value="critical">
                Critical - Immediate response needed
              </option>
            </select>
          </div>

          <div>
            <Label htmlFor="contactPhone">Contact Phone *</Label>
            <Input
              id="contactPhone"
              type="tel"
              value={formData.contactPhone}
              onChange={(e) =>
                setFormData({ ...formData, contactPhone: e.target.value })
              }
              placeholder="(555) 123-4567"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the emergency situation..."
              rows={4}
              required
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start">
              <Camera className="h-4 w-4 mr-2 mt-0.5 text-yellow-600" />
              <div className="text-sm text-yellow-800">
                <strong>Photos helpful:</strong> If safe, include photos of the
                issue to help our team respond faster. You can add photos after
                submitting this form.
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Emergency Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
