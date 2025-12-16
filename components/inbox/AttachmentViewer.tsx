'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Download,
  File,
  Image,
  FileText,
  Video,
  Music,
  Archive,
} from 'lucide-react';

interface Attachment {
  url: string;
  type: string;
  filename?: string;
}

interface AttachmentViewerProps {
  attachments: Attachment[];
  messageId?: string;
}

export function AttachmentViewer({
  attachments,
  messageId,
}: AttachmentViewerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('pdf') || type.includes('document')) return FileText;
    if (type.includes('zip') || type.includes('rar') || type.includes('tar'))
      return Archive;
    return File;
  };

  const isImage = (type: string) => type.startsWith('image/');

  const handleDownload = async (
    url: string,
    filename?: string,
    index?: number
  ) => {
    try {
      // Use API endpoint if messageId and index are available
      if (messageId && index !== undefined) {
        const apiUrl = `/api/inbox/messages/${messageId}/attachments/${index}`;
        window.open(apiUrl, '_blank');
        return;
      }

      // Fallback to direct download
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to opening in new tab
      window.open(url, '_blank');
    }
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="text-xs font-medium text-muted-foreground">
        Attachments
      </div>
      <div className="grid grid-cols-1 gap-2">
        {attachments.map((att, idx) => {
          const IconComponent = getFileIcon(att.type);
          const filename =
            att.filename || att.url.split('/').pop() || `attachment-${idx + 1}`;

          return (
            <div
              key={`${att.url}-${idx}`}
              className="flex items-center space-x-2 p-2 bg-muted rounded-md"
            >
              <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />

              {isImage(att.type) ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex-1 text-left text-sm text-blue-600 hover:text-blue-800 underline truncate">
                      {filename}
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>{filename}</DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center">
                      <img
                        src={att.url}
                        alt={filename}
                        className="max-w-full max-h-96 object-contain rounded-lg"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <button
                  onClick={() => window.open(att.url, '_blank')}
                  className="flex-1 text-left text-sm text-blue-600 hover:text-blue-800 underline truncate"
                >
                  {filename}
                </button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(att.url, filename, idx)}
                className="flex-shrink-0 h-6 w-6 p-0"
                title="Download"
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
