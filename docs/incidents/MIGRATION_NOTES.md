# MIGRATION_NOTES.md

## Folder Structure Changes

### Moved Files

#### Scripts and Utilities

- `check-db.js` → `scripts/check-db.js`
- `check-issues.js` → `scripts/check-issues.js`
- `check-schema.js` → `scripts/check-schema.js`
- `test-invoice-reminders.js` → `scripts/test-invoice-reminders.js`
- `test-login-browser.html` → `scripts/test-login-browser.html`
- `test_customer_communications.sql` → `scripts/test_customer_communications.sql`
- `test_migration_syntax.sql` → `scripts/test_migration_syntax.sql`
- `create_job_templates_complete.sql` → `scripts/create_job_templates_complete.sql`
- `fix_job_templates.sql` → `scripts/fix_job_templates.sql`

#### Documentation

- `CLEANUP_RECOMMENDATIONS.md` → `docs/CLEANUP_RECOMMENDATIONS.md`
- `DEPLOYMENT_GUIDE.md` → `docs/DEPLOYMENT_GUIDE.md`
- `E2E_AUDIT_SUCCESS.md` → `docs/E2E_AUDIT_SUCCESS.md`
- `E2E_FINDINGS_REPORT.md` → `docs/E2E_FINDINGS_REPORT.md`
- `FIX_ESTIMATES_ERROR.md` → `docs/FIX_ESTIMATES_ERROR.md`
- `GOOGLE_OAUTH_SETUP.md` → `docs/GOOGLE_OAUTH_SETUP.md`
- `IMPROVEMENTS_COMPLETE.md` → `docs/IMPROVEMENTS_COMPLETE.md`
- `ISSUE_RESOLVED.md` → `docs/ISSUE_RESOLVED.md`
- `JOBBER_REDESIGN.md` → `docs/JOBBER_REDESIGN.md`
- `LOGIN_DEBUG_GUIDE.md` → `docs/LOGIN_DEBUG_GUIDE.md`
- `MIGRATION_INSTRUCTIONS.md` → `docs/MIGRATION_INSTRUCTIONS.md`
- `PLANNED_FEATURES.md` → `docs/PLANNED_FEATURES.md`
- `PRICEBOOK_INTEGRATION_FIXES.md` → `docs/PRICEBOOK_INTEGRATION_FIXES.md`
- `QUICK_WINS.md` → `docs/QUICK_WINS.md`
- `RESEND_SETUP.md` → `docs/RESEND_SETUP.md`
- `SCHEMA_ISSUES_AND_FIXES.md` → `docs/SCHEMA_ISSUES_AND_FIXES.md`
- `SECURITY.md` → `docs/SECURITY.md`
- `SECURITY_AUDIT_RESULTS.md` → `docs/SECURITY_AUDIT_RESULTS.md`
- `SECURITY_IMPLEMENTATION.md` → `docs/SECURITY_IMPLEMENTATION.md`
- `TENANT_LOGIN_FIX.md` → `docs/TENANT_LOGIN_FIX.md`

#### Data and Fixtures

- `data/` → `scripts/data/`

### Import Updates Required

#### Files Importing Data

If you have any local imports or references to the moved data files, update them:

- `@/data/pricebook/*` → `@/scripts/data/pricebook/*`
- `../data/pricebook/*` → `../scripts/data/pricebook/*`

#### Affected Files (Already Updated)

- `app/admin/estimates/[id]/client-view/page.tsx`
- `app/admin/estimates/[id]/summary/page.tsx`
- `lib/pdf-estimate.ts`
- `lib/pricingEngine.ts`

### Removed Files

- `lib/db/time-tracking.ts.disabled` (obvious dead code)

### New Structure Overview

```
doveapp/
├── app/                    # Next.js app
├── components/             # UI components
├── lib/                    # Business logic & utils
├── types/                  # TypeScript types
├── supabase/               # DB migrations & config
├── scripts/                # Build/dev scripts + data fixtures
│   ├── data/              # Moved from root data/
│   └── ...                # Moved script files
├── docs/                   # Documentation (moved from root)
├── tests/                  # Tests (existing)
├── public/                 # Static assets
├── .github/                # CI
├── package.json
└── ...
```

### Why These Changes?

- **Better Organization**: Separates app code, scripts, data, and docs for easier navigation
- **Cleaner Root**: Reduces clutter in the root directory
- **Standard Conventions**: Follows common project structures
- **Maintainability**: Easier to find and manage different types of files

### No Breaking Changes

- All imports have been updated to maintain functionality
- Runtime behavior unchanged
- Only organizational improvements
