'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { getClients } from '@/lib/db/clients';
import {
  propertySchema,
  type PropertyFormData,
} from '@/lib/validations/property';
import type { PropertyWithClient } from '@/types/property';
import type { Client } from '@/types/client';

interface PropertyFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PropertyFormData) => void;
  property?: PropertyWithClient | null;
}

export function PropertyForm({
  open,
  onClose,
  onSubmit,
  property,
}: PropertyFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      client_id: '',
      name: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      zip_code: '',
      property_type: null,
      notes: '',
    },
  });

  const selectedClientId = watch('client_id');

  useEffect(() => {
    if (open) {
      loadClients();
      if (property) {
        // Editing existing property
        reset({
          client_id: property.client_id,
          name: property.name,
          address_line1: property.address_line1 || '',
          address_line2: property.address_line2 || '',
          city: property.city || '',
          state: property.state || '',
          zip_code: property.zip_code || '',
          property_type: property.property_type as any,
          notes: property.notes || '',
        });
      } else {
        // Creating new property
        reset({
          client_id: '',
          name: '',
          address_line1: '',
          address_line2: '',
          city: '',
          state: '',
          zip_code: '',
          property_type: null,
          notes: '',
        });
      }
    }
  }, [open, property, reset]);

  const loadClients = async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const handleFormSubmit = async (data: PropertyFormData) => {
    setLoading(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const propertyTypes = [
    'Residential',
    'Commercial',
    'Condo',
    'Apartment',
    'Townhouse',
    'Other',
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {property ? 'Edit Property' : 'Add New Property'}
          </DialogTitle>
          <DialogDescription>
            {property
              ? 'Update the property details below.'
              : 'Create a new property for a client.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="client_id">Client *</Label>
              <Select
                value={selectedClientId}
                onValueChange={(value) => setValue('client_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                      {client.company_name && ` (${client.company_name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client_id && (
                <p className="text-sm text-red-600">
                  {errors.client_id.message}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <Label htmlFor="name">Property Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Main House, Summer Cottage, Office Building"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="property_type">Property Type</Label>
              <Select
                value={watch('property_type') || ''}
                onValueChange={(value) =>
                  setValue('property_type', value as any)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Address</h3>

            <div>
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input
                id="address_line1"
                {...register('address_line1')}
                placeholder="Street address"
              />
              {errors.address_line1 && (
                <p className="text-sm text-red-600">
                  {errors.address_line1.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                {...register('address_line2')}
                placeholder="Apartment, suite, etc."
              />
              {errors.address_line2 && (
                <p className="text-sm text-red-600">
                  {errors.address_line2.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register('city')} />
                {errors.city && (
                  <p className="text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" {...register('state')} />
                {errors.state && (
                  <p className="text-sm text-red-600">{errors.state.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="zip_code">ZIP Code</Label>
              <Input id="zip_code" {...register('zip_code')} />
              {errors.zip_code && (
                <p className="text-sm text-red-600">
                  {errors.zip_code.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Any special notes about this property..."
              rows={3}
            />
            {errors.notes && (
              <p className="text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? 'Saving...'
                : property
                  ? 'Update Property'
                  : 'Create Property'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
