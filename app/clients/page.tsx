'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClientTable } from './components/ClientTable';
import { ClientForm } from './components/ClientForm';
import { DeleteClientDialog } from './components/DeleteClientDialog';
import { ClientDetailModal } from './components/ClientDetailModal';
import { ImportSquareDialog } from './components/ImportSquareDialog';
import { ImportCSVDialog } from './components/ImportCSVDialog';
import { ConnectSquareButton } from './components/ConnectSquareButton';
// Pure Tailwind - no shadcn components needed for layout
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  searchClients,
} from '@/lib/db/clients';
import type { Client } from '@/types/client';
import type { ClientFormData } from '@/lib/validations/client';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importCSVDialogOpen, setImportCSVDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load clients on mount
  useEffect(() => {
    loadClients();
  }, []);

  // Search clients when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      loadClients();
    }
  }, [searchQuery]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
      alert(
        'Failed to load clients. Please check your Supabase configuration.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const data = await searchClients(searchQuery);
      setClients(data);
    } catch (error) {
      console.error('Failed to search clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setFormOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setFormOpen(true);
  };

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: ClientFormData) => {
    try {
      if (selectedClient) {
        await updateClient(selectedClient.id, data);
      } else {
        await createClient(data);
      }

      await loadClients();
      setFormOpen(false);
      setSelectedClient(null);
    } catch (error) {
      console.error('Failed to save client:', error);
      alert('Failed to save client. Please try again.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedClient) return;

    try {
      await deleteClient(selectedClient.id);
      await loadClients();
      setDeleteDialogOpen(false);
      setSelectedClient(null);
    } catch (error) {
      console.error('Failed to delete client:', error);
      alert('Failed to delete client. Please try again.');
    }
  };

  const handleViewClientDetails = (client: Client) => {
    setSelectedClientId(client.id);
    setDetailModalOpen(true);
  };

  const handleClientUpdated = () => {
    loadClients(); // Refresh the client list
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your client relationships and contact information
          </p>
        </div>
        <button
          onClick={handleAddClient}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          Add Client
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Total Clients
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {clients.length}
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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

        <Link href="/properties" className="block">
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Properties</p>
                <p className="text-sm text-emerald-600 mt-2 font-medium hover:text-emerald-700">
                  View all →
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/jobs" className="block">
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Jobs</p>
                <p className="text-sm text-emerald-600 mt-2 font-medium hover:text-emerald-700">
                  View all →
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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
        </Link>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setImportCSVDialogOpen(true)}
          className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 inline-flex items-center"
        >
          <svg
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Import CSV
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <input
            type="text"
            placeholder="Search clients by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          />
        </div>
        <div className="p-6">
          <ClientTable
            clients={clients}
            onEdit={handleEditClient}
            onDelete={handleDeleteClick}
            onViewDetails={handleViewClientDetails}
            onViewProperties={(client) => {
              // Navigate to properties page filtered by this client
              window.location.href = `/properties?client=${client.id}`;
            }}
          />
        </div>
      </div>

      <ClientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        initialData={selectedClient}
      />

      <DeleteClientDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        client={selectedClient}
      />

      <ImportSquareDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={loadClients}
      />

      <ImportCSVDialog
        open={importCSVDialogOpen}
        onOpenChange={setImportCSVDialogOpen}
        onSuccess={loadClients}
      />

      <ClientDetailModal
        clientId={selectedClientId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedClientId(null);
        }}
        onClientUpdated={handleClientUpdated}
      />
    </div>
  );
}
