# Flat Rate Safety System - Quick Reference

## Current Protection Settings

### Safety Mode: MEDIUM (1.03x multiplier)

**Location:** `/data/pricebook/pricing_rules.json` → `flat_rate_safety_mode.current`

**When to change:**

- **LOW** (1.0x): Stable markets, no material volatility
- **MEDIUM** (1.03x): ✅ Current - Normal volatility protection
- **HIGH** (1.06x): Extreme market conditions, high uncertainty

---

## Risk Levels by Category

| Category                       | Default Risk | Multiplier | Reason                       |
| ------------------------------ | ------------ | ---------- | ---------------------------- |
| Plumbing (2000-2999)           | HIGH         | 1.20x      | Hidden conditions, corrosion |
| Electrical (3000-3999)         | MEDIUM       | 1.10x      | Code requirements, panel age |
| General Repairs (1000-1999)    | MEDIUM       | 1.10x      | Standard work                |
| Painting/Finishes (5000-5999)  | LOW          | 1.00x      | Predictable scope            |
| Furniture Assembly (4000-4999) | LOW          | 1.00x      | Fixed scope                  |
| Specialty (9000+)              | HIGH         | 1.20x      | Unknown conditions           |

---

## Material Price Management

**File:** `/data/pricebook/material_prices.json`

**Current Prices:**

```
toilet_basic: $185
toilet_midgrade: $265
faucet_standard: $120
light_fixture_standard: $85
```

**To update:** Edit this file when supplier prices change. All SKUs using these keys automatically update.

---

## High-Risk Items Requiring Confirmation

These items ALWAYS trigger extra due diligence:

- All plumbing installations (toilets, faucets, shower valves)
- Specialty project placeholder (9001)
- Any item with `highRiskRequiresConfirmation: true`

**AI will automatically:**

1. Ask about site conditions
2. Request photos of work area
3. Add disclaimer about on-site confirmation
4. Avoid guaranteeing fixed price

---

## Quick Pricing Example

**Service:** Toilet Replacement (Code 2005)

- Base price: $350
- Material (toilet_midgrade): $265
- Material with markup (18%): $313
- Subtotal: $663
- Tier (standard): ×1.0 = $663
- Risk (high): ×1.2 = $796
- Safety (medium): ×1.03 = $820
- **Final Price: $820**

---

## Adjusting Protection Levels

### Increase Protection (Market Volatility Rising)

1. Open `/data/pricebook/pricing_rules.json`
2. Change `"current": "medium"` to `"current": "high"`
3. Save file
4. All new estimates use 1.06x multiplier

### Decrease Protection (Market Stabilizes)

1. Open `/data/pricebook/pricing_rules.json`
2. Change `"current": "high"` to `"current": "medium"` or `"low"`
3. Save file

**No code changes needed!** The pricing engine reads the file automatically.

---

## Legal Protection - Disclaimers

**File:** `/data/pricebook/estimate_disclaimers.json`

**Appears on:**

- All estimate PDFs
- Estimate detail view in UI
- Automatically included

**Edit if needed:** Modify the `lines` array to update disclaimer text.

---

## Testing Changes

After modifying pricing rules or material prices:

```bash
npm run test -- __tests__/lib/pricingEngine.test.ts
```

All 25 tests should pass.

---

## Emergency Override

If you need to quickly disable risk/safety multipliers:

**In `/data/pricebook/pricing_rules.json`:**

```json
{
  "risk_multipliers": {
    "low": 1.0,
    "medium": 1.0, // ← Set all to 1.0
    "high": 1.0
  },
  "flat_rate_safety_mode": {
    "current": "low", // ← Set to "low"
    "multipliers": {
      "low": 1.0,
      "medium": 1.0,
      "high": 1.0
    }
  }
}
```

**⚠️ Only use in emergencies!** This removes all protection.
