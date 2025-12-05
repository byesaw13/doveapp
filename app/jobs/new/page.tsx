'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  jobSchema,
  lineItemSchema,
  type JobFormData,
  type LineItemFormData,
} from '@/lib/validations/job';
import { getClients } from '@/lib/db/clients';
import { getAllProperties } from '@/lib/db/properties';
import { createJob } from '@/lib/db/jobs';
import type { Client } from '@/types/client';
import type { PropertyWithClient } from '@/types/property';
import type { LineItemInsert } from '@/types/job';

import { Input } from '@/components/ui/input';
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

export default function NewJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<PropertyWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const prefilledDate = searchParams.get('date') || '';

  const form = useForm({
    defaultValues: {
      client_id: '',
      property_id: 'none',
      title: '',
      description: '',
      status: 'quote' as const,
      service_date: prefilledDate,
      scheduled_time: '',
      notes: '',
      lineItems: [
        {
          item_type: 'labor' as const,
          description: '',
          quantity: 1,
          unit_price: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientsData, propertiesData] = await Promise.all([
        getClients(),
        getAllProperties(),
      ]);
      setClients(clientsData);
      setProperties(propertiesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setSubmitting(true);

      const lineItems: LineItemInsert[] = data.lineItems.map((item: any) => ({
        item_type: item.item_type,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      await createJob(
        {
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
        },
        lineItems
      );

      router.push('/jobs');
    } catch (error) {
      console.error('Failed to create job:', error);
      alert('Failed to create job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header - Jobber style with emerald gradient */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 sm:px-8 lg:px-10 py-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-white">
                  Create New Job
                </h1>
                <p className="mt-2 text-emerald-50 text-sm">
                  Loading form data...
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
            <div className="text-slate-600">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Jobber style with emerald gradient */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 sm:px-8 lg:px-10 py-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white">Create New Job</h1>
              <p className="mt-2 text-emerald-50 text-sm">
                Fill out the details below to create a new job
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Container - Jobber style */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 shadow-md">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-900">Job Details</h2>
            </div>
          </div>
          <div className="p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-8"
              >
                {/* Client & Property Section */}
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded">
                      <svg
                        className="h-4 w-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    Client & Property
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="client_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700">
                            Client *
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-white border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                                <SelectValue
                                  placeholder="Select a client"
                                  className="text-slate-700 font-medium"
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.first_name} {client.last_name}
                                  {client.company_name &&
                                    ` - ${client.company_name}`}
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
                          <FormLabel className="text-sm font-semibold text-slate-700">
                            Property (Optional)
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-white border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                                <SelectValue
                                  placeholder="Select a property (optional)"
                                  className="text-slate-700 font-medium"
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">
                                No specific property
                              </SelectItem>
                              {properties
                                .filter(
                                  (property) =>
                                    !form.watch('client_id') ||
                                    property.client_id ===
                                      form.watch('client_id')
                                )
                                .map((property) => (
                                  <SelectItem
                                    key={property.id}
                                    value={property.id}
                                  >
                                    {property.name} -{' '}
                                    {property.client.first_name}{' '}
                                    {property.client.last_name}
                                    {property.city && ` (${property.city})`}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Job Details Section */}
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 rounded">
                      <svg
                        className="h-4 w-4 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    Job Details
                  </h3>
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700">
                            Job Title *
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., Interior Painting - Living Room"
                              className="bg-white border-slate-300"
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
                          <FormLabel className="text-sm font-semibold text-slate-700">
                            Description
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Additional details about the job"
                              className="bg-white border-slate-300"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-slate-700">
                              Status *
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-white border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                                  <SelectValue className="text-slate-700 font-medium" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="quote">Quote</SelectItem>
                                <SelectItem value="scheduled">
                                  Scheduled
                                </SelectItem>
                                <SelectItem value="in_progress">
                                  In Progress
                                </SelectItem>
                                <SelectItem value="completed">
                                  Completed
                                </SelectItem>
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
                            <FormLabel className="text-sm font-semibold text-slate-700">
                              Service Date
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="date"
                                className="bg-white border-slate-300"
                              />
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
                          <FormLabel className="text-sm font-semibold text-slate-700">
                            Notes
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Special instructions, access codes, etc."
                              className="bg-white border-slate-300"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Line Items Section */}
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-100 rounded">
                        <svg
                          className="h-4 w-4 text-emerald-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      Line Items
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        append({
                          item_type: 'labor',
                          description: '',
                          quantity: 1,
                          unit_price: 0,
                        })
                      }
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-slate-900">
                            Item {index + 1}
                          </h4>
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg transition-colors text-sm border border-red-200"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <FormField
                            control={form.control}
                            name={`lineItems.${index}.item_type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-slate-700">
                                  Type
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="bg-white border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                                      <SelectValue className="text-slate-700 font-medium" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="labor">Labor</SelectItem>
                                    <SelectItem value="material">
                                      Material
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`lineItems.${index}.description`}
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel className="text-sm font-semibold text-slate-700">
                                  Description
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="e.g., Paint 2 rooms"
                                    className="bg-white border-slate-300"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`lineItems.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-slate-700">
                                  Qty
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    step="0.01"
                                    className="bg-white border-slate-300"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.unit_price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-slate-700">
                                Unit Price ($)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  className="bg-white border-slate-300"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => router.push('/jobs')}
                    className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Creating...' : 'Create Job'}
                  </button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
