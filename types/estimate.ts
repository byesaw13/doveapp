// Estimate/Quote types
export type EstimateStatus =
  | 'draft'
  | 'pending'
  | 'sent'
  | 'approved'
  | 'declined'
  | 'expired'
  | 'revised';

export interface EstimateLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  unit?: string; // 'hour', 'sq ft', 'each', etc.
  total: number;
  tax_rate?: number;
  discount?: number;
  tier?: string;
  serviceId?: number | string;
  materialCost?: number;
  code?: string;
}

export interface Estimate {
  id: string;
  estimate_number: string; // Auto-generated: EST-001

  // Related Records
  lead_id?: string;
  client_id?: string;
  property_id?: string;

  // Estimate Details
  title: string;
  description?: string;
  status: EstimateStatus;

  // Line Items
  line_items: EstimateLineItem[];

  // Pricing
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount?: number;
  total: number;

  // Terms
  valid_until: string;
  terms_and_conditions?: string;
  payment_terms?: string;
  notes?: string;

  // Tracking
  sent_date?: string;
  viewed_date?: string;
  accepted_date?: string;
  declined_date?: string;
  decline_reason?: string;

  // Approval/Decline Info
  approval_info?: any;
  decline_info?: any;
  sent_history?: any[];

  // Conversion
  converted_to_job_id?: string;

  // Metadata
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EstimateTemplate {
  id: string;
  name: string;
  description?: string;
  service_type: string;
  default_line_items: EstimateLineItem[];
  default_terms?: string;
  default_payment_terms?: string;
  default_valid_days: number; // Days until expiration
  created_at: string;
  updated_at: string;
}

export interface EstimateStats {
  total_estimates: number;
  draft_estimates: number;
  sent_estimates: number;
  accepted_estimates: number;
  declined_estimates: number;
  acceptance_rate: number;
  total_value: number;
  accepted_value: number;
  average_estimate_value: number;
  average_time_to_acceptance: number;
  by_status: Record<EstimateStatus, number>;
}

export interface EstimateWithRelations extends Estimate {
  lead?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    company_name?: string;
    email: string;
    phone: string;
  };
}

// AI Estimate Generation Types
export interface AIEstimateSettings {
  id: string;
  user_id?: string; // null for global defaults

  // Profit & Pricing
  default_profit_margin: number; // percentage (e.g., 25 for 25%)
  markup_on_materials: number; // percentage
  markup_on_subcontractors: number; // percentage

  // Labor Rates
  hourly_labor_rate: number; // what you pay employees
  billable_hourly_rate: number; // what you charge clients
  overtime_multiplier: number; // e.g., 1.5 for time-and-a-half

  // Material Costs
  material_markup_percentage: number; // additional markup on materials
  equipment_rental_rate: number; // hourly rate for equipment rental
  fuel_surcharge_percentage: number; // for transportation

  // Overhead & Expenses
  overhead_percentage: number; // percentage of total costs
  insurance_percentage: number; // percentage of total
  administrative_fee: number; // flat fee per job
  permit_fees: number; // estimated permit costs
  disposal_fees: number; // waste disposal costs

  // Tax Settings
  default_tax_rate: number; // sales tax percentage
  taxable_labor: boolean; // whether labor is taxable
  taxable_materials: boolean; // whether materials are taxable

  // Business Rules
  minimum_job_size: number; // minimum total before profit margin
  round_to_nearest: number; // round totals to nearest dollar
  include_contingency: boolean; // add contingency percentage
  contingency_percentage: number; // percentage for unknowns

  // Service-specific rates
  service_rates: {
    painting: {
      labor_rate_per_sqft: number;
      material_cost_per_sqft: number;
      primer_included: boolean;
    };
    plumbing: {
      hourly_rate: number;
      trip_fee: number;
      emergency_multiplier: number;
    };
    electrical: {
      hourly_rate: number;
      permit_fee: number;
      inspection_fee: number;
    };
    hvac: {
      hourly_rate: number;
      diagnostic_fee: number;
      refrigerant_cost_per_lb: number;
    };
    general: {
      hourly_rate: number;
      minimum_charge: number;
    };
  };

  created_at: string;
  updated_at: string;
}

export interface AIEstimateRequest {
  description: string;
  service_type:
    | 'painting'
    | 'plumbing'
    | 'electrical'
    | 'hvac'
    | 'general'
    | 'other';
  images?: string[]; // base64 encoded images or URLs
  property_details?: {
    square_footage?: number;
    stories?: number;
    age?: number;
    condition?: 'excellent' | 'good' | 'fair' | 'poor';
  };
  urgency?: 'low' | 'normal' | 'high' | 'emergency';
  client_budget?: number;
  location?: string;
  special_requirements?: string[];
}

export interface AIEstimateAnalysis {
  service_type: string;
  complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  estimated_duration: {
    hours: number;
    days: number;
  };
  required_materials: Array<{
    name: string;
    quantity: number;
    unit: string;
    estimated_cost: number;
    supplier?: string;
  }>;
  labor_breakdown: Array<{
    task: string;
    hours: number;
    skill_level: 'apprentice' | 'journeyman' | 'master';
    hourly_rate: number;
  }>;
  equipment_needed: Array<{
    name: string;
    rental_cost_per_day?: number;
    purchase_cost?: number;
    usage_days: number;
  }>;
  potential_issues: string[];
  recommendations: string[];
  confidence_score: number;
}

export interface AIEstimateResult {
  analysis: AIEstimateAnalysis;
  line_items: EstimateLineItem[];
  subtotal: number;
  applied_settings: {
    profit_margin: number;
    labor_rate: number;
    material_markup: number;
    overhead: number;
    taxes: number;
  };
  total: number;
  breakdown: {
    materials: number;
    labor: number;
    equipment: number;
    overhead: number;
    profit: number;
    taxes: number;
  };
  reasoning: string;
  suggestions: string[];
  historical_data_used?: {
    confidence: number;
    similar_jobs_count: number;
    total_records: number;
  };
}
