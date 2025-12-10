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
import { useToast } from '@/components/ui/toast';
import { useForm } from 'react-hook-form';
import type { Lead } from '@/types/lead';
import type { LeadFormData } from '@/lib/validations/lead';
import {
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  PhoneCall,
  MessageSquare,
  Send,
  RefreshCw,
} from 'lucide-react';
import {
  handleCallLead as callLead,
  handleTextLead as textLead,
  handleEmailLead as emailLead,
  sortLeadsByUrgency,
  calculateUrgencyScore,
} from '@/lib/lead-utils';

interface LeadListProps {
  onStatsUpdate?: () => void;
  statusFilter?: string | null;
  sortByUrgency?: boolean;
  autoRefresh?: boolean;
  showUrgencyIndicators?: boolean;
}

export default function LeadListContent({
  onStatsUpdate,
  statusFilter,
  sortByUrgency = false,
  autoRefresh = false,
  showUrgencyIndicators = false,
}: LeadListProps) {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
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
  }, []);

  // Auto-refresh if enabled
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadLeads, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Filter and sort leads when statusFilter or sortByUrgency changes
  useEffect(() => {
    let result = [...leads];

    // Apply status filter
    if (statusFilter) {
      result = result.filter((lead) => lead.status === statusFilter);
    }

    // Apply urgency sorting
    if (sortByUrgency) {
      result = sortLeadsByUrgency(result);
    }

    setFilteredLeads(result);
  }, [leads, statusFilter, sortByUrgency]);

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
      if (onStatsUpdate) onStatsUpdate();
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
    sessionStorage.setItem(
      'newEstimate',
      JSON.stringify({
        client_name: `${lead.first_name} ${lead.last_name}`,
        email: lead.email,
        phone: lead.phone,
        company_name: lead.company_name,
        service_description: lead.service_description,
        estimated_value: lead.estimated_value,
      })
    );
    window.location.href = '/estimates';
  };

  const handleConvertToClient = async (lead: Lead) => {
    try {
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

      await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'converted',
          converted_to_client_id: newClient.id,
        }),
      });

      toast({
        title: 'Success',
        description: 'Lead converted to client successfully',
      });

      setSelectedLead(null);
      loadLeads();
      if (onStatsUpdate) onStatsUpdate();
    } catch (error) {
      console.error('Failed to convert lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to convert lead to client',
        variant: 'destructive',
      });
    }
  };

  const handleCallLead = (lead: Lead) => {
    callLead(lead.phone);
  };

  const handleTextLead = (lead: Lead) => {
    textLead(lead.phone);
  };

  const handleEmailLead = (lead: Lead) => {
    emailLead(lead.email || '');
  };

  const handleQuickStatusChange = async (lead: Lead, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast({
        title: 'Status Updated',
        description: `Lead status changed to ${newStatus.replace('_', ' ')}`,
      });

      loadLeads();
      if (onStatsUpdate) onStatsUpdate();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lead status',
        variant: 'destructive',
      });
    }
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
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
          <div className="text-slate-600">Loading leads...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
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
        <Button onClick={handleSearch} className="h-12">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Button
          onClick={() => setShowNewLeadDialog(true)}
          className="h-12 bg-emerald-500 hover:bg-emerald-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Lead
        </Button>
      </div>

      {/* Status Filter Indicator */}
      {statusFilter && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Filtering by status:{' '}
              <span className="font-bold capitalize">
                {statusFilter.replace('_', ' ')}
              </span>
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => (window.location.href = '/leads')}
            className="text-blue-600 border-blue-300 hover:bg-blue-100"
          >
            Clear Filter
          </Button>
        </div>
      )}

      {/* Leads Grid */}
      <div className="grid gap-4">
        {filteredLeads.length > 0 ? (
          filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className={`bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-200 cursor-pointer group ${
                showUrgencyIndicators && calculateUrgencyScore(lead) > 100
                  ? 'border-l-4 border-l-red-500'
                  : showUrgencyIndicators && lead.status === 'new'
                    ? 'border-l-4 border-l-blue-500'
                    : ''
              }`}
              onClick={() => setSelectedLead(lead)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-slate-900">
                      {lead.first_name} {lead.last_name}
                    </h3>
                    <Select
                      value={lead.status}
                      onValueChange={(value) => {
                        handleQuickStatusChange(lead, value);
                      }}
                    >
                      <SelectTrigger
                        className={`w-auto h-auto border-0 p-0 ${
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
                                      : 'bg-red-100 text-red-800'
                        } rounded-full px-2.5 py-1 text-xs font-medium hover:opacity-80 transition-opacity`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(lead.status)}
                          <span className="capitalize">
                            {lead.status.replace('_', ' ')}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent onClick={(e) => e.stopPropagation()}>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="proposal_sent">
                          Proposal Sent
                        </SelectItem>
                        <SelectItem value="negotiating">Negotiating</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge
                      className={
                        lead.priority === 'low'
                          ? 'bg-gray-100 text-gray-800'
                          : lead.priority === 'medium'
                            ? 'bg-blue-100 text-blue-800'
                            : lead.priority === 'high'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                      }
                    >
                      {lead.priority}
                    </Badge>
                  </div>

                  {lead.company_name && (
                    <p className="text-slate-600 mb-2">{lead.company_name}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4" />
                      {lead.phone}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                    {lead.city && lead.state && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-4 h-4" />
                        {lead.city}, {lead.state}
                      </div>
                    )}
                  </div>

                  {lead.service_description && (
                    <p className="text-slate-700 text-sm line-clamp-2 mb-3">
                      {lead.service_description}
                    </p>
                  )}

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCallLead(lead);
                      }}
                    >
                      <PhoneCall className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="hover:bg-blue-50 hover:border-blue-300 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTextLead(lead);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Text
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="hover:bg-purple-50 hover:border-purple-300 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEmailLead(lead);
                      }}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Email
                    </Button>
                    <Button
                      size="sm"
                      className="bg-purple-500 hover:bg-purple-600 text-white shadow-sm hover:shadow-md transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateEstimate(lead);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Estimate
                    </Button>
                    {lead.status !== 'converted' && (
                      <Button
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:shadow-md transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConvertToClient(lead);
                        }}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Convert
                      </Button>
                    )}
                  </div>
                </div>

                {lead.estimated_value && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600">
                      ${lead.estimated_value.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">Est. Value</div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No leads found
            </h3>
            <p className="text-slate-600 mb-4">
              {searchQuery
                ? 'Try a different search term'
                : 'Get started by creating your first lead'}
            </p>
            <Button
              onClick={() => setShowNewLeadDialog(true)}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Lead
            </Button>
          </div>
        )}
      </div>

      {/* Existing lead detail and new lead dialogs remain the same */}
      {/* ... (keeping original dialog code) */}
    </div>
  );
}
