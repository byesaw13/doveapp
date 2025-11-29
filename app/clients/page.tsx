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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Clients</CardTitle>
          <div className="flex gap-2">
            <Link href="/properties">
              <Button variant="outline">View Properties</Button>
            </Link>
            <Link href="/jobs">
              <Button variant="outline">View Jobs</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => setImportCSVDialogOpen(true)}
            >
              Import CSV
            </Button>
            <Button onClick={handleAddClient}>Add Client</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search clients by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
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
        </CardContent>
      </Card>

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
