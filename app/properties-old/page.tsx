'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PropertyTable } from './components/PropertyTable';
import { PropertyForm } from './components/PropertyForm';
import { DeletePropertyDialog } from './components/DeletePropertyDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getAllProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  searchProperties,
} from '@/lib/db/properties';
import type { PropertyWithClient } from '@/types/property';
import type { PropertyFormData } from '@/lib/validations/property';

function PropertiesPageContent() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<PropertyWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] =
    useState<PropertyWithClient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState<string | null>(null);

  // Set client filter from URL params
  useEffect(() => {
    const clientId = searchParams.get('client');
    setClientFilter(clientId);
  }, [searchParams]);

  // Load properties on mount and when client filter changes
  useEffect(() => {
    loadProperties();
  }, [clientFilter]);

  // Search properties when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      loadProperties();
    }
  }, [searchQuery]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      let data: PropertyWithClient[];

      data = await getAllProperties();

      // Filter by client if specified
      if (clientFilter) {
        data = data.filter((property) => property.client_id === clientFilter);
      }

      setProperties(data);
    } catch (error) {
      console.error('Failed to load properties:', error);
      alert(
        'Failed to load properties. Please check your database configuration.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const data = await searchProperties(searchQuery);
      setProperties(data);
    } catch (error) {
      console.error('Failed to search properties:', error);
      alert('Failed to search properties.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: PropertyFormData) => {
    try {
      await createProperty(data);
      await loadProperties();
      setFormOpen(false);
    } catch (error) {
      console.error('Failed to create property:', error);
      alert('Failed to create property.');
    }
  };

  const handleEdit = (property: PropertyWithClient) => {
    setSelectedProperty(property);
    setFormOpen(true);
  };

  const handleUpdate = async (data: PropertyFormData) => {
    if (!selectedProperty) return;

    try {
      await updateProperty(selectedProperty.id, data);
      await loadProperties();
      setFormOpen(false);
      setSelectedProperty(null);
    } catch (error) {
      console.error('Failed to update property:', error);
      alert('Failed to update property.');
    }
  };

  const handleDelete = (property: PropertyWithClient) => {
    setSelectedProperty(property);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProperty) return;

    try {
      await deleteProperty(selectedProperty.id);
      await loadProperties();
      setDeleteDialogOpen(false);
      setSelectedProperty(null);
    } catch (error) {
      console.error('Failed to delete property:', error);
      alert('Failed to delete property.');
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedProperty(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="text-muted-foreground">
            {clientFilter
              ? `Properties for ${properties[0]?.client.first_name} ${properties[0]?.client.last_name}`
              : 'Manage client properties and service locations'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/clients">
            <Button variant="outline">View Clients</Button>
          </Link>
          {clientFilter && (
            <Link href="/properties">
              <Button variant="outline">View All Properties</Button>
            </Link>
          )}
          <Button onClick={() => setFormOpen(true)}>Add Property</Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Search by property name, address, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" onClick={loadProperties}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Properties ({properties.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyTable
            properties={properties}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <PropertyForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={selectedProperty ? handleUpdate : handleCreate}
        property={selectedProperty}
      />

      <DeletePropertyDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        property={selectedProperty}
      />
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PropertiesPageContent />
    </Suspense>
  );
}
