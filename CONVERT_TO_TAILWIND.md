# Converting from shadcn to Pure Tailwind

This guide shows you how to convert shadcn/ui components to pure Tailwind CSS.

## Example: Clients Page Conversion

### Before (shadcn)

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ClientsPage() {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <Input placeholder="Search..." />
          <Button>Add Client</Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### After (Pure Tailwind)

```tsx
// No component imports needed for layout!

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
        <button
          onClick={handleAddClient}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          Add Client
        </button>
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <input
            type="text"
            placeholder="Search..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          />
        </div>
        <div className="p-6">{/* Content */}</div>
      </div>
    </div>
  );
}
```

## Component Conversion Table

| shadcn Component             | Replace With | Tailwind Classes                                                                                          |
| ---------------------------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| `<Button>`                   | `<button>`   | `px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors`       |
| `<Button variant="outline">` | `<button>`   | `px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg`               |
| `<Card>`                     | `<div>`      | `bg-white rounded-lg border border-slate-200 shadow-sm`                                                   |
| `<CardHeader>`               | `<div>`      | `px-6 py-4 border-b border-slate-200`                                                                     |
| `<CardContent>`              | `<div>`      | `p-6`                                                                                                     |
| `<Badge>`                    | `<span>`     | `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800` |
| `<Input>`                    | `<input>`    | `px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`     |
| `<Alert>`                    | `<div>`      | `p-4 bg-emerald-50 border border-emerald-200 rounded-lg`                                                  |

## Step-by-Step Conversion Process

### 1. Remove Import Statements

```tsx
// Before
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// After
// Remove these imports!
```

### 2. Replace Button Components

```tsx
// Before
<Button onClick={handleClick} variant="outline" size="sm">
  Click Me
</Button>

// After
<button
  onClick={handleClick}
  className="px-3 py-1.5 text-sm border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
>
  Click Me
</button>
```

### 3. Replace Card Components

```tsx
// Before
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>

// After
<div className="bg-white rounded-lg border border-slate-200 shadow-sm">
  <div className="px-6 py-4 border-b border-slate-200">
    <h2 className="text-lg font-semibold text-slate-900">Title</h2>
  </div>
  <div className="p-6">
    Content here
  </div>
</div>
```

### 4. Replace Input Components

```tsx
// Before
<Input
  placeholder="Search..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>

// After
<input
  type="text"
  placeholder="Search..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
/>
```

### 5. Replace Badge Components

```tsx
// Before
<Badge variant="success">Active</Badge>

// After
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  Active
</span>
```

## Keep shadcn For These Components

Don't convert these - they have complex logic and accessibility features:

- **Dialog/Modal** - Focus trapping, escape handling, backdrop
- **Select/Dropdown** - Keyboard navigation, positioning
- **Tooltip** - Positioning logic, show/hide timing
- **Popover** - Positioning, click outside detection
- **Command** - Keyboard shortcuts, filtering
- **Sheet** - Slide-in animations, focus management

```tsx
// KEEP THESE:
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectTrigger } from '@/components/ui/select';
import { Tooltip, TooltipContent } from '@/components/ui/tooltip';
```

## Common Button Patterns

### Primary Action

```tsx
<button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
  Save Changes
</button>
```

### Secondary Action

```tsx
<button className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2">
  Cancel
</button>
```

### Danger Action

```tsx
<button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
  Delete
</button>
```

### Ghost Button

```tsx
<button className="px-4 py-2 text-slate-700 hover:bg-slate-100 font-medium rounded-lg transition-colors">
  View Details
</button>
```

### Icon Button

```tsx
<button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
</button>
```

### Button with Loading State

```tsx
<button
  disabled={loading}
  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
>
  {loading && (
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
  )}
  {loading ? 'Saving...' : 'Save'}
</button>
```

## Common Card Patterns

### Basic Info Card

```tsx
<div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-slate-900 mb-2">Card Title</h3>
  <p className="text-sm text-slate-600">Card description or content</p>
</div>
```

### Stat Card with Icon

```tsx
<div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-slate-600">Total Revenue</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">$45,231</p>
    </div>
    <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
      <svg
        className="h-6 w-6 text-emerald-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
  </div>
</div>
```

### Clickable Card

```tsx
<button className="w-full text-left bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all">
  <h3 className="text-lg font-semibold text-slate-900">View Details</h3>
  <p className="text-sm text-slate-600 mt-2">Click to see more information</p>
</button>
```

## Benefits of Pure Tailwind

✅ **Full Control** - No fighting with component CSS  
✅ **Better Performance** - Less JavaScript overhead  
✅ **Easier Debugging** - See exactly what styles apply  
✅ **No Version Conflicts** - Just Tailwind CSS  
✅ **Simpler Codebase** - Fewer dependencies  
✅ **Consistent Spacing** - Direct control over layout

## When to Convert

**Convert these pages first (simplest):**

1. ✅ Clients page - DONE
2. Dashboard/Home page
3. Jobs page
4. Properties page
5. KPI page

**Convert these later (more complex):** 6. Calendar page (has react-big-calendar) 7. Time Tracking page 8. Emails page (complex sidebar + many buttons)

## Quick Reference

See `TAILWIND_PATTERNS.md` for a complete pattern library with:

- All button variants
- All card types
- Form inputs
- Badges
- Alerts
- Tables
- Loading states

## Need Help?

If you're converting a page and get stuck:

1. Check `TAILWIND_PATTERNS.md` for the pattern
2. Look at the converted Clients page as a reference
3. Keep Dialog/Select/Tooltip from shadcn for complex interactions
