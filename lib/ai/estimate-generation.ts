import { OpenAI } from 'openai';
import type {
  AIEstimateRequest,
  AIEstimateResult,
  AIEstimateSettings,
  EstimateLineItem,
} from '@/types/estimate';

export interface EstimateGenerationOptions {
  settings: AIEstimateSettings;
  request: AIEstimateRequest;
  useVision?: boolean; // whether to analyze images
}

/**
 * Generate an AI-powered estimate from description and optional images
 */
export async function generateAIEstimate({
  settings,
  request,
  useVision = true,
}: EstimateGenerationOptions): Promise<AIEstimateResult> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Build the prompt based on request type
  const prompt = buildEstimatePrompt(settings, request);

  let messages: any[] = [{ role: 'user', content: prompt }];

  // Add image analysis if images are provided and vision is enabled
  if (useVision && request.images && request.images.length > 0) {
    messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...request.images.map((image) => ({
            type: 'image_url',
            image_url: {
              url: image.startsWith('data:')
                ? image
                : `data:image/jpeg;base64,${image}`,
              detail: 'high',
            },
          })),
        ],
      },
    ];
  }

  const response = await openai.chat.completions.create({
    model: useVision && request.images ? 'gpt-4o' : 'gpt-4o-mini',
    messages,
    temperature: 0.1,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content received from OpenAI');
  }

  const aiResult = JSON.parse(content);

  // Apply business rules and settings to generate final estimate
  return applyBusinessRules(aiResult, settings, request);
}

/**
 * Build the detailed prompt for estimate generation
 */
function buildEstimatePrompt(
  settings: AIEstimateSettings,
  request: AIEstimateRequest
): string {
  const serviceSpecificRates =
    settings.service_rates[request.service_type] ||
    settings.service_rates.general;

  return `You are an expert estimator for a field service company specializing in ${request.service_type} services. Generate a detailed, accurate estimate based on the provided information.

BUSINESS CONTEXT:
- Service Type: ${request.service_type}
- Your hourly labor rate: $${settings.hourly_labor_rate}/hour
- Your billable rate: $${settings.billable_hourly_rate}/hour
- Material markup: ${settings.material_markup_percentage}%
- Equipment rental: $${settings.equipment_rental_rate}/hour
- Overhead: ${settings.overhead_percentage}% of total costs
- Profit margin: ${settings.default_profit_margin}%
- Tax rate: ${settings.default_tax_rate}%

SERVICE-SPECIFIC RATES:
${JSON.stringify(serviceSpecificRates, null, 2)}

PROJECT DETAILS:
- Description: ${request.description}
- Urgency: ${request.urgency || 'normal'}
- Property Details: ${request.property_details ? JSON.stringify(request.property_details) : 'Not provided'}
- Location: ${request.location || 'Local area'}
- Special Requirements: ${request.special_requirements?.join(', ') || 'None specified'}
- Client Budget: ${request.client_budget ? `$${request.client_budget}` : 'Not specified'}

TASK: Analyze this project and provide a comprehensive estimate breakdown. Consider:
1. Scope of work and complexity
2. Materials required with realistic quantities
3. Labor hours needed (be conservative but realistic)
4. Equipment/tools needed
5. Potential challenges or additional considerations
6. Timeframe estimates

Return a JSON object with this exact structure:
{
  "analysis": {
    "service_type": "${request.service_type}",
    "complexity": "simple|moderate|complex|very_complex",
    "estimated_duration": {
      "hours": 0,
      "days": 0
    },
    "required_materials": [
      {
        "name": "Material name",
        "quantity": 0,
        "unit": "each|sq ft|gallons|lbs|etc",
        "estimated_cost": 0,
        "supplier": "optional supplier name"
      }
    ],
    "labor_breakdown": [
      {
        "task": "Task description",
        "hours": 0,
        "skill_level": "apprentice|journeyman|master",
        "hourly_rate": ${settings.hourly_labor_rate}
      }
    ],
    "equipment_needed": [
      {
        "name": "Equipment name",
        "rental_cost_per_day": 0,
        "usage_days": 0
      }
    ],
    "potential_issues": ["Issue 1", "Issue 2"],
    "recommendations": ["Recommendation 1", "Recommendation 2"],
    "confidence_score": 0.0
  },
  "reasoning": "Detailed explanation of your estimate methodology and assumptions"
}`;
}

/**
 * Apply business rules and settings to convert AI analysis into final estimate
 */
function applyBusinessRules(
  aiResult: any,
  settings: AIEstimateSettings,
  request: AIEstimateRequest
): AIEstimateResult {
  const lineItems: EstimateLineItem[] = [];
  let subtotal = 0;

  // Process materials
  aiResult.analysis.required_materials?.forEach(
    (material: any, index: number) => {
      const costWithMarkup =
        material.estimated_cost *
        (1 + settings.material_markup_percentage / 100);
      const total = material.quantity * costWithMarkup;

      lineItems.push({
        id: `material-${index}`,
        description: `${material.name} (${material.quantity} ${material.unit})`,
        quantity: material.quantity,
        unit_price: costWithMarkup,
        unit: material.unit,
        total: Math.round(total * 100) / 100,
      });

      subtotal += total;
    }
  );

  // Process labor
  aiResult.analysis.labor_breakdown?.forEach((labor: any, index: number) => {
    const billableRate = settings.billable_hourly_rate;
    const total = labor.hours * billableRate;

    lineItems.push({
      id: `labor-${index}`,
      description: `${labor.task} (${labor.skill_level})`,
      quantity: labor.hours,
      unit_price: billableRate,
      unit: 'hour',
      total: Math.round(total * 100) / 100,
    });

    subtotal += total;
  });

  // Process equipment
  aiResult.analysis.equipment_needed?.forEach(
    (equipment: any, index: number) => {
      const total = equipment.rental_cost_per_day * equipment.usage_days;

      lineItems.push({
        id: `equipment-${index}`,
        description: `${equipment.name} rental`,
        quantity: equipment.usage_days,
        unit_price: equipment.rental_cost_per_day,
        unit: 'day',
        total: Math.round(total * 100) / 100,
      });

      subtotal += total;
    }
  );

  // Add overhead
  const overheadAmount = subtotal * (settings.overhead_percentage / 100);
  lineItems.push({
    id: 'overhead',
    description: `Overhead (${settings.overhead_percentage}%)`,
    quantity: 1,
    unit_price: overheadAmount,
    unit: 'each',
    total: Math.round(overheadAmount * 100) / 100,
  });
  subtotal += overheadAmount;

  // Add administrative fee
  if (settings.administrative_fee > 0) {
    lineItems.push({
      id: 'admin-fee',
      description: 'Administrative fee',
      quantity: 1,
      unit_price: settings.administrative_fee,
      unit: 'each',
      total: settings.administrative_fee,
    });
    subtotal += settings.administrative_fee;
  }

  // Add permit fees
  if (settings.permit_fees > 0) {
    lineItems.push({
      id: 'permits',
      description: 'Permit fees',
      quantity: 1,
      unit_price: settings.permit_fees,
      unit: 'each',
      total: settings.permit_fees,
    });
    subtotal += settings.permit_fees;
  }

  // Calculate profit margin
  const profitAmount = subtotal * (settings.default_profit_margin / 100);
  lineItems.push({
    id: 'profit',
    description: `Profit margin (${settings.default_profit_margin}%)`,
    quantity: 1,
    unit_price: profitAmount,
    unit: 'each',
    total: Math.round(profitAmount * 100) / 100,
  });

  const preTaxTotal = subtotal + profitAmount;

  // Calculate taxes
  const taxableAmount =
    settings.taxable_labor && settings.taxable_materials
      ? preTaxTotal
      : settings.taxable_labor
        ? preTaxTotal * 0.7 // estimate 70% labor
        : settings.taxable_materials
          ? preTaxTotal * 0.3
          : 0; // estimate 30% materials

  const taxAmount = taxableAmount * (settings.default_tax_rate / 100);
  lineItems.push({
    id: 'taxes',
    description: `Taxes (${settings.default_tax_rate}%)`,
    quantity: 1,
    unit_price: taxAmount,
    unit: 'each',
    total: Math.round(taxAmount * 100) / 100,
  });

  const finalTotal =
    Math.round((preTaxTotal + taxAmount) / settings.round_to_nearest) *
    settings.round_to_nearest;

  // Generate suggestions based on analysis
  const suggestions = generateSuggestions(aiResult.analysis, settings, request);

  return {
    analysis: aiResult.analysis,
    line_items: lineItems,
    subtotal: Math.round(subtotal * 100) / 100,
    applied_settings: {
      profit_margin: settings.default_profit_margin,
      labor_rate: settings.billable_hourly_rate,
      material_markup: settings.material_markup_percentage,
      overhead: settings.overhead_percentage,
      taxes: settings.default_tax_rate,
    },
    total: finalTotal,
    breakdown: {
      materials: lineItems
        .filter((item) => item.id.startsWith('material-'))
        .reduce((sum, item) => sum + item.total, 0),
      labor: lineItems
        .filter((item) => item.id.startsWith('labor-'))
        .reduce((sum, item) => sum + item.total, 0),
      equipment: lineItems
        .filter((item) => item.id.startsWith('equipment-'))
        .reduce((sum, item) => sum + item.total, 0),
      overhead: overheadAmount,
      profit: profitAmount,
      taxes: taxAmount,
    },
    reasoning:
      aiResult.reasoning ||
      'Estimate generated using AI analysis and business rules',
    suggestions,
  };
}

/**
 * Generate helpful suggestions based on the estimate analysis
 */
function generateSuggestions(
  analysis: any,
  settings: AIEstimateSettings,
  request: AIEstimateRequest
): string[] {
  const suggestions: string[] = [];

  if (analysis.complexity === 'very_complex') {
    suggestions.push(
      'Consider breaking this project into phases for better cost control'
    );
  }

  if (analysis.estimated_duration.days > 7) {
    suggestions.push(
      'This project may require scheduling across multiple weeks'
    );
  }

  if (
    request.client_budget &&
    request.client_budget < analysis.estimated_total * 0.8
  ) {
    suggestions.push(
      'Client budget appears lower than estimated cost - consider discussing scope adjustments'
    );
  }

  if (analysis.potential_issues?.length > 0) {
    suggestions.push(
      'Review potential issues identified in the analysis before proceeding'
    );
  }

  if (settings.include_contingency) {
    suggestions.push(
      `Consider adding ${settings.contingency_percentage}% contingency for unforeseen issues`
    );
  }

  return suggestions;
}

/**
 * Get default AI estimate settings
 */
export function getDefaultAIEstimateSettings(): Omit<
  AIEstimateSettings,
  'id' | 'created_at' | 'updated_at'
> {
  return {
    default_profit_margin: 25,
    markup_on_materials: 15,
    markup_on_subcontractors: 10,
    hourly_labor_rate: 25,
    billable_hourly_rate: 75,
    overtime_multiplier: 1.5,
    material_markup_percentage: 20,
    equipment_rental_rate: 50,
    fuel_surcharge_percentage: 5,
    overhead_percentage: 15,
    insurance_percentage: 3,
    administrative_fee: 50,
    permit_fees: 100,
    disposal_fees: 25,
    default_tax_rate: 8.5,
    taxable_labor: true,
    taxable_materials: true,
    minimum_job_size: 500,
    round_to_nearest: 5,
    include_contingency: true,
    contingency_percentage: 10,
    service_rates: {
      painting: {
        labor_rate_per_sqft: 2.5,
        material_cost_per_sqft: 1.25,
        primer_included: true,
      },
      plumbing: {
        hourly_rate: 85,
        trip_fee: 75,
        emergency_multiplier: 2.0,
      },
      electrical: {
        hourly_rate: 90,
        permit_fee: 150,
        inspection_fee: 100,
      },
      hvac: {
        hourly_rate: 95,
        diagnostic_fee: 125,
        refrigerant_cost_per_lb: 15,
      },
      general: {
        hourly_rate: 75,
        minimum_charge: 150,
      },
    },
  };
}
