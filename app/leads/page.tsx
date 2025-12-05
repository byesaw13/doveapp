'use client';

import { useState, useEffect } from 'react';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import type { Lead, LeadStats } from '@/types/lead';
import { leadSchema, type LeadFormData } from '@/lib/validations/lead';
import {
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  TrendingUp,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';

export default function LeadsPage() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showNewLeadDialog, setShowNewLeadDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LeadFormData>({
    defaultValues: {
      first_name: '',
      last_name: '',
      company_name: '',
      email: '',
      phone: '',
      alternate_phone: '',
      source: 'website',
      status: 'new',
      priority: 'medium',
      service_type: '',
      service_description: '',
      estimated_value: 0,
      address: '',
      city: '',
      state: '',
      zip_code: '',
      follow_up_date: '',
      notes: '',
    },
  });

  useEffect(() => {
    loadLeads();
    loadStats();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leads');
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error('Failed to load leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leads',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/leads?action=stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadLeads();
      return;
    }

    try {
      const response = await fetch(
        `/api/leads?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleCreateLead = async (data: LeadFormData) => {
    setIsSubmitting(true);
    try {
      // Convert 0 estimated_value to undefined
      const submitData = {
        ...data,
        estimated_value:
          data.estimated_value === 0 ? undefined : data.estimated_value,
      };

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error('Failed to create lead');
      }

      const newLead = await response.json();
      setLeads((prev) => [newLead, ...prev]);
      setShowNewLeadDialog(false);
      form.reset();
      toast({
        title: 'Success',
        description: 'Lead created successfully',
      });
      loadStats(); // Refresh stats
    } catch (error) {
      console.error('Failed to create lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to create lead',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateEstimate = (lead: Lead) => {
    // Navigate to estimates page with lead data pre-filled
    const estimateData = {
      client_name: `${lead.first_name} ${lead.last_name}`,
      email: lead.email,
      phone: lead.phone,
      company_name: lead.company_name,
      service_description: lead.service_description,
      estimated_value: lead.estimated_value,
    };

    // Store in sessionStorage to pre-fill the estimate form
    sessionStorage.setItem('newEstimate', JSON.stringify(estimateData));

    // Navigate to estimates page
    window.location.href = '/estimates';
  };

  const handleConvertToClient = async (lead: Lead) => {
    try {
      // Create a new client from the lead data
      const clientData = {
        first_name: lead.first_name,
        last_name: lead.last_name,
        company_name: lead.company_name,
        email: lead.email,
        phone: lead.phone,
        address_line1: lead.address,
        city: lead.city,
        state: lead.state,
        zip_code: lead.zip_code,
        notes: lead.notes,
      };

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        throw new Error('Failed to create client');
      }

      const newClient = await response.json();

      // Update the lead status to converted
      const updateResponse = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'converted',
          converted_to_client_id: newClient.id,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update lead status');
      }

      toast({
        title: 'Success',
        description: 'Lead converted to client successfully',
      });

      // Close the dialog and refresh leads
      setSelectedLead(null);
      loadLeads();
      loadStats();
    } catch (error) {
      console.error('Failed to convert lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to convert lead to client',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-700 border-blue-300',
      contacted: 'bg-purple-100 text-purple-700 border-purple-300',
      qualified: 'bg-green-100 text-green-700 border-green-300',
      proposal_sent: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      negotiating: 'bg-orange-100 text-orange-700 border-orange-300',
      converted: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      lost: 'bg-red-100 text-red-700 border-red-300',
      unqualified: 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700',
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <AlertCircle className="w-4 h-4" />;
      case 'qualified':
        return <CheckCircle className="w-4 h-4" />;
      case 'converted':
        return <Target className="w-4 h-4" />;
      case 'lost':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header - Jobber style with emerald gradient */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 sm:px-8 lg:px-10 py-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-white">Leads</h1>
                <p className="mt-2 text-emerald-50 text-sm">
                  Loading lead data...
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
            <div className="text-slate-600">Loading leads...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Jobber style with emerald gradient */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 sm:px-8 lg:px-10 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-white">Leads</h1>
              <p className="mt-2 text-emerald-50 text-sm">
                Track and convert potential customers
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => setShowNewLeadDialog(true)}
                className="px-6 py-3 bg-white hover:bg-emerald-50 text-emerald-600 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-500 inline-flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Lead
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section - Jobber style */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Search Leads
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search leads by name, email, phone, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 h-12"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Leads
            </h1>
            <p className="text-gray-600 mt-2">
              Track and convert potential customers
            </p>
          </div>
          <Button
            onClick={() => setShowNewLeadDialog(true)}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Lead
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search leads by name, email, phone, or company..."
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

      {/* Stats Cards - Jobber style */}
      {stats && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* Total Leads Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {stats.total_leads}
            </div>
            <p className="text-sm font-medium text-slate-600">Total Leads</p>
          </div>

          {/* New Leads Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {stats.new_leads}
            </div>
            <p className="text-sm font-medium text-slate-600">New</p>
          </div>

          {/* Qualified Leads Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-green-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {stats.qualified_leads}
            </div>
            <p className="text-sm font-medium text-slate-600">Qualified</p>
          </div>

          {/* Converted Leads Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border-2 border-emerald-200 p-6 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-emerald-700 mb-1">
              {stats.converted_leads}
            </div>
            <p className="text-sm font-semibold text-emerald-600">Converted</p>
          </div>

          {/* Conversion Rate Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-md">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {stats.conversion_rate.toFixed(1)}%
            </div>
            <p className="text-sm font-medium text-slate-600">Conv. Rate</p>
          </div>

          {/* Estimated Value Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-pink-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-md">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              ${(stats.total_estimated_value / 1000).toFixed(0)}k
            </div>
            <p className="text-sm font-medium text-slate-600">Est. Value</p>
          </div>
        </div>
      )}

      {/* Leads List - Jobber style */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-md">
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">All Leads</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {leads.length} leads
            </span>
          </div>
        </div>
        <div className="p-6">
          {leads.length > 0 ? (
            <div className="grid gap-4">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer"
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-slate-900">
                          {lead.first_name} {lead.last_name}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lead.status === 'new'
                              ? 'bg-blue-100 text-blue-800'
                              : lead.status === 'contacted'
                                ? 'bg-purple-100 text-purple-800'
                                : lead.status === 'qualified'
                                  ? 'bg-green-100 text-green-800'
                                  : lead.status === 'proposal_sent'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : lead.status === 'negotiating'
                                      ? 'bg-orange-100 text-orange-800'
                                      : lead.status === 'converted'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : lead.status === 'lost'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {getStatusIcon(lead.status)}
                          <span className="ml-1">
                            {lead.status.replace('_', ' ')}
                          </span>
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lead.priority === 'low'
                              ? 'bg-gray-100 text-gray-800'
                              : lead.priority === 'medium'
                                ? 'bg-blue-100 text-blue-800'
                                : lead.priority === 'high'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {lead.priority}
                        </span>
                      </div>

                      {lead.company_name && (
                        <p className="text-slate-600 mb-2">
                          {lead.company_name}
                        </p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-4 h-4" />
                          <span>{lead.phone}</span>
                        </div>
                        {lead.city && lead.state && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {lead.city}, {lead.state}
                            </span>
                          </div>
                        )}
                        {lead.follow_up_date && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Follow-up:{' '}
                              {format(new Date(lead.follow_up_date), 'MMM d')}
                            </span>
                          </div>
                        )}
                      </div>

                      {lead.service_description && (
                        <p className="text-slate-700 mt-3 line-clamp-2">
                          {lead.service_description}
                        </p>
                      )}
                    </div>

                    {lead.estimated_value && (
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-emerald-600">
                          ${lead.estimated_value.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">Est. Value</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No leads found
              </h3>
              <p className="text-slate-600 mb-4">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Get started by creating your first lead'}
              </p>
              <button
                onClick={() => setShowNewLeadDialog(true)}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Lead
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lead Detail Dialog - Jobber style */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border-slate-200">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  {selectedLead?.first_name} {selectedLead?.last_name}
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  {selectedLead?.company_name || 'Individual Lead'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-6">
              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Status
                  </label>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedLead.status === 'new'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedLead.status === 'contacted'
                            ? 'bg-purple-100 text-purple-800'
                            : selectedLead.status === 'qualified'
                              ? 'bg-green-100 text-green-800'
                              : selectedLead.status === 'proposal_sent'
                                ? 'bg-yellow-100 text-yellow-800'
                                : selectedLead.status === 'negotiating'
                                  ? 'bg-orange-100 text-orange-800'
                                  : selectedLead.status === 'converted'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : selectedLead.status === 'lost'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {getStatusIcon(selectedLead.status)}
                      <span className="ml-1">
                        {selectedLead.status.replace('_', ' ')}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Priority
                  </label>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedLead.priority === 'low'
                          ? 'bg-gray-100 text-gray-800'
                          : selectedLead.priority === 'medium'
                            ? 'bg-blue-100 text-blue-800'
                            : selectedLead.priority === 'high'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedLead.priority}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-200 rounded">
                      <Mail className="w-4 h-4 text-slate-600" />
                    </div>
                    <span className="text-sm text-slate-700">
                      {selectedLead.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-200 rounded">
                      <Phone className="w-4 h-4 text-slate-600" />
                    </div>
                    <span className="text-sm text-slate-700">
                      {selectedLead.phone}
                    </span>
                  </div>
                  {selectedLead.alternate_phone && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-200 rounded">
                        <Phone className="w-4 h-4 text-slate-600" />
                      </div>
                      <span className="text-sm text-slate-700">
                        {selectedLead.alternate_phone}
                      </span>
                    </div>
                  )}
                  {(selectedLead.address || selectedLead.city) && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-200 rounded">
                        <MapPin className="w-4 h-4 text-slate-600" />
                      </div>
                      <span className="text-sm text-slate-700">
                        {selectedLead.address && `${selectedLead.address}, `}
                        {selectedLead.city && `${selectedLead.city}, `}
                        {selectedLead.state} {selectedLead.zip_code}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Details */}
              {(selectedLead.service_type ||
                selectedLead.service_description) && (
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 rounded">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                    Service Requested
                  </h3>
                  {selectedLead.service_type && (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {selectedLead.service_type}
                      </span>
                    </div>
                  )}
                  {selectedLead.service_description && (
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {selectedLead.service_description}
                    </p>
                  )}
                </div>
              )}

              {/* Value and Dates */}
              <div className="grid grid-cols-2 gap-4">
                {selectedLead.estimated_value && (
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border-2 border-emerald-200">
                    <label className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                      Estimated Value
                    </label>
                    <div className="text-2xl font-bold text-emerald-600 mt-1">
                      ${selectedLead.estimated_value.toLocaleString()}
                    </div>
                  </div>
                )}
                {selectedLead.follow_up_date && (
                  <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Follow-up Date
                    </label>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="p-2 bg-slate-200 rounded">
                        <Calendar className="w-5 h-5 text-slate-600" />
                      </div>
                      <span className="font-medium text-slate-900">
                        {format(new Date(selectedLead.follow_up_date), 'PPP')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Lead Source */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Lead Source
                </label>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {selectedLead.source.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedLead.notes && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Notes
                  </label>
                  <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap leading-relaxed">
                    {selectedLead.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-slate-200">
                <button
                  className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors"
                  onClick={() => handleCreateEstimate(selectedLead)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Create Estimate
                </button>
                <button
                  className="flex-1 px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-300 transition-colors"
                  onClick={() => handleConvertToClient(selectedLead)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Convert to Client
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Lead Dialog - Jobber style */}
      <Dialog open={showNewLeadDialog} onOpenChange={setShowNewLeadDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-slate-200">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  Create New Lead
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  Add a new potential customer to your pipeline
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreateLead)}
              className="space-y-8"
            >
              {/* Contact Information Section */}
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  Contact Information
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700">
                            First Name *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John"
                              {...field}
                              className="bg-white border-slate-300"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700">
                            Last Name *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Doe"
                              {...field}
                              className="bg-white border-slate-300"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-700">
                          Company Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ABC Construction"
                            {...field}
                            className="bg-white border-slate-300"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700">
                            Phone *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(555) 123-4567"
                              {...field}
                              className="bg-white border-slate-300"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="alternate_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700">
                            Alternate Phone
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(555) 987-6543"
                              {...field}
                              className="bg-white border-slate-300"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Lead Details Section */}
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-purple-100 rounded">
                    <Target className="h-4 w-4 text-purple-600" />
                  </div>
                  Lead Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-700">
                          Source *
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                              <SelectValue
                                placeholder="Select source"
                                className="text-slate-700 font-medium"
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="website">Website</SelectItem>
                            <SelectItem value="referral">Referral</SelectItem>
                            <SelectItem value="social_media">
                              Social Media
                            </SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="walk_in">Walk In</SelectItem>
                            <SelectItem value="advertisement">
                              Advertisement
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-700">
                          Priority
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                              <SelectValue
                                placeholder="Select priority"
                                className="text-slate-700 font-medium"
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estimated_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-700">
                          Estimated Value
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="50000"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined
                              )
                            }
                            className="bg-white border-slate-300"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Service Details Section */}
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 rounded">
                    <FileText className="h-4 w-4 text-emerald-600" />
                  </div>
                  Service Details
                </h3>
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="service_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-700">
                          Service Type
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Roofing, Plumbing, etc."
                            {...field}
                            className="bg-white border-slate-300"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="service_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-700">
                          Service Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the service needed..."
                            className="min-h-[80px] bg-white border-slate-300"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Address Section */}
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 rounded">
                    <MapPin className="h-4 w-4 text-amber-600" />
                  </div>
                  Address
                </h3>
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-700">
                          Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Main St"
                            {...field}
                            className="bg-white border-slate-300"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700">
                            City
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Anytown"
                              {...field}
                              className="bg-white border-slate-300"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700">
                            State
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="CA"
                              {...field}
                              className="bg-white border-slate-300"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zip_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700">
                            ZIP Code
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="12345"
                              {...field}
                              className="bg-white border-slate-300"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Follow-up and Notes Section */}
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 rounded">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                  </div>
                  Follow-up & Notes
                </h3>
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="follow_up_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-700">
                          Follow-up Date
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="bg-white border-slate-300"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-slate-700">
                          Notes
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes about this lead..."
                            className="min-h-[80px] bg-white border-slate-300"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewLeadDialog(false)}
                  className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
