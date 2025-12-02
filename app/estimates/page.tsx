'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import type { EstimateWithRelations, EstimateStats } from '@/types/estimate';
import {
  Plus,
  Search,
  FileText,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  User,
  Mail,
} from 'lucide-react';
import { format } from 'date-fns';

export default function EstimatesPage() {
  const { toast } = useToast();
  const [estimates, setEstimates] = useState<EstimateWithRelations[]>([]);
  const [stats, setStats] = useState<EstimateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEstimate, setSelectedEstimate] =
    useState<EstimateWithRelations | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);

  useEffect(() => {
    loadEstimates();
    loadStats();
  }, []);

  const loadEstimates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/estimates');
      const data = await response.json();
      setEstimates(data);
    } catch (error) {
      console.error('Failed to load estimates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load estimates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/estimates?action=stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadEstimates();
      return;
    }

    try {
      const response = await fetch(
        `/api/estimates?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setEstimates(data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700 border-gray-300',
      sent: 'bg-blue-100 text-blue-700 border-blue-300',
      viewed: 'bg-purple-100 text-purple-700 border-purple-300',
      accepted: 'bg-green-100 text-green-700 border-green-300',
      declined: 'bg-red-100 text-red-700 border-red-300',
      expired: 'bg-orange-100 text-orange-700 border-orange-300',
      revised: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-4 h-4" />;
      case 'sent':
        return <Send className="w-4 h-4" />;
      case 'viewed':
        return <Eye className="w-4 h-4" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'declined':
        return <XCircle className="w-4 h-4" />;
      case 'expired':
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-gray-600 font-medium">Loading estimates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Estimates
              </h1>
              <p className="text-gray-600 mt-2">
                Create and manage quotes and proposals
              </p>
            </div>
            <Button
              onClick={() => setShowNewDialog(true)}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Estimate
            </Button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search estimates by number or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-12 border-2"
              />
            </div>
            <Button onClick={handleSearch} size="lg" variant="outline">
              Search
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="text-3xl font-bold">
                  {stats.total_estimates}
                </div>
                <div className="text-sm text-blue-100 mt-1">
                  Total Estimates
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="text-3xl font-bold">{stats.sent_estimates}</div>
                <div className="text-sm text-purple-100 mt-1">Sent</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="text-3xl font-bold">
                  {stats.accepted_estimates}
                </div>
                <div className="text-sm text-green-100 mt-1">Accepted</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="text-3xl font-bold">
                  {stats.acceptance_rate.toFixed(1)}%
                </div>
                <div className="text-sm text-orange-100 mt-1">Accept Rate</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardContent className="p-4">
                <div className="text-3xl font-bold">
                  ${(stats.total_value / 1000).toFixed(0)}k
                </div>
                <div className="text-sm text-emerald-100 mt-1">Total Value</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Estimates List */}
        <div className="grid gap-4">
          {estimates.length > 0 ? (
            estimates.map((estimate) => (
              <Card
                key={estimate.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                onClick={() => setSelectedEstimate(estimate)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">
                          {estimate.estimate_number}
                        </h3>
                        <Badge
                          variant="outline"
                          className={getStatusColor(estimate.status)}
                        >
                          {getStatusIcon(estimate.status)}
                          <span className="ml-1">{estimate.status}</span>
                        </Badge>
                      </div>

                      <p className="text-lg text-gray-700 mb-3">
                        {estimate.title}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        {estimate.client && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span>
                              {estimate.client.first_name}{' '}
                              {estimate.client.last_name}
                            </span>
                          </div>
                        )}
                        {estimate.lead && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>
                              {estimate.lead.first_name}{' '}
                              {estimate.lead.last_name}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Valid until:{' '}
                            {format(
                              new Date(estimate.valid_until),
                              'MMM d, yyyy'
                            )}
                          </span>
                        </div>
                      </div>

                      {estimate.description && (
                        <p className="text-gray-600 mt-3 line-clamp-2">
                          {estimate.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-3xl font-bold text-blue-600">
                        ${estimate.total.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Array.isArray(estimate.line_items)
                          ? estimate.line_items.length
                          : 0}{' '}
                        line items
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No estimates found
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Get started by creating your first estimate'}
                </p>
                <Button
                  onClick={() => setShowNewDialog(true)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Estimate
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Estimate Detail Dialog */}
      <Dialog
        open={!!selectedEstimate}
        onOpenChange={() => setSelectedEstimate(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              {selectedEstimate?.estimate_number}
            </DialogTitle>
            <DialogDescription>{selectedEstimate?.title}</DialogDescription>
          </DialogHeader>

          {selectedEstimate && (
            <div className="space-y-6 mt-4">
              {/* Status and Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs font-medium text-gray-600 uppercase">
                    Status
                  </label>
                  <div className="mt-2">
                    <Badge
                      variant="outline"
                      className={getStatusColor(selectedEstimate.status)}
                    >
                      {getStatusIcon(selectedEstimate.status)}
                      <span className="ml-1">{selectedEstimate.status}</span>
                    </Badge>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs font-medium text-gray-600 uppercase">
                    Valid Until
                  </label>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">
                      {format(new Date(selectedEstimate.valid_until), 'PPP')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Client/Lead Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {selectedEstimate.client ? 'Client' : 'Lead'} Information
                </h3>
                {selectedEstimate.client && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">
                        {selectedEstimate.client.first_name}{' '}
                        {selectedEstimate.client.last_name}
                      </span>
                    </div>
                    {selectedEstimate.client.company_name && (
                      <p className="text-sm text-gray-600">
                        {selectedEstimate.client.company_name}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span>{selectedEstimate.client.email}</span>
                    </div>
                  </div>
                )}
                {selectedEstimate.lead && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">
                        {selectedEstimate.lead.first_name}{' '}
                        {selectedEstimate.lead.last_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span>{selectedEstimate.lead.email}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedEstimate.description && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs font-medium text-gray-600 uppercase">
                    Description
                  </label>
                  <p className="text-sm text-gray-700 mt-2">
                    {selectedEstimate.description}
                  </p>
                </div>
              )}

              {/* Line Items */}
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Line Items</h3>
                <div className="space-y-3">
                  {Array.isArray(selectedEstimate.line_items) &&
                  selectedEstimate.line_items.length > 0 ? (
                    selectedEstimate.line_items.map(
                      (item: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {item.description}
                            </p>
                            <p className="text-sm text-gray-600">
                              {item.quantity} {item.unit || 'units'} × $
                              {item.unit_price?.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-bold text-gray-900">
                              ${item.total?.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-gray-500 text-sm">No line items</p>
                  )}
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-100">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal:</span>
                    <span className="font-medium">
                      ${selectedEstimate.subtotal.toFixed(2)}
                    </span>
                  </div>
                  {selectedEstimate.tax_rate > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Tax ({selectedEstimate.tax_rate}%):</span>
                      <span className="font-medium">
                        ${selectedEstimate.tax_amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {selectedEstimate.discount_amount &&
                    selectedEstimate.discount_amount > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>Discount:</span>
                        <span className="font-medium text-red-600">
                          -${selectedEstimate.discount_amount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  <div className="flex justify-between text-xl font-bold text-green-600 pt-3 border-t-2 border-green-200">
                    <span>Total:</span>
                    <span>${selectedEstimate.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Terms */}
              {(selectedEstimate.terms_and_conditions ||
                selectedEstimate.payment_terms) && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  {selectedEstimate.payment_terms && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 uppercase">
                        Payment Terms
                      </label>
                      <p className="text-sm text-gray-700 mt-1">
                        {selectedEstimate.payment_terms}
                      </p>
                    </div>
                  )}
                  {selectedEstimate.terms_and_conditions && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 uppercase">
                        Terms & Conditions
                      </label>
                      <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                        {selectedEstimate.terms_and_conditions}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedEstimate.status === 'draft' && (
                  <Button className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500">
                    <Send className="w-4 h-4 mr-2" />
                    Send to Client
                  </Button>
                )}
                {['draft', 'sent', 'viewed'].includes(
                  selectedEstimate.status
                ) && (
                  <>
                    <Button variant="outline" className="flex-1">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Accepted
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <XCircle className="w-4 h-4 mr-2" />
                      Mark Declined
                    </Button>
                  </>
                )}
                <Button variant="outline" className="flex-1">
                  <FileText className="w-4 h-4 mr-2" />
                  View PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Estimate Dialog - Placeholder */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Estimate</DialogTitle>
            <DialogDescription>
              Create a quote or proposal for a client or lead
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-600">Estimate builder coming soon...</p>
            <p className="text-sm text-gray-500 mt-2">
              Use the API endpoint to create estimates for now
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
