import serviceItems from '../scripts/data/pricebook/service_items.json';
import serviceCategories from '../scripts/data/pricebook/service_categories.json';
import pricingRules from '../scripts/data/pricebook/pricing_rules.json';
import materialPrices from '../scripts/data/pricebook/material_prices.json';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type PriceTier = 'basic' | 'standard' | 'premium';

export interface ServiceCategory {
  id: number;
  key: string;
  name: string;
  code_range: string;
  description: string;
}

export interface ServiceItem {
  id: number;
  code: string;
  name: string;
  category_key: string;
  tier: 'core' | 'standard' | 'specialty';
  price_range?: string;
  standard_price: number;
  description: string;
  notes_for_ai: string;
  riskFactor?: 'low' | 'medium' | 'high';
  materialKey?: string;
  highRiskRequiresConfirmation?: boolean;
}

export interface PricingRules {
  labor_rate: number;
  material_markup: number;
  minimum_job_total: number;
  tiers: {
    core: { label: string; target_net_margin_range: [number, number] };
    standard: { label: string; target_net_margin_range: [number, number] };
    specialty: { label: string; target_net_margin_range: [number, number] };
  };
  ui_tier_display_order: string[];
  multipliers: {
    basic: number;
    standard: number;
    premium: number;
  };
  defaults: {
    tier: string;
    apply_minimum_job_total: boolean;
    round_to_nearest_dollar: boolean;
  };
  risk_multipliers: {
    low: number;
    medium: number;
    high: number;
  };
  flat_rate_safety_mode: {
    current: 'low' | 'medium' | 'high';
    multipliers: {
      low: number;
      medium: number;
      high: number;
    };
  };
}

export interface MaterialPrices {
  [key: string]: number;
}

export interface LineItemInput {
  id: number | string;
  quantity?: number;
  materialCost?: number;
  tier?: PriceTier;
}

export interface CalculatedLineItem {
  serviceId: number;
  code: string;
  name: string;
  quantity: number;
  tier: PriceTier;
  laborPortion: number;
  materialsPortion: number;
  lineTotal: number;
}

export interface EstimateResult {
  lineItems: CalculatedLineItem[];
  subtotal: number;
  adjustedTotal: number;
  appliedMinimum: boolean;
}

// ============================================================================
// DATA ACCESS
// ============================================================================

const typedServiceItems = serviceItems as ServiceItem[];
const typedCategories = serviceCategories as ServiceCategory[];
const typedPricingRules = pricingRules as PricingRules;
const typedMaterialPrices = materialPrices as MaterialPrices;

/**
 * Find a service item by numeric ID or string code.
 */
export function getServiceItem(id: number | string): ServiceItem | undefined {
  if (typeof id === 'number') {
    return typedServiceItems.find((item) => item.id === id);
  }
  return typedServiceItems.find((item) => item.code === id);
}

/**
 * Get all service items.
 */
export function getAllServiceItems(): ServiceItem[] {
  return typedServiceItems;
}

/**
 * Get all service categories.
 */
export function getAllServiceCategories(): ServiceCategory[] {
  return typedCategories;
}

/**
 * Get pricing rules.
 */
export function getPricingRules(): PricingRules {
  return typedPricingRules;
}

// ============================================================================
// PRICING CALCULATIONS
// ============================================================================

/**
 * Calculate the total for a single line item.
 *
 * @param input - Service item, material cost, quantity, and tier
 * @returns Detailed line item breakdown with labor, materials, and total
 */
export function calculateLineItemTotal(input: {
  service: ServiceItem;
  materialCost?: number;
  quantity?: number;
  tier?: PriceTier;
}): CalculatedLineItem {
  const { service, materialCost = 0, quantity = 1, tier = 'standard' } = input;

  // Base price from service item
  const basePrice = service.standard_price;

  // Determine material cost basis
  let materialCostBasis = materialCost;
  if (
    materialCostBasis === 0 &&
    service.materialKey &&
    typedMaterialPrices[service.materialKey]
  ) {
    materialCostBasis = typedMaterialPrices[service.materialKey];
  }

  // Calculate material portion (with markup)
  const materialsPortion =
    materialCostBasis > 0
      ? Math.round(materialCostBasis * (1 + typedPricingRules.material_markup))
      : 0;

  // Labor portion is the base price
  const laborPortion = basePrice;

  // Subtotal before tier multiplier
  const subtotal = (laborPortion + materialsPortion) * quantity;

  // Apply tier multiplier
  const multiplier = typedPricingRules.multipliers[tier];
  let lineTotal = subtotal * multiplier;

  // Apply risk multiplier
  const riskMultiplier =
    typedPricingRules.risk_multipliers[service.riskFactor || 'medium'];
  lineTotal *= riskMultiplier;

  // Apply safety mode multiplier
  const safetyMode = typedPricingRules.flat_rate_safety_mode.current;
  const safetyMultiplier =
    typedPricingRules.flat_rate_safety_mode.multipliers[safetyMode];
  lineTotal *= safetyMultiplier;

  // Round to nearest dollar
  lineTotal = Math.round(lineTotal);

  return {
    serviceId: service.id,
    code: service.code,
    name: service.name,
    quantity,
    tier,
    laborPortion: Math.round(laborPortion * quantity),
    materialsPortion,
    lineTotal,
  };
}

/**
 * Calculate a complete estimate from multiple line items.
 *
 * @param lineItems - Array of line item inputs
 * @returns Full estimate with line item details, subtotal, and adjusted total
 */
export function calculateEstimate(lineItems: LineItemInput[]): EstimateResult {
  const calculatedLineItems: CalculatedLineItem[] = [];

  for (const input of lineItems) {
    const service = getServiceItem(input.id);
    if (!service) {
      throw new Error(
        `Service item not found: ${input.id}. Please use a valid service item ID or code from the price book.`
      );
    }

    const lineItem = calculateLineItemTotal({
      service,
      materialCost: input.materialCost ?? 0,
      quantity: input.quantity ?? 1,
      tier: input.tier ?? 'standard',
    });

    calculatedLineItems.push(lineItem);
  }

  // Calculate subtotal
  const subtotal = calculatedLineItems.reduce(
    (sum, item) => sum + item.lineTotal,
    0
  );

  // Apply minimum job total if necessary
  const minimumJobTotal = typedPricingRules.minimum_job_total;
  const applyMinimum = typedPricingRules.defaults.apply_minimum_job_total;

  let adjustedTotal = subtotal;
  let appliedMinimum = false;

  if (applyMinimum && subtotal < minimumJobTotal) {
    adjustedTotal = minimumJobTotal;
    appliedMinimum = true;
  }

  return {
    lineItems: calculatedLineItems,
    subtotal,
    adjustedTotal,
    appliedMinimum,
  };
}
