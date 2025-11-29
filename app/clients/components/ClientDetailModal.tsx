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
import {
  getClient,
  getAllProperties,
  getJobsByClient,
  updateClient,
  createProperty,
  getJobPaymentSummary,
} from '@/lib/db';
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
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [addingProperty, setAddingProperty] = useState(false);

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
      const [clientData, allPropertiesData, jobsData] = await Promise.all([
        getClient(clientId),
        getAllProperties(),
        getJobsByClient(clientId),
      ]);

      // Filter properties for this client
      const propertiesData = allPropertiesData.filter(
        (p) => p.client_id === clientId
      );

      setClient(clientData);

      // Set address data for editing
      if (clientData) {
        setAddressData({
          address_line1: clientData.address_line1 || '',
          address_line2: clientData.address_line2 || '',
          city: clientData.city || '',
          state: clientData.state || '',
          zip_code: clientData.zip_code || '',
        });

        // Set notes and preferences data
        setNotesData({
          notes: clientData.notes || '',
          preferences: clientData.preferences || '',
        });
      }

      setProperties(propertiesData);

      // Load payment summaries for jobs
      const jobsWithPayments = await Promise.all(
        jobsData.map(async (job) => {
          const paymentSummary = await getJobPaymentSummary(job.id);
          return { ...job, paymentSummary };
        })
      );

      setJobs(jobsWithPayments);
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
      setEditingNotes(false);
      onClientUpdated?.();
    } catch (error) {
      console.error('Failed to update notes:', error);
      alert('Failed to update notes');
    }
  };

  const handleUpdatePreferences = async () => {
    if (!client) return;

    try {
      await updateClient(client.id, { preferences: notesData.preferences });
      setClient({ ...client, preferences: notesData.preferences });
      setEditingPreferences(false);
      onClientUpdated?.();
    } catch (error) {
      console.error('Failed to update preferences:', error);
      alert('Failed to update preferences');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Partial
          </Badge>
        );
      case 'unpaid':
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Unpaid
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getJobStatusBadge = (status: string) => {
    const statusColors = {
      quote: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      invoiced: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <Badge
        className={
          statusColors[status as keyof typeof statusColors] ||
          'bg-gray-100 text-gray-800'
        }
      >
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {client.first_name} {client.last_name}
            {client.company_name && (
              <span className="text-muted-foreground">
                - {client.company_name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="properties">
              Properties ({properties.length})
            </TabsTrigger>
            <TabsTrigger value="jobs">Jobs ({jobs.length})</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="notes">Notes & Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Client Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Contact Information</span>
                  <Button
                    variant="outline"
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
                    <Label className="text-sm font-medium">Name</Label>
                    <p className="text-sm text-muted-foreground">
                      {client.first_name} {client.last_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Company</Label>
                    <p className="text-sm text-muted-foreground">
                      {client.company_name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {client.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {client.phone || 'N/A'}
                    </p>
                  </div>
                </div>

                {editingAddress ? (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium">Edit Address</h4>
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
                    <Label className="text-sm font-medium">Address</Label>
                    <p className="text-sm text-muted-foreground flex items-start">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
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

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Building className="w-8 h-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-2xl font-bold">{properties.length}</p>
                      <p className="text-xs text-muted-foreground">
                        Properties
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Briefcase className="w-8 h-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-2xl font-bold">{jobs.length}</p>
                      <p className="text-xs text-muted-foreground">
                        Total Jobs
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <DollarSign className="w-8 h-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-2xl font-bold">
                        {formatCurrency(
                          jobs.reduce((sum, job) => sum + job.total, 0)
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total Value
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                    <div className="ml-3">
                      <p className="text-2xl font-bold">
                        {
                          jobs.filter((job) => job.paymentSummary.remaining > 0)
                            .length
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Outstanding
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="properties" className="space-y-4">
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
                        <Badge variant="secondary">
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

          <TabsContent value="jobs" className="space-y-4">
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

          <TabsContent value="financial" className="space-y-4">
            <h3 className="text-lg font-medium">Financial Overview</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(
                        jobs.reduce(
                          (sum, job) => sum + job.paymentSummary.paid,
                          0
                        )
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(
                        jobs.reduce(
                          (sum, job) => sum + job.paymentSummary.remaining,
                          0
                        )
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(
                        jobs.reduce((sum, job) => sum + job.total, 0)
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Value</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {
                        jobs.filter(
                          (job) => job.paymentSummary.status === 'paid'
                        ).length
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">Paid Jobs</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
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
                            <p className="font-medium text-red-600">
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

          <TabsContent value="notes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* General Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>General Notes</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingNotes(!editingNotes)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {editingNotes ? 'Cancel' : 'Edit'}
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    General notes and observations about this client
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {editingNotes ? (
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
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleUpdateNotes}>Save Notes</Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingNotes(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="min-h-[120px]">
                      {client.notes ? (
                        <p className="text-sm whitespace-pre-wrap">
                          {client.notes}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No general notes yet. Click Edit to add notes.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Preferences & Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Preferences & Instructions</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPreferences(!editingPreferences)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {editingPreferences ? 'Cancel' : 'Edit'}
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Billing preferences, special instructions, access codes,
                    etc.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {editingPreferences ? (
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
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleUpdatePreferences}>
                          Save Preferences
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingPreferences(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="min-h-[120px]">
                      {client.preferences ? (
                        <div className="text-sm whitespace-pre-wrap">
                          {client.preferences}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground italic">
                          No preferences or special instructions recorded.
                          <br />
                          <br />
                          Common items to include:
                          <br />• Billing preferences (email, mail, etc.)
                          <br />• Door lock codes
                          <br />• Special access instructions
                          <br />• Preferred contact methods
                          <br />• Service preferences
                        </div>
                      )}
                    </div>
                  )}
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
