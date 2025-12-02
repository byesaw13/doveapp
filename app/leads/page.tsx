'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { Lead, LeadStats } from '@/types/lead';
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-gray-600 font-medium">Loading leads...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto p-6">
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

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="text-3xl font-bold">{stats.total_leads}</div>
                <div className="text-sm text-blue-100 mt-1">Total Leads</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="text-3xl font-bold">{stats.new_leads}</div>
                <div className="text-sm text-purple-100 mt-1">New</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="text-3xl font-bold">
                  {stats.qualified_leads}
                </div>
                <div className="text-sm text-green-100 mt-1">Qualified</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardContent className="p-4">
                <div className="text-3xl font-bold">
                  {stats.converted_leads}
                </div>
                <div className="text-sm text-emerald-100 mt-1">Converted</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="text-3xl font-bold">
                  {stats.conversion_rate.toFixed(1)}%
                </div>
                <div className="text-sm text-orange-100 mt-1">Conv. Rate</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-500 to-pink-600 text-white">
              <CardContent className="p-4">
                <div className="text-3xl font-bold">
                  ${(stats.total_estimated_value / 1000).toFixed(0)}k
                </div>
                <div className="text-sm text-pink-100 mt-1">Est. Value</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Leads List */}
        <div className="grid gap-4">
          {leads.length > 0 ? (
            leads.map((lead) => (
              <Card
                key={lead.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                onClick={() => setSelectedLead(lead)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">
                          {lead.first_name} {lead.last_name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={getStatusColor(lead.status)}
                        >
                          {getStatusIcon(lead.status)}
                          <span className="ml-1">
                            {lead.status.replace('_', ' ')}
                          </span>
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getPriorityColor(lead.priority)}
                        >
                          {lead.priority}
                        </Badge>
                      </div>

                      {lead.company_name && (
                        <p className="text-gray-600 mb-2">
                          {lead.company_name}
                        </p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{lead.phone}</span>
                        </div>
                        {lead.city && lead.state && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {lead.city}, {lead.state}
                            </span>
                          </div>
                        )}
                        {lead.follow_up_date && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Follow-up:{' '}
                              {format(new Date(lead.follow_up_date), 'MMM d')}
                            </span>
                          </div>
                        )}
                      </div>

                      {lead.service_description && (
                        <p className="text-gray-700 mt-3 line-clamp-2">
                          {lead.service_description}
                        </p>
                      )}
                    </div>

                    {lead.estimated_value && (
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-green-600">
                          ${lead.estimated_value.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">Est. Value</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No leads found
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Get started by creating your first lead'}
                </p>
                <Button
                  onClick={() => setShowNewLeadDialog(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Lead
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-600" />
              {selectedLead?.first_name} {selectedLead?.last_name}
            </DialogTitle>
            <DialogDescription>
              {selectedLead?.company_name || 'Individual Lead'}
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-6 mt-4">
              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs font-medium text-gray-600 uppercase">
                    Status
                  </label>
                  <div className="mt-2">
                    <Badge
                      variant="outline"
                      className={getStatusColor(selectedLead.status)}
                    >
                      {getStatusIcon(selectedLead.status)}
                      <span className="ml-1">
                        {selectedLead.status.replace('_', ' ')}
                      </span>
                    </Badge>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs font-medium text-gray-600 uppercase">
                    Priority
                  </label>
                  <div className="mt-2">
                    <Badge
                      variant="outline"
                      className={getPriorityColor(selectedLead.priority)}
                    >
                      {selectedLead.priority}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">{selectedLead.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">{selectedLead.phone}</span>
                  </div>
                  {selectedLead.alternate_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">
                        {selectedLead.alternate_phone}
                      </span>
                    </div>
                  )}
                  {(selectedLead.address || selectedLead.city) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">
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
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Service Requested
                  </h3>
                  {selectedLead.service_type && (
                    <div className="mb-2">
                      <Badge className="bg-purple-100 text-purple-700">
                        {selectedLead.service_type}
                      </Badge>
                    </div>
                  )}
                  {selectedLead.service_description && (
                    <p className="text-sm text-gray-700">
                      {selectedLead.service_description}
                    </p>
                  )}
                </div>
              )}

              {/* Value and Dates */}
              <div className="grid grid-cols-2 gap-4">
                {selectedLead.estimated_value && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
                    <label className="text-xs font-medium text-gray-600 uppercase">
                      Estimated Value
                    </label>
                    <div className="text-2xl font-bold text-green-600 mt-1">
                      ${selectedLead.estimated_value.toLocaleString()}
                    </div>
                  </div>
                )}
                {selectedLead.follow_up_date && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-xs font-medium text-gray-600 uppercase">
                      Follow-up Date
                    </label>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">
                        {format(new Date(selectedLead.follow_up_date), 'PPP')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Lead Source */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-xs font-medium text-gray-600 uppercase">
                  Lead Source
                </label>
                <div className="mt-2">
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-700 border-blue-300"
                  >
                    {selectedLead.source.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {/* Notes */}
              {selectedLead.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs font-medium text-gray-600 uppercase">
                    Notes
                  </label>
                  <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                    {selectedLead.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500">
                  <FileText className="w-4 h-4 mr-2" />
                  Create Estimate
                </Button>
                <Button variant="outline" className="flex-1">
                  <Users className="w-4 h-4 mr-2" />
                  Convert to Client
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Lead Dialog - Placeholder for now */}
      <Dialog open={showNewLeadDialog} onOpenChange={setShowNewLeadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Lead</DialogTitle>
            <DialogDescription>
              Add a new potential customer to your pipeline
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-600">Lead form coming soon...</p>
            <p className="text-sm text-gray-500 mt-2">
              Use the API endpoint to create leads for now
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
