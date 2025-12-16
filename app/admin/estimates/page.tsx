'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  reviewEstimateWithAI,
  quickEstimateValidation,
} from '@/lib/ai/estimate-review';
import type { EstimateReviewResult } from '@/lib/ai/estimate-review';
import SKUPicker from '@/components/estimates/SKUPicker';
import {
  formatCurrency,
  formatDate,
  formatEstimateStatus,
} from '@/lib/formatters';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

// Lazy load AI Estimate Generator
const AIEstimateGenerator = dynamic(
  () => import('@/components/ai-estimate-generator'),
  {
    loading: () => (
      <div className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed">
        Loading AI Generator...
      </div>
    ),
  }
);
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
  Sparkles,
  Loader2,
  AlertCircle,
  Download,
} from 'lucide-react';
import { exportEstimatesToCSV } from '@/lib/csv-export';
import { format } from 'date-fns';

// Lazy load KanbanBoard component
const KanbanBoard = dynamic(() => import('@/components/kanban/KanbanBoard'), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ),
}) as any;
import estimateDisclaimers from '@/data/pricebook/estimate_disclaimers.json';

export default function EstimatesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [estimates, setEstimates] = useState<EstimateWithRelations[]>([]);
  const [stats, setStats] = useState<EstimateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
  const [selectedEstimates, setSelectedEstimates] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
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
  const [aiReview, setAiReview] = useState<EstimateReviewResult | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Pricebook integration
  const [showSKUPicker, setShowSKUPicker] = useState(false);
  const [pricebookCalculation, setPricebookCalculation] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  // Business settings
  const [businessSettings, setBusinessSettings] = useState<any>(null);

  const form = useForm<EstimateFormData>({
    resolver: zodResolver(estimateSchema) as any,
    defaultValues: {
      client_id: '',
      lead_id: '',
      title: '',
      description: '',
      line_items: [
        {
          description: '',
          quantity: 1,
          unit_price: 0,
          unit: '',
          materialCost: 0,
          tier: 'standard',
        },
      ],
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

  // Missing function definitions
  const loadEstimates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/estimates');
      if (!response.ok) throw new Error('Failed to load estimates');
      const data = await response.json();
      setEstimates(data.estimates || []);
      setStats(data.stats);
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
      if (!response.ok) throw new Error('Failed to load stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadBusinessSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to load business settings');
      const data = await response.json();
      setBusinessSettings(data);
    } catch (error) {
      console.error('Failed to load business settings:', error);
    }
  };

  const checkForLeadData = () => {
    // Check URL params for lead data
    const urlParams = new URLSearchParams(window.location.search);
    const leadId = urlParams.get('lead_id');
    if (leadId) {
      form.setValue('lead_id', leadId);
    }
  };

  const handleCreateEstimate = async (data: EstimateFormData) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create estimate');

      toast({
        title: 'Success',
        description: 'Estimate created successfully',
      });

      setShowNewDialog(false);
      form.reset();
      loadEstimates();
    } catch (error) {
      console.error('Failed to create estimate:', error);
      toast({
        title: 'Error',
        description: 'Failed to create estimate',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendEstimate = async (estimateId: string) => {
    try {
      const response = await fetch(`/api/estimates/${estimateId}/send`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to send estimate');

      toast({
        title: 'Success',
        description: 'Estimate sent successfully',
      });

      loadEstimates();
    } catch (error) {
      console.error('Failed to send estimate:', error);
      toast({
        title: 'Error',
        description: 'Failed to send estimate',
        variant: 'destructive',
      });
    }
  };

  const calculateSubtotal = () => {
    return fields.reduce((total, field, index) => {
      const quantity = form.watch(`line_items.${index}.quantity`) || 0;
      const unitPrice = form.watch(`line_items.${index}.unit_price`) || 0;
      return total + quantity * unitPrice;
    }, 0);
  };

  useEffect(() => {
    checkForLeadData();
    loadBusinessSettings();
    loadEstimates();
  }, [dateRange, amountRange, selectedStatuses, selectedClients]);

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

  // Kanban helper functions
  const getKanbanColumns = () => {
    const filteredEstimates = estimates.filter((estimate) => {
      const query = searchQuery.toLowerCase();

      // Search query filter
      const matchesQuery =
        estimate.title?.toLowerCase().includes(query) ||
        estimate.description?.toLowerCase().includes(query) ||
        estimate.client?.first_name?.toLowerCase().includes(query) ||
        estimate.client?.last_name?.toLowerCase().includes(query) ||
        estimate.client?.company_name?.toLowerCase().includes(query);

      // Date range filter
      const matchesDate =
        !dateRange.from ||
        !dateRange.to ||
        (estimate.created_at &&
          new Date(estimate.created_at) >= dateRange.from &&
          new Date(estimate.created_at) <= dateRange.to);

      // Amount range filter
      const matchesAmount =
        (!amountRange.min || estimate.total >= amountRange.min) &&
        (!amountRange.max || estimate.total <= amountRange.max);

      // Status filter
      const matchesStatus =
        selectedStatuses.length === 0 ||
        selectedStatuses.includes(estimate.status);

      // Client filter
      const matchesClient =
        selectedClients.length === 0 ||
        (estimate.client_id && selectedClients.includes(estimate.client_id));

      return (
        matchesQuery &&
        matchesDate &&
        matchesAmount &&
        matchesStatus &&
        matchesClient
      );
    });

    return [
      {
        id: 'draft',
        title: 'Draft',
        items: filteredEstimates.filter((est) => est.status === 'draft'),
        color: 'border-slate-400',
      },
      {
        id: 'sent',
        title: 'Sent',
        items: filteredEstimates.filter((est) => est.status === 'sent'),
        color: 'border-blue-400',
      },
      {
        id: 'approved',
        title: 'Approved',
        items: filteredEstimates.filter((est) => est.status === 'approved'),
        color: 'border-green-400',
      },
      {
        id: 'declined',
        title: 'Declined',
        items: filteredEstimates.filter((est) => est.status === 'declined'),
        color: 'border-red-400',
      },
      {
        id: 'expired',
        title: 'Expired',
        items: filteredEstimates.filter((est) => est.status === 'expired'),
        color: 'border-gray-400',
      },
    ];
  };

  const handleStatusChange = async (estimateId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/estimates/${estimateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update estimate status');
      }

      toast({
        title: 'Status Updated',
        description: `Estimate moved to ${newStatus}`,
      });

      loadEstimates();
      loadStats();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update estimate status',
        variant: 'destructive',
      });
      throw error; // Re-throw to let KanbanBoard handle the error
    }
  };

  const renderKanbanCard = (estimate: EstimateWithRelations) => {
    const workflowStatus = getEstimateWorkflowStatus(estimate);
    const clientName = estimate.client
      ? `${estimate.client.first_name} ${estimate.client.last_name}`
      : estimate.lead
        ? `${estimate.lead.first_name} ${estimate.lead.last_name}`
        : 'No Client';

    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 text-sm truncate">
              #{estimate.estimate_number}
            </h4>
            <p className="text-slate-600 text-sm truncate mt-1">
              {estimate.title}
            </p>
          </div>
          <Badge className={`text-xs ml-2 ${getStatusColor(workflowStatus)}`}>
            {workflowStatus === 'followup_pending'
              ? 'Follow-up'
              : workflowStatus === 'sent_no_followup'
                ? 'Sent'
                : estimate.status.charAt(0).toUpperCase() +
                  estimate.status.slice(1)}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 truncate">{clientName}</span>
            <span className="font-semibold text-emerald-600">
              ${estimate.total.toLocaleString()}
            </span>
          </div>

          {estimate.sent_date && (
            <div className="text-xs text-slate-500">
              Sent {format(new Date(estimate.sent_date), 'MMM d')}
            </div>
          )}

          {estimate.valid_until && (
            <div className="text-xs text-slate-500">
              Expires {format(new Date(estimate.valid_until), 'MMM d')}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Filter estimates based on current filters
  const filteredEstimates = estimates.filter((estimate) => {
    const query = searchQuery.toLowerCase();

    // Search query filter
    const matchesQuery =
      estimate.title?.toLowerCase().includes(query) ||
      estimate.description?.toLowerCase().includes(query) ||
      estimate.client?.first_name?.toLowerCase().includes(query) ||
      estimate.client?.last_name?.toLowerCase().includes(query) ||
      estimate.client?.company_name?.toLowerCase().includes(query);

    // Date range filter
    const matchesDate =
      !dateRange.from ||
      !dateRange.to ||
      (estimate.created_at &&
        new Date(estimate.created_at) >= dateRange.from &&
        new Date(estimate.created_at) <= dateRange.to);

    // Amount range filter
    const matchesAmount =
      (!amountRange.min || estimate.total >= amountRange.min) &&
      (!amountRange.max || estimate.total <= amountRange.max);

    // Status filter
    const matchesStatus =
      selectedStatuses.length === 0 ||
      selectedStatuses.includes(estimate.status);

    // Client filter
    const matchesClient =
      selectedClients.length === 0 ||
      (estimate.client_id && selectedClients.includes(estimate.client_id));

    return (
      matchesQuery &&
      matchesDate &&
      matchesAmount &&
      matchesStatus &&
      matchesClient
    );
  });

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
                onClick={() => exportEstimatesToCSV(estimates)}
                disabled={estimates.length === 0}
                className="px-4 py-2 bg-white text-emerald-700 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
              <div className="flex bg-white/20 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-emerald-700'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-white text-emerald-700'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Kanban
                </button>
              </div>
              <AIEstimateGenerator onEstimateCreated={loadEstimates} />
              <button
                onClick={() => setShowNewDialog(true)}
                className="px-4 py-2 bg-white text-emerald-700 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                aria-label="Create new estimate"
              >
                <Plus className="w-4 h-4 mr-2" />
                Manual Estimate
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Sidebar */}
          <div className="w-80 bg-white rounded-xl border border-slate-200 shadow-lg flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <Breadcrumbs items={[{ label: 'Estimates' }]} />
            </div>

            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <h2 className="text-lg font-bold text-slate-900">Estimates</h2>
              <div className="mt-4">
                <div className="text-xs text-slate-500">
                  {filteredEstimates.length} of {estimates.length} estimates
                </div>
              </div>
            </div>

            {/* Estimates List */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                {viewMode === 'list' ? (
                  filteredEstimates.map((estimate) => (
                    <div
                      key={estimate.id}
                      className="flex items-center gap-2 p-3 hover:bg-slate-50 rounded-lg"
                    >
                      <Checkbox
                        checked={selectedEstimates.includes(estimate.id)}
                        onCheckedChange={(checked) => {
                          checked
                            ? setSelectedEstimates([
                                ...selectedEstimates,
                                estimate.id,
                              ])
                            : setSelectedEstimates(
                                selectedEstimates.filter(
                                  (id) => id !== estimate.id
                                )
                              );
                        }}
                        aria-label={`Select estimate ${estimate.estimate_number}`}
                      />
                      <button
                        onClick={() => setSelectedEstimate(estimate)}
                        className={`flex-1 text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
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
                            className={`text-xs ${getStatusColor(getEstimateWorkflowStatus(estimate))}`}
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
                            ${estimate.total?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </button>
                    </div>
                  ))
                ) : (
                  <KanbanBoard
                    columns={getKanbanColumns()}
                    onStatusChange={handleStatusChange}
                    renderCard={renderKanbanCard}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
            {selectedEstimate ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Estimate #{selectedEstimate.estimate_number}
                    </h3>
                    <p className="text-slate-600 mt-1">
                      {selectedEstimate.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Total:</span>
                    <span className="font-bold text-lg text-emerald-600">
                      ${selectedEstimate.total?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>

                {getEstimateWorkflowStatus(selectedEstimate) ===
                  'followup_pending' && (
                  <div className="mt-3 text-sm text-orange-600 font-medium mb-4">
                    📅 Follow-up due in 7 days
                  </div>
                )}

                <div className="flex gap-2 mb-6">
                  {selectedEstimate.status === 'draft' && (
                    <Button
                      onClick={() => handleSendEstimate(selectedEstimate.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Estimate
                    </Button>
                  )}
                  {selectedEstimate.status === 'approved' &&
                    selectedEstimate.converted_to_job_id && (
                      <Button
                        onClick={() =>
                          router.push(
                            `/jobs/${selectedEstimate.converted_to_job_id}`
                          )
                        }
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Go to Job
                      </Button>
                    )}
                  <Button
                    onClick={() =>
                      window.open(
                        `/api/estimates/${selectedEstimate.id}/pdf`,
                        '_blank'
                      )
                    }
                    variant="outline"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    onClick={() =>
                      router.push(`/estimates/${selectedEstimate.id}/summary`)
                    }
                    variant="outline"
                  >
                    View Summary
                  </Button>
                  <Button
                    onClick={() => setEditingEstimate(selectedEstimate)}
                    variant="outline"
                  >
                    Edit
                  </Button>
                </div>

                {/* Estimate Details */}
                <div className="grid grid-cols-2 gap-6 mb-6">
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

                {/* Line Items */}
                <div className="mb-6">
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

                {/* Disclaimers Section */}
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    Standard Terms & Conditions
                  </h3>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <ul className="space-y-2 text-sm text-slate-700">
                      {estimateDisclaimers.lines.map((line, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-slate-500 mt-1">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                    {selectedEstimate.created_at && (
                      <div className="mt-4 pt-3 border-t border-slate-200">
                        <p className="text-sm text-slate-600">
                          <strong>This estimate is valid until:</strong>{' '}
                          {new Date(
                            new Date(selectedEstimate.created_at).getTime() +
                              estimateDisclaimers.validity_days *
                                24 *
                                60 *
                                60 *
                                1000
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
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
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          aria-labelledby="new-estimate-title"
          aria-describedby="new-estimate-description"
        >
          <DialogHeader>
            <DialogTitle id="new-estimate-title">
              Create New Estimate
            </DialogTitle>
            <DialogDescription id="new-estimate-description">
              Fill in the details to create a new estimate for your client.
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
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSKUPicker(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add from Pricebook
                    </Button>
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
                          materialCost: 0,
                          tier: 'standard',
                        })
                      }
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Manual Item
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="grid grid-cols-12 gap-4 items-end">
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
                                        parseFloat(e.target.value) || 1
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
                            name={`line_items.${index}.materialCost`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Material Cost</FormLabel>
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
                            name={`line_items.${index}.tier`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tier</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="basic">
                                      Basic (0.9x)
                                    </SelectItem>
                                    <SelectItem value="standard">
                                      Standard (1.0x)
                                    </SelectItem>
                                    <SelectItem value="premium">
                                      Premium (1.15x)
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
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

                      {/* Display calculated values */}
                      {pricebookCalculation?.lineItems?.[index] && (
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <span className="font-medium">Labor:</span> $
                              {
                                pricebookCalculation.lineItems[index]
                                  .laborPortion
                              }
                            </div>
                            <div>
                              <span className="font-medium">Materials:</span> $
                              {
                                pricebookCalculation.lineItems[index]
                                  .materialsPortion
                              }
                            </div>
                            <div>
                              <span className="font-medium">Line Total:</span> $
                              {pricebookCalculation.lineItems[index].lineTotal}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                {/* High-risk warning */}
                {(() => {
                  const lineItems = form.watch('line_items');
                  const hasHighRisk = lineItems.some((item: any) => {
                    // Check if this line item has high risk based on serviceId
                    const serviceId = item.serviceId;
                    if (!serviceId) return false;

                    // This would need to fetch from service items, for now simplified
                    return false; // Placeholder - would check actual service item data
                  });

                  if (hasHighRisk) {
                    return (
                      <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md text-sm text-orange-800">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-semibold">
                            High-risk work detected:
                          </span>{' '}
                          This estimate includes items that may require on-site
                          inspection. Final pricing is subject to confirmation
                          based on actual site conditions.
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {pricebookCalculation && (
                  <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded border">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Pricebook Subtotal
                      </label>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(pricebookCalculation.subtotal)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Adjusted Total
                      </label>
                      <div className="text-xl font-bold text-green-700">
                        ${pricebookCalculation.adjustedTotal.toFixed(2)}
                        {pricebookCalculation.appliedMinimum && (
                          <span className="text-sm text-orange-600 ml-2">
                            (min. $150 applied)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Manual Subtotal
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
                    <div className="text-xl font-bold text-green-700">
                      $
                      {(
                        calculateSubtotal() *
                        (1 + (form.watch('tax_rate') || 0) / 100)
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Create Estimate
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* SKU Picker Dialog */}
      <SKUPicker
        open={showSKUPicker}
        onOpenChange={setShowSKUPicker}
        onSelectSKU={async (sku) => {
          try {
            // Calculate pricing using the pricebook endpoint
            const response = await fetch('/api/estimate/pricebook', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                lineItems: [
                  {
                    id: sku.id,
                    quantity: 1,
                    materialCost: 0,
                    tier: 'standard',
                  },
                ],
              }),
            });

            if (response.ok) {
              const result = await response.json();
              const calculatedItem = result.lineItems[0];

              // Add the line item to the form
              append({
                description: `${sku.name} (Code: ${sku.code})`,
                quantity: 1,
                unit_price: calculatedItem.lineTotal,
                unit: 'each',
              });

              toast({
                title: 'Service Added',
                description: `${sku.name} has been added to the estimate`,
              });
            } else {
              throw new Error('Failed to calculate pricing');
            }
          } catch (error) {
            console.error('Failed to add SKU:', error);
            toast({
              title: 'Error',
              description: 'Failed to add service item to estimate',
              variant: 'destructive',
            });
          }

          setShowSKUPicker(false);
        }}
      />
    </>
  );
}
