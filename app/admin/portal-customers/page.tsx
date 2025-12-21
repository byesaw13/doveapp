'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Mail, User, Phone, MapPin } from 'lucide-react';

interface PortalCustomer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  invited_at?: string;
  joined_at?: string;
  status: 'invited' | 'active' | 'inactive';
}

export default function PortalCustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<PortalCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/portal-customers');
      if (!response.ok) {
        throw new Error('Failed to load portal customers');
      }
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Failed to load portal customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load portal customers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddCustomer = async () => {
    if (
      !formData.first_name.trim() ||
      !formData.last_name.trim() ||
      !formData.email.trim()
    ) {
      toast({
        title: 'Error',
        description: 'First name, last name, and email are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/portal-customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to add customer');
      }

      const newCustomer = await response.json();
      setCustomers((prev) => [newCustomer.customer, ...prev]);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
      });
      setShowAddDialog(false);

      toast({
        title: 'Success',
        description: 'Customer added and invitation sent',
      });
    } catch (error: any) {
      console.error('Failed to add customer:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add customer',
        variant: 'destructive',
      });
    }
  };

  const handleInviteCustomer = async (customerId: string) => {
    try {
      setInviting(customerId);
      const response = await fetch(
        `/api/admin/portal-customers/${customerId}/invite`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send invitation');
      }

      // Update customer status
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === customerId
            ? {
                ...customer,
                status: 'invited' as const,
                invited_at: new Date().toISOString(),
              }
            : customer
        )
      );

      toast({
        title: 'Success',
        description: 'Invitation sent successfully',
      });
    } catch (error: any) {
      console.error('Failed to send invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setInviting(null);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: PortalCustomer['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Active
          </Badge>
        );
      case 'invited':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Invited
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            Inactive
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-gray-700 bg-white transition ease-in-out duration-150">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading Portal Customers...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  Portal Customers
                </h1>
                <p className="mt-1 text-sm text-indigo-100">
                  Manage end customer accounts and send portal invitations
                </p>
              </div>
              <div className="flex space-x-3">
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Customer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Portal Customer</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="first_name">First Name *</Label>
                          <Input
                            id="first_name"
                            value={formData.first_name}
                            onChange={(e) =>
                              handleInputChange('first_name', e.target.value)
                            }
                            placeholder="John"
                          />
                        </div>
                        <div>
                          <Label htmlFor="last_name">Last Name *</Label>
                          <Input
                            id="last_name"
                            value={formData.last_name}
                            onChange={(e) =>
                              handleInputChange('last_name', e.target.value)
                            }
                            placeholder="Doe"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange('email', e.target.value)
                          }
                          placeholder="john.doe@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) =>
                            handleInputChange('phone', e.target.value)
                          }
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) =>
                            handleInputChange('address', e.target.value)
                          }
                          placeholder="123 Main St, City, State"
                        />
                      </div>
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowAddDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddCustomer}>
                          Add & Invite Customer
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="space-y-4">
          {filteredCustomers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No portal customers
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first portal customer.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredCustomers.map((customer) => (
              <Card
                key={customer.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {customer.first_name} {customer.last_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {customer.email}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          {customer.phone && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Phone className="h-3 w-3 mr-1" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.address && (
                            <div className="flex items-center text-xs text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" />
                              {customer.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(customer.status)}
                      {customer.status === 'active' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInviteCustomer(customer.id)}
                          disabled={inviting === customer.id}
                        >
                          {inviting === customer.id ? (
                            <svg
                              className="animate-spin h-4 w-4"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-1" />
                              Re-invite
                            </>
                          )}
                        </Button>
                      ) : customer.status === 'invited' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInviteCustomer(customer.id)}
                          disabled={inviting === customer.id}
                        >
                          {inviting === customer.id ? (
                            <svg
                              className="animate-spin h-4 w-4"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-1" />
                              Send Reminder
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleInviteCustomer(customer.id)}
                          disabled={inviting === customer.id}
                        >
                          {inviting === customer.id ? (
                            <svg
                              className="animate-spin h-4 w-4"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-1" />
                              Invite to Portal
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  {customer.invited_at && (
                    <div className="mt-4 text-xs text-gray-500">
                      Invited:{' '}
                      {new Date(customer.invited_at).toLocaleDateString()}
                      {customer.joined_at && (
                        <span className="ml-4">
                          Joined:{' '}
                          {new Date(customer.joined_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
