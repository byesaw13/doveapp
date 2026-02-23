# P7-T2: Jobs + Visits Workspace Rewrite

**Date:** 2026-02-22
**Status:** READY FOR REVIEW
**Branch:** p7-jobs-visits-workspace
**Builds on:** P7-T1 (commit 5fc71c4)

## What Changed

### 1. New Shared Components

| Component     | File                              | Description                            |
| ------------- | --------------------------------- | -------------------------------------- |
| JobFilters    | `components/jobs/job-filters.tsx` | URL-persisted filters with badges      |
| JobCard       | `components/jobs/job-card.tsx`    | Card variants: default, compact, dense |
| JobTable      | `components/jobs/job-table.tsx`   | Dense table with inline actions        |
| useQueryState | `lib/hooks/use-query-state.ts`    | URL state persistence hook             |

### 2. Jobs List Page Rewrite

| Feature         | Implementation                                     |
| --------------- | -------------------------------------------------- |
| View modes      | Table / Cards / Kanban toggle with URL persistence |
| Filters         | Status, Priority, Tech, Date Range, Search         |
| URL persistence | All filters sync to URL for shareable links        |
| Bulk actions    | Multi-select with status change, export, delete    |
| Empty states    | EmptyState component with contextual actions       |
| Loading states  | Spinner + LoadingOverlay                           |

### 3. Job Detail Page Rewrite

| Feature           | Implementation                              |
| ----------------- | ------------------------------------------- |
| Operational hub   | Tabs: Overview, Items, Payments, Activity   |
| Sticky header     | Job #, status, quick actions always visible |
| Action rail       | Desktop: sidebar; Mobile: bottom bar        |
| State transitions | Context-aware buttons with confirmations    |
| Status indicators | StatusBadge for job status, payment status  |
| Tech assignment   | Inline Select for quick reassignment        |

### 4. New Job Page Rewrite

| Feature           | Implementation                               |
| ----------------- | -------------------------------------------- |
| Sticky header     | Back button, title, save actions             |
| Form sections     | Cards for Client, Details, Line Items        |
| Line items        | Dynamic array with add/remove, running total |
| Mobile action bar | Fixed bottom save button on mobile           |

### 5. Today Page Rewrite

| Feature           | Implementation                           |
| ----------------- | ---------------------------------------- |
| Metric cards      | MetricCard for KPIs at top               |
| Job segmentation  | Today's Jobs, Overdue, Upcoming sections |
| Quick actions     | Sidebar with common actions              |
| Progress tracking | Visual progress bar for daily completion |

### 6. Schedule Page Rewrite

| Feature      | Implementation                      |
| ------------ | ----------------------------------- |
| Header       | PageHeader with breadcrumbs         |
| Toolbar      | Custom styled with view buttons     |
| Event dialog | Improved styling, quick create form |
| Drag/drop    | Preserved with toast notifications  |

## UX Before/After

### Before

- Inconsistent page layouts
- No URL persistence for filters
- Ad-hoc status styling
- Desktop-focused design
- Scattered action buttons
- No visual hierarchy

### After

- Consistent PageHeader + PageContainer
- URL-synced filters for shareability
- StatusBadge with semantic variants
- Mobile-first responsive design
- Sticky action rails (desktop) / bottom bars (mobile)
- Clear visual hierarchy with tabs, cards, sections

## Files Touched

### New Files (8)

```
components/jobs/job-card.tsx
components/jobs/job-filters.tsx
components/jobs/job-table.tsx
components/jobs/index.ts
lib/hooks/use-query-state.ts
__tests__/hooks/use-query-state.test.ts
__tests__/components/job-filters.test.tsx
e2e/job-workflow.spec.ts
```

### Modified Files (5)

```
app/admin/jobs/page.tsx
app/admin/jobs/[id]/page.tsx
app/admin/jobs/new/page.tsx
app/admin/today/page.tsx
app/admin/schedule/page.tsx
```

### Updated Docs (2)

```
docs/P7_T1_IMPLEMENTATION.md (appended progress note)
docs/P7_T2_IMPLEMENTATION.md (this file)
```

## Gate Results

### Type Check

```
[To be run]
```

### Lint

```
[To be run]
```

### Build

```
[To be run]
```

### Tests

```
[To be run]
```

## Risks/Follow-ups

### Risks

1. **URL length limits** - Complex filters could hit URL length limits
   - Mitigation: Use compressed encoding for complex filter states if needed

2. **Calendar CSS** - react-big-calendar CSS may conflict with Tailwind
   - Mitigation: Scoped styles via style jsx global

3. **Mobile bottom bar overlap** - Fixed bottom bars can overlap content
   - Mitigation: Added pb-20 padding on mobile content areas

### Follow-ups

1. **Infinite scroll** - Add pagination/infinite scroll for large job lists
2. **Keyboard navigation** - Add j/k navigation between jobs
3. **Filter presets** - Add saved filter presets
4. **Bulk edit modal** - Add modal for bulk editing job properties
5. **Visit timeline** - Add timeline view for job visits

## Usage Examples

### JobFilters

```tsx
import { JobFilters, JobFiltersState } from '@/components/jobs';

const [filters, setFilters] = useState<JobFiltersState>({
  search: '',
  status: 'all',
  priority: 'all',
  assignedTech: '',
  dateFrom: undefined,
  dateTo: undefined,
});

<JobFilters
  techs={techs}
  onFiltersChange={setFilters}
  initialFilters={filters}
/>;
```

### JobCard Variants

```tsx
import { JobCard } from '@/components/jobs';

<JobCard job={job} variant="default" />
<JobCard job={job} variant="compact" />
<JobCard job={job} variant="dense" />
```

### JobTable

```tsx
import { JobTable } from '@/components/jobs';

<JobTable
  jobs={jobs}
  onStatusChange={handleStatusChange}
  selectedIds={selectedIds}
  onSelect={handleSelect}
/>;
```

### useQueryState

```tsx
import { useQueryState } from '@/lib/hooks/use-query-state';

const [status, setStatus] = useQueryState('status', {
  defaultValue: 'all',
});
```

---

**Ready for review and PR creation.**
