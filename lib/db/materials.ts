import { supabase } from '@/lib/supabase';
import type {
  Material,
  JobMaterial,
  MaterialTransaction,
  InventorySummary,
  StockAlert,
  ToolAssignment,
  ToolMaintenance,
  JobTool,
  ToolAvailability,
  MaterialFormData,
  JobMaterialFormData,
  MaterialTransactionFormData,
  StockAdjustmentData,
  MaterialQueryParams,
  ToolCheckoutData,
  ToolCheckinData,
  ToolMaintenanceData,
  ToolAssignmentData,
} from '@/types/materials';

// Materials CRUD Operations
export async function getMaterials(
  params?: MaterialQueryParams
): Promise<{ materials: Material[]; total: number }> {
  let query = supabase
    .from('materials')
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  // Apply filters
  if (params?.search) {
    query = query.or(
      `name.ilike.%${params.search}%,description.ilike.%${params.search}%,sku.ilike.%${params.search}%`
    );
  }

  if (params?.category) {
    query = query.eq('category', params.category);
  }

  if (params?.low_stock_only) {
    // This will be handled in the application layer since Supabase doesn't support column comparison in lte
    // We'll filter after fetching
  }

  if (params?.out_of_stock_only) {
    query = query.eq('current_stock', 0);
  }

  // Apply sorting
  const sortBy = params?.sort_by || 'name';
  const sortOrder = params?.sort_order || 'asc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch materials: ${error.message}`);
  }

  return {
    materials: data || [],
    total: count || 0,
  };
}

export async function getMaterialById(id: string): Promise<Material | null> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch material: ${error.message}`);
  }

  return data;
}

export async function createMaterial(
  materialData: MaterialFormData
): Promise<Material> {
  const { data, error } = await supabase
    .from('materials')
    .insert([materialData])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create material: ${error.message}`);
  }

  // Record initial stock transaction if stock > 0
  if (materialData.current_stock > 0) {
    await recordMaterialTransaction({
      material_id: data.id,
      transaction_type: 'purchase',
      quantity: materialData.current_stock,
      unit_cost: materialData.unit_cost,
      notes: 'Initial stock entry',
    });
  }

  return data;
}

export async function updateMaterial(
  id: string,
  updates: Partial<MaterialFormData>
): Promise<Material> {
  const { data, error } = await supabase
    .from('materials')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update material: ${error.message}`);
  }

  return data;
}

export async function deleteMaterial(id: string): Promise<void> {
  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from('materials')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete material: ${error.message}`);
  }
}

// Job Materials Operations
export async function getJobMaterials(jobId: string): Promise<JobMaterial[]> {
  const { data, error } = await supabase
    .from('job_materials')
    .select(
      `
      *,
      material:materials(*)
    `
    )
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch job materials: ${error.message}`);
  }

  return data || [];
}

export async function addMaterialToJob(
  jobId: string,
  materialData: JobMaterialFormData
): Promise<JobMaterial> {
  // Get current material cost
  const material = await getMaterialById(materialData.material_id);
  if (!material) {
    throw new Error('Material not found');
  }

  // Check if material is already used on this job
  const { data: existing } = await supabase
    .from('job_materials')
    .select('id')
    .eq('job_id', jobId)
    .eq('material_id', materialData.material_id)
    .single();

  if (existing) {
    throw new Error('Material is already used on this job');
  }

  // Check stock availability
  if (material.current_stock < materialData.quantity_used) {
    throw new Error(
      `Insufficient stock. Available: ${material.current_stock}, Requested: ${materialData.quantity_used}`
    );
  }

  const totalCost = materialData.quantity_used * material.unit_cost;

  const { data, error } = await supabase
    .from('job_materials')
    .insert([
      {
        job_id: jobId,
        material_id: materialData.material_id,
        quantity_used: materialData.quantity_used,
        unit_cost: material.unit_cost,
        total_cost: totalCost,
        notes: materialData.notes,
      },
    ])
    .select(
      `
      *,
      material:materials(*)
    `
    )
    .single();

  if (error) {
    throw new Error(`Failed to add material to job: ${error.message}`);
  }

  return data;
}

export async function updateJobMaterial(
  id: string,
  updates: Partial<JobMaterialFormData>
): Promise<JobMaterial> {
  const { data, error } = await supabase
    .from('job_materials')
    .update(updates)
    .eq('id', id)
    .select(
      `
      *,
      material:materials(*)
    `
    )
    .single();

  if (error) {
    throw new Error(`Failed to update job material: ${error.message}`);
  }

  return data;
}

export async function removeMaterialFromJob(id: string): Promise<void> {
  const { error } = await supabase.from('job_materials').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to remove material from job: ${error.message}`);
  }
}

// Material Transactions
export async function recordMaterialTransaction(
  transactionData: MaterialTransactionFormData
): Promise<MaterialTransaction> {
  // Get current stock
  const material = await getMaterialById(transactionData.material_id);
  if (!material) {
    throw new Error('Material not found');
  }

  const previousStock = material.current_stock;
  const newStock = previousStock + transactionData.quantity;

  // For purchases and returns, update stock
  if (
    transactionData.transaction_type === 'purchase' ||
    transactionData.transaction_type === 'return'
  ) {
    await updateMaterial(transactionData.material_id, {
      current_stock: newStock,
    });
  }

  // For usage and adjustments, stock is handled by triggers (for usage) or manually (for adjustments)
  if (transactionData.transaction_type === 'adjustment') {
    await updateMaterial(transactionData.material_id, {
      current_stock: newStock,
    });
  }

  const totalCost = transactionData.unit_cost
    ? transactionData.quantity * transactionData.unit_cost
    : undefined;

  const { data, error } = await supabase
    .from('material_transactions')
    .insert([
      {
        ...transactionData,
        previous_stock: previousStock,
        new_stock: newStock,
        total_cost: totalCost,
      },
    ])
    .select(
      `
      *,
      material:materials(*)
    `
    )
    .single();

  if (error) {
    throw new Error(`Failed to record transaction: ${error.message}`);
  }

  return data;
}

export async function getMaterialTransactions(
  materialId: string,
  limit = 50
): Promise<MaterialTransaction[]> {
  const { data, error } = await supabase
    .from('material_transactions')
    .select(
      `
      *,
      material:materials(*)
    `
    )
    .eq('material_id', materialId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch material transactions: ${error.message}`);
  }

  return data || [];
}

// Stock Management
export async function adjustStock(
  adjustmentData: StockAdjustmentData
): Promise<Material> {
  const material = await getMaterialById(adjustmentData.material_id);
  if (!material) {
    throw new Error('Material not found');
  }

  const newStock = material.current_stock + adjustmentData.adjustment_quantity;
  if (newStock < 0) {
    throw new Error('Stock adjustment would result in negative inventory');
  }

  // Update stock
  const updatedMaterial = await updateMaterial(adjustmentData.material_id, {
    current_stock: newStock,
  });

  // Record transaction
  await recordMaterialTransaction({
    material_id: adjustmentData.material_id,
    transaction_type: 'adjustment',
    quantity: adjustmentData.adjustment_quantity,
    unit_cost: adjustmentData.unit_cost,
    notes: adjustmentData.reason,
  });

  return updatedMaterial;
}

// Analytics and Reporting
export async function getInventorySummary(): Promise<InventorySummary> {
  const { data: materials, error } = await supabase
    .from('materials')
    .select('category, current_stock, unit_cost, min_stock')
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to fetch inventory summary: ${error.message}`);
  }

  const summary: InventorySummary = {
    total_materials: materials?.length || 0,
    total_value: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    categories: [],
  };

  const categoryMap = new Map<string, { count: number; total_value: number }>();

  materials?.forEach((material) => {
    const value = material.current_stock * material.unit_cost;
    summary.total_value += value;

    if (material.current_stock === 0) {
      summary.out_of_stock_count++;
    } else if (material.current_stock <= material.min_stock) {
      summary.low_stock_count++;
    }

    const category = material.category;
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { count: 0, total_value: 0 });
    }
    const catData = categoryMap.get(category)!;
    catData.count++;
    catData.total_value += value;
  });

  summary.categories = Array.from(categoryMap.entries()).map(
    ([category, data]) => ({
      category,
      ...data,
    })
  );

  return summary;
}

export async function getStockAlerts(): Promise<StockAlert[]> {
  const { data: materials, error } = await supabase
    .from('materials')
    .select('id, name, current_stock, min_stock, reorder_point')
    .eq('is_active', true)
    .or('current_stock.lte.min_stock,current_stock.eq.0');

  if (error) {
    throw new Error(`Failed to fetch stock alerts: ${error.message}`);
  }

  const alerts: StockAlert[] = [];

  materials?.forEach((material) => {
    if (material.current_stock === 0) {
      alerts.push({
        material_id: material.id,
        material_name: material.name,
        current_stock: material.current_stock,
        min_stock: material.min_stock,
        reorder_point: material.reorder_point,
        alert_type: 'out_of_stock',
        severity: 'critical',
      });
    } else if (material.current_stock <= material.min_stock) {
      alerts.push({
        material_id: material.id,
        material_name: material.name,
        current_stock: material.current_stock,
        min_stock: material.min_stock,
        reorder_point: material.reorder_point,
        alert_type: 'low_stock',
        severity: 'warning',
      });
    } else if (material.current_stock <= material.reorder_point) {
      alerts.push({
        material_id: material.id,
        material_name: material.name,
        current_stock: material.current_stock,
        min_stock: material.min_stock,
        reorder_point: material.reorder_point,
        alert_type: 'reorder_needed',
        severity: 'warning',
      });
    }
  });

  return alerts;
}

export async function getMaterialCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('category')
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  const categories = [...new Set(data?.map((m) => m.category) || [])];
  return categories.sort();
}

// Tool-specific operations

// Get tool availability
export async function getToolAvailability(): Promise<ToolAvailability[]> {
  const { data, error } = await supabase
    .from('tool_availability')
    .select('*')
    .order('name');

  if (error) {
    throw new Error(`Failed to fetch tool availability: ${error.message}`);
  }

  return data || [];
}

// Tool checkout/checkin operations
export async function checkoutTool(
  checkoutData: ToolCheckoutData
): Promise<ToolAssignment> {
  // Check if tool is available
  const material = await getMaterialById(checkoutData.material_id);
  if (!material) {
    throw new Error('Tool not found');
  }

  if (!material.is_tool) {
    throw new Error('This item is not a tool');
  }

  if (material.tool_status !== 'available') {
    throw new Error('Tool is not available for checkout');
  }

  const { data, error } = await supabase
    .from('tool_assignments')
    .insert([
      {
        material_id: checkoutData.material_id,
        assigned_to_name: checkoutData.assigned_to_name,
        expected_return_date: checkoutData.expected_return_date,
        job_id: checkoutData.job_id,
        notes: checkoutData.notes,
        condition_at_assignment: checkoutData.condition_at_assignment,
      },
    ])
    .select(
      `
      *,
      material:materials(*)
    `
    )
    .single();

  if (error) {
    throw new Error(`Failed to checkout tool: ${error.message}`);
  }

  return data;
}

export async function checkinTool(
  checkinData: ToolCheckinData
): Promise<ToolAssignment> {
  const { data, error } = await supabase
    .from('tool_assignments')
    .update({
      actual_return_date: new Date().toISOString(),
      condition_at_return: checkinData.condition_at_return,
      status: 'returned',
      notes: checkinData.notes,
    })
    .eq('id', checkinData.assignment_id)
    .select(
      `
      *,
      material:materials(*)
    `
    )
    .single();

  if (error) {
    throw new Error(`Failed to checkin tool: ${error.message}`);
  }

  return data;
}

// Tool assignments
export async function getToolAssignments(params?: {
  status?: string;
  assigned_to?: string;
}): Promise<ToolAssignment[]> {
  let query = supabase
    .from('tool_assignments')
    .select(
      `
      *,
      material:materials(*)
    `
    )
    .order('assigned_date', { ascending: false });

  if (params?.status) {
    query = query.eq('status', params.status);
  }

  if (params?.assigned_to) {
    query = query.ilike('assigned_to_name', `%${params.assigned_to}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch tool assignments: ${error.message}`);
  }

  return data || [];
}

export async function getToolAssignmentById(
  id: string
): Promise<ToolAssignment | null> {
  const { data, error } = await supabase
    .from('tool_assignments')
    .select(
      `
      *,
      material:materials(*)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch tool assignment: ${error.message}`);
  }

  return data;
}

// Tool maintenance
export async function scheduleToolMaintenance(
  maintenanceData: ToolMaintenanceData
): Promise<ToolMaintenance> {
  const { data, error } = await supabase
    .from('tool_maintenance')
    .insert([maintenanceData])
    .select(
      `
      *,
      material:materials(*)
    `
    )
    .single();

  if (error) {
    throw new Error(`Failed to schedule tool maintenance: ${error.message}`);
  }

  return data;
}

export async function getToolMaintenance(
  materialId?: string
): Promise<ToolMaintenance[]> {
  let query = supabase
    .from('tool_maintenance')
    .select(
      `
      *,
      material:materials(*)
    `
    )
    .order('scheduled_date', { ascending: false });

  if (materialId) {
    query = query.eq('material_id', materialId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch tool maintenance: ${error.message}`);
  }

  return data || [];
}

export async function updateToolMaintenance(
  id: string,
  updates: Partial<ToolMaintenance>
): Promise<ToolMaintenance> {
  const { data, error } = await supabase
    .from('tool_maintenance')
    .update(updates)
    .eq('id', id)
    .select(
      `
      *,
      material:materials(*)
    `
    )
    .single();

  if (error) {
    throw new Error(`Failed to update tool maintenance: ${error.message}`);
  }

  return data;
}

// Job tools
export async function assignToolToJob(
  jobId: string,
  materialId: string,
  assignedByName?: string
): Promise<JobTool> {
  // Check if tool is already assigned to this job
  const { data: existing } = await supabase
    .from('job_tools')
    .select('id')
    .eq('job_id', jobId)
    .eq('material_id', materialId)
    .eq('status', 'assigned')
    .single();

  if (existing) {
    throw new Error('Tool is already assigned to this job');
  }

  const { data, error } = await supabase
    .from('job_tools')
    .insert([
      {
        job_id: jobId,
        material_id: materialId,
        assigned_by_name: assignedByName,
      },
    ])
    .select(
      `
      *,
      material:materials(*)
    `
    )
    .single();

  if (error) {
    throw new Error(`Failed to assign tool to job: ${error.message}`);
  }

  return data;
}

export async function getJobTools(jobId: string): Promise<JobTool[]> {
  const { data, error } = await supabase
    .from('job_tools')
    .select(
      `
      *,
      material:materials(*)
    `
    )
    .eq('job_id', jobId)
    .order('assigned_date', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch job tools: ${error.message}`);
  }

  return data || [];
}

export async function returnJobTool(id: string): Promise<JobTool> {
  const { data, error } = await supabase
    .from('job_tools')
    .update({
      returned_date: new Date().toISOString(),
      status: 'returned',
    })
    .eq('id', id)
    .select(
      `
      *,
      material:materials(*)
    `
    )
    .single();

  if (error) {
    throw new Error(`Failed to return job tool: ${error.message}`);
  }

  return data;
}

// Tool analytics
export async function getToolUtilization(): Promise<
  Array<{
    material_id: string;
    material_name: string;
    total_assignments: number;
    active_assignments: number;
    utilization_rate: number;
  }>
> {
  const { data, error } = await supabase.rpc('get_tool_utilization_stats');

  if (error) {
    // Fallback if RPC doesn't exist
    console.warn('RPC function not available, using basic query');
    return [];
  }

  return data || [];
}

export async function getOverdueToolReturns(): Promise<ToolAssignment[]> {
  const { data, error } = await supabase
    .from('tool_assignments')
    .select(
      `
      *,
      material:materials(*)
    `
    )
    .eq('status', 'active')
    .lt('expected_return_date', new Date().toISOString())
    .order('expected_return_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch overdue tool returns: ${error.message}`);
  }

  return data || [];
}

export async function getToolsDueForMaintenance(): Promise<
  Array<{
    material_id: string;
    material_name: string;
    days_until_maintenance: number;
    next_maintenance_date: string;
  }>
> {
  const { data, error } = await supabase
    .from('materials')
    .select('id, name, next_maintenance_date')
    .eq('is_tool', true)
    .not('next_maintenance_date', 'is', null)
    .lte(
      'next_maintenance_date',
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    ) // Next 30 days
    .order('next_maintenance_date', { ascending: true });

  if (error) {
    throw new Error(
      `Failed to fetch tools due for maintenance: ${error.message}`
    );
  }

  return (data || []).map((material) => ({
    material_id: material.id,
    material_name: material.name,
    days_until_maintenance: Math.ceil(
      (new Date(material.next_maintenance_date!).getTime() - Date.now()) /
        (24 * 60 * 60 * 1000)
    ),
    next_maintenance_date: material.next_maintenance_date!,
  }));
}
