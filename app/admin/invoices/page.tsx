'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkeletonTable } from '@/components/ui/skeletons';
import type { InvoiceWithRelations, InvoiceStatus } from '@/types/invoice';
import {
  Search,
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
} from 'lucide-react';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Advanced filter states
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [amountRange, setAmountRange] = useState<{
    min: number | undefined;
    max: number | undefined;
  }>({
    min: undefined,
    max: undefined,
  });
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  // Bulk operations states
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>(
    'all'
  );

  useEffect(() => {
    loadInvoices();
    loadStats();
  }, [
    statusFilter,
    searchQuery,
    dateRange,
    amountRange,
    selectedStatuses,
    selectedClients,
  ]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invoices');
      if (!response.ok) throw new Error('Failed to load invoices');
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/invoices?action=stats');
      if (!response.ok) throw new Error('Failed to load stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load invoice stats:', error);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const query = searchQuery.toLowerCase();

    // Search query filter
    const matchesQuery =
      invoice.invoice_number?.toLowerCase().includes(query) ||
      invoice.notes?.toLowerCase().includes(query) ||
      invoice.client?.first_name?.toLowerCase().includes(query) ||
      invoice.client?.last_name?.toLowerCase().includes(query);

    // Date range filter
    const matchesDate =
      !dateRange.from ||
      !dateRange.to ||
      (invoice.created_at &&
        new Date(invoice.created_at) >= dateRange.from &&
        new Date(invoice.created_at) <= dateRange.to);

    // Amount range filter
    const matchesAmount =
      (!amountRange.min || invoice.total >= amountRange.min) &&
      (!amountRange.max || invoice.total <= amountRange.max);

    // Status filter (combine tab filter with advanced filter)
    const statusFilters =
      selectedStatuses.length > 0
        ? selectedStatuses
        : statusFilter !== 'all'
          ? [statusFilter]
          : [];
    const matchesStatus =
      statusFilters.length === 0 || statusFilters.includes(invoice.status);

    // Client filter
    const matchesClient =
      selectedClients.length === 0 ||
      (invoice.client_id && selectedClients.includes(invoice.client_id));

    return (
      matchesQuery &&
      matchesDate &&
      matchesAmount &&
      matchesStatus &&
      matchesClient
    );
  });

  const getStatusColor = (status: InvoiceStatus) => {
    const colors: Record<InvoiceStatus, string> = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      partial: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      void: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'void':
        return <XCircle className="w-4 h-4" />;
      case 'partial':
        return <DollarSign className="w-4 h-4" />;
      case 'sent':
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const statusTabs = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'partial', label: 'Partial' },
    { value: 'paid', label: 'Paid' },
    { value: 'void', label: 'Void' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-600 mt-1">
              Manage billing and track payments
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Invoices
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total_invoices}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Paid</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.paid_invoices}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Outstanding
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      ${stats.outstanding_balance?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Revenue</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${stats.total_revenue?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by invoice number or customer name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Tabs
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as InvoiceStatus | 'all')
              }
            >
              <TabsList className="grid w-full grid-cols-6">
                {statusTabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Invoices List */}
        {loading ? (
          <SkeletonTable rows={8} columns={4} />
        ) : filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No invoices found
              </h3>
              <p className="text-gray-600 mb-4">
                {statusFilter !== 'all' || searchQuery
                  ? 'Try adjusting your filters or search terms.'
                  : 'Create invoices from completed jobs to get started.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <Card
                key={invoice.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                        >
                          {invoice.invoice_number}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">
                          {invoice.client?.first_name}{' '}
                          {invoice.client?.last_name}
                        </p>
                      </div>
                      <Badge
                        className={`inline-flex items-center gap-1.5 px-3 py-1 ${getStatusColor(invoice.status)}`}
                      >
                        {getStatusIcon(invoice.status)}
                        {invoice.status.charAt(0).toUpperCase() +
                          invoice.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div>
                        <p className="font-medium">Issue Date</p>
                        <p>{formatDate(invoice.issue_date)}</p>
                      </div>

                      {invoice.due_date && (
                        <div>
                          <p className="font-medium">Due Date</p>
                          <p>{formatDate(invoice.due_date)}</p>
                        </div>
                      )}

                      <div className="text-right">
                        <p className="font-medium">Total</p>
                        <p className="font-semibold">
                          ${invoice.total.toFixed(2)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-medium">Balance Due</p>
                        <p
                          className={`font-semibold ${invoice.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}
                        >
                          ${invoice.balance_due.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
