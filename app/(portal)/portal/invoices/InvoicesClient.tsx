'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Calendar,
  DollarSign,
  CreditCard,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { InvoiceWithRelations } from '@/types/invoice';

export default function InvoicesClient() {
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/portal/invoices');
      if (!response.ok) {
        throw new Error('Failed to load invoices');
      }

      const data = await response.json();
      setInvoices(data);
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'unpaid':
        return 'Unpaid';
      case 'overdue':
        return 'Overdue';
      case 'partial':
        return 'Partially Paid';
      default:
        return status.replace('_', ' ');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getTotalOutstanding = () => {
    return invoices
      .filter((invoice) => invoice.status !== 'paid')
      .reduce((total, invoice) => total + (invoice.total || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p className="mb-4">{error}</p>
            <Button onClick={loadInvoices} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const outstandingAmount = getTotalOutstanding();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Invoices</h1>
        <p className="text-gray-500 mt-1">View and pay your service invoices</p>
      </div>

      {/* Outstanding Balance Alert */}
      {outstandingAmount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">
                    Outstanding Balance
                  </h3>
                  <p className="text-red-700">
                    You have ${outstandingAmount.toFixed(2)} in unpaid invoices
                  </p>
                </div>
              </div>
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                Pay All Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Invoices ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">No invoices yet</p>
              <p className="text-sm">
                Your invoices will appear here once services are completed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="border rounded-lg p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      {/* Invoice Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">
                              {invoice.invoice_number ||
                                `Invoice #${invoice.id.slice(-8)}`}
                            </h3>
                            <Badge
                              className={getStatusColor(
                                invoice.status || 'unpaid'
                              )}
                            >
                              {getStatusLabel(invoice.status || 'unpaid')}
                            </Badge>
                            {invoice.due_date &&
                              isOverdue(invoice.due_date) &&
                              invoice.status !== 'paid' && (
                                <Badge className="bg-red-100 text-red-800">
                                  Overdue
                                </Badge>
                              )}
                          </div>
                          {invoice.job && (
                            <p className="text-gray-600">
                              {invoice.job.title} ({invoice.job.job_number})
                            </p>
                          )}
                        </div>
                        {invoice.total && (
                          <div className="text-right">
                            <div
                              className={`text-2xl font-bold ${
                                invoice.status === 'paid'
                                  ? 'text-green-600'
                                  : 'text-primary'
                              }`}
                            >
                              ${invoice.total.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Invoice Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            <span className="font-medium">Created:</span>{' '}
                            {formatDate(invoice.created_at)}
                          </span>
                        </div>

                        {invoice.due_date && (
                          <div className="flex items-center gap-2">
                            <AlertCircle
                              className={`h-4 w-4 ${
                                isOverdue(invoice.due_date) &&
                                invoice.status !== 'paid'
                                  ? 'text-red-500'
                                  : 'text-gray-400'
                              }`}
                            />
                            <span>
                              <span className="font-medium">Due:</span>{' '}
                              {formatDate(invoice.due_date)}
                              {isOverdue(invoice.due_date) &&
                                invoice.status !== 'paid' && (
                                  <span className="text-red-600 ml-1">
                                    (Overdue)
                                  </span>
                                )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 min-w-[120px]">
                      <Button className="w-full" variant="outline">
                        View Details
                      </Button>

                      {invoice.status !== 'paid' && (
                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Now
                        </Button>
                      )}

                      {invoice.status === 'paid' && (
                        <div className="text-center text-green-600 font-medium py-2">
                          <CheckCircle className="h-4 w-4 mx-auto mb-1" />
                          Paid
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
