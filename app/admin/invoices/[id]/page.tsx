'use client';

import * as React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  PageContainer,
  EmptyState,
  Spinner,
  StatusBadge,
  Button,
  ButtonLoader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import {
  LineItemsTable,
  LineItemsTotals,
  PaymentPanel,
} from '@/components/commercial';
import { SendInvoiceDialog } from '@/components/invoices/SendInvoiceDialog';
import { useToast } from '@/components/ui/toast';
import type {
  InvoiceWithRelations,
  InvoiceStatus,
  PaymentMethod,
} from '@/types/invoice';
import {
  ArrowLeft,
  Download,
  Send,
  FileText,
  Calendar,
  DollarSign,
  User,
  Briefcase,
  CheckCircle,
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

const statusVariantMap: Record<
  InvoiceStatus,
  'draft' | 'sent' | 'partial' | 'paid' | 'void'
> = {
  draft: 'draft',
  sent: 'sent',
  partial: 'partial',
  paid: 'paid',
  void: 'void',
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [invoice, setInvoice] = React.useState<InvoiceWithRelations | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);
  const [recordingPayment, setRecordingPayment] = React.useState(false);
  const [showPaymentForm, setShowPaymentForm] = React.useState(false);

  const invoiceId = params.id as string;

  React.useEffect(() => {
    if (invoiceId) loadInvoice();
  }, [invoiceId]);

  React.useEffect(() => {
    if (
      searchParams.get('recordPayment') === 'true' &&
      invoice &&
      invoice.balance_due > 0
    ) {
      setShowPaymentForm(true);
    }
  }, [searchParams, invoice]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}`);

      if (!response.ok) {
        if (response.status === 404) throw new Error('Invoice not found');
        throw new Error('Failed to load invoice');
      }

      const data = await response.json();
      setInvoice(data);
    } catch (error) {
      console.error('Failed to load invoice:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to load invoice',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (payment: {
    amount: number;
    method: PaymentMethod;
    reference?: string;
    notes?: string;
  }) => {
    setRecordingPayment(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment),
      });

      if (!response.ok) throw new Error('Failed to record payment');

      toast({
        title: 'Payment Recorded',
        description: `Payment of $${payment.amount.toFixed(2)} recorded successfully`,
      });

      setShowPaymentForm(false);
      loadInvoice();
    } catch (error) {
      console.error('Failed to record payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record payment',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!invoice) return;

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast({
        title: 'Invoice Paid',
        description: 'Invoice marked as paid',
      });

      loadInvoice();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update invoice status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <PageContainer maxWidth="lg">
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (!invoice) {
    return (
      <PageContainer maxWidth="lg">
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="Invoice not found"
          description="The requested invoice could not be found."
          action={{
            label: 'Back to Invoices',
            onClick: () => router.push('/admin/invoices'),
          }}
        />
      </PageContainer>
    );
  }

  const clientName = invoice.client
    ? `${invoice.client.first_name} ${invoice.client.last_name}`
    : 'Unknown Client';

  const daysOverdue = (() => {
    if (
      invoice.status === 'paid' ||
      invoice.status === 'void' ||
      !invoice.due_date
    )
      return null;
    const dueDate = parseISO(invoice.due_date);
    const days = differenceInDays(new Date(), dueDate);
    return days > 0 ? days : null;
  })();

  const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <PageContainer maxWidth="xl" padding="none">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/invoices')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold truncate">
                    {invoice.invoice_number}
                  </h1>
                  <StatusBadge
                    variant={statusVariantMap[invoice.status]}
                    size="sm"
                    dot
                  >
                    {invoice.status}
                  </StatusBadge>
                  {daysOverdue && (
                    <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded">
                      {daysOverdue}d overdue
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {clientName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(`/api/invoices/${invoiceId}/pdf`, '_blank')
                }
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              {invoice.status !== 'paid' && invoice.status !== 'void' && (
                <SendInvoiceDialog
                  invoiceId={invoiceId}
                  invoiceNumber={invoice.invoice_number || ''}
                  customerEmail={invoice.client?.email}
                  customerPhone={invoice.client?.phone}
                  onSent={loadInvoice}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:flex lg:gap-6 px-4 lg:px-6 py-6">
        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Invoice #:</span>
                  <span className="font-medium">{invoice.invoice_number}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Issued:</span>
                  <span>
                    {invoice.issue_date
                      ? format(parseISO(invoice.issue_date), 'MMM d, yyyy')
                      : '-'}
                  </span>
                </div>
                {invoice.due_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Due:</span>
                    <span
                      className={cn(daysOverdue && 'text-red-600 font-medium')}
                    >
                      {format(parseISO(invoice.due_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{clientName}</span>
                </div>
                {invoice.client?.email && (
                  <a
                    href={`mailto:${invoice.client.email}`}
                    className="text-sm text-primary hover:underline block"
                  >
                    {invoice.client.email}
                  </a>
                )}
                {invoice.client?.phone && (
                  <a
                    href={`tel:${invoice.client.phone}`}
                    className="text-sm text-primary hover:underline block"
                  >
                    {invoice.client.phone}
                  </a>
                )}
              </CardContent>
            </Card>
          </div>

          {invoice.job && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Related Job
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <Link href={`/admin/jobs/${invoice.job.id}`}>
                    <Briefcase className="h-4 w-4 mr-2" />
                    Job #{invoice.job.job_number}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {invoice.estimate && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  From Estimate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <Link
                    href={`/admin/estimates/${invoice.estimate.id}/summary`}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Estimate #{invoice.estimate.estimate_number}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Line Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LineItemsTable
                items={(invoice.invoice_line_items || []).map((item) => ({
                  id: item.id,
                  description: item.description,
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                  total: item.line_total,
                  tier: item.tier,
                }))}
              />
              <LineItemsTotals
                subtotal={invoice.subtotal}
                taxAmount={(invoice as any).tax_amount}
                taxRate={(invoice as any).tax_rate}
                discountAmount={(invoice as any).discount_amount}
                total={invoice.total}
                className="mt-4"
              />
            </CardContent>
          </Card>

          {invoice.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}

          <div className="lg:hidden">
            <PaymentPanel
              balanceDue={invoice.balance_due}
              payments={invoice.invoice_payments || []}
              onRecordPayment={handleRecordPayment}
              isRecording={recordingPayment}
            />
          </div>
        </div>

        <div className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge
                    variant={statusVariantMap[invoice.status]}
                    size="sm"
                  >
                    {invoice.status}
                  </StatusBadge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance</span>
                  <span
                    className={cn(
                      'font-bold',
                      invoice.balance_due > 0
                        ? 'text-red-600'
                        : 'text-green-600'
                    )}
                  >
                    {formatCurrency(invoice.balance_due)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    window.open(`/api/invoices/${invoiceId}/pdf`, '_blank')
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                {invoice.status !== 'paid' && invoice.status !== 'void' && (
                  <SendInvoiceDialog
                    invoiceId={invoiceId}
                    invoiceNumber={invoice.invoice_number || ''}
                    customerEmail={invoice.client?.email}
                    customerPhone={invoice.client?.phone}
                    onSent={loadInvoice}
                    trigger={
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send to Client
                      </Button>
                    }
                  />
                )}
                {invoice.balance_due > 0 && invoice.status !== 'void' && (
                  <Button
                    className="w-full justify-start"
                    onClick={() => setShowPaymentForm(true)}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                )}
                {invoice.balance_due === 0 &&
                  invoice.status !== 'paid' &&
                  invoice.status !== 'void' && (
                    <ButtonLoader
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleMarkPaid}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Paid
                    </ButtonLoader>
                  )}
              </CardContent>
            </Card>

            <PaymentPanel
              balanceDue={invoice.balance_due}
              payments={invoice.invoice_payments || []}
              onRecordPayment={handleRecordPayment}
              isRecording={recordingPayment}
            />
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-20">
        <div className="flex gap-2">
          {invoice.balance_due > 0 && invoice.status !== 'void' && (
            <Button className="flex-1" onClick={() => setShowPaymentForm(true)}>
              <DollarSign className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          )}
          {invoice.balance_due === 0 &&
            invoice.status !== 'paid' &&
            invoice.status !== 'void' && (
              <Button className="flex-1" onClick={handleMarkPaid}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Paid
              </Button>
            )}
          <Button
            variant="outline"
            onClick={() =>
              window.open(`/api/invoices/${invoiceId}/pdf`, '_blank')
            }
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
