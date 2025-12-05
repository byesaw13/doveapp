'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ImportSquareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportSquareDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportSquareDialogProps) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    imported: number;
    errors: string[];
  } | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setResult(null);

    try {
      const response = await fetch('/api/square/import-customers', {
        method: 'POST',
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
          setResult(null);
        }, 2000);
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to import customers',
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from Square</DialogTitle>
          <DialogDescription>
            This will import all customers from your Square account. Existing
            customers (matched by Square ID) will be skipped.
          </DialogDescription>
        </DialogHeader>

        {result && (
          <div
            className={`p-4 rounded-md ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
          >
            <p className="font-medium">{result.message}</p>
            {result.imported > 0 && (
              <p className="text-sm mt-1">
                Successfully imported {result.imported} customers
              </p>
            )}
            {result.errors.length > 0 && (
              <div className="mt-2 text-sm">
                <p className="font-medium">Errors:</p>
                <ul className="list-disc list-inside">
                  {result.errors.slice(0, 5).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li>... and {result.errors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={importing}>
            {importing ? 'Importing...' : 'Start Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
