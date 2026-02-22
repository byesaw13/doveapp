'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  PageHeader,
  PageContainer,
  ContentSection,
  Button,
  ButtonLoader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Calendar,
  User,
  FileText,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import type { Client } from '@/types/client';
import type { PropertyWithClient } from '@/types/property';
import type { LineItemType } from '@/types/job';
import { cn } from '@/lib/utils';

interface LineItemFormData {
  item_type: LineItemType;
  description: string;
  quantity: number;
  unit_price: number;
}

interface JobFormData {
  client_id: string;
  property_id: string;
  title: string;
  description: string;
  status: 'quote' | 'scheduled' | 'in_progress' | 'completed';
  service_date: string;
  scheduled_time: string;
  notes: string;
  lineItems: LineItemFormData[];
}

const defaultLineItem = {
  item_type: 'labor' as const,
  description: '',
  quantity: 1,
  unit_price: 0,
};

function NewJobPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [clients, setClients] = React.useState<Client[]>([]);
  const [properties, setProperties] = React.useState<PropertyWithClient[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const prefilledDate = searchParams.get('date') || '';

  const form = useForm<JobFormData>({
    defaultValues: {
      client_id: '',
      property_id: 'none',
      title: '',
      description: '',
      status: 'quote',
      service_date: prefilledDate,
      scheduled_time: '',
      notes: '',
      lineItems: [{ ...defaultLineItem }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientsRes, propertiesRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/properties'),
      ]);

      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(Array.isArray(data) ? data : data.clients || []);
      }

      if (propertiesRes.ok) {
        const data = await propertiesRes.json();
        setProperties(Array.isArray(data) ? data : data.properties || []);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      toast({
        title: 'Error',
        description: 'Failed to load form data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: JobFormData) => {
    try {
      setSubmitting(true);

      const lineItems = data.lineItems.map((item) => ({
        item_type: item.item_type,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: data.client_id,
          property_id:
            data.property_id === 'none' ? null : data.property_id || null,
          title: data.title,
          description: data.description || null,
          status: data.status,
          service_date: data.service_date || null,
          scheduled_time: data.scheduled_time || null,
          notes: data.notes || null,
          subtotal: 0,
          tax: 0,
          total: 0,
          line_items: lineItems,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create job');
      }

      const job = await response.json();

      toast({
        title: 'Job Created',
        description: `Job #${job.job_number} has been created`,
      });

      router.push(`/admin/jobs/${job.id}`);
    } catch (err) {
      console.error('Failed to create job:', err);
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to create job',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const calculateLineTotal = (index: number) => {
    const qty = form.watch(`lineItems.${index}.quantity`) || 0;
    const price = form.watch(`lineItems.${index}.unit_price`) || 0;
    return qty * price;
  };

  const calculateTotal = () => {
    return fields.reduce((sum, _, index) => sum + calculateLineTotal(index), 0);
  };

  if (loading) {
    return (
      <PageContainer maxWidth="lg">
        <div className="flex items-center justify-center py-24">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="lg" padding="none">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/jobs')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-bold">New Job</h1>
                <p className="text-sm text-muted-foreground">
                  Create a new job
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/jobs')}
              >
                Cancel
              </Button>
              <ButtonLoader
                size="sm"
                loading={submitting}
                onClick={form.handleSubmit(handleSubmit)}
              >
                <Save className="h-4 w-4 mr-2" />
                Create Job
              </ButtonLoader>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="p-4 lg:p-6 space-y-6"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Client & Property
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_id"
                rules={{ required: 'Client is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.first_name} {client.last_name}
                            {client.company_name && ` - ${client.company_name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="property_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">
                          No specific property
                        </SelectItem>
                        {properties
                          .filter(
                            (p) =>
                              !form.watch('client_id') ||
                              p.client_id === form.watch('client_id')
                          )
                          .map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.name}{' '}
                              {property.city && `(${property.city})`}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                rules={{ required: 'Title is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Interior Painting - Living Room"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Additional details about the job..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="quote">Quote</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in_progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="service_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduled_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input {...field} type="time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Special instructions, access codes, etc."
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Line Items</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ ...defaultLineItem })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-3 items-start p-3 bg-muted/50 rounded-lg"
                >
                  <FormField
                    control={form.control}
                    name={`lineItems.${index}.item_type`}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-xs">Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="labor">Labor</SelectItem>
                            <SelectItem value="material">Material</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`lineItems.${index}.description`}
                    rules={{ required: 'Required' }}
                    render={({ field }) => (
                      <FormItem className="col-span-5">
                        <FormLabel className="text-xs">Description</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`lineItems.${index}.quantity`}
                    rules={{ min: { value: 0.01, message: 'Required' } }}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-xs">Qty</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`lineItems.${index}.unit_price`}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-xs">Price</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="col-span-1 flex items-end justify-center pb-2">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-2 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Estimated Total
                  </p>
                  <p className="text-xl font-bold">
                    ${calculateTotal().toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-4 pb-20 lg:pb-0">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push('/admin/jobs')}
            >
              Cancel
            </Button>
            <ButtonLoader type="submit" loading={submitting}>
              <Save className="h-4 w-4 mr-2" />
              Create Job
            </ButtonLoader>
          </div>
        </form>
      </Form>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-20">
        <ButtonLoader
          className="w-full"
          loading={submitting}
          onClick={form.handleSubmit(handleSubmit)}
        >
          <Save className="h-4 w-4 mr-2" />
          Create Job
        </ButtonLoader>
      </div>
    </PageContainer>
  );
}

export default function NewJobPage() {
  return (
    <React.Suspense
      fallback={<div className="p-8 text-center">Loading...</div>}
    >
      <NewJobPageContent />
    </React.Suspense>
  );
}
