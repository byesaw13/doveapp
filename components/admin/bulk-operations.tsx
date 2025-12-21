'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface ImportResult {
  success: boolean;
  message: string;
  summary: {
    totalAttempted: number;
    successful: number;
    failed: number;
    csvValidation: {
      totalRows: number;
      validRows: number;
      errorRows: number;
    };
  };
  errors?: Array<{
    batch: number;
    error: string;
    count: number;
  }>;
}

interface BulkOperationsProps {
  onImportComplete?: () => void;
}

export function BulkOperations({ onImportComplete }: BulkOperationsProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a CSV file.',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);
    setImportProgress(0);

    try {
      const content = await file.text();
      setImportProgress(25);

      const response = await fetch('/api/admin/clients/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvContent: content }),
      });

      setImportProgress(75);

      const result: ImportResult = await response.json();

      if (response.ok) {
        setImportResult(result);
        toast({
          title: 'Import completed',
          description: result.message,
        });
        onImportComplete?.();
      } else {
        setImportResult(result);
        toast({
          title: 'Import failed',
          description: result.message || 'An error occurred during import.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import failed',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      setImportProgress(100);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const response = await fetch('/api/admin/clients/bulk/export');

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Export initiated',
          description: `Exporting ${result.recordCount} clients to CSV.`,
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Export failed',
          description: error.message || 'Failed to export clients.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Clients
          </CardTitle>
          <CardDescription>
            Download all clients as a CSV file for backup or external use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            {isExporting ? (
              <>
                <FileText className="mr-2 h-4 w-4 animate-pulse" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export to CSV
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Clients
          </CardTitle>
          <CardDescription>
            Upload a CSV file to bulk import clients. The file should have
            headers for first_name, last_name, email, phone, etc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {isImporting ? (
                <>
                  <FileText className="mr-2 h-4 w-4 animate-pulse" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Choose CSV File
                </>
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Processing...</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="w-full" />
            </div>
          )}

          {/* CSV Format Help */}
          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-medium mb-2">CSV Format Requirements:</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <strong>Required:</strong> first_name, last_name
              </p>
              <p>
                <strong>Optional:</strong> company_name, email, phone,
                address_line1, city, state, postal_code
              </p>
              <p>
                <strong>Example:</strong>
              </p>
              <code className="block bg-background p-2 rounded text-xs">
                first_name,last_name,email,phone,company_name
                <br />
                John,Doe,john@example.com,555-0123,ABC Corp
                <br />
                Jane,Smith,jane@example.com,555-0456,
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert
              className={
                importResult.success
                  ? 'border-green-200 bg-green-50'
                  : 'border-yellow-200 bg-yellow-50'
              }
            >
              <AlertDescription>{importResult.message}</AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {importResult.summary.totalAttempted}
                </div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.summary.successful}
                </div>
                <div className="text-sm text-muted-foreground">Imported</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.summary.failed}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {importResult.summary.csvValidation.validRows}
                </div>
                <div className="text-sm text-muted-foreground">Valid Rows</div>
              </div>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Errors:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {importResult.errors.slice(0, 10).map((error, index) => (
                    <div
                      key={index}
                      className="text-sm text-red-600 bg-red-50 p-2 rounded"
                    >
                      Batch {error.batch}: {error.error} ({error.count} records)
                    </div>
                  ))}
                  {importResult.errors.length > 10 && (
                    <div className="text-sm text-muted-foreground">
                      ... and {importResult.errors.length - 10} more errors
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
