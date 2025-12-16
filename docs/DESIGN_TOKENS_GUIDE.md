# Design Tokens Integration Guide

This document outlines how to use the design tokens system throughout the DoveApp codebase for consistent UI styling.

## Overview

The design tokens system provides a centralized way to manage colors, spacing, typography, shadows, and other design elements. All tokens are defined in `lib/design-tokens.ts` and made available through utility functions in `lib/design-tokens-utils.ts`.

## CSS Custom Properties

The following CSS custom properties are available globally:

### Colors

```css
--color-background
--color-foreground
--color-primary
--color-primary-foreground
--color-secondary
--color-secondary-foreground
--color-muted
--color-muted-foreground
--color-accent
--color-accent-foreground
--color-destructive
--color-destructive-foreground
--color-border
--color-input
--color-ring
```

### Typography

```css
--font-size-xs   /* 0.75rem */
--font-size-sm   /* 0.875rem */
--font-size-base /* 1rem */
--font-size-lg   /* 1.125rem */
--font-size-xl   /* 1.25rem */
--font-size-2xl  /* 1.5rem */
--font-size-3xl  /* 1.875rem */
--font-size-4xl  /* 2.25rem */
--font-size-5xl  /* 3rem */
--font-size-6xl  /* 3.75rem */
```

### Spacing

```css
--spacing-0  /* 0 */
--spacing-1  /* 0.25rem */
--spacing-2  /* 0.5rem */
--spacing-3  /* 0.75rem */
--spacing-4  /* 1rem */
--spacing-5  /* 1.25rem */
--spacing-6  /* 1.5rem */
--spacing-8  /* 2rem */
--spacing-10 /* 2.5rem */
--spacing-12 /* 3rem */
--spacing-16 /* 4rem */
--spacing-20 /* 5rem */
--spacing-24 /* 6rem */
--spacing-32 /* 8rem */
```

### Component Tokens

```css
--button-height-sm  /* 2rem */
--button-height-md  /* 2.5rem */
--button-height-lg  /* 3rem */
--input-height      /* 2.5rem */
--card-padding      /* 1.5rem */
--radius            /* 0.5rem */
```

## Using Design Tokens in Components

### 1. CSS Classes (Recommended for most cases)

Most components should use Tailwind CSS classes that reference the custom properties:

```tsx
// Good - uses design token via Tailwind
<div className="bg-primary text-primary-foreground p-4 rounded-lg">
  Content
</div>

// Good - uses spacing token via Tailwind
<div className="space-y-4 p-6">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### 2. Inline Styles (For dynamic values)

Use the utility functions for programmatic access:

```tsx
import {
  getSpacing,
  getColor,
  getBorderRadius,
} from '@/lib/design-tokens-utils';

function MyComponent() {
  return (
    <div
      style={{
        padding: getSpacing(4), // 1rem
        backgroundColor: getColor('primary', 500),
        borderRadius: getBorderRadius('lg'),
      }}
    >
      Content
    </div>
  );
}
```

### 3. CSS Custom Properties

For complex styling, use the CSS variables directly:

```tsx
<div
  style={{
    '--custom-spacing': 'var(--spacing-8)',
    padding: 'var(--custom-spacing)',
  }}
>
  Content
</div>
```

## Component-Specific Guidelines

### Buttons

```tsx
// Use Tailwind classes - automatically uses design tokens
<Button variant="primary" size="md">
  Click me
</Button>

// Custom styling with tokens
<Button
  style={{
    height: 'var(--button-height-lg)',
    borderRadius: 'var(--radius)',
  }}
>
  Large Button
</Button>
```

### Cards

```tsx
// Use component classes
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>

// Custom spacing
<Card style={{ padding: 'var(--card-padding)' }}>
  Content
</Card>
```

### Forms

```tsx
// Inputs automatically use design tokens
<Input placeholder="Enter text" />

// Custom form styling
<div style={{
  marginBottom: 'var(--spacing-4)',
}}>
  <Label>Form Field</Label>
  <Input
    style={{
      height: 'var(--input-height)',
      borderRadius: 'var(--radius)',
    }}
  />
</div>
```

## Color Usage Guidelines

### Primary Colors

- Use for primary actions, links, and important UI elements
- Primary: Main brand color (#3b82f6)
- Primary foreground: Text on primary backgrounds (#ffffff)

### Secondary Colors

- Use for less prominent actions and secondary information
- Secondary: Neutral background color (#f1f5f9)
- Muted: Subtle text and backgrounds (#64748b)

### Semantic Colors

- Success: Positive actions and confirmations (#22c55e)
- Warning: Caution states and warnings (#f59e0b)
- Error/Destructive: Errors and destructive actions (#ef4444)

## Typography Scale

Use the typography scale for consistent text sizing:

- `xs`: Small labels, captions (12px)
- `sm`: Secondary text, small buttons (14px)
- `base`: Body text, inputs (16px)
- `lg`: Large body text, small headings (18px)
- `xl`: Section headings (20px)
- `2xl`: Page headings (24px)
- `3xl`: Large headings (30px)

## Spacing Scale

Use the spacing scale for consistent margins and padding:

- `1`: 4px - Small gaps, borders
- `2`: 8px - Component padding, small margins
- `3`: 12px - Input padding, medium gaps
- `4`: 16px - Standard padding, large gaps
- `6`: 24px - Section spacing, card padding
- `8`: 32px - Large sections, modal padding

## Shadows

Use appropriate shadows for depth:

- `sm`: Subtle elevation for cards
- `base`: Standard shadow for floating elements
- `md`: Medium elevation for modals
- `lg`: Large elevation for dropdowns
- `xl`: Maximum elevation for tooltips

## Best Practices

### 1. Prefer CSS Classes Over Inline Styles

```tsx
// Preferred
<div className="p-4 bg-primary text-primary-foreground rounded-lg">
  Content
</div>

// Avoid when possible
<div style={{ padding: '1rem', backgroundColor: '#3b82f6' }}>
  Content
</div>
```

### 2. Use Design Tokens for Consistency

```tsx
// Good
import { getSpacing, getColor } from '@/lib/design-tokens-utils';

<div style={{ margin: getSpacing(4), color: getColor('primary', 600) }}>
  Content
</div>;
```

### 3. Avoid Hard-coded Values

```tsx
// Avoid
<div style={{ padding: '16px', color: '#3b82f6' }}>
  Content
</div>

// Use tokens instead
<div className="p-4 text-primary">
  Content
</div>
```

### 4. Test in Both Light and Dark Modes

Ensure components look good in both themes by using the semantic color tokens.

## Migration Guide

When updating existing components:

1. **Identify hard-coded values** in styles and replace with design tokens
2. **Update CSS classes** to use the new token-based classes
3. **Test in both themes** to ensure proper contrast and visibility
4. **Update component variants** to use token values

## Examples

### Before (hard-coded values)

```tsx
<div className="bg-blue-500 text-white p-4 rounded-lg shadow-md">
  <h2 className="text-xl font-bold mb-2">Title</h2>
  <p className="text-sm">Description</p>
</div>
```

### After (design tokens)

```tsx
<div className="bg-primary text-primary-foreground p-4 rounded-lg shadow-base">
  <h2 className="text-2xl font-bold mb-2">Title</h2>
  <p className="text-sm">Description</p>
</div>
```

This ensures consistency across the app and makes it easy to update the design system globally.
