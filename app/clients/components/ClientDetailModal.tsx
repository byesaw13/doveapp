'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateClient, createProperty } from '@/lib/db';
import { ActivityTimeline } from './ActivityTimeline';
import type { Client } from '@/types/client';
import type { PropertyWithClient } from '@/types/property';
import type { JobWithClient } from '@/types/job';
import type { PropertyFormData } from '@/lib/validations/property';
import {
  User,
  MapPin,
  Briefcase,
  DollarSign,
  Phone,
  Mail,
  Calendar,
  Plus,
  Edit,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface ClientDetailModalProps {
  clientId: string | null;
  open: boolean;
  onClose: () => void;
  onClientUpdated?: () => void;
}

interface JobWithPayment extends JobWithClient {
  paymentSummary: {
    total: number;
    paid: number;
    remaining: number;
    status: string;
  };
}

export function ClientDetailModal({
  clientId,
  open,
  onClose,
  onClientUpdated,
}: ClientDetailModalProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [properties, setProperties] = useState<PropertyWithClient[]>([]);
  const [jobs, setJobs] = useState<JobWithPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addingProperty, setAddingProperty] = useState(false);

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getJobStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        label: string;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
      }
    > = {
      draft: { label: 'Draft', variant: 'secondary' },
      scheduled: { label: 'Scheduled', variant: 'default' },
      in_progress: { label: 'In Progress', variant: 'default' },
      completed: { label: 'Completed', variant: 'outline' },
      cancelled: { label: 'Cancelled', variant: 'destructive' },
    };
    const config = statusConfig[status] || {
      label: status,
      variant: 'secondary' as const,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        label: string;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
      }
    > = {
      unpaid: { label: 'Unpaid', variant: 'destructive' },
      partial: { label: 'Partial', variant: 'secondary' },
      paid: { label: 'Paid', variant: 'outline' },
    };
    const config = statusConfig[status] || {
      label: status,
      variant: 'secondary' as const,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Address editing state
  const [addressData, setAddressData] = useState({
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
  });

  // Property adding state
  const [propertyData, setPropertyData] = useState<PropertyFormData>({
    client_id: '',
    name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    property_type: 'Residential',
    notes: '',
  });

  // Notes and preferences state
  const [notesData, setNotesData] = useState({
    notes: '',
    preferences: '',
  });

  useEffect(() => {
    if (open && clientId) {
      loadClientData();
    }
  }, [open, clientId]);

  const loadClientData = async () => {
    if (!clientId) return;

    setLoading(true);
    try {
      // Use the new batched API for better performance
      const response = await fetch(`/api/clients/${clientId}/details`);
      if (!response.ok) {
        throw new Error('Failed to load client details');
      }

      const data = await response.json();

      setClient(data.client);
      setProperties(data.properties);
      setJobs(data.jobs);

      // Set address data for editing
      if (data.client) {
        setAddressData({
          address_line1: data.client.address_line1 || '',
          address_line2: data.client.address_line2 || '',
          city: data.client.city || '',
          state: data.client.state || '',
          zip_code: data.client.zip_code || '',
        });

        // Set notes and preferences data
        setNotesData({
          notes: data.client.notes || '',
          preferences: data.client.preferences || '',
        });
      }
    } catch (error) {
      console.error('Failed to load client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAddress = async () => {
    if (!client) return;

    try {
      await updateClient(client.id, addressData);
      setClient({ ...client, ...addressData });
      setEditingAddress(false);
      onClientUpdated?.();
    } catch (error) {
      console.error('Failed to update address:', error);
      alert('Failed to update address');
    }
  };

  const handleAddProperty = async () => {
    if (!client) return;

    try {
      const newPropertyData = {
        ...propertyData,
        client_id: client.id,
      };

      await createProperty(newPropertyData);
      await loadClientData(); // Reload to show new property
      setAddingProperty(false);
      setPropertyData({
        client_id: '',
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

  const handleUpdateNotes = async () => {
    if (!client) return;

    try {
      await updateClient(client.id, { notes: notesData.notes });
      setClient({ ...client, notes: notesData.notes });
      onClientUpdated?.();
    } catch (error) {
      console.error('Failed to update notes:', error);
      alert('Failed to update notes');
    }
  };

  const formatCurrency = (amount: number) => {
    if (!amount || Number.isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleUpdatePreferences = async () => {
    if (!client) return;

    try {
      await updateClient(client.id, { preferences: notesData.preferences });
      setClient({ ...client, preferences: notesData.preferences });
      onClientUpdated?.();
    } catch (error) {
      console.error('Failed to update preferences:', error);
      alert('Failed to update preferences');
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-white">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 text-slate-800">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
              <User className="w-4 h-4 text-slate-600" />
            </span>
            {client.first_name} {client.last_name}
            {client.company_name && (
              <span className="text-muted-foreground">
                · {client.company_name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
            <TabsTrigger
              value="overview"
              className="flex-1 basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(33.33%-0.5rem)] whitespace-normal rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-500 shadow-sm"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="properties"
              className="flex-1 basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(33.33%-0.5rem)] whitespace-normal rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-500 shadow-sm"
            >
              Properties ({properties.length})
            </TabsTrigger>
            <TabsTrigger
              value="jobs"
              className="flex-1 basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(33.33%-0.5rem)] whitespace-normal rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-500 shadow-sm"
            >
              Jobs ({jobs.length})
            </TabsTrigger>
            <TabsTrigger
              value="financial"
              className="flex-1 basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(33.33%-0.5rem)] whitespace-normal rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-500 shadow-sm"
            >
              Financial
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="flex-1 basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(33.33%-0.5rem)] whitespace-normal rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-500 shadow-sm"
            >
              Notes & Preferences
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="flex-1 basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(33.33%-0.5rem)] whitespace-normal rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-500 shadow-sm"
            >
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <Card className="border-0 shadow-sm bg-white/90">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-slate-800">
                  <span>Contact Information</span>
                  <Button
                    variant={editingAddress ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setEditingAddress(!editingAddress)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {editingAddress ? 'Cancel' : 'Edit Address'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-500">
                      Name
                    </Label>
                    <p className="text-base font-semibold text-slate-800">
                      {client.first_name} {client.last_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-500">
                      Company
                    </Label>
                    <p className="text-base font-semibold text-slate-800">
                      {client.company_name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-500">
                      Email
                    </Label>
                    <p className="text-sm text-slate-600 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-slate-400" />
                      {client.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-500">
                      Phone
                    </Label>
                    <p className="text-sm text-slate-600 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-slate-400" />
                      {client.phone || 'N/A'}
                    </p>
                  </div>
                </div>

                {editingAddress ? (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium text-slate-800">Edit Address</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="address_line1">Address Line 1</Label>
                        <Input
                          id="address_line1"
                          value={addressData.address_line1}
                          onChange={(e) =>
                            setAddressData((prev) => ({
                              ...prev,
                              address_line1: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="address_line2">Address Line 2</Label>
                        <Input
                          id="address_line2"
                          value={addressData.address_line2}
                          onChange={(e) =>
                            setAddressData((prev) => ({
                              ...prev,
                              address_line2: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={addressData.city}
                          onChange={(e) =>
                            setAddressData((prev) => ({
                              ...prev,
                              city: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={addressData.state}
                          onChange={(e) =>
                            setAddressData((prev) => ({
                              ...prev,
                              state: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="zip_code">ZIP Code</Label>
                        <Input
                          id="zip_code"
                          value={addressData.zip_code}
                          onChange={(e) =>
                            setAddressData((prev) => ({
                              ...prev,
                              zip_code: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleUpdateAddress}>
                        Save Address
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingAddress(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="text-sm font-medium text-slate-500">
                      Address
                    </Label>
                    <p className="text-sm text-slate-600 flex items-start">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-slate-400" />
                      {client.address_line1 ? (
                        <span>
                          {client.address_line1}
                          {client.address_line2 && <br />}
                          {client.address_line2}
                          {(client.city || client.state || client.zip_code) && (
                            <br />
                          )}
                          {[client.city, client.state, client.zip_code]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      ) : (
                        'No address on file'
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <Building className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-2xl font-bold text-blue-700">
                        {properties.length}
                      </p>
                      <p className="text-xs text-blue-500 uppercase tracking-wide">
                        Properties
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <Briefcase className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-2xl font-bold text-emerald-700">
                        {jobs.length}
                      </p>
                      <p className="text-xs text-emerald-500 uppercase tracking-wide">
                        Total Jobs
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <DollarSign className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-2xl font-bold text-amber-700">
                        {formatCurrency(
                          jobs.reduce((sum, job) => sum + job.total, 0)
                        )}
                      </p>
                      <p className="text-xs text-amber-500 uppercase tracking-wide">
                        Total Value
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-white">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-2xl font-bold text-rose-600">
                        {
                          jobs.filter((job) => job.paymentSummary.remaining > 0)
                            .length
                        }
                      </p>
                      <p className="text-xs text-rose-500 uppercase tracking-wide">
                        Outstanding
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="properties" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Properties</h3>
              <Button onClick={() => setAddingProperty(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </Button>
            </div>

            {properties.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-medium mb-2">No properties yet</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add properties for this client to track service locations.
                  </p>
                  <Button onClick={() => setAddingProperty(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Property
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {properties.map((property) => (
                  <Card key={property.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{property.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {property.property_type}
                          </p>
                          <p className="text-sm">
                            {property.address_line1}
                            {property.address_line2 && <br />}
                            {property.address_line2}
                            {(property.city ||
                              property.state ||
                              property.zip_code) && <br />}
                            {[property.city, property.state, property.zip_code]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                          {property.notes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {property.notes}
                            </p>
                          )}
                        </div>
                        <Badge className="bg-slate-100 text-slate-700 border border-slate-200">
                          {property.property_type}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {addingProperty && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Property</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Property creation form coming soon...
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setAddingProperty(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="jobs" className="mt-6 space-y-4">
            <h3 className="text-lg font-medium">Job History</h3>

            {jobs.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-medium mb-2">No jobs yet</h4>
                  <p className="text-sm text-muted-foreground">
                    Jobs created for this client will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobs.slice(0, 10).map((job) => (
                  <Card key={job.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">
                              Job #{job.job_number}
                            </h4>
                            {getJobStatusBadge(job.status)}
                            {getPaymentStatusBadge(job.paymentSummary.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {job.title}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(job.created_at)}
                            </span>
                            <span className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {formatCurrency(job.total)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(job.total)}
                          </p>
                          {job.paymentSummary.remaining > 0 && (
                            <p className="text-sm text-red-600">
                              Due:{' '}
                              {formatCurrency(job.paymentSummary.remaining)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="financial" className="mt-6 space-y-6">
            <h3 className="text-lg font-medium text-slate-800">
              Financial Overview
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
                <CardContent className="p-4 text-center">
                  <p className="text-xs uppercase tracking-wide text-emerald-500">
                    Total Paid
                  </p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {formatCurrency(
                      jobs.reduce(
                        (sum, job) => sum + job.paymentSummary.paid,
                        0
                      )
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-white">
                <CardContent className="p-4 text-center">
                  <p className="text-xs uppercase tracking-wide text-rose-500">
                    Outstanding
                  </p>
                  <p className="text-2xl font-bold text-rose-600">
                    {formatCurrency(
                      jobs.reduce(
                        (sum, job) => sum + job.paymentSummary.remaining,
                        0
                      )
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-white">
                <CardContent className="p-4 text-center">
                  <p className="text-xs uppercase tracking-wide text-indigo-500">
                    Total Value
                  </p>
                  <p className="text-2xl font-bold text-indigo-700">
                    {formatCurrency(
                      jobs.reduce((sum, job) => sum + job.total, 0)
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
                <CardContent className="p-4 text-center">
                  <p className="text-xs uppercase tracking-wide text-purple-500">
                    Paid Jobs
                  </p>
                  <p className="text-2xl font-bold text-purple-700">
                    {
                      jobs.filter((job) => job.paymentSummary.status === 'paid')
                        .length
                    }
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Outstanding Invoices</CardTitle>
                <CardDescription>Jobs with unpaid balances</CardDescription>
              </CardHeader>
              <CardContent>
                {jobs.filter((job) => job.paymentSummary.remaining > 0)
                  .length === 0 ? (
                  <p className="text-muted-foreground">
                    No outstanding invoices
                  </p>
                ) : (
                  <div className="space-y-2">
                    {jobs
                      .filter((job) => job.paymentSummary.remaining > 0)
                      .map((job) => (
                        <div
                          key={job.id}
                          className="flex items-center justify-between p-3 border rounded"
                        >
                          <div>
                            <p className="font-medium">Job #{job.job_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {job.title}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-rose-600">
                              {formatCurrency(job.paymentSummary.remaining)} due
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(job.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* General Notes */}
              <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-slate-50">
                <CardHeader>
                  <CardTitle className="text-slate-800">
                    General Notes
                  </CardTitle>
                  <CardDescription>
                    General notes and observations about this client
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Add general notes about this client..."
                      value={notesData.notes || ''}
                      onChange={(e) =>
                        setNotesData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      rows={6}
                      className="bg-white border-slate-200"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleUpdateNotes}>Save Notes</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preferences & Instructions */}
              <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-slate-50">
                <CardHeader>
                  <CardTitle className="text-slate-800">
                    Preferences & Instructions
                  </CardTitle>
                  <CardDescription>
                    Billing preferences, special instructions, access codes,
                    etc.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Add preferences, billing instructions, door codes, special requirements..."
                      value={notesData.preferences || ''}
                      onChange={(e) =>
                        setNotesData((prev) => ({
                          ...prev,
                          preferences: e.target.value,
                        }))
                      }
                      rows={6}
                      className="bg-white border-slate-200"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleUpdatePreferences}>
                        Save Preferences
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Reference Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">📧 Billing Preferences</h4>
                  <p className="text-sm text-muted-foreground">
                    How does this client prefer to receive invoices?
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">🔐 Access Codes</h4>
                  <p className="text-sm text-muted-foreground">
                    Door codes, gate codes, alarm codes, etc.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">⚠️ Special Instructions</h4>
                  <p className="text-sm text-muted-foreground">
                    Important notes for service visits.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-6 space-y-6">
            <ActivityTimeline clientId={client.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
