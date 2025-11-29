-- Create materials inventory table
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  reorder_point DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit_of_measure TEXT NOT NULL DEFAULT 'each',
  supplier_name TEXT,
  supplier_contact TEXT,
  location TEXT, -- Where the material is stored
  sku TEXT UNIQUE, -- Stock Keeping Unit
  barcode TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_name ON materials(name);
CREATE INDEX idx_materials_sku ON materials(sku);

-- Create job_materials junction table to track materials used on jobs
CREATE TABLE job_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  quantity_used DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL, -- Cost at time of use
  total_cost DECIMAL(10,2) NOT NULL,
  notes TEXT,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, material_id) -- Prevent duplicate material entries per job
);

-- Create index for job_materials
CREATE INDEX idx_job_materials_job_id ON job_materials(job_id);
CREATE INDEX idx_job_materials_material_id ON job_materials(material_id);

-- Create material_transactions table for audit trail
CREATE TABLE material_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'adjustment', 'return')),
  quantity DECIMAL(10,2) NOT NULL,
  previous_stock DECIMAL(10,2) NOT NULL,
  new_stock DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  reference_id UUID, -- Could reference job_id, purchase_order_id, etc.
  reference_type TEXT, -- 'job', 'purchase_order', 'manual_adjustment'
  notes TEXT,
  created_by UUID, -- Could reference user if we add user management
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for material_transactions
CREATE INDEX idx_material_transactions_material_id ON material_transactions(material_id);
CREATE INDEX idx_material_transactions_created_at ON material_transactions(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_materials_updated_at
    BEFORE UPDATE ON materials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update material stock when job_materials are added
CREATE OR REPLACE FUNCTION update_material_stock_on_job_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Deduct stock when material is used on a job
    UPDATE materials
    SET current_stock = current_stock - NEW.quantity_used
    WHERE id = NEW.material_id;

    -- Record the transaction
    INSERT INTO material_transactions (
        material_id,
        transaction_type,
        quantity,
        previous_stock,
        new_stock,
        unit_cost,
        total_cost,
        reference_id,
        reference_type,
        notes
    )
    SELECT
        NEW.material_id,
        'usage',
        -NEW.quantity_used,
        m.current_stock + NEW.quantity_used, -- previous stock before deduction
        m.current_stock, -- new stock after deduction
        NEW.unit_cost,
        NEW.total_cost,
        NEW.job_id,
        'job',
        'Used on job'
    FROM materials m
    WHERE m.id = NEW.material_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic stock updates
CREATE TRIGGER trigger_update_material_stock_on_job_usage
    AFTER INSERT ON job_materials
    FOR EACH ROW
    EXECUTE FUNCTION update_material_stock_on_job_usage();

-- Function to handle stock adjustments and purchases
CREATE OR REPLACE FUNCTION record_material_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- This function can be called manually to record purchases, returns, or adjustments
    -- It will be used by application code to maintain audit trail
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;