import { z } from 'zod';

export const materialSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters'),
    description: z.string().optional(),
    category: z
      .string()
      .min(1, 'Category is required')
      .max(50, 'Category must be less than 50 characters'),
    unit_cost: z
      .number()
      .min(0, 'Unit cost must be positive')
      .max(999999.99, 'Unit cost is too high'),
    current_stock: z
      .number()
      .min(0, 'Current stock cannot be negative')
      .max(999999.99, 'Stock quantity is too high'),
    min_stock: z
      .number()
      .min(0, 'Minimum stock cannot be negative')
      .max(999999.99, 'Minimum stock is too high'),
    reorder_point: z
      .number()
      .min(0, 'Reorder point cannot be negative')
      .max(999999.99, 'Reorder point is too high'),
    unit_of_measure: z
      .string()
      .min(1, 'Unit of measure is required')
      .max(20, 'Unit of measure must be less than 20 characters'),
    supplier_name: z.string().optional(),
    supplier_contact: z.string().optional(),
    location: z.string().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    is_active: z.boolean().default(true),
    // Tool-specific fields
    is_tool: z.boolean().default(false),
    serial_number: z.string().optional(),
    tool_condition: z
      .enum(['excellent', 'good', 'fair', 'poor', 'needs_repair', 'retired'])
      .optional(),
    purchase_date: z.string().optional(),
    warranty_expires: z.string().optional(),
    maintenance_interval_days: z
      .number()
      .min(1, 'Maintenance interval must be at least 1 day')
      .max(9999, 'Maintenance interval is too high')
      .optional(),
  })
  .refine((data) => data.reorder_point >= data.min_stock, {
    message: 'Reorder point must be greater than or equal to minimum stock',
    path: ['reorder_point'],
  })
  .refine(
    (data) => {
      // If it's a tool, current_stock should be 1 (one tool) or 0 (not available)
      if (data.is_tool && data.current_stock > 1) {
        return false;
      }
      return true;
    },
    {
      message: 'Tools can only have stock of 0 or 1',
      path: ['current_stock'],
    }
  );

export const jobMaterialSchema = z.object({
  material_id: z.string().uuid('Invalid material ID'),
  quantity_used: z
    .number()
    .min(0.01, 'Quantity must be greater than 0')
    .max(999999.99, 'Quantity is too high'),
  notes: z.string().optional(),
});

export const materialTransactionSchema = z.object({
  material_id: z.string().uuid('Invalid material ID'),
  transaction_type: z.enum(['purchase', 'usage', 'adjustment', 'return']),
  quantity: z
    .number()
    .min(-999999.99, 'Quantity is too low')
    .max(999999.99, 'Quantity is too high'),
  unit_cost: z
    .number()
    .min(0, 'Unit cost must be positive')
    .max(999999.99, 'Unit cost is too high')
    .optional(),
  reference_id: z.string().uuid().optional(),
  reference_type: z
    .enum(['job', 'purchase_order', 'manual_adjustment'])
    .optional(),
  notes: z.string().optional(),
});

// Tool-specific schemas
export const toolCheckoutSchema = z.object({
  material_id: z.string().uuid('Invalid tool ID'),
  assigned_to_name: z
    .string()
    .min(1, 'Assigned to name is required')
    .max(100, 'Name is too long'),
  expected_return_date: z.string().optional(),
  job_id: z.string().uuid().optional(),
  notes: z.string().optional(),
  condition_at_assignment: z
    .enum(['excellent', 'good', 'fair', 'poor'])
    .optional(),
});

export const toolCheckinSchema = z.object({
  assignment_id: z.string().uuid('Invalid assignment ID'),
  condition_at_return: z
    .enum(['excellent', 'good', 'fair', 'poor', 'needs_repair', 'damaged'])
    .optional(),
  notes: z.string().optional(),
});

export const toolMaintenanceSchema = z.object({
  material_id: z.string().uuid('Invalid tool ID'),
  maintenance_type: z.enum([
    'scheduled',
    'repair',
    'inspection',
    'calibration',
  ]),
  scheduled_date: z.string().min(1, 'Scheduled date is required'),
  technician_name: z.string().optional(),
  cost: z
    .number()
    .min(0, 'Cost must be positive')
    .max(999999.99, 'Cost is too high')
    .optional(),
  notes: z.string().optional(),
  parts_used: z.string().optional(),
});

export const toolAssignmentSchema = z.object({
  material_id: z.string().uuid('Invalid tool ID'),
  assigned_to_name: z
    .string()
    .min(1, 'Assigned to name is required')
    .max(100, 'Name is too long'),
  assigned_by_name: z.string().optional(),
  expected_return_date: z.string().optional(),
  job_id: z.string().uuid().optional(),
  notes: z.string().optional(),
  condition_at_assignment: z
    .enum(['excellent', 'good', 'fair', 'poor'])
    .optional(),
});

export const materialUpdateSchema = materialSchema.partial().extend({
  id: z.string().uuid('Invalid material ID'),
});

export const stockAdjustmentSchema = z.object({
  material_id: z.string().uuid('Invalid material ID'),
  adjustment_quantity: z
    .number()
    .min(-999999.99, 'Adjustment is too low')
    .max(999999.99, 'Adjustment is too high'),
  reason: z
    .string()
    .min(1, 'Reason is required')
    .max(200, 'Reason must be less than 200 characters'),
  unit_cost: z
    .number()
    .min(0, 'Unit cost must be positive')
    .max(999999.99, 'Unit cost is too high')
    .optional(),
});

// Query/filter schemas
export const materialQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  low_stock_only: z.boolean().optional(),
  out_of_stock_only: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sort_by: z
    .enum(['name', 'category', 'current_stock', 'unit_cost', 'updated_at'])
    .default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

export type MaterialFormData = z.infer<typeof materialSchema>;
export type JobMaterialFormData = z.infer<typeof jobMaterialSchema>;
export type MaterialTransactionFormData = z.infer<
  typeof materialTransactionSchema
>;
export type MaterialUpdateData = z.infer<typeof materialUpdateSchema>;
export type StockAdjustmentData = z.infer<typeof stockAdjustmentSchema>;
export type MaterialQueryParams = z.infer<typeof materialQuerySchema>;

// Tool-specific types
export type ToolCheckoutData = z.infer<typeof toolCheckoutSchema>;
export type ToolCheckinData = z.infer<typeof toolCheckinSchema>;
export type ToolMaintenanceData = z.infer<typeof toolMaintenanceSchema>;
export type ToolAssignmentData = z.infer<typeof toolAssignmentSchema>;
