'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, Mail, MessageSquare } from 'lucide-react';

interface SendInvoiceData {
  recipientEmail: string;
  ccEmails: string;
  subject: string;
  message: string;
  sendSms: boolean;
  smsPhone: string;
}

interface SendInvoiceDialogProps {
  invoiceId: string;
  invoiceNumber: string;
  customerEmail?: string;
  customerPhone?: string;
  trigger?: React.ReactNode;
  onSent?: () => void;
}

export function SendInvoiceDialog({
  invoiceId,
  invoiceNumber,
  customerEmail,
  customerPhone,
  trigger,
  onSent,
}: SendInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState<SendInvoiceData>({
    recipientEmail: customerEmail || '',
    ccEmails: '',
    subject: `Invoice ${invoiceNumber} - Payment Due`,
    message: `Dear Customer,

Please find attached invoice ${invoiceNumber}. The payment is due within 30 days.

If you have any questions, please don't hesitate to contact us.

Thank you for your business!

Best regards,
Your Service Team`,
    sendSms: false,
    smsPhone: customerPhone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.recipientEmail?.trim()) {
      setMessage({ type: 'error', text: 'Recipient email is required' });
      return;
    }

    if (formData.sendSms && !formData.smsPhone?.trim()) {
      setMessage({ type: 'error', text: 'Phone number is required for SMS' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to send invoice' }));
        throw new Error(error.error || 'Failed to send invoice');
      }

      const result = await response.json();
      setMessage({
        type: 'success',
        text: `Invoice sent successfully! ${result.emailSent ? 'Email sent.' : ''} ${result.smsSent ? 'SMS sent.' : ''}`.trim(),
      });

      // Close dialog after success
      setTimeout(() => {
        setOpen(false);
        setMessage(null);
        onSent?.();
      }, 2000);
    } catch (error) {
      console.error('Send invoice error:', error);
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to send invoice. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" className="w-full flex items-center gap-2">
      <Send className="w-4 h-4" />
      Send Invoice
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Send className="h-5 w-5 mr-2" />
            Send Invoice {invoiceNumber}
          </DialogTitle>
        </DialogHeader>

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

          <div className="space-y-4">
            {/* Email Section */}
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                <Label className="text-sm font-medium text-blue-800">
                  Email Invoice
                </Label>
              </div>

              <div>
                <Label htmlFor="recipientEmail">Recipient Email *</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  value={formData.recipientEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, recipientEmail: e.target.value })
                  }
                  placeholder="customer@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="ccEmails">CC Emails (optional)</Label>
                <Input
                  id="ccEmails"
                  value={formData.ccEmails}
                  onChange={(e) =>
                    setFormData({ ...formData, ccEmails: e.target.value })
                  }
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>

              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  placeholder="Invoice subject"
                  required
                />
              </div>

              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Email message"
                  rows={6}
                  required
                />
              </div>
            </div>

            {/* SMS Section */}
            <div className="space-y-3 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
                <Label className="text-sm font-medium text-green-800">
                  SMS Notification (Optional)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendSms"
                  checked={formData.sendSms}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, sendSms: checked as boolean })
                  }
                />
                <Label htmlFor="sendSms" className="text-sm">
                  Send SMS notification with payment link
                </Label>
              </div>

              {formData.sendSms && (
                <div>
                  <Label htmlFor="smsPhone">Phone Number *</Label>
                  <Input
                    id="smsPhone"
                    value={formData.smsPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, smsPhone: e.target.value })
                    }
                    placeholder="(555) 123-4567"
                    required={formData.sendSms}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invoice
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
