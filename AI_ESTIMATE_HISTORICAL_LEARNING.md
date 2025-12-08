# AI Estimate Historical Learning System

## Overview

The AI Estimate Generator now **learns from your past estimates and completed jobs** to provide more accurate, personalized pricing recommendations.

---

## How It Works

### 1. **Data Collection**

When you click "Generate Estimate", the system:

- Fetches your last 12 months of estimates from the database
- Fetches your completed jobs with line items
- Analyzes 100+ records to learn your pricing patterns

### 2. **Pattern Analysis**

The AI calculates:

- **Average Labor Rate** - What you actually charge per hour (from completed jobs)
- **Material Markup** - Your typical markup on materials
- **Profit Margins** - Your actual profit percentages
- **Overhead** - Your typical overhead costs

### 3. **Similar Job Matching**

The system finds jobs similar to your current request by:

- Tokenizing descriptions (removing common words)
- Calculating similarity scores (0-1)
- Matching service types
- Ranking by relevance

### 4. **AI Context Enhancement**

When generating the estimate, OpenAI receives:

```
HISTORICAL PRICING DATA FROM THIS BUSINESS:
- Data Confidence: 85% (based on 45 estimates and 32 completed jobs)
- Actual Average Labor Rate: $68/hour
- Actual Average Material Markup: 18%
- Similar jobs: [details of 3-5 most similar past jobs]

IMPORTANT: Use the historical pricing data as your PRIMARY guide.
```

---

## What You'll See

### **Learning Indicator**

When the AI uses your historical data, you'll see:

```
🌟 AI learned from your past work!
Based on 77 past jobs (3 similar)
```

This appears when:

- Confidence is >30% (at least 15 records)
- Similar jobs are found

### **Confidence Levels**

- **0-30%**: Not enough data yet (falls back to defaults)
- **30-60%**: Moderate confidence (based on 15-30 records)
- **60-100%**: High confidence (50+ records)

---

## Benefits

### **More Accurate Estimates**

- No more huge estimates! AI uses YOUR actual rates
- Learns your typical profit margins
- Adjusts based on your real business data

### **Smarter Over Time**

- Every estimate you save improves the system
- Every completed job trains the AI
- The more you use it, the smarter it gets

### **Context-Aware Pricing**

If you're estimating:

> "Install 8-foot handrail with 2x4 lumber"

And you've done similar work before:

> "Install 12-foot deck railing with 2x4 posts - $450"

The AI will use that as a reference point instead of generic rates.

---

## Technical Details

### **Files Created**

- `lib/ai/historical-pricing-analysis.ts` - Core analysis engine
- `lib/ai/estimate-generation.ts` - Enhanced with historical context
- `types/estimate.ts` - Added `historical_data_used` field
- `components/ai-estimate-generator.tsx` - Shows learning indicator

### **Database Tables Used**

- `estimates` - Past quotes/proposals
- `jobs` - Completed work
- `job_line_items` - Labor and material details

### **Algorithm**

#### Similarity Scoring:

```typescript
similarity = (common_words / total_unique_words) + service_type_bonus

// Example:
"Install handrail with 2x4" vs "Install deck railing with 2x4"
common_words: ["install", "2x4"]
similarity: 0.4 + 0.2 (service match) = 0.6 (60% similar)
```

#### Labor Rate Calculation:

```typescript
avgLaborRate = total_labor_cost / total_labor_hours;

// From all jobs where labor hours > 0
```

---

## Example Prompt Sent to OpenAI

**Before (Generic):**

```
BUSINESS CONTEXT:
- Labor Rate: $75/hour
- Material Markup: 20%
- Profit Margin: 25%
- Overhead: 15%
```

**After (With Your Data):**

```
HISTORICAL PRICING DATA FROM THIS BUSINESS:
- Data Confidence: 78% (based on 45 estimates, 28 jobs)
- Actual Average Labor Rate: $62/hour
- Actual Material Markup: 12%
- Actual Profit Margin: 18%
- Actual Overhead: 9%

SIMILAR JOBS:
1. "Install 10ft handrail, 2x4 lumber" (85% similar)
   Labor: 6 hours @ $60/hour = $360
   Materials: $85
   Total: $445

2. "Replace deck railing posts" (72% similar)
   Labor: 4 hours @ $65/hour = $260
   Materials: $120
   Total: $380

IMPORTANT: Use the historical data as your PRIMARY guide.
```

---

## Privacy & Data

- **All data stays in your database** - No external uploads
- **Server-side processing** - Historical analysis happens in API routes
- **12-month window** - Only recent data is analyzed for relevance
- **100 record limit** - Prevents performance issues

---

## Troubleshooting

### "Not enough historical data"

- Add more estimates to your system
- Complete jobs and mark them as "completed" or "invoiced"
- System needs 15+ records for 30% confidence

### "AI isn't learning from my data"

- Check if estimates have `line_items` populated
- Verify jobs have `job_line_items` with labor/materials
- Ensure descriptions are detailed (not just "Job #123")

### "Estimates still seem high"

- Manually adjust settings (click gear icon)
- Check if your historical data includes high-value jobs skewing averages
- Add more "typical" small jobs to balance the data

---

## Future Enhancements

- [ ] Learn seasonal pricing patterns
- [ ] Detect regional cost variations
- [ ] Factor in acceptance rates (lower price if needed)
- [ ] Track estimate accuracy vs actual job costs
- [ ] Auto-suggest price adjustments based on win rate

---

## Testing

To test with your actual data:

1. Restart dev server: `npm run dev`
2. Open AI Estimate Generator
3. Enter a description similar to past work
4. Click "Generate Estimate"
5. Look for "AI learned from your past work!" message

---

## Summary

**Before:** AI used generic defaults ($75/hr, 25% profit, 20% markup)
**After:** AI learns from YOUR actual rates and past jobs

The more you use the system, the more accurate it becomes!
