# Flat Rate Safety System - Implementation Summary

## Overview

A comprehensive safety system has been implemented to protect against volatile material prices and high-risk jobs while maintaining flat-rate pricing integrity.

## Files Modified/Created

### Data Files

- `/data/pricebook/service_items.json` - Added riskFactor, materialKey, and highRiskRequiresConfirmation fields
- `/data/pricebook/pricing_rules.json` - Added risk_multipliers and flat_rate_safety_mode
- `/data/pricebook/material_prices.json` - New file for centralized material cost management
- `/data/pricebook/estimate_disclaimers.json` - New file for protective legal disclaimers

### Core Engine

- `/lib/pricingEngine.ts` - Updated types and calculateLineItemTotal to apply risk and safety multipliers
- `__tests__/lib/pricingEngine.test.ts` - Added comprehensive tests for new features

### UI Components

- `/components/estimates/SKUPicker.tsx` - Fixed dialog overflow and styling issues for better UX
- `/app/estimates/page.tsx` - Added high-risk warnings and disclaimer display

### PDF Generation

- `/lib/pdf-estimate.ts` - Added disclaimer section and improved logo handling

### Agent Instructions

- `/lib/agents/estimator.md` - Added "Exception Triggers & High-Risk Items" section

## How Risk Factor Affects Pricing

### Risk Multipliers

Each service item has a riskFactor field ("low", "medium", or "high"):

- **Low Risk** (1.0x): Painting, furniture assembly - predictable, low-complexity work
- **Medium Risk** (1.1x): General repairs, mounting, basic electrical - standard handyman work
- **High Risk** (1.2x): Plumbing, specialty work - potential for hidden conditions

**Example:**

- Base price: $200
- With medium risk (1.1x): $220
- With high risk (1.2x): $240

### Safety Mode Global Multiplier

The `flat_rate_safety_mode` provides an additional safety margin across all pricing:

- **Low mode** (1.0x): Normal market conditions
- **Medium mode** (1.03x): Current default - slight volatility protection
- **High mode** (1.06x): Extreme market volatility

**Current Setting:** Medium (1.03x multiplier on all jobs)

**Combined Example:**

- Base: $200
- Risk (high 1.2x): $240
- Safety (medium 1.03x): $247.20 → $247 (rounded)

## Dynamic Material Pricing

### Material Price Lookup

Service items can reference centralized material costs via `materialKey`:

```json
{
  "id": 2001,
  "name": "Faucet replacement",
  "materialKey": "faucet_standard"
}
```

The system looks up `material_prices.json`:

```json
{
  "faucet_standard": 120
}
```

### Priority Order

1. **Explicit materialCost** in API call → Use that value
2. **materialKey** present → Look up in material_prices.json
3. **Neither present** → materialsPortion = 0

### Markup Applied

All materials get 18% markup:

- Material cost: $120
- With markup: $141.60 → $142 (rounded)

## Legal Protection - Disclaimers

### Disclaimer Content

Located in `/data/pricebook/estimate_disclaimers.json`:

1. 14-day pricing validity due to market volatility
2. Flat-rate pricing assumes standard conditions
3. Material cost increase notification clause
4. On-site confirmation requirement for scope changes

### Where Disclaimers Appear

- **Estimate PDFs**: Printed in "Terms & Conditions" section
- **Estimates UI**: Displayed in "Standard Terms & Conditions" panel
- **Validity Date**: Auto-calculated as estimate_date + 14 days

## High-Risk Exception Triggers

### Identification

Items marked with:

- `riskFactor: "high"` AND/OR
- `highRiskRequiresConfirmation: true`

Examples:

- Toilet replacement (2005)
- All plumbing work (2000-2999)
- Specialty projects (9000+)

### AI Estimator Behavior

When high-risk item detected:

1. **Ask clarifying questions** about:
   - Age of systems (plumbing/electrical)
   - Visible corrosion or damage
   - Access issues
   - Previous repairs/problems
2. **Add disclaimer note** to estimate body:
   > "Final pricing is subject to on-site confirmation due to potential hidden conditions"
3. **Avoid guaranteeing fixed price** - present as best-effort estimate

### UI Warnings

In estimates page, high-risk items trigger:

```
⚠ High-risk work detected: This estimate includes items that may
require on-site inspection. Final pricing is subject to confirmation
based on actual site conditions.
```

## Current Safety Settings

### Risk Multipliers

```json
{
  "low": 1.0,
  "medium": 1.1,
  "high": 1.2
}
```

### Flat Rate Safety Mode

```json
{
  "current": "medium",
  "multipliers": {
    "low": 1.0,
    "medium": 1.03,
    "high": 1.06
  }
}
```

**To adjust:** Edit `/data/pricebook/pricing_rules.json` and change `flat_rate_safety_mode.current` to "low" or "high" as market conditions change.

## Pricing Calculation Flow

```
1. Base Price (from service_items.json)
   ↓
2. + Materials (materialKey lookup OR explicit, +18% markup)
   ↓
3. × Quantity
   ↓
4. × Tier Multiplier (basic 0.9, standard 1.0, premium 1.15)
   ↓
5. × Risk Multiplier (1.0, 1.1, or 1.2)
   ↓
6. × Safety Mode Multiplier (currently 1.03)
   ↓
7. Round to nearest dollar
   ↓
8. Apply $150 minimum if needed
```

## Testing

All tests pass (25/25):

- ✅ Risk multiplier application
- ✅ Safety mode multipliers
- ✅ Material key lookup
- ✅ Material cost override priority
- ✅ Default riskFactor behavior
- ✅ All existing functionality preserved

## Maintenance

### Adjusting for Market Conditions

1. **Minor volatility**: Keep safety mode at "medium" (1.03x)
2. **Extreme volatility**: Change to "high" (1.06x) in pricing_rules.json
3. **Stable market**: Change to "low" (1.0x)

### Updating Material Prices

Edit `/data/pricebook/material_prices.json` to adjust centralized costs without touching individual SKUs.

### Adding New High-Risk Items

In `/data/pricebook/service_items.json`, add:

```json
{
  "riskFactor": "high",
  "highRiskRequiresConfirmation": true
}
```

## Logo Image Handling

The PDF now properly handles business logo images:

1. Attempts to load image from `businessSettings.logo_url`
2. On failure or timeout (3 seconds), falls back to company initials placeholder
3. Uses company name from business settings instead of hardcoded value

**To set logo:** Go to `/settings` and enter the full URL to your logo image (PNG format recommended).
