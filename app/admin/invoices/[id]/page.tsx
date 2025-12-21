'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SendInvoiceDialog } from '@/components/invoices/SendInvoiceDialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import type { InvoiceWithRelations, PaymentMethod } from '@/types/invoice';
import {
  ArrowLeft,
  FileText,
  Download,
  Send,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
} from 'lucide-react';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<InvoiceWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const invoiceId = params.id as string;

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}`);
      if (!response.ok) throw new Error('Failed to load invoice');
      const data = await response.json();
      setInvoice(data);
    } catch (error) {
      console.error('Failed to load invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invoice',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!invoice || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount',
        variant: 'destructive',
      });
      return;
    }

    if (amount > invoice.balance_due) {
      toast({
        title: 'Overpayment',
        description: 'Payment amount cannot exceed balance due',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          method: paymentMethod,
          reference: paymentReference.trim() || undefined,
          notes: paymentNotes.trim() || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to record payment');

      toast({
        title: 'Payment Recorded',
        description: 'Payment has been successfully recorded',
      });

      // Reset form and reload invoice
      setShowPaymentForm(false);
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentNotes('');
      loadInvoice();
    } catch (error) {
      console.error('Failed to record payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record payment',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      partial: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      void: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5" />;
      case 'void':
        return <XCircle className="w-5 h-5" />;
      case 'partial':
        return <DollarSign className="w-5 h-5" />;
      case 'sent':
        return <Clock className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Invoice Not Found
          </h1>
          <Button onClick={() => router.push('/invoices')}>
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/invoices')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Invoices
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {invoice.invoice_number}
              </h1>
              <p className="text-gray-600 mt-1">
                {invoice.customer?.first_name} {invoice.customer?.last_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm ${getStatusColor(invoice.status)}`}
            >
              {getStatusIcon(invoice.status)}
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Info */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Invoice Number
                    </Label>
                    <p className="font-semibold">{invoice.invoice_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Issue Date
                    </Label>
                    <p>{formatDate(invoice.issue_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Due Date
                    </Label>
                    <p>
                      {invoice.due_date ? formatDate(invoice.due_date) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Job
                    </Label>
                    {invoice.job ? (
                      <Button
                        variant="link"
                        className="p-0 h-auto font-semibold text-blue-600"
                        onClick={() => router.push(`/jobs/${invoice.job?.id}`)}
                      >
                        {invoice.job.job_number}
                      </Button>
                    ) : (
                      <p className="text-gray-500">No job linked</p>
                    )}
                  </div>
                </div>

                {invoice.estimate && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Estimate
                    </Label>
                    <Button
                      variant="link"
                      className="p-0 h-auto font-semibold text-blue-600"
                      onClick={() =>
                        router.push(
                          `/estimates/${invoice.estimate?.id}/summary`
                        )
                      }
                    >
                      {invoice.estimate.estimate_number}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle>Line Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.invoice_line_items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.description}</p>
                            {item.tier && (
                              <p className="text-sm text-gray-500">
                                Tier: {item.tier}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          ${item.unit_price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${item.line_total.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {invoice.invoice_payments &&
                invoice.invoice_payments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.invoice_payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.paid_at)}</TableCell>
                          <TableCell className="capitalize">
                            {payment.method.replace('_', ' ')}
                          </TableCell>
                          <TableCell>{payment.reference || '-'}</TableCell>
                          <TableCell className="text-right">
                            ${payment.amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No payments recorded
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Totals */}
            <Card>
              <CardHeader>
                <CardTitle>Totals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-semibold">
                    ${invoice.total.toFixed(2)}
                  </span>
                </div>
                {invoice.invoice_payments &&
                  invoice.invoice_payments.length > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Payments Applied:</span>
                      <span>
                        -$
                        {invoice.invoice_payments
                          .reduce((sum, p) => sum + p.amount, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  )}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Balance Due:</span>
                    <span
                      className={
                        invoice.balance_due > 0
                          ? 'text-red-600'
                          : 'text-green-600'
                      }
                    >
                      ${invoice.balance_due.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() =>
                    window.open(`/api/invoices/${invoiceId}/pdf`, '_blank')
                  }
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>

                <SendInvoiceDialog
                  invoiceId={invoiceId}
                  invoiceNumber={invoice.invoice_number}
                  customerEmail={invoice.customer?.email}
                  customerPhone={invoice.customer?.phone}
                  onSent={() => {
                    // Refresh the invoice data after sending
                    loadInvoice();
                  }}
                />

                {invoice.balance_due > 0 && (
                  <Button
                    onClick={() => setShowPaymentForm(true)}
                    className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                    Record Payment
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Payment Form */}
            {showPaymentForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Record Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="method">Payment Method *</Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={(value) =>
                        setPaymentMethod(value as PaymentMethod)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                        <SelectItem value="online">Online Payment</SelectItem>
                        <SelectItem value="bank_transfer">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="reference">Reference (Optional)</Label>
                    <Input
                      id="reference"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="Check number, transaction ID, etc."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Additional notes..."
                      rows={2}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowPaymentForm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRecordPayment}
                      disabled={saving}
                      className="flex-1"
                    >
                      {saving ? 'Recording...' : 'Record Payment'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
