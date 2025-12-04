# Pure Tailwind Component Patterns

Replace shadcn/ui components with these pure Tailwind patterns for better layout control.

## Buttons

### Primary Button (emerald)

```tsx
<button
  onClick={handleClick}
  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
>
  Button Text
</button>
```

### Secondary Button (outlined)

```tsx
<button
  onClick={handleClick}
  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
>
  Button Text
</button>
```

### Button with Icon

```tsx
<button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 inline-flex items-center">
  <svg
    className="h-4 w-4 mr-2"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
    />
  </svg>
  Add Item
</button>
```

### Danger Button

```tsx
<button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
  Delete
</button>
```

### Small Button

```tsx
<button className="px-3 py-1.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
  Small
</button>
```

### Large Button

```tsx
<button className="px-6 py-3 text-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
  Large
</button>
```

### Disabled Button

```tsx
<button
  disabled
  className="px-4 py-2 bg-slate-300 text-slate-500 font-medium rounded-lg cursor-not-allowed"
>
  Disabled
</button>
```

## Cards

### Basic Card

```tsx
<div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-2">Card Title</h3>
  <p className="text-sm text-slate-600">Card content goes here</p>
</div>
```

### Card with Header and Content Sections

```tsx
<div className="bg-white rounded-lg border border-slate-200 shadow-sm">
  {/* Header */}
  <div className="px-6 py-4 border-b border-slate-200">
    <h2 className="text-lg font-semibold text-slate-900">Card Title</h2>
    <p className="text-sm text-slate-600 mt-1">Subtitle or description</p>
  </div>

  {/* Content */}
  <div className="p-6">
    <p>Content goes here</p>
  </div>
</div>
```

### Stat Card

```tsx
<div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-slate-600">Metric Name</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">1,234</p>
    </div>
    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
      <svg
        className="h-6 w-6 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </svg>
    </div>
  </div>
</div>
```

### Hoverable Card (for links)

```tsx
<div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
  <h3 className="text-lg font-semibold text-slate-900">Clickable Card</h3>
  <p className="text-sm text-slate-600 mt-2">Hover for effect</p>
</div>
```

## Form Inputs

### Text Input

```tsx
<input
  type="text"
  placeholder="Enter text..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
/>
```

### Input with Label

```tsx
<div className="space-y-2">
  <label className="text-sm font-medium text-slate-700">Email Address</label>
  <input
    type="email"
    placeholder="you@example.com"
    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
  />
</div>
```

### Textarea

```tsx
<textarea
  rows={4}
  placeholder="Enter description..."
  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm resize-none"
/>
```

### Select Dropdown

```tsx
<select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm">
  <option value="">Select option...</option>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</select>
```

### Checkbox

```tsx
<label className="flex items-center space-x-2 cursor-pointer">
  <input
    type="checkbox"
    className="w-4 h-4 text-emerald-500 border-slate-300 rounded focus:ring-emerald-500"
  />
  <span className="text-sm text-slate-700">Accept terms</span>
</label>
```

### Radio Button

```tsx
<label className="flex items-center space-x-2 cursor-pointer">
  <input
    type="radio"
    name="option"
    className="w-4 h-4 text-emerald-500 border-slate-300 focus:ring-emerald-500"
  />
  <span className="text-sm text-slate-700">Option 1</span>
</label>
```

## Badges

### Basic Badge

```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
  Active
</span>
```

### Status Badges

```tsx
{
  /* Success */
}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  Completed
</span>;

{
  /* Warning */
}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
  Pending
</span>;

{
  /* Danger */
}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
  Cancelled
</span>;

{
  /* Info */
}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
  Scheduled
</span>;

{
  /* Neutral */
}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
  Draft
</span>;
```

### Badge with Dot

```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
  Active
</span>
```

## Alerts

### Success Alert

```tsx
<div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
  <div className="flex items-start">
    <svg
      className="h-5 w-5 text-emerald-600 mt-0.5 mr-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <div>
      <h3 className="text-sm font-medium text-emerald-800">Success</h3>
      <p className="text-sm text-emerald-700 mt-1">
        Your changes have been saved.
      </p>
    </div>
  </div>
</div>
```

### Error Alert

```tsx
<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
  <div className="flex items-start">
    <svg
      className="h-5 w-5 text-red-600 mt-0.5 mr-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <div>
      <h3 className="text-sm font-medium text-red-800">Error</h3>
      <p className="text-sm text-red-700 mt-1">Something went wrong.</p>
    </div>
  </div>
</div>
```

### Warning Alert

```tsx
<div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
  <div className="flex items-start">
    <svg
      className="h-5 w-5 text-yellow-600 mt-0.5 mr-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
    <div>
      <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
      <p className="text-sm text-yellow-700 mt-1">
        Please review before proceeding.
      </p>
    </div>
  </div>
</div>
```

### Info Alert

```tsx
<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <div className="flex items-start">
    <svg
      className="h-5 w-5 text-blue-600 mt-0.5 mr-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <div>
      <h3 className="text-sm font-medium text-blue-800">Info</h3>
      <p className="text-sm text-blue-700 mt-1">
        Here's some helpful information.
      </p>
    </div>
  </div>
</div>
```

## Loading States

### Spinner

```tsx
<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
```

### Loading Card

```tsx
<div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
  </div>
</div>
```

## Tables

### Simple Table

```tsx
<div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-slate-200">
    <thead className="bg-slate-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
          Name
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
          Email
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
          Status
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-slate-200">
      <tr className="hover:bg-slate-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
          John Doe
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
          john@example.com
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

## Modals (Keep shadcn Dialog for accessibility)

For complex interactive components like modals, dropdowns, and tooltips, continue using shadcn/ui for accessibility features. But style them with Tailwind:

```tsx
import { Dialog, DialogContent } from '@/components/ui/dialog';

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md">
    <div className="p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Modal Title</h2>
      <p className="text-sm text-slate-600 mb-6">Modal content goes here.</p>
      <div className="flex justify-end gap-3">
        <button className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg transition-colors">
          Cancel
        </button>
        <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors">
          Confirm
        </button>
      </div>
    </div>
  </DialogContent>
</Dialog>;
```

## Best Practices

1. **Use Tailwind for layout & styling** - Cards, buttons, forms, badges
2. **Keep shadcn for complex interactions** - Dialogs, Dropdowns, Tooltips, Select components
3. **Consistent spacing** - Use p-4, p-6 for padding; gap-3, gap-4 for spacing
4. **Consistent colors** - emerald-500 for primary, slate-\* for neutrals
5. **Focus states** - Always include focus:outline-none focus:ring-2 for accessibility
6. **Transitions** - Add transition-colors, transition-shadow for smooth effects
7. **Hover states** - Include hover: variants for interactive elements
