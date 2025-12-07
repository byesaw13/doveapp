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
import { sendEstimate } from '@/lib/db/estimates';
import { getPendingTasks } from '@/lib/db/activities';
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
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);

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
    loadPendingTasks();
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

  const loadPendingTasks = async () => {
    try {
      const tasks = await getPendingTasks();
      setPendingTasks(tasks);
    } catch (error) {
      console.error('Failed to load pending tasks:', error);
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

  const handleSendEstimate = async (estimateId: string) => {
    try {
      await sendEstimate(estimateId);
      toast({
        title: 'Estimate Sent',
        description: 'Estimate has been sent and follow-up task created.',
      });
      await loadEstimates();
      await loadPendingTasks();
    } catch (error) {
      console.error('Failed to send estimate:', error);
      toast({
        title: 'Error',
        description: 'Failed to send estimate.',
        variant: 'destructive',
      });
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700 border-gray-300',
      sent: 'bg-blue-100 text-blue-700 border-blue-300',
      followup_pending: 'bg-orange-100 text-orange-700 border-orange-300',
      sent_no_followup: 'bg-indigo-100 text-indigo-700 border-indigo-300',
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
      case 'followup_pending':
        return <Clock className="w-4 h-4" />;
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

  const getEstimateWorkflowStatus = (estimate: EstimateWithRelations) => {
    if (estimate.status === 'sent') {
      // Check if there's a pending follow-up task for this estimate
      const followUpTask = pendingTasks.find(
        (task) =>
          task.metadata?.estimate_id === estimate.id &&
          task.metadata?.task_type === 'estimate_followup'
      );
      return followUpTask ? 'followup_pending' : 'sent_no_followup';
    }
    return estimate.status;
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
    <>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl shadow-lg p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Estimates</h1>
              <p className="mt-2 text-emerald-100">
                Create and manage quotes and proposals for your clients
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewDialog(true)}
                className="px-4 py-2 bg-white text-emerald-700 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Estimate
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Sidebar */}
          <div className="w-80 bg-white rounded-xl border border-slate-200 shadow-lg flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <h2 className="text-lg font-bold text-slate-900">Estimates</h2>
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search estimates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-9 h-10 border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  {estimates.length} estimates
                </div>
              </div>
            </div>

            {/* Estimates List */}
            <div className="flex-1 overflow-y-auto">
              {estimates.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No estimates found
                  </h3>
                  <p className="text-sm text-slate-600">
                    Create your first estimate to get started
                  </p>
                </div>
              ) : (
                estimates.map((estimate) => (
                  <button
                    key={estimate.id}
                    onClick={() => setSelectedEstimate(estimate)}
                    className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      selectedEstimate?.id === estimate.id
                        ? 'bg-emerald-50 border-l-4 border-l-emerald-500'
                        : ''
                    }`}
                  >
                    <div className="font-semibold text-slate-900 text-sm">
                      #{estimate.estimate_number}
                    </div>
                    <div className="text-slate-600 text-sm mt-1 truncate">
                      {estimate.title}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge
                        className={`text-xs ${getStatusColor(
                          getEstimateWorkflowStatus(estimate)
                        )}`}
                      >
                        {getEstimateWorkflowStatus(estimate) ===
                        'followup_pending'
                          ? 'Follow-up Pending'
                          : getEstimateWorkflowStatus(estimate) ===
                              'sent_no_followup'
                            ? 'Sent'
                            : estimate.status.charAt(0).toUpperCase() +
                              estimate.status.slice(1)}
                      </Badge>
                      <span className="text-slate-500 text-xs">
                        ${estimate.total.toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
            {selectedEstimate ? (
              <div className="overflow-y-auto h-full">
                {/* Estimate Header */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 p-6 mb-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-slate-900 mb-1">
                        Estimate #{selectedEstimate.estimate_number}
                      </h2>
                      <p className="text-slate-600 font-medium mb-2">
                        {selectedEstimate.title}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border ${getStatusColor(
                              getEstimateWorkflowStatus(selectedEstimate)
                            )}`}
                          >
                            {getStatusIcon(
                              getEstimateWorkflowStatus(selectedEstimate)
                            )}
                            {getEstimateWorkflowStatus(selectedEstimate) ===
                            'followup_pending'
                              ? 'Follow-up Pending'
                              : getEstimateWorkflowStatus(selectedEstimate) ===
                                  'sent_no_followup'
                                ? 'Sent'
                                : selectedEstimate.status
                                    .charAt(0)
                                    .toUpperCase() +
                                  selectedEstimate.status.slice(1)}
                          </Badge>
                        </div>
                        {selectedEstimate.client && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Client:</span>
                            <span className="font-medium">
                              {selectedEstimate.client.first_name}{' '}
                              {selectedEstimate.client.last_name}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Total:</span>
                          <span className="font-bold text-lg text-emerald-600">
                            ${selectedEstimate.total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {getEstimateWorkflowStatus(selectedEstimate) ===
                        'followup_pending' && (
                        <div className="mt-3 text-sm text-orange-600 font-medium">
                          📅 Follow-up due in 7 days
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {selectedEstimate.status === 'draft' && (
                        <Button
                          onClick={() =>
                            handleSendEstimate(selectedEstimate.id)
                          }
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send Estimate
                        </Button>
                      )}
                      <Button
                        onClick={() => setEditingEstimate(selectedEstimate)}
                        variant="outline"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>

                  {/* Estimate Details */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        Created
                      </label>
                      <p className="text-slate-900 font-medium">
                        {formatDateTime(selectedEstimate.created_at)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        Valid Until
                      </label>
                      <p className="text-slate-900 font-medium">
                        {selectedEstimate.valid_until
                          ? formatDateTime(selectedEstimate.valid_until)
                          : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        Subtotal
                      </label>
                      <p className="text-slate-900 font-medium">
                        ${selectedEstimate.subtotal?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        Tax
                      </label>
                      <p className="text-slate-900 font-medium">
                        ${selectedEstimate.tax_amount?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div className="px-6 pb-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    Line Items
                  </h3>
                  {selectedEstimate.line_items &&
                  selectedEstimate.line_items.length > 0 ? (
                    <div className="space-y-3">
                      {selectedEstimate.line_items.map((item, index) => (
                        <div
                          key={index}
                          className="p-4 border border-slate-200 rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900">
                                {item.description}
                              </h4>
                              <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                                <span>Qty: {item.quantity}</span>
                                <span>Rate: ${item.unit_price}</span>
                                <span>Total: ${item.total}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                      <p>No line items found</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-slate-500">
                  <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Select an estimate
                  </h3>
                  <p className="text-slate-600">
                    Choose an estimate from the sidebar to view its details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Estimate Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Estimate</DialogTitle>
            <DialogDescription>
              Create a new estimate for a client or lead
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreateEstimate)}
              className="space-y-6"
            >
              {/* Client/Lead Selection */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No client</SelectItem>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.first_name} {client.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lead_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a lead" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No lead</SelectItem>
                          {leads.map((lead) => (
                            <SelectItem key={lead.id} value={lead.id}>
                              {lead.first_name} {lead.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Estimate title" {...field} />
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
                      <FormLabel>Valid Until</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Line Items</h3>
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

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-12 gap-4 items-end"
                    >
                      <div className="col-span-4">
                        <FormField
                          control={form.control}
                          name={`line_items.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Item description"
                                  {...field}
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
                          name={`line_items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Qty</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseFloat(e.target.value) || 0
                                    )
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
                              <FormLabel>Unit Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseFloat(e.target.value) || 0
                                    )
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
                              <FormLabel>Unit</FormLabel>
                              <FormControl>
                                <Input placeholder="ea" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Subtotal
                  </label>
                  <div className="text-lg font-semibold">
                    ${calculateSubtotal().toFixed(2)}
                  </div>
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="tax_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Total
                  </label>
                  <div className="text-xl font-bold text-blue-600">
                    ${calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Additional Fields */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="payment_terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Net 30" {...field} />
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
                      <FormLabel>Discount Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="terms_and_conditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms & Conditions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter terms and conditions..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Estimate'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Estimate Dialog */}
      <Dialog
        open={!!editingEstimate}
        onOpenChange={() => setEditingEstimate(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Estimate</DialogTitle>
            <DialogDescription>
              Update estimate details and line items
            </DialogDescription>
          </DialogHeader>

          {editingEstimate && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleUpdateEstimate)}
                className="space-y-6"
              >
                {/* Similar form fields as create dialog */}
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingEstimate(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Updating...' : 'Update Estimate'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
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
    </>
  );
}
