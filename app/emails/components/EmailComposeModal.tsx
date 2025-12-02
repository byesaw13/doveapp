'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { Send, Paperclip, X } from 'lucide-react';

interface EmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  replyData?: {
    type: 'reply' | 'reply-all' | 'forward';
    originalEmail: {
      id: string;
      subject?: string;
      from_address?: string;
      to_addresses?: string;
      body_text?: string;
      received_at?: string;
    };
  };
}

export default function EmailComposeModal({
  isOpen,
  onClose,
  replyData,
}: EmailComposeModalProps) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
  });

  // Initialize form data when modal opens or replyData changes
  React.useEffect(() => {
    if (isOpen) {
      if (replyData) {
        const { type, originalEmail } = replyData;
        let subject = originalEmail.subject || '';
        let body = '';

        // Format subject for replies/forwards
        if (type === 'reply' || type === 'reply-all') {
          if (!subject.toLowerCase().startsWith('re:')) {
            subject = `Re: ${subject}`;
          }
        } else if (type === 'forward') {
          if (!subject.toLowerCase().startsWith('fwd:')) {
            subject = `Fwd: ${subject}`;
          }
        }

        // Format body for replies/forwards
        if (type === 'reply' || type === 'reply-all') {
          const originalFrom = originalEmail.from_address || 'Unknown';
          const originalDate = originalEmail.received_at
            ? new Date(originalEmail.received_at).toLocaleString()
            : 'Unknown date';

          body = `\n\n--- Original Message ---\nFrom: ${originalFrom}\nDate: ${originalDate}\nSubject: ${originalEmail.subject || 'No subject'}\n\n${originalEmail.body_text || ''}`;
        } else if (type === 'forward') {
          const originalFrom = originalEmail.from_address || 'Unknown';
          const originalDate = originalEmail.received_at
            ? new Date(originalEmail.received_at).toLocaleString()
            : 'Unknown date';

          body = `---------- Forwarded message ---------\nFrom: ${originalFrom}\nDate: ${originalDate}\nSubject: ${originalEmail.subject || 'No subject'}\n\n${originalEmail.body_text || ''}`;
        }

        setFormData({
          to:
            type === 'reply'
              ? originalEmail.from_address || ''
              : type === 'reply-all'
                ? originalEmail.to_addresses || ''
                : '',
          cc: '',
          bcc: '',
          subject,
          body,
        });
      } else {
        // New email
        setFormData({
          to: '',
          cc: '',
          bcc: '',
          subject: '',
          body: '',
        });
      }
    }
  }, [isOpen, replyData]);

  const handleSend = async () => {
    if (!formData.to.trim() || !formData.subject.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in the To field and Subject.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formData.to,
          cc: formData.cc || undefined,
          bcc: formData.bcc || undefined,
          subject: formData.subject,
          body: formData.body,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Email Sent!',
          description: 'Your email has been sent successfully.',
        });
        onClose();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      toast({
        title: 'Send Failed',
        description:
          error instanceof Error ? error.message : 'Failed to send email.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {replyData
              ? `Compose ${replyData.type === 'reply' ? 'Reply' : replyData.type === 'reply-all' ? 'Reply All' : 'Forward'}`
              : 'Compose New Email'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* To Field */}
          <div>
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="email"
              placeholder="recipient@example.com"
              value={formData.to}
              onChange={(e) => handleInputChange('to', e.target.value)}
            />
          </div>

          {/* CC Field */}
          <div>
            <Label htmlFor="cc">CC (optional)</Label>
            <Input
              id="cc"
              type="email"
              placeholder="cc@example.com"
              value={formData.cc}
              onChange={(e) => handleInputChange('cc', e.target.value)}
            />
          </div>

          {/* BCC Field */}
          <div>
            <Label htmlFor="bcc">BCC (optional)</Label>
            <Input
              id="bcc"
              type="email"
              placeholder="bcc@example.com"
              value={formData.bcc}
              onChange={(e) => handleInputChange('bcc', e.target.value)}
            />
          </div>

          {/* Subject Field */}
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
            />
          </div>

          {/* Body Field */}
          <div>
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Write your message here..."
              className="min-h-64 resize-none"
              value={formData.body}
              onChange={(e) => handleInputChange('body', e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Paperclip className="w-4 h-4 mr-2" />
                Attach
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={sending}>
                <Send className="w-4 h-4 mr-2" />
                {sending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
