'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Client } from '@/types/client';
import { Search, Plus, Mail, Phone, Building } from 'lucide-react';

export default function AdminCustomersClient() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadClients();
  }, [searchQuery]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const response = await fetch(`/api/admin/clients?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to load clients');
      }

      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-gray-500 mt-1">
            Manage all customers in your account
          </p>
        </div>
        <Link href="/clients/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Customer
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <label htmlFor="customer-search" className="sr-only">
              Search customers
            </label>
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
              aria-hidden="true"
            />
            <Input
              id="customer-search"
              placeholder="Search customers by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-describedby="customer-search-help"
            />
            <span id="customer-search-help" className="sr-only">
              Search by customer name, email, or company name
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No customers found.</p>
              <Link href="/clients/new">
                <Button className="mt-4">Add your first customer</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  onClick={() => router.push(`/clients/${client.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/clients/${client.id}`);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for ${client.first_name} ${client.last_name}${client.company_name ? ` from ${client.company_name}` : ''}`}
                >
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {client.first_name} {client.last_name}
                      </h3>
                      {client.company_name && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          <Building className="h-3 w-3" />
                          <span>{client.company_name}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>
                    {(client.city || client.state) && (
                      <div className="text-sm text-gray-500">
                        {client.city && client.state
                          ? `${client.city}, ${client.state}`
                          : client.city || client.state}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
