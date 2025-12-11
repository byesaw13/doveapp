'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from '@/lib/db/clients';
import {
  createProperty,
  updateProperty,
  deleteProperty,
} from '@/lib/db/properties';
import { Client, ClientInsert } from '@/types/client';
import type { Property } from '@/types/property';
import type { JobWithClient } from '@/types/job';
import type { EstimateWithRelations } from '@/types/estimate';
import type { Payment } from '@/types/payment';
import { ImportCSVDialog } from './components/ImportCSVDialog';
import { ActivityTimeline } from './components/ActivityTimeline';
import { logEmailSent, logCall, logNote } from '@/lib/db/activities';
import { validateClientData, detectDuplicates } from '@/lib/validation';
import { exportClientsToCSV } from '@/lib/csv-export';

interface JobWithPayment extends JobWithClient {
  paymentSummary: {
    total: number;
    paid: number;
    remaining: number;
    status: string;
  };
}

export default function NewClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [jobs, setJobs] = useState<JobWithPayment[]>([]);
  const [estimates, setEstimates] = useState<EstimateWithRelations[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<
    'all' | 'company' | 'email' | 'phone' | 'outstanding'
  >('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<Partial<Client>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importCSVDialogOpen, setImportCSVDialogOpen] = useState(false);
  const [addingProperty, setAddingProperty] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [newPropertyData, setNewPropertyData] = useState<{
    name: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    zip_code: string;
    property_type: 'Residential' | 'Commercial';
    notes: string;
  }>({
    name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    property_type: 'Residential',
    notes: '',
  });
  const [totalStats, setTotalStats] = useState({
    totalClients: 0,
    totalProperties: 0,
    totalJobs: 0,
  });
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [activityType, setActivityType] = useState<'email' | 'call' | 'note'>(
    'note'
  );
  const [activityDescription, setActivityDescription] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationSuggestions, setValidationSuggestions] = useState<string[]>(
    []
  );

  useEffect(() => {
    loadClients();
    loadTotalStats();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadClientDetails(selectedClient.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient?.id]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTotalStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to load stats');
      }
      const stats = await response.json();
      setTotalStats({
        totalClients: stats.totalClients,
        totalProperties: stats.totalProperties,
        totalJobs: stats.totalJobs,
      });
    } catch (error) {
      console.error('Failed to load total stats:', error);
      // Set zeros on error to prevent UI issues
      setTotalStats({
        totalClients: 0,
        totalProperties: 0,
        totalJobs: 0,
      });
    }
  };

  const loadClientDetails = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/details`);
      if (!response.ok) {
        throw new Error('Failed to load client details');
      }

      const data = await response.json();
      setProperties(data.properties);
      setJobs(data.jobs);
      setEstimates(data.estimates);
    } catch (error) {
      console.error('Failed to load client details:', error);
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setEditedClient(client);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedClient(selectedClient || {});
  };

  const handleSave = async () => {
    if (!selectedClient || !editedClient) return;

    // Validate client data
    const validation = validateClientData({
      first_name: editedClient.first_name || '',
      last_name: editedClient.last_name || '',
      email: editedClient.email || undefined,
      phone: editedClient.phone || undefined,
      address_line1: editedClient.address_line1 || undefined,
      city: editedClient.city || undefined,
      state: editedClient.state || undefined,
      zip_code: editedClient.zip_code || undefined,
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setValidationSuggestions(validation.suggestions);
      return;
    }

    try {
      // Use corrected data if available
      const dataToSave = validation.correctedData || editedClient;
      await updateClient(selectedClient.id, dataToSave);
      await loadClients();
      setIsEditing(false);
      const updatedClient = await getClients();
      const updated = updatedClient.find((c) => c.id === selectedClient.id);
      if (updated) {
        setSelectedClient(updated);
        setEditedClient(updated);
      }
      setValidationErrors([]);
      setValidationSuggestions([]);
    } catch (error) {
      console.error('Failed to update client:', error);
      alert('Failed to save changes');
    }
  };

  const handleCancel = () => {
    setEditedClient(selectedClient || {});
    setIsEditing(false);
  };

  const handleNewClient = () => {
    setSelectedClient(null);
    setEditedClient({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company_name: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      zip_code: '',
      preferences: '',
    });
    setIsEditing(true);
  };

  const handleCreateClient = async () => {
    // Validate client data
    const validation = validateClientData({
      first_name: editedClient.first_name || '',
      last_name: editedClient.last_name || '',
      email: editedClient.email || undefined,
      phone: editedClient.phone || undefined,
      address_line1: editedClient.address_line1 || undefined,
      city: editedClient.city || undefined,
      state: editedClient.state || undefined,
      zip_code: editedClient.zip_code || undefined,
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setValidationSuggestions(validation.suggestions);
      return;
    }

    // Check for duplicates
    const duplicates = detectDuplicates(editedClient, clients);
    if (duplicates.length > 0) {
      setValidationSuggestions([...validation.suggestions, ...duplicates]);
      // Don't block creation, just warn
    }

    try {
      // Use corrected data if available
      const dataToSave = validation.correctedData || editedClient;
      const newClient = await createClient(dataToSave as ClientInsert);
      await loadClients();
      await loadTotalStats();
      if (newClient) {
        setSelectedClient(newClient);
        setEditedClient(newClient);
      }
      setIsEditing(false);
      setValidationErrors([]);
      setValidationSuggestions([]);
    } catch (error) {
      console.error('Failed to create client:', error);
      alert('Failed to create client');
    }
  };

  const handleDelete = () => {
    if (!selectedClient) return;
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedClient) return;

    try {
      await deleteClient(selectedClient.id);
      await loadClients();
      await loadTotalStats();
      setSelectedClient(null);
      setEditedClient({});
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete client:', error);
      alert('Failed to delete client');
    }
  };

  const handleAddProperty = async () => {
    if (!selectedClient) return;
    if (!newPropertyData.name || !newPropertyData.address_line1) {
      alert('Property name and address are required');
      return;
    }

    try {
      await createProperty({
        client_id: selectedClient.id,
        ...newPropertyData,
      });
      await loadClientDetails(selectedClient.id);
      await loadTotalStats();
      setAddingProperty(false);
      setNewPropertyData({
        name: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        zip_code: '',
        property_type: 'Residential',
        notes: '',
      });
    } catch (error) {
      console.error('Failed to add property:', error);
      alert('Failed to add property');
    }
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setNewPropertyData({
      name: property.name,
      address_line1: property.address_line1 || '',
      address_line2: property.address_line2 || '',
      city: property.city || '',
      state: property.state || '',
      zip_code: property.zip_code || '',
      property_type: property.property_type as 'Residential' | 'Commercial',
      notes: property.notes || '',
    });
  };

  const handleUpdateProperty = async () => {
    if (!editingProperty) return;
    if (!newPropertyData.name || !newPropertyData.address_line1) {
      alert('Property name and address are required');
      return;
    }

    try {
      await updateProperty(editingProperty.id, newPropertyData);
      if (selectedClient) {
        await loadClientDetails(selectedClient.id);
      }
      setEditingProperty(null);
      setNewPropertyData({
        name: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        zip_code: '',
        property_type: 'Residential',
        notes: '',
      });
    } catch (error) {
      console.error('Failed to update property:', error);
      alert('Failed to update property');
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      await deleteProperty(propertyId);
      if (selectedClient) {
        await loadClientDetails(selectedClient.id);
        await loadTotalStats();
      }
    } catch (error) {
      console.error('Failed to delete property:', error);
      alert('Failed to delete property');
    }
  };

  const formatCurrency = (amount: number) => {
    if (!amount || Number.isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCustomerDuration = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
  };

  const handleLogActivity = async () => {
    if (!selectedClient || !activityDescription.trim()) {
      alert('Please enter a description');
      return;
    }

    try {
      if (activityType === 'email') {
        await logEmailSent(selectedClient.id, activityDescription);
      } else if (activityType === 'call') {
        await logCall(
          selectedClient.id,
          'outgoing',
          undefined,
          activityDescription
        );
      } else if (activityType === 'note') {
        await logNote(selectedClient.id, activityDescription);
      }

      setActivityDescription('');
      setActivityDialogOpen(false);
      if (selectedClient) {
        await loadClientDetails(selectedClient.id);
      }
    } catch (error) {
      console.error('Failed to log activity:', error);
      alert('Failed to log activity');
    }
  };

  const handleCreateJob = () => {
    if (!selectedClient) return;
    const params = new URLSearchParams({
      client_id: selectedClient.id,
      client_name: `${selectedClient.first_name} ${selectedClient.last_name}`,
    });
    window.location.href = `/jobs/new?${params.toString()}`;
  };

  const handleCreateEstimate = () => {
    if (!selectedClient) return;
    const params = new URLSearchParams({
      client_id: selectedClient.id,
      client_name: `${selectedClient.first_name} ${selectedClient.last_name}`,
    });
    window.location.href = `/estimates?${params.toString()}`;
  };

  const handleAddCalendarEvent = () => {
    if (!selectedClient) return;
    const params = new URLSearchParams({
      client_id: selectedClient.id,
      client_name: `${selectedClient.first_name} ${selectedClient.last_name}`,
    });
    window.location.href = `/calendar?${params.toString()}`;
  };

  const getJobStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-700',
      scheduled: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return statusColors[status] || 'bg-slate-100 text-slate-700';
  };

  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();

    if (filterType === 'all') {
      return (
        fullName.includes(query) ||
        client.company_name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query)
      );
    } else if (filterType === 'company') {
      return client.company_name?.toLowerCase().includes(query);
    } else if (filterType === 'email') {
      return client.email?.toLowerCase().includes(query);
    } else if (filterType === 'phone') {
      return client.phone?.toLowerCase().includes(query);
    } else if (filterType === 'outstanding') {
      return fullName.includes(query);
    }

    return true;
  });

  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  const totalRevenue = jobs.reduce((sum, job) => sum + job.total, 0);
  const totalPaid = jobs.reduce((sum, job) => sum + job.paymentSummary.paid, 0);
  const totalOutstanding = jobs.reduce(
    (sum, job) => sum + job.paymentSummary.remaining,
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl shadow-lg p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="mt-2 text-emerald-100">
              Manage your client relationships and view their details
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setImportCSVDialogOpen(true)}
              className="px-4 py-2 bg-white text-emerald-700 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              Import CSV
            </button>
            <button
              onClick={() => exportClientsToCSV(clients)}
              disabled={clients.length === 0}
              className="px-4 py-2 bg-white text-emerald-700 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV
            </button>
            <button
              onClick={handleNewClient}
              className="px-4 py-2 bg-white text-emerald-700 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              + New Client
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Total Clients
              </p>
              <p className="text-3xl font-bold text-emerald-700 mt-2">
                {totalStats.totalClients}
              </p>
            </div>
            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Total Properties
              </p>
              <p className="text-3xl font-bold text-purple-700 mt-2">
                {totalStats.totalProperties}
              </p>
            </div>
            <div className="h-14 w-14 rounded-full bg-purple-100 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Total Jobs
              </p>
              <p className="text-3xl font-bold text-blue-700 mt-2">
                {totalStats.totalJobs}
              </p>
            </div>
            <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* Sidebar */}
        <div className="w-80 bg-white rounded-xl border border-slate-200 shadow-lg flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <h2 className="text-lg font-bold text-slate-900">Clients</h2>
            <div className="mt-4 space-y-3">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as typeof filterType);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white"
              >
                <option value="all">All Fields</option>
                <option value="company">Company</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="outstanding">Has Outstanding</option>
              </select>
              <input
                type="text"
                placeholder={`Search by ${filterType === 'all' ? 'name, company, email, phone' : filterType}...`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
              <div className="text-xs text-slate-500">
                {filteredClients.length} of {clients.length} clients
              </div>
            </div>
          </div>

          {/* Client List */}
          <div className="flex-1 overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="h-8 w-8 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No clients found
                </h3>
                <p className="text-sm text-slate-600">
                  Try adjusting your search criteria
                </p>
              </div>
            ) : (
              <>
                {paginatedClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleClientSelect(client)}
                    className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      selectedClient?.id === client.id
                        ? 'bg-emerald-50 border-l-4 border-l-emerald-500'
                        : ''
                    }`}
                  >
                    <div className="font-semibold text-slate-900">
                      {client.first_name} {client.last_name}
                    </div>
                    {client.company_name && (
                      <div className="text-sm text-slate-600 mt-1">
                        {client.company_name}
                      </div>
                    )}
                    {client.email && (
                      <div className="text-sm text-slate-500 mt-1">
                        {client.email}
                      </div>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
          {selectedClient && !isEditing ? (
            <div className="overflow-y-auto h-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 p-6 mb-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">
                      {selectedClient.first_name} {selectedClient.last_name}
                    </h2>
                    {selectedClient.company_name && (
                      <p className="text-slate-600 font-medium mb-2">
                        {selectedClient.company_name}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <svg
                        className="h-4 w-4 text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-slate-600">
                        Customer for{' '}
                        <span className="font-semibold">
                          {getCustomerDuration(selectedClient.created_at)}
                        </span>
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">
                        Since {formatDate(selectedClient.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={handleEdit}
                        className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                      >
                        Edit Client
                      </button>
                      <button
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateJob}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        + Job
                      </button>
                      <button
                        onClick={handleCreateEstimate}
                        className="px-3 py-1.5 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        + Estimate
                      </button>
                      <button
                        onClick={handleAddCalendarEvent}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        + Event
                      </button>
                      <button
                        onClick={() => setActivityDialogOpen(true)}
                        className="px-3 py-1.5 bg-slate-600 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        + Activity
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      First Name
                    </label>
                    <p className="text-slate-900 font-medium break-words">
                      {selectedClient.first_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Last Name
                    </label>
                    <p className="text-slate-900 font-medium break-words">
                      {selectedClient.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Company
                    </label>
                    <p className="text-slate-900 font-medium break-words">
                      {selectedClient.company_name || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Email
                    </label>
                    <p className="text-slate-900 font-medium break-words">
                      {selectedClient.email || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Phone
                    </label>
                    <p className="text-slate-900 font-medium break-words">
                      {selectedClient.phone || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div className="px-6 pb-6">
                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                        Total Revenue
                      </span>
                      <svg
                        className="h-5 w-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">
                      {formatCurrency(totalRevenue)}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                        Paid
                      </span>
                      <svg
                        className="h-5 w-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(totalPaid)}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-white rounded-xl border border-red-100 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                        Outstanding
                      </span>
                      <svg
                        className="h-5 w-5 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-red-700">
                      {formatCurrency(totalOutstanding)}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                        Properties
                      </span>
                      <svg
                        className="h-5 w-5 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-purple-700">
                      {properties.length}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Contact Information */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all duration-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <svg
                        className="h-5 w-5 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Contact Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                          First Name
                        </label>
                        <p className="mt-1 text-slate-900 font-medium">
                          {selectedClient.first_name}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                          Last Name
                        </label>
                        <p className="mt-1 text-slate-900 font-medium">
                          {selectedClient.last_name}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                          Company
                        </label>
                        <p className="mt-1 text-slate-900 font-medium">
                          {selectedClient.company_name || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                          Email
                        </label>
                        <p className="mt-1 text-slate-900 font-medium">
                          {selectedClient.email || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                          Phone
                        </label>
                        <p className="mt-1 text-slate-900 font-medium">
                          {selectedClient.phone || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all duration-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <svg
                        className="h-5 w-5 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Address
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                          Address Line 1
                        </label>
                        <p className="mt-1 text-slate-900 font-medium">
                          {selectedClient.address_line1 || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                          Address Line 2
                        </label>
                        <p className="mt-1 text-slate-900 font-medium">
                          {selectedClient.address_line2 || 'Not provided'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                            City
                          </label>
                          <p className="mt-1 text-slate-900 font-medium">
                            {selectedClient.city || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                            State
                          </label>
                          <p className="mt-1 text-slate-900 font-medium">
                            {selectedClient.state || 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                          ZIP Code
                        </label>
                        <p className="mt-1 text-slate-900 font-medium">
                          {selectedClient.zip_code || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-lg hover:shadow-xl transition-all duration-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Preferences & Notes
                  </h3>
                  <p className="text-slate-900 font-medium">
                    {selectedClient.preferences || 'No preferences set'}
                  </p>
                </div>

                {/* Properties */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-lg hover:shadow-xl transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <svg
                        className="h-5 w-5 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      Properties ({properties.length})
                    </h3>
                    <button
                      onClick={() => setAddingProperty(true)}
                      className="px-3 py-1 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      + Add Property
                    </button>
                  </div>

                  {addingProperty && (
                    <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-semibold mb-3">New Property</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Property Name"
                          value={newPropertyData.name}
                          onChange={(e) =>
                            setNewPropertyData({
                              ...newPropertyData,
                              name: e.target.value,
                            })
                          }
                          className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Address Line 1"
                          value={newPropertyData.address_line1}
                          onChange={(e) =>
                            setNewPropertyData({
                              ...newPropertyData,
                              address_line1: e.target.value,
                            })
                          }
                          className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Address Line 2"
                          value={newPropertyData.address_line2}
                          onChange={(e) =>
                            setNewPropertyData({
                              ...newPropertyData,
                              address_line2: e.target.value,
                            })
                          }
                          className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="City"
                          value={newPropertyData.city}
                          onChange={(e) =>
                            setNewPropertyData({
                              ...newPropertyData,
                              city: e.target.value,
                            })
                          }
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={newPropertyData.state}
                          onChange={(e) =>
                            setNewPropertyData({
                              ...newPropertyData,
                              state: e.target.value,
                            })
                          }
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="ZIP Code"
                          value={newPropertyData.zip_code}
                          onChange={(e) =>
                            setNewPropertyData({
                              ...newPropertyData,
                              zip_code: e.target.value,
                            })
                          }
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                        <select
                          value={newPropertyData.property_type}
                          onChange={(e) => {
                            const value = e.target.value as
                              | 'Residential'
                              | 'Commercial';
                            setNewPropertyData({
                              ...newPropertyData,
                              property_type: value,
                            });
                          }}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                        >
                          <option value="Residential">Residential</option>
                          <option value="Commercial">Commercial</option>
                        </select>
                        <textarea
                          placeholder="Notes"
                          value={newPropertyData.notes}
                          onChange={(e) =>
                            setNewPropertyData({
                              ...newPropertyData,
                              notes: e.target.value,
                            })
                          }
                          className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={handleAddProperty}
                          className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          Save Property
                        </button>
                        <button
                          onClick={() => setAddingProperty(false)}
                          className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {properties.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <svg
                        className="h-12 w-12 mx-auto mb-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <p>No properties found for this client</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {properties.map((property) => (
                        <div key={property.id}>
                          {editingProperty?.id === property.id ? (
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                              <h4 className="font-semibold mb-3">
                                Edit Property
                              </h4>
                              <div className="grid grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  placeholder="Property Name"
                                  value={newPropertyData.name}
                                  onChange={(e) =>
                                    setNewPropertyData({
                                      ...newPropertyData,
                                      name: e.target.value,
                                    })
                                  }
                                  className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Address Line 1"
                                  value={newPropertyData.address_line1}
                                  onChange={(e) =>
                                    setNewPropertyData({
                                      ...newPropertyData,
                                      address_line1: e.target.value,
                                    })
                                  }
                                  className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Address Line 2"
                                  value={newPropertyData.address_line2}
                                  onChange={(e) =>
                                    setNewPropertyData({
                                      ...newPropertyData,
                                      address_line2: e.target.value,
                                    })
                                  }
                                  className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="City"
                                  value={newPropertyData.city}
                                  onChange={(e) =>
                                    setNewPropertyData({
                                      ...newPropertyData,
                                      city: e.target.value,
                                    })
                                  }
                                  className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="State"
                                  value={newPropertyData.state}
                                  onChange={(e) =>
                                    setNewPropertyData({
                                      ...newPropertyData,
                                      state: e.target.value,
                                    })
                                  }
                                  className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="ZIP Code"
                                  value={newPropertyData.zip_code}
                                  onChange={(e) =>
                                    setNewPropertyData({
                                      ...newPropertyData,
                                      zip_code: e.target.value,
                                    })
                                  }
                                  className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                />
                                <select
                                  value={newPropertyData.property_type}
                                  onChange={(e) => {
                                    const value = e.target.value as
                                      | 'Residential'
                                      | 'Commercial';
                                    setNewPropertyData({
                                      ...newPropertyData,
                                      property_type: value,
                                    });
                                  }}
                                  className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                                >
                                  <option value="Residential">
                                    Residential
                                  </option>
                                  <option value="Commercial">Commercial</option>
                                </select>
                                <textarea
                                  placeholder="Notes"
                                  value={newPropertyData.notes}
                                  onChange={(e) =>
                                    setNewPropertyData({
                                      ...newPropertyData,
                                      notes: e.target.value,
                                    })
                                  }
                                  className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                  rows={2}
                                />
                              </div>
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={handleUpdateProperty}
                                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                                >
                                  Save Changes
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingProperty(null);
                                    setNewPropertyData({
                                      name: '',
                                      address_line1: '',
                                      address_line2: '',
                                      city: '',
                                      state: '',
                                      zip_code: '',
                                      property_type: 'Residential',
                                      notes: '',
                                    });
                                  }}
                                  className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-300 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 border border-slate-200 rounded-lg hover:border-emerald-300 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-slate-900">
                                    {property.name}
                                  </h4>
                                  <p className="text-sm text-slate-600 mt-1">
                                    {property.address_line1}
                                    {property.address_line2 &&
                                      `, ${property.address_line2}`}
                                  </p>
                                  <p className="text-sm text-slate-600">
                                    {[
                                      property.city,
                                      property.state,
                                      property.zip_code,
                                    ]
                                      .filter(Boolean)
                                      .join(', ')}
                                  </p>
                                  {property.notes && (
                                    <p className="text-sm text-slate-500 mt-2">
                                      {property.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                                    {property.property_type}
                                  </span>
                                  <button
                                    onClick={() => handleEditProperty(property)}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteProperty(property.id)
                                    }
                                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Jobs */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-lg hover:shadow-xl transition-all duration-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Jobs ({jobs.length})
                  </h3>
                  {jobs.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <svg
                        className="h-12 w-12 mx-auto mb-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <p>No jobs found for this client</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {jobs.map((job) => (
                        <Link
                          key={job.id}
                          href={`/jobs/${job.id}`}
                          className="block p-4 border border-slate-200 rounded-lg hover:border-emerald-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-slate-900">
                                  Job #{job.job_number}
                                </h4>
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded ${getJobStatusBadge(job.status)}`}
                                >
                                  {job.status}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600">
                                {job.title}
                              </p>
                              <p className="text-sm text-slate-500 mt-1">
                                {formatDate(job.created_at)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-slate-900">
                                {formatCurrency(job.total)}
                              </p>
                              {job.paymentSummary.remaining > 0 && (
                                <p className="text-sm text-red-600">
                                  {formatCurrency(job.paymentSummary.remaining)}{' '}
                                  due
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Estimates and Payments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Estimates */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all duration-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <svg
                        className="h-5 w-5 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      Estimates ({estimates.length})
                    </h3>
                    {estimates.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <svg
                          className="h-12 w-12 mx-auto mb-4 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <p>No estimates found</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {estimates.map((estimate) => (
                          <div
                            key={estimate.id}
                            className="p-3 border border-slate-200 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-sm">
                                  {estimate.estimate_number}
                                </p>
                                <p className="text-xs text-slate-600">
                                  {estimate.title}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-sm">
                                  {formatCurrency(estimate.total)}
                                </p>
                                <span className="text-xs px-2 py-1 bg-slate-100 rounded">
                                  {estimate.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payments */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all duration-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <svg
                        className="h-5 w-5 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                      Payments ({payments.length})
                    </h3>
                    {payments.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <svg
                          className="h-12 w-12 mx-auto mb-4 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          />
                        </svg>
                        <p>No payments found</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="p-3 border border-slate-200 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-sm">
                                  {payment.payment_method}
                                </p>
                                <p className="text-xs text-slate-600">
                                  {formatDate(payment.payment_date)}
                                </p>
                              </div>
                              <p className="font-semibold text-green-700">
                                {formatCurrency(payment.amount)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all duration-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Activity Timeline
                  </h3>
                  <ActivityTimeline clientId={selectedClient.id} />
                </div>
              </div>
            </div>
          ) : isEditing ? (
            <div className="overflow-y-auto h-full p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">
                    {selectedClient ? 'Edit Client' : 'New Client'}
                  </h2>
                  <p className="text-slate-600">
                    {selectedClient
                      ? 'Update client information'
                      : 'Add a new client to your system'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectedClient ? handleSave : handleCreateClient}
                    className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                  >
                    {selectedClient ? 'Save' : 'Create'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Validation Messages */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="h-5 w-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <h3 className="text-sm font-semibold text-red-800">
                      Please fix the following errors:
                    </h3>
                  </div>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationSuggestions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="h-5 w-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="text-sm font-semibold text-blue-800">
                      Suggestions:
                    </h3>
                  </div>
                  <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                    {validationSuggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={editedClient.first_name || ''}
                      onChange={(e) =>
                        setEditedClient({
                          ...editedClient,
                          first_name: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={editedClient.last_name || ''}
                      onChange={(e) =>
                        setEditedClient({
                          ...editedClient,
                          last_name: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={editedClient.company_name || ''}
                      onChange={(e) =>
                        setEditedClient({
                          ...editedClient,
                          company_name: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editedClient.email || ''}
                      onChange={(e) =>
                        setEditedClient({
                          ...editedClient,
                          email: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editedClient.phone || ''}
                      onChange={(e) =>
                        setEditedClient({
                          ...editedClient,
                          phone: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    Address
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        value={editedClient.address_line1 || ''}
                        onChange={(e) =>
                          setEditedClient({
                            ...editedClient,
                            address_line1: e.target.value,
                          })
                        }
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        value={editedClient.address_line2 || ''}
                        onChange={(e) =>
                          setEditedClient({
                            ...editedClient,
                            address_line2: e.target.value,
                          })
                        }
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={editedClient.city || ''}
                          onChange={(e) =>
                            setEditedClient({
                              ...editedClient,
                              city: e.target.value,
                            })
                          }
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          State
                        </label>
                        <input
                          type="text"
                          value={editedClient.state || ''}
                          onChange={(e) =>
                            setEditedClient({
                              ...editedClient,
                              state: e.target.value,
                            })
                          }
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          value={editedClient.zip_code || ''}
                          onChange={(e) =>
                            setEditedClient({
                              ...editedClient,
                              zip_code: e.target.value,
                            })
                          }
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    Preferences & Notes
                  </h3>
                  <textarea
                    value={editedClient.preferences || ''}
                    onChange={(e) =>
                      setEditedClient({
                        ...editedClient,
                        preferences: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Client preferences and notes..."
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-slate-500">
                <svg
                  className="h-16 w-16 mx-auto mb-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Select a client
                </h3>
                <p className="text-slate-600">
                  Choose a client from the sidebar to view their details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Delete Client
            </h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete {selectedClient?.first_name}{' '}
              {selectedClient?.last_name}? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Dialog */}
      <ImportCSVDialog
        open={importCSVDialogOpen}
        onOpenChange={setImportCSVDialogOpen}
        onSuccess={loadClients}
      />

      {/* Activity Logging Dialog */}
      {activityDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Log Activity
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Activity Type
                </label>
                <select
                  value={activityType}
                  onChange={(e) =>
                    setActivityType(e.target.value as typeof activityType)
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                  <option value="note">Note</option>
                  <option value="email">Email Sent</option>
                  <option value="call">Phone Call</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  placeholder={
                    activityType === 'email'
                      ? 'Email subject or summary...'
                      : activityType === 'call'
                        ? 'Call notes...'
                        : 'Add a note...'
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setActivityDialogOpen(false);
                  setActivityDescription('');
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogActivity}
                disabled={!activityDescription.trim()}
                className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Log Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
