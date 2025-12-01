'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  X,
  Send,
  Paperclip,
  Bold,
  Italic,
  Underline,
  List,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface EmailComposerProps {
  initialData?: any;
  onClose: () => void;
  onSent: () => void;
}

export function EmailComposer({
  initialData,
  onClose,
  onSent,
}: EmailComposerProps) {
  const { toast } = useToast();
  const [to, setTo] = useState(initialData?.to || '');
  const [cc, setCc] = useState(initialData?.cc || '');
  const [bcc, setBcc] = useState(initialData?.bcc || '');
  const [subject, setSubject] = useState(initialData?.subject || '');
  const [body, setBody] = useState(initialData?.body || '');
  const [sending, setSending] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle reply/forward initialization
  useState(() => {
    if (initialData?.type && initialData?.originalEmail) {
      const { type, originalEmail } = initialData;

      if (type === 'reply') {
        setTo(originalEmail.sender);
        setSubject(`Re: ${originalEmail.subject || ''}`);
        setBody(
          `\n\n--- Original Message ---\nFrom: ${originalEmail.sender}\nDate: ${new Date(originalEmail.received_at).toLocaleString()}\nSubject: ${originalEmail.subject}\n\n${originalEmail.body_text || ''}`
        );
      } else if (type === 'reply-all') {
        setTo(originalEmail.sender);
        setCc(originalEmail.recipient || '');
        setSubject(`Re: ${originalEmail.subject || ''}`);
        setBody(
          `\n\n--- Original Message ---\nFrom: ${originalEmail.sender}\nDate: ${new Date(originalEmail.received_at).toLocaleString()}\nSubject: ${originalEmail.subject}\n\n${originalEmail.body_text || ''}`
        );
      } else if (type === 'forward') {
        setSubject(`Fwd: ${originalEmail.subject || ''}`);
        setBody(
          `\n\n--- Forwarded Message ---\nFrom: ${originalEmail.sender}\nDate: ${new Date(originalEmail.received_at).toLocaleString()}\nSubject: ${originalEmail.subject}\nTo: ${originalEmail.recipient}\n\n${originalEmail.body_text || ''}`
        );
      }
    }
  });

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSending(true);

      const emailData = {
        to: to.trim(),
        cc: cc.trim() || undefined,
        bcc: bcc.trim() || undefined,
        subject: subject.trim(),
        body: body.trim(),
      };

      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      toast({
        title: 'Email Sent',
        description: 'Your email has been sent successfully.',
      });

      onSent();
    } catch (error) {
      console.error('Failed to send email:', error);
      toast({
        title: 'Send Failed',
        description: 'Failed to send email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const formatText = (command: string) => {
    // Basic text formatting (can be enhanced with a rich text editor)
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end);

    let formattedText = '';
    switch (command) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
      case 'list':
        formattedText = `\n• ${selectedText}`;
        break;
      default:
        return;
    }

    const newBody =
      body.substring(0, start) + formattedText + body.substring(end);
    setBody(newBody);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">
          {initialData?.type ? `Compose ${initialData.type}` : 'Compose Email'}
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Compose Form */}
      <div className="flex-1 flex flex-col">
        {/* Recipients */}
        <div className="p-4 space-y-3 border-b border-gray-200">
          <div>
            <Label htmlFor="to" className="text-sm font-medium">
              To
            </Label>
            <Input
              id="to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="mt-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCc(!showCc)}
              className="text-xs"
            >
              Cc
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBcc(!showBcc)}
              className="text-xs"
            >
              Bcc
            </Button>
          </div>

          {showCc && (
            <div>
              <Label htmlFor="cc" className="text-sm font-medium">
                Cc
              </Label>
              <Input
                id="cc"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com"
                className="mt-1"
              />
            </div>
          )}

          {showBcc && (
            <div>
              <Label htmlFor="bcc" className="text-sm font-medium">
                Bcc
              </Label>
              <Input
                id="bcc"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="bcc@example.com"
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label htmlFor="subject" className="text-sm font-medium">
              Subject
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="mt-1"
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
          <Button variant="ghost" size="sm" onClick={() => formatText('bold')}>
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('italic')}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('underline')}
          >
            <Underline className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => formatText('list')}>
            <List className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-2" />
          <Button variant="ghost" size="sm" onClick={handleAttachment}>
            <Paperclip className="w-4 h-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 p-4">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Compose your email..."
            className="w-full h-full resize-none border-0 focus:ring-0 focus:outline-none"
          />
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            // TODO: Handle file attachments
            console.log('Files selected:', e.target.files);
          }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <Button
            onClick={handleSend}
            disabled={sending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Sending...' : 'Send'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
