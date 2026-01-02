export interface Material {
  id: string;
  name: string;
  description?: string;
  category: string;
  unit_cost: number;
  current_stock: number;
  min_stock: number;
  reorder_point: number;
  unit_of_measure: string;
  supplier_name?: string;
  supplier_contact?: string;
  location?: string;
  sku?: string;
  barcode?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Tool-specific fields
  is_tool?: boolean;
  serial_number?: string;
  tool_condition?:
    | 'excellent'
    | 'good'
    | 'fair'
    | 'poor'
    | 'needs_repair'
    | 'retired';
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_date?: string;
  expected_return_date?: string;
  tool_status?: 'available' | 'assigned' | 'maintenance' | 'lost' | 'retired';
  purchase_date?: string;
  warranty_expires?: string;
  maintenance_interval_days?: number;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
}

interface JobSummary {
  id: string;
  title?: string;
  job_number?: string;
  status?: string;
  client_name?: string;
}

export interface JobMaterial {
  id: string;
  job_id: string;
  material_id: string;
  quantity_used: number;
  unit_cost: number;
  total_cost: number;
  notes?: string;
  used_at: string;
  created_at: string;
  // Populated from joins
  material?: Material;
}

export interface MaterialTransaction {
  id: string;
  material_id: string;
  transaction_type: 'purchase' | 'usage' | 'adjustment' | 'return';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_cost?: number;
  total_cost?: number;
  reference_id?: string;
  reference_type?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  // Populated from joins
  material?: Material;
}

export interface InventorySummary {
  total_materials: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  categories: Array<{
    category: string;
    count: number;
    total_value: number;
  }>;
}

export interface StockAlert {
  material_id: string;
  material_name: string;
  current_stock: number;
  min_stock: number;
  reorder_point: number;
  alert_type: 'low_stock' | 'out_of_stock' | 'reorder_needed';
  severity: 'warning' | 'critical';
}

// Tool-specific interfaces
export interface ToolAssignment {
  id: string;
  material_id: string;
  assigned_to?: string;
  assigned_to_name: string;
  assigned_by?: string;
  assigned_by_name?: string;
  assigned_date: string;
  expected_return_date?: string;
  actual_return_date?: string;
  job_id?: string;
  notes?: string;
  condition_at_assignment?: 'excellent' | 'good' | 'fair' | 'poor';
  condition_at_return?:
    | 'excellent'
    | 'good'
    | 'fair'
    | 'poor'
    | 'needs_repair'
    | 'damaged';
  status: 'active' | 'returned' | 'overdue' | 'lost';
  created_at: string;
  updated_at: string;
  // Populated from joins
  material?: Material;
  job?: JobSummary;
}

export interface ToolMaintenance {
  id: string;
  material_id: string;
  maintenance_type: 'scheduled' | 'repair' | 'inspection' | 'calibration';
  scheduled_date: string;
  completed_date?: string;
  technician_name?: string;
  cost?: number;
  notes?: string;
  parts_used?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  next_maintenance_date?: string;
  created_at: string;
  updated_at: string;
  // Populated from joins
  material?: Material;
}

export interface JobTool {
  id: string;
  job_id: string;
  material_id: string;
  assigned_date: string;
  returned_date?: string;
  assigned_by?: string;
  assigned_by_name?: string;
  notes?: string;
  status: 'assigned' | 'returned' | 'lost' | 'damaged';
  created_at: string;
  // Populated from joins
  material?: Material;
  job?: JobSummary;
}

export interface ToolAvailability {
  id: string;
  name: string;
  category: string;
  serial_number?: string;
  tool_condition?: string;
  tool_status: string;
  assigned_to_name?: string;
  assigned_date?: string;
  expected_return_date?: string;
  is_available: boolean;
  days_until_maintenance?: number;
}

// Zod inferred types (import from validations)
import type {
  MaterialFormData as ZodMaterialFormData,
  JobMaterialFormData as ZodJobMaterialFormData,
  MaterialTransactionFormData as ZodMaterialTransactionFormData,
  MaterialUpdateData as ZodMaterialUpdateData,
  StockAdjustmentData as ZodStockAdjustmentData,
  MaterialQueryParams as ZodMaterialQueryParams,
  ToolCheckoutData as ZodToolCheckoutData,
  ToolCheckinData as ZodToolCheckinData,
  ToolMaintenanceData as ZodToolMaintenanceData,
  ToolAssignmentData as ZodToolAssignmentData,
} from '@/lib/validations/materials';

export type MaterialFormData = ZodMaterialFormData;
export type JobMaterialFormData = ZodJobMaterialFormData;
export type MaterialTransactionFormData = ZodMaterialTransactionFormData;
export type MaterialUpdateData = ZodMaterialUpdateData;
export type StockAdjustmentData = ZodStockAdjustmentData;
export type MaterialQueryParams = ZodMaterialQueryParams;
export type ToolCheckoutData = ZodToolCheckoutData;
export type ToolCheckinData = ZodToolCheckinData;
export type ToolMaintenanceData = ZodToolMaintenanceData;
export type ToolAssignmentData = ZodToolAssignmentData;
