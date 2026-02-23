'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ButtonLoader } from '@/components/ui/button-loader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { StatusBadge } from '@/components/ui/status-badge';
import type { PaymentMethod, InvoicePayment } from '@/types/invoice';
import { DollarSign, Plus, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentPanelProps {
  balanceDue: number;
  payments: InvoicePayment[];
  onRecordPayment: (payment: {
    amount: number;
    method: PaymentMethod;
    reference?: string;
    notes?: string;
  }) => Promise<void>;
  isRecording?: boolean;
  className?: string;
}

const paymentMethods: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'online', label: 'Online Payment' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
];

export function PaymentPanel({
  balanceDue,
  payments,
  onRecordPayment,
  isRecording = false,
  className,
}: PaymentPanelProps) {
  const [showForm, setShowForm] = React.useState(false);
  const [amount, setAmount] = React.useState('');
  const [method, setMethod] = React.useState<PaymentMethod>('cash');
  const [reference, setReference] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const isPaid = balanceDue <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (paymentAmount > balanceDue) {
      setError('Payment cannot exceed balance due');
      return;
    }

    try {
      await onRecordPayment({
        amount: paymentAmount,
        method,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setAmount('');
      setReference('');
      setNotes('');
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Payments</CardTitle>
          {!isPaid && !showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Record Payment
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Total</p>
            <p className="text-lg font-bold">
              ${(balanceDue + totalPaid).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Paid</p>
            <p className="text-lg font-bold text-green-600">
              ${totalPaid.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Balance</p>
            <p
              className={cn(
                'text-lg font-bold',
                balanceDue > 0 ? 'text-red-600' : 'text-green-600'
              )}
            >
              ${balanceDue.toFixed(2)}
            </p>
          </div>
        </div>

        {isPaid && (
          <div className="flex items-center justify-center gap-2 py-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-700 dark:text-green-400">
              Paid in Full
            </span>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={balanceDue}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-9"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Max: ${balanceDue.toFixed(2)}
                </p>
              </div>
              <div>
                <Label htmlFor="method">Method *</Label>
                <Select
                  value={method}
                  onValueChange={(v) => setMethod(v as PaymentMethod)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Check #, Transaction ID, etc."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                rows={2}
                className="mt-1"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <ButtonLoader
                type="submit"
                className="flex-1"
                loading={isRecording}
              >
                Record Payment
              </ButtonLoader>
            </div>
          </form>
        )}

        {payments.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Payment History</h4>
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
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.paid_at)}</TableCell>
                    <TableCell className="capitalize">
                      {payment.method.replace('_', ' ')}
                    </TableCell>
                    <TableCell>{payment.reference || '-'}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      ${payment.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
