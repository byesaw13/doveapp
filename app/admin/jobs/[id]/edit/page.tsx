'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { getJob, updateJob, addLineItem, deleteLineItem } from '@/lib/db/jobs';
import { getClients } from '@/lib/db/clients';
import type { JobWithDetails, LineItemInsert } from '@/types/job';
import type { Client } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobWithDetails | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      client_id: '',
      title: '',
      description: '',
      status: 'quote' as const,
      service_date: '',
      scheduled_time: '',
      notes: '',
      newLineItems: [] as any[],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'newLineItems',
  });

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobData, clientsData] = await Promise.all([
        getJob(params.id as string),
        getClients(),
      ]);

      if (jobData) {
        setJob(jobData);
        setClients(clientsData);

        form.reset({
          client_id: jobData.client_id,
          title: jobData.title,
          description: jobData.description || '',
          status: jobData.status as any,
          service_date: jobData.service_date || '',
          scheduled_time: jobData.scheduled_time || '',
          notes: jobData.notes || '',
          newLineItems: [],
        });
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    if (!job) return;

    try {
      setSubmitting(true);

      // Update job
      await updateJob(job.id, {
        client_id: data.client_id,
        title: data.title,
        description: data.description || null,
        status: data.status,
        service_date: data.service_date || null,
        scheduled_time: data.scheduled_time || null,
        notes: data.notes || null,
        subtotal: 0,
        tax: 0,
        total: 0,
      });

      // Add new line items
      for (const item of data.newLineItems) {
        if (item.description) {
          const lineItem: LineItemInsert = {
            job_id: job.id,
            item_type: item.item_type,
            description: item.description,
            quantity: parseFloat(item.quantity),
            unit_price: parseFloat(item.unit_price),
          };
          await addLineItem(job.id, lineItem);
        }
      }

      router.push(`/jobs/${job.id}`);
    } catch (error) {
      console.error('Failed to update job:', error);
      alert('Failed to update job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExistingLineItem = async (itemId: string) => {
    if (!job || !confirm('Delete this line item?')) return;

    try {
      await deleteLineItem(itemId, job.id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete line item:', error);
      alert('Failed to delete line item');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Job not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Job {job.job_number}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Client Selection */}
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
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

              {/* Job Details */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title *</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="quote">Quote</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="invoiced">Invoiced</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
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
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Existing Line Items */}
              {job.line_items.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Existing Line Items</h3>
                  <div className="space-y-2">
                    {job.line_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between border p-3 rounded"
                      >
                        <div>
                          <span className="font-medium capitalize">{item.item_type}</span>
                          {' - '}
                          {item.description}
                          {' - '}
                          {item.quantity} × ${item.unit_price.toFixed(2)} = $
                          {item.total.toFixed(2)}
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteExistingLineItem(item.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Line Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Add New Line Items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        item_type: 'labor',
                        description: '',
                        quantity: 1,
                        unit_price: 0,
                      })
                    }
                  >
                    Add Item
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="border p-4 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">New Item {index + 1}</h4>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name={`newLineItems.${index}.item_type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
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
                        name={`newLineItems.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`newLineItems.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qty</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`newLineItems.${index}.unit_price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Price ($)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Link href={`/jobs/${job.id}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
