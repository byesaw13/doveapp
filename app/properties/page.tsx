'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  getAllProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  searchProperties,
} from '@/lib/db/properties';
import type { PropertyWithClient } from '@/types/property';
import type { PropertyFormData } from '@/lib/validations/property';
import { PropertyTable } from './components/PropertyTable';
import { PropertyForm } from './components/PropertyForm';
import { DeletePropertyDialog } from './components/DeletePropertyDialog';

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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Properties</h1>
            <p className="mt-2 text-purple-100">
              {clientFilter
                ? `Properties for ${properties[0]?.client.first_name} ${properties[0]?.client.last_name}`
                : 'Manage client properties and service locations'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/clients">
              <button className="px-4 py-2 bg-white text-purple-700 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                View Clients
              </button>
            </Link>
            {clientFilter && (
              <Link href="/properties">
                <button className="px-4 py-2 bg-white text-purple-700 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                  View All Properties
                </button>
              </Link>
            )}
            <button
              onClick={() => setFormOpen(true)}
              className="px-4 py-2 bg-white text-purple-700 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              + Add Property
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search by property name, address, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
          />
          <button
            onClick={loadProperties}
            className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            All Properties ({properties.length})
          </h2>
        </div>
        <div className="p-6">
          <PropertyTable
            properties={properties}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

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
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <PropertiesPageContent />
    </Suspense>
  );
}
