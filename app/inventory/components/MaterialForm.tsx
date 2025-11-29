'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  materialSchema,
  type MaterialFormData,
} from '@/lib/validations/materials';
import type { Material } from '@/types/materials';

interface MaterialFormProps {
  material?: Material;
  onSuccess: () => void;
}

const UNIT_OF_MEASURE_OPTIONS = [
  'each',
  'box',
  'case',
  'pack',
  'roll',
  'sheet',
  'tube',
  'can',
  'bottle',
  'gallon',
  'quart',
  'pint',
  'cup',
  'pound',
  'ounce',
  'gram',
  'kilogram',
  'meter',
  'foot',
  'yard',
  'inch',
];

const CATEGORY_OPTIONS = [
  'General',
  'Paint',
  'Wood',
  'Hardware',
  'Electrical',
  'Plumbing',
  'Tools',
  'Cleaning',
  'Safety',
  'Lumber',
  'Drywall',
  'Flooring',
  'Roofing',
  'Concrete',
  'Landscape',
];

export function MaterialForm({ material, onSuccess }: MaterialFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: material
      ? {
          name: material.name,
          description: material.description || '',
          category: material.category,
          unit_cost: material.unit_cost,
          current_stock: material.current_stock,
          min_stock: material.min_stock,
          reorder_point: material.reorder_point,
          unit_of_measure: material.unit_of_measure,
          supplier_name: material.supplier_name || '',
          supplier_contact: material.supplier_contact || '',
          location: material.location || '',
          sku: material.sku || '',
          barcode: material.barcode || '',
          is_active: material.is_active,
          // Tool-specific fields
          is_tool: material.is_tool || false,
          serial_number: material.serial_number || '',
          tool_condition: material.tool_condition || 'good',
          purchase_date: material.purchase_date || '',
          warranty_expires: material.warranty_expires || '',
          maintenance_interval_days:
            material.maintenance_interval_days || undefined,
        }
      : {
          name: '',
          description: '',
          category: 'General',
          unit_cost: 0,
          current_stock: 0,
          min_stock: 0,
          reorder_point: 0,
          unit_of_measure: 'each',
          supplier_name: '',
          supplier_contact: '',
          location: '',
          sku: '',
          barcode: '',
          is_active: true,
          // Tool-specific fields
          is_tool: false,
          serial_number: '',
          tool_condition: 'good',
          purchase_date: '',
          warranty_expires: '',
          maintenance_interval_days: undefined,
        },
  });

  const isActive = watch('is_active');

  const onSubmit = async (data: MaterialFormData) => {
    setLoading(true);
    setError(null);

    try {
      const url = material ? `/api/materials/${material.id}` : '/api/materials';
      const method = material ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save material');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>

          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Material name"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Material description"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              value={watch('category')}
              onValueChange={(value) => setValue('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-600 mt-1">
                {errors.category.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="unit_of_measure">Unit of Measure *</Label>
            <Select
              value={watch('unit_of_measure')}
              onValueChange={(value) => setValue('unit_of_measure', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {UNIT_OF_MEASURE_OPTIONS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.unit_of_measure && (
              <p className="text-sm text-red-600 mt-1">
                {errors.unit_of_measure.message}
              </p>
            )}
          </div>
        </div>

        {/* Stock Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Stock Information</h3>

          <div>
            <Label htmlFor="unit_cost">Unit Cost *</Label>
            <Input
              id="unit_cost"
              type="number"
              step="0.01"
              min="0"
              {...register('unit_cost', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.unit_cost && (
              <p className="text-sm text-red-600 mt-1">
                {errors.unit_cost.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="current_stock">Current Stock *</Label>
            <Input
              id="current_stock"
              type="number"
              step="0.01"
              min="0"
              {...register('current_stock', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.current_stock && (
              <p className="text-sm text-red-600 mt-1">
                {errors.current_stock.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="min_stock">Minimum Stock *</Label>
            <Input
              id="min_stock"
              type="number"
              step="0.01"
              min="0"
              {...register('min_stock', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.min_stock && (
              <p className="text-sm text-red-600 mt-1">
                {errors.min_stock.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="reorder_point">Reorder Point *</Label>
            <Input
              id="reorder_point"
              type="number"
              step="0.01"
              min="0"
              {...register('reorder_point', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.reorder_point && (
              <p className="text-sm text-red-600 mt-1">
                {errors.reorder_point.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Supplier Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Supplier Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="supplier_name">Supplier Name</Label>
            <Input
              id="supplier_name"
              {...register('supplier_name')}
              placeholder="Supplier name"
            />
            {errors.supplier_name && (
              <p className="text-sm text-red-600 mt-1">
                {errors.supplier_name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="supplier_contact">Supplier Contact</Label>
            <Input
              id="supplier_contact"
              {...register('supplier_contact')}
              placeholder="Phone or email"
            />
            {errors.supplier_contact && (
              <p className="text-sm text-red-600 mt-1">
                {errors.supplier_contact.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="location">Storage Location</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="Where is this stored?"
            />
            {errors.location && (
              <p className="text-sm text-red-600 mt-1">
                {errors.location.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              {...register('sku')}
              placeholder="Stock keeping unit"
            />
            {errors.sku && (
              <p className="text-sm text-red-600 mt-1">{errors.sku.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Additional Information</h3>

        <div>
          <Label htmlFor="barcode">Barcode</Label>
          <Input
            id="barcode"
            {...register('barcode')}
            placeholder="Barcode number"
          />
          {errors.barcode && (
            <p className="text-sm text-red-600 mt-1">
              {errors.barcode.message}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_active"
            checked={isActive}
            onCheckedChange={(checked) => setValue('is_active', !!checked)}
          />
          <Label htmlFor="is_active">Material is active</Label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => onSuccess()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? 'Saving...'
            : material
              ? 'Update Material'
              : 'Create Material'}
        </Button>
      </div>
    </form>
  );
}
