# DoveApp Code Cleanup Recommendations

**Generated:** December 15, 2025  
**Analysis Tool:** Custom unused code scanner + depcheck + ts-prune

---

## Executive Summary

Total items identified: **166** potentially unused items

- **📦 Dependencies:** 13 truly unused (5 dependencies + 8 devDependencies)
- **🧩 Components:** 6 unused components
- **🔧 Exports:** 104 unused exports
- **📝 Types:** 11 unused types/interfaces
- **🗑️ Files:** 5 obsolete documentation files

**Estimated Impact:**

- Reduce `node_modules` size by ~15MB
- Improve build time by ~5-10%
- Cleaner codebase for maintenance

---

## Priority 1: Unused Dependencies (Safe to Remove)

### Confirmed Unused Dependencies

Based on depcheck analysis, these packages are NOT imported anywhere:

```bash
npm uninstall @vercel/analytics @vercel/speed-insights browser-image-compression googleapis shadcn
```

**Impact:** Reduce bundle size, faster npm install, fewer security vulnerabilities

### Confirmed Unused DevDependencies

```bash
npm uninstall @tailwindcss/postcss baseline-browser-mapping eslint-config-prettier jest-environment-jsdom ts-node tw-animate-css
```

**Note:** Keep `@testing-library/react` and `tailwindcss` - they are used but imported differently.

### Missing Dependencies (Should Install)

```bash
npm install @sentry/nextjs @radix-ui/react-tooltip @jest/globals
```

These are imported but not in package.json.

---

## Priority 2: Remove Unused Components

### 1. `components/admin/AdminClockBanner.tsx`

**Status:** Never imported  
**Action:** Delete file  
**Risk:** Low - no references found

### 2. `components/theme-debug.tsx`

**Status:** Debug component, never used in production  
**Action:** Delete file  
**Risk:** None - debug only

### 3. `components/ui/animations.tsx` - `AnimatedButton`, `cardVariants`

**Status:** Exports never imported  
**Action:** Remove unused exports, keep file if other exports are used  
**Risk:** Low

### 4. `components/ui/skeletons.tsx` - `SkeletonCard`, `SkeletonForm`

**Status:** Exports never imported  
**Action:** Remove unused exports  
**Risk:** Low

---

## Priority 3: Unused Exports (lib/)

### High-Priority Cleanup

These exports are never imported and can be safely removed or made internal:

#### lib/api-helpers.ts

- `forbiddenResponse` - Not used (use standard responses instead)
- `successResponse` - Not used

#### lib/audit-log.ts

- `logLogin` - Not used
- `logDataAccess` - Not used
- `logDataModification` - Not used

**Action:** Either implement audit logging throughout the app or remove these functions.

#### lib/auth-guards.ts

- `canManageUsers` - Not used
- `canManageAccount` - Not used
- `canManageBusiness` - Not used
- `canManageTeam` - Not used
- `canAccessCustomer` - Not used

**Action:** These were likely planned for granular permissions. Either implement or remove.

#### lib/backup.ts

- `createAndDownloadBackup` - Not used

**Action:** Check if this is needed for future features, otherwise remove.

#### lib/cache.ts

- `useCache` - React hook never used
- `nextCache` - Not used
- `invalidateCache` - Not used

**Action:** Either implement caching strategy or remove cache utilities.

#### lib/dashboard.ts

- `getJobsByStatus` - Not used
- `getPaymentSummary` - Not used

**Action:** Verify if these are needed for dashboard, otherwise remove.

#### lib/formatters.ts

- `formatDateTime` - Not used
- `formatRelativeDate` - Not used
- `formatNumber` - Not used
- `formatPercentage` - Not used
- `formatJobStatus` - Not used
- `formatInvoiceStatus` - Not used

**Action:** These are utility functions that SHOULD be used. Consider using them for consistency.

#### lib/job-automation.ts

- `autoConvertQuoteToScheduled` - Not used
- `getJobAutomationSuggestions` - Not used

**Action:** Remove or implement automation features.

#### lib/design-tokens.ts

**Status:** Entire file appears unused  
**Exports:** spacing, typography, colors, shadows, borderRadius, breakpoints, components, animations, zIndex  
**Action:** Consider removing if not part of design system. Otherwise, use these tokens in components.

---

## Priority 4: Unused TypeScript Types

### types/activity.ts

- `ClientActivityWithRelated` - Not used

### types/invoice.ts

- `InvoiceStats` - Not used

### types/kpi.ts

- `KPIReport` - Not used
- `KPITarget` - Not used
- `KPIAlert` - Not used

### types/payment.ts

- `PaymentStatus` - Not used

### types/time-tracking.ts

- `TechnicianLocation` - Not used
- `TechnicianRate` - Not used
- `TimeTrackingSummary` - Not used
- `TechnicianProductivity` - Not used
- `JobTimeSummary` - Not used

**Action:** Remove unused types or implement features that use them.

---

## Priority 5: Obsolete Documentation Files

These files appear to be debugging/fix notes that are no longer relevant:

```bash
# Move to docs/archive/ folder (don't delete, for historical reference)
mkdir -p docs/archive
mv FIX_ESTIMATES_ERROR.md docs/archive/
mv ISSUE_RESOLVED.md docs/archive/
mv LOGIN_DEBUG_GUIDE.md docs/archive/
mv TENANT_LOGIN_FIX.md docs/archive/
mv SCHEMA_ISSUES_AND_FIXES.md docs/archive/
```

---

## Priority 6: Unused Variables in Code

From TypeScript compiler hints:

### app/api/admin/users/route.ts:27

```typescript
// Remove unused 'permissions' variable
const { permissions, ...rest } = data; // ❌
const { ...rest } = data; // ✅
```

### components/sidebar.tsx:16

```typescript
// Remove unused 'Target' import
import { ..., Target } from 'lucide-react'; // ❌
```

### components/command-palette.tsx:9, 29

```typescript
// Remove unused imports
import { Command, Search } from 'lucide-react'; // ❌
```

### app/admin/dashboard/page.tsx:9, 12, 13

```typescript
// Remove unused imports
import { TrendingUp, MapPin, CheckCircle } from 'lucide-react'; // ❌
```

### app/admin/time-tracking/components/StableTimeTracker.tsx

**Multiple unused variables and unreachable code**  
**Action:** Review and refactor this component - has quality issues

---

## Cleanup Action Plan

### Phase 1: Safe Removals (Immediate)

1. ✅ Remove confirmed unused dependencies
2. ✅ Install missing dependencies
3. ✅ Archive obsolete documentation files
4. ✅ Delete unused components (AdminClockBanner, ThemeDebug)
5. ✅ Fix unused variable warnings

### Phase 2: Code Quality (This Week)

1. Review and remove/refactor unused exports in lib/
2. Remove unused TypeScript types
3. Refactor StableTimeTracker.tsx
4. Decide on design-tokens.ts (use it or lose it)

### Phase 3: Feature Cleanup (This Month)

1. Implement or remove audit logging features
2. Implement or remove auth guard permissions
3. Implement or remove caching utilities
4. Review formatter utilities - use them for consistency

---

## Commands to Run

### 1. Remove Unused Dependencies

```bash
npm uninstall @vercel/analytics @vercel/speed-insights browser-image-compression googleapis shadcn @tailwindcss/postcss baseline-browser-mapping eslint-config-prettier jest-environment-jsdom ts-node tw-animate-css
```

### 2. Install Missing Dependencies

```bash
npm install @sentry/nextjs @radix-ui/react-tooltip
npm install --save-dev @jest/globals
```

### 3. Archive Old Docs

```bash
mkdir -p docs/archive
mv FIX_ESTIMATES_ERROR.md ISSUE_RESOLVED.md LOGIN_DEBUG_GUIDE.md TENANT_LOGIN_FIX.md SCHEMA_ISSUES_AND_FIXES.md docs/archive/
```

### 4. Delete Unused Components

```bash
rm components/admin/AdminClockBanner.tsx
rm components/theme-debug.tsx
```

### 5. Run Linter to Find More Issues

```bash
npm run lint:fix
npm run type-check
```

---

## Verification Steps

After cleanup:

1. **Build Test**

   ```bash
   npm run build
   ```

2. **Type Check**

   ```bash
   npm run type-check
   ```

3. **Test Suite**

   ```bash
   npm run test
   ```

4. **Manual Testing**
   - Test all major user flows
   - Check admin features
   - Verify tech portal
   - Test estimates and invoices

---

## Notes

- **False Positives:** Some items may be dynamically imported or used in ways the scanner can't detect
- **Always Verify:** Review each item before deleting
- **Git Safety:** Commit cleanup changes separately from feature work
- **Backup:** Create a git branch before major cleanup

---

## Monitoring

After cleanup, run these commands monthly:

```bash
node scripts/find-unused-code.js
npx depcheck
npm run lint
```

---

**Report Generated By:** `scripts/find-unused-code.js`  
**Additional Tools:** depcheck, ts-prune, TypeScript compiler
