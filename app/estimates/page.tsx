'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { EstimateWithRelations, EstimateStats } from '@/types/estimate';
import {
  estimateSchema,
  type EstimateFormData,
} from '@/lib/validations/estimate';
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
  Trash2,
  Edit,
  Minus,
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
  const [editingEstimate, setEditingEstimate] =
    useState<EstimateWithRelations | null>(null);
  const [deleteEstimateId, setDeleteEstimateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);

  const form = useForm<EstimateFormData>({
    resolver: zodResolver(estimateSchema) as any,
    defaultValues: {
      client_id: '',
      lead_id: '',
      title: '',
      description: '',
      line_items: [{ description: '', quantity: 1, unit_price: 0, unit: '' }],
      tax_rate: 0,
      discount_amount: 0,
      valid_until: '',
      payment_terms: '',
      terms_and_conditions: '',
      status: 'draft',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'line_items',
  });

  useEffect(() => {
    loadEstimates();
    loadStats();
    loadClients();
    loadLeads();
    checkForLeadData();
  }, []);

  const checkForLeadData = () => {
    const leadData = sessionStorage.getItem('newEstimate');
    if (leadData) {
      try {
        const data = JSON.parse(leadData);
        form.setValue('title', data.service_description || '');
        form.setValue('description', data.service_description || '');
        if (data.estimated_value) {
          form.setValue('line_items', [
            {
              description: data.service_description || 'Service',
              quantity: 1,
              unit_price: data.estimated_value,
              unit: '',
            },
          ]);
        }
        sessionStorage.removeItem('newEstimate');
        setShowNewDialog(true);
      } catch (error) {
        console.error('Failed to parse lead data:', error);
      }
    }
  };

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error(`Failed to fetch clients: ${response.status}`);
      }
      const data = await response.json();
      console.log('Loaded clients:', data.length, data);
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load clients:', error);
      setClients([]);
    }
  };

  const loadLeads = async () => {
    try {
      const response = await fetch('/api/leads');
      if (!response.ok) {
        throw new Error(`Failed to fetch leads: ${response.status}`);
      }
      const data = await response.json();
      const filteredLeads = Array.isArray(data)
        ? data.filter((l: any) => l.status !== 'converted')
        : [];
      console.log('Loaded leads:', filteredLeads.length, filteredLeads);
      setLeads(filteredLeads);
    } catch (error) {
      console.error('Failed to load leads:', error);
      setLeads([]);
    }
  };

  const loadEstimates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/estimates');
      const data = await response.json();
      setEstimates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load estimates:', error);
      setEstimates([]);
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
      setEstimates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Search failed:', error);
      setEstimates([]);
    }
  };

  const handleCreateEstimate = async (data: EstimateFormData) => {
    setIsSubmitting(true);
    try {
      // Validate client or lead is selected
      if (
        (!data.client_id || data.client_id === 'none') &&
        (!data.lead_id || data.lead_id === 'none')
      ) {
        toast({
          title: 'Validation Error',
          description: 'Please select either a client or a lead',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Calculate totals
      const subtotal = data.line_items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
      );
      const tax_amount = subtotal * (data.tax_rate / 100);
      const total = subtotal + tax_amount - (data.discount_amount || 0);

      const submitData = {
        ...data,
        subtotal,
        tax_amount,
        total,
        client_id:
          data.client_id && data.client_id !== 'none'
            ? data.client_id
            : undefined,
        lead_id:
          data.lead_id && data.lead_id !== 'none' ? data.lead_id : undefined,
      };

      console.log('Submitting estimate:', submitData);

      const url = editingEstimate
        ? `/api/estimates/${editingEstimate.id}`
        : '/api/estimates';
      const method = editingEstimate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to save estimate');
      }

      const estimate = await response.json();

      if (editingEstimate) {
        setEstimates((prev) =>
          Array.isArray(prev)
            ? prev.map((e) => (e.id === estimate.id ? estimate : e))
            : [estimate]
        );
      } else {
        setEstimates((prev) =>
          Array.isArray(prev) ? [estimate, ...prev] : [estimate]
        );
      }

      setShowNewDialog(false);
      setEditingEstimate(null);
      form.reset();
      toast({
        title: 'Success',
        description: editingEstimate
          ? 'Estimate updated successfully'
          : 'Estimate created successfully',
      });
      loadStats();
    } catch (error) {
      console.error('Failed to save estimate:', error);
      toast({
        title: 'Error',
        description: 'Failed to save estimate',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/estimates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      const updated = await response.json();
      setEstimates((prev) =>
        Array.isArray(prev) ? prev.map((e) => (e.id === id ? updated : e)) : []
      );
      setSelectedEstimate(updated);
      toast({
        title: 'Success',
        description: `Estimate marked as ${status}`,
      });
      loadStats();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update estimate status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEstimate = async () => {
    if (!deleteEstimateId) return;

    try {
      const response = await fetch(`/api/estimates/${deleteEstimateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete estimate');

      setEstimates((prev) =>
        Array.isArray(prev) ? prev.filter((e) => e.id !== deleteEstimateId) : []
      );
      setDeleteEstimateId(null);
      setSelectedEstimate(null);
      toast({
        title: 'Success',
        description: 'Estimate deleted successfully',
      });
      loadStats();
    } catch (error) {
      console.error('Failed to delete estimate:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete estimate',
        variant: 'destructive',
      });
    }
  };

  const handleEditEstimate = (estimate: EstimateWithRelations) => {
    setEditingEstimate(estimate);
    form.reset({
      client_id: estimate.client_id || '',
      lead_id: estimate.lead_id || '',
      title: estimate.title,
      description: estimate.description || '',
      line_items: estimate.line_items || [
        { description: '', quantity: 1, unit_price: 0, unit: '' },
      ],
      tax_rate: estimate.tax_rate,
      discount_amount: estimate.discount_amount || 0,
      valid_until: estimate.valid_until.split('T')[0],
      payment_terms: estimate.payment_terms || '',
      terms_and_conditions: estimate.terms_and_conditions || '',
      status: estimate.status,
    });
    setSelectedEstimate(null);
    setShowNewDialog(true);
  };

  const calculateSubtotal = () => {
    const lineItems = form.watch('line_items');
    return lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const taxRate = form.watch('tax_rate') || 0;
    const discount = form.watch('discount_amount') || 0;
    const tax = subtotal * (taxRate / 100);
    return subtotal + tax - discount;
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
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleEditEstimate(selectedEstimate)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                {selectedEstimate.status === 'draft' && (
                  <Button
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500"
                    onClick={() =>
                      handleUpdateStatus(selectedEstimate.id, 'sent')
                    }
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send to Client
                  </Button>
                )}
                {['draft', 'sent', 'viewed'].includes(
                  selectedEstimate.status
                ) && (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        handleUpdateStatus(selectedEstimate.id, 'accepted')
                      }
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Accepted
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        handleUpdateStatus(selectedEstimate.id, 'declined')
                      }
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Mark Declined
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    window.open(
                      `/api/estimates/${selectedEstimate.id}/pdf`,
                      '_blank'
                    )
                  }
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View PDF
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteEstimateId(selectedEstimate.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New/Edit Estimate Dialog */}
      <Dialog
        open={showNewDialog}
        onOpenChange={(open) => {
          setShowNewDialog(open);
          if (!open) {
            setEditingEstimate(null);
            form.reset();
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEstimate ? 'Edit Estimate' : 'Create New Estimate'}
            </DialogTitle>
            <DialogDescription>
              Create a quote or proposal for a client or lead
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreateEstimate)}
              className="space-y-6"
            >
              {/* Client/Lead Selection */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select
                        value={field.value || ''}
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value && value !== 'none')
                            form.setValue('lead_id', '');
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">-- None --</SelectItem>
                          {clients.length === 0 ? (
                            <SelectItem value="loading" disabled>
                              Loading clients...
                            </SelectItem>
                          ) : (
                            clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.first_name} {client.last_name}
                                {client.company_name &&
                                  ` (${client.company_name})`}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-center text-sm text-gray-500">OR</div>

                <FormField
                  control={form.control}
                  name="lead_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead</FormLabel>
                      <Select
                        value={field.value || ''}
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value && value !== 'none')
                            form.setValue('client_id', '');
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a lead..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">-- None --</SelectItem>
                          {leads.length === 0 ? (
                            <SelectItem value="loading" disabled>
                              Loading leads...
                            </SelectItem>
                          ) : (
                            leads.map((lead) => (
                              <SelectItem key={lead.id} value={lead.id}>
                                {lead.first_name} {lead.last_name}
                                {lead.company_name && ` (${lead.company_name})`}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Title & Description */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Kitchen Renovation Estimate"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed description of the work..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Line Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Line Items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        description: '',
                        quantity: 1,
                        unit_price: 0,
                        unit: '',
                      })
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="col-span-5">
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Qty"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.unit_price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Price"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.unit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Unit" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="tax_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discount_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="valid_until"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid Until *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Totals Preview */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">
                      ${calculateSubtotal().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span className="font-medium">
                      $
                      {(
                        calculateSubtotal() *
                        ((form.watch('tax_rate') || 0) / 100)
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Discount:</span>
                    <span className="font-medium text-red-600">
                      -${(form.watch('discount_amount') || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-green-600 pt-2 border-t border-green-200">
                    <span>Total:</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <FormField
                control={form.control}
                name="payment_terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Net 30, 50% deposit required, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="terms_and_conditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms & Conditions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Terms and conditions..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewDialog(false);
                    setEditingEstimate(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? 'Saving...'
                    : editingEstimate
                      ? 'Update Estimate'
                      : 'Create Estimate'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteEstimateId}
        onOpenChange={() => setDeleteEstimateId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Estimate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this estimate? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEstimate}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
