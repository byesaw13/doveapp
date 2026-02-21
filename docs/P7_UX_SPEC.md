# P7: Product UX Overhaul - Design System Specification

**Version:** 1.0.0  
**Status:** FROZEN  
**Date:** 2026-02-20  
**Reference:** Jobber-grade interface overhaul

## 1. Design Philosophy

### 1.1 Core Principles

- **Workflow Speed**: Every interaction optimized for field service professionals
- **Mobile-First**: Touch-friendly, thumb-reach optimized layouts
- **Consistency**: Unified visual language across all modules
- **Accessibility**: WCAG 2.1 AA compliance minimum
- **Performance**: Sub-200ms interaction response time

### 1.2 Visual Language

- **Brand**: Professional, trustworthy, modern
- **Tone**: Helpful, efficient, confident
- **Style**: Clean lines, purposeful whitespace, clear hierarchy

## 2. Token System

### 2.1 Color Semantics

```
Primary Actions:    #3b82f6 (blue-500)
Success/Complete:   #22c55e (green-500)
Warning/Attention:  #f59e0b (amber-500)
Error/Destructive:  #ef4444 (red-500)
Neutral/Base:       #64748b (slate-500)
```

### 2.2 Spacing Scale

- Base unit: 4px (0.25rem)
- Scale: 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32

### 2.3 Typography

- Font family: System stack (Inter, system-ui, sans-serif)
- Body: 16px / 1.5 line-height
- Headings: Semibold, tight tracking
- Small text: 14px / 1.5 line-height

### 2.4 Component Heights

- Buttons: sm=32px, md=40px, lg=48px
- Inputs: 40px standard
- Touch targets: Minimum 44x44px on mobile

## 3. Component Architecture

### 3.1 Primitive Components

| Component   | Variants                                        | Use Case          |
| ----------- | ----------------------------------------------- | ----------------- |
| Button      | primary, secondary, outline, ghost, destructive | All CTAs          |
| StatusBadge | success, warning, error, info, neutral          | Status indicators |
| EmptyState  | with/without action                             | Zero data states  |
| PageHeader  | with breadcrumbs, actions                       | Page titles       |
| DataCard    | standard, metric, interactive                   | Data display      |
| Spinner     | sm, md, lg                                      | Loading states    |
| Skeleton    | text, card, list                                | Content loading   |

### 3.2 Layout Components

| Component      | Purpose                               |
| -------------- | ------------------------------------- |
| PageContainer  | Max-width wrapper, responsive padding |
| ContentSection | Logical content grouping              |
| ActionPanel    | Sticky action bars                    |
| SidebarNav     | Primary navigation                    |
| Header         | Top bar with user menu                |

## 4. App Shell Specification

### 4.1 Desktop Layout (lg: 1024px+)

```
+--------+--------------------------------+
|        |  Header (64px fixed)           |
| Side-  +--------------------------------+
| bar    |                                |
| (256px)|  Main Content Area             |
|        |  (scrollable)                  |
|        |                                |
+--------+--------------------------------+
```

### 4.2 Mobile Layout (< 1024px)

```
+--------------------------------+
|  Header (56px fixed)           |
|  [Menu] Title        [Actions] |
+--------------------------------+
|                                |
|  Main Content Area             |
|  (full width, scrollable)      |
|                                |
+--------------------------------+

Sidebar: Full-height drawer overlay
- Swipe from left to open
- Tap outside to close
- Push animation (not overlay) optional
```

### 4.3 Header Contents

- Left: Hamburger menu (mobile only), Breadcrumbs
- Center: Page title
- Right: Search, Notifications, User menu, Theme toggle

### 4.4 Sidebar Contents

- Logo + App name
- Navigation groups (collapsible)
- Quick metrics widget
- Theme toggle
- Sign out button

## 5. Interaction Patterns

### 5.1 Navigation

- Keyboard shortcuts: Alt+Key for main nav items
- Click outside to close dropdowns/modals
- Escape to close overlays
- Tab navigation for accessibility

### 5.2 Forms

- Inline validation with clear error messages
- Required field indicators
- Auto-focus first field
- Save on enter (when appropriate)

### 5.3 Data Tables

- Sortable columns (click header)
- Row actions in dedicated column
- Pagination for 50+ items
- Empty state with guidance

### 5.4 Loading States

- Skeleton for initial load
- Spinner for actions
- Optimistic updates where possible
- Progress indicators for long operations

## 6. Accessibility Requirements

### 6.1 Keyboard Navigation

- All interactive elements focusable
- Visible focus indicators
- Logical tab order
- Skip links for main content

### 6.2 Screen Reader Support

- Semantic HTML structure
- ARIA labels for icons
- Live regions for dynamic content
- Table headers associated with cells

### 6.3 Visual Accessibility

- Minimum 4.5:1 contrast ratio
- Focus visible indicators
- No color-only information
- Respects prefers-reduced-motion

## 7. Responsive Breakpoints

| Breakpoint | Width  | Layout             |
| ---------- | ------ | ------------------ |
| sm         | 640px  | Mobile adjustments |
| md         | 768px  | Tablet             |
| lg         | 1024px | Sidebar visible    |
| xl         | 1280px | Wider content      |
| 2xl        | 1536px | Max content width  |

## 8. Animation Specifications

### 8.1 Timing

- Fast: 150ms (hover, focus)
- Normal: 300ms (panel open, page transitions)
- Slow: 500ms (complex animations)

### 8.2 Easing

- Default: cubic-bezier(0.4, 0, 0.2, 1)
- Decelerate: cubic-bezier(0, 0, 0.2, 1)
- Accelerate: cubic-bezier(0.4, 0, 1, 1)

### 8.3 Patterns

- Fade in/out for overlays
- Slide for drawers
- Scale for modals
- Height for accordions

## 9. Module-Specific Guidelines

### 9.1 Dashboard

- KPI cards at top (4-column grid)
- Activity feed on left
- Charts on right
- Quick actions prominent

### 9.2 Jobs/Visits

- Kanban view for status workflow
- List view with filters
- Calendar integration
- Quick status updates

### 9.3 Estimates/Invoices

- Line item editor
- Running totals
- PDF preview
- Send workflow

### 9.4 Payments

- Outstanding summary
- Payment recording
- Receipt generation

## 10. Quality Gates

### 10.1 Visual QA

- [ ] Consistent spacing throughout
- [ ] Proper alignment in all components
- [ ] Correct color usage per semantics
- [ ] Typography hierarchy clear

### 10.2 Interaction QA

- [ ] All keyboard shortcuts work
- [ ] Touch targets meet minimums
- [ ] Loading states present
- [ ] Error states handled

### 10.3 Accessibility QA

- [ ] axe-core scan passes
- [ ] Keyboard navigation complete
- [ ] Screen reader tested
- [ ] Color contrast verified

---

**Frozen:** This specification is locked for P7 implementation.
**Changes:** Require approval and version bump.
