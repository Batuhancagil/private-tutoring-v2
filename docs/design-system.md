# Design System

**Last Updated:** 2025-11-24  
**Story:** 1-5-basic-ui-framework-layout

## Overview

This document defines the design system for the Private Tutoring Dashboard Platform. It establishes consistent colors, typography, spacing, and component patterns to ensure a cohesive user experience across all features.

## Color Palette

### Primary Colors (Indigo)

Used for primary actions, links, and brand elements.

- `primary-50`: #eef2ff - Lightest background
- `primary-100`: #e0e7ff - Light background
- `primary-200`: #c7d2fe - Subtle background
- `primary-300`: #a5b4fc - Hover states
- `primary-400`: #818cf8 - Secondary actions
- `primary-500`: #6366f1 - Base primary
- `primary-600`: #4f46e5 - **Primary brand color** (main CTA buttons, active states)
- `primary-700`: #4338ca - Hover states
- `primary-800`: #3730a3 - Dark mode primary
- `primary-900`: #312e81 - Darkest primary

**Usage:**
- Primary buttons: `bg-indigo-600` or `bg-primary-600`
- Active navigation links: `bg-indigo-100 dark:bg-indigo-900`
- Focus rings: `focus:ring-indigo-500`

### Success Colors (Green)

Used for success messages, positive indicators, and completed states.

- `success-600`: #16a34a - Success text/icons
- `success-500`: #22c55e - Success backgrounds

**Usage:**
- Success messages: `text-success-600`
- Success badges: `bg-success-500`

### Warning Colors (Amber/Yellow)

Used for warnings and cautionary messages.

- `warning-600`: #d97706 - Warning text/icons
- `warning-500`: #f59e0b - Warning backgrounds

**Usage:**
- Warning messages: `text-warning-600`
- Warning badges: `bg-warning-500`

### Error Colors (Red)

Used for errors, destructive actions, and validation failures.

- `error-600`: #dc2626 - **Error color** (error text, destructive buttons)
- `error-500`: #ef4444 - Error backgrounds

**Usage:**
- Error messages: `text-red-600` or `text-error-600`
- Destructive buttons: `bg-red-600` or `bg-error-600`
- Form validation errors: `border-red-500`

### Neutral Colors (Gray)

Used for text, backgrounds, borders, and UI elements.

- `gray-50`: Lightest background
- `gray-100`: Light background
- `gray-200`: Borders, dividers
- `gray-300`: Input borders
- `gray-400`: Placeholder text
- `gray-500`: Secondary text
- `gray-600`: Body text
- `gray-700`: Headings (dark mode)
- `gray-800`: Dark backgrounds
- `gray-900`: Darkest backgrounds

**Usage:**
- Backgrounds: `bg-gray-50 dark:bg-gray-900`
- Text: `text-gray-900 dark:text-white`
- Borders: `border-gray-200 dark:border-gray-700`

## Typography

### Font Family

- **Primary:** Inter (loaded via Next.js font optimization)
- **Fallback:** System font stack

### Font Sizes

| Size | Rem | Pixels | Line Height | Usage |
|------|-----|--------|-------------|-------|
| xs | 0.75rem | 12px | 1rem | Labels, captions |
| sm | 0.875rem | 14px | 1.25rem | Small text, buttons |
| base | 1rem | 16px | 1.5rem | Body text |
| lg | 1.125rem | 18px | 1.75rem | Large body text |
| xl | 1.25rem | 20px | 1.75rem | Small headings |
| 2xl | 1.5rem | 24px | 2rem | Section headings |
| 3xl | 1.875rem | 30px | 2.25rem | Page titles |
| 4xl | 2.25rem | 36px | 2.5rem | Hero headings |

### Font Weights

- `font-normal`: 400 - Body text
- `font-medium`: 500 - Labels, emphasis
- `font-semibold`: 600 - Headings, buttons
- `font-bold`: 700 - Strong emphasis

### Typography Patterns

**Page Title:**
```tsx
<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
  Page Title
</h1>
```

**Section Heading:**
```tsx
<h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
  Section Title
</h2>
```

**Body Text:**
```tsx
<p className="text-base text-gray-600 dark:text-gray-400">
  Body text content
</p>
```

**Label:**
```tsx
<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
  Label Text
</label>
```

## Spacing Scale

Consistent spacing values for padding and margins.

| Size | Value | Usage |
|------|-------|-------|
| 0 | 0 | No spacing |
| 1 | 0.25rem (4px) | Tight spacing |
| 2 | 0.5rem (8px) | Small spacing |
| 3 | 0.75rem (12px) | Default spacing |
| 4 | 1rem (16px) | Standard spacing |
| 6 | 1.5rem (24px) | Medium spacing |
| 8 | 2rem (32px) | Large spacing |
| 10 | 2.5rem (40px) | Extra large spacing |
| 12 | 3rem (48px) | Section spacing |

**Usage:**
- Component padding: `p-4` (1rem)
- Component margins: `mb-6` (1.5rem)
- Grid gaps: `gap-6` (1.5rem)
- Section spacing: `py-8` (2rem)

## Component Patterns

### Buttons

**Primary Button:**
```tsx
<Button variant="primary" size="md">
  Primary Action
</Button>
```

**Secondary Button:**
```tsx
<Button variant="secondary" size="md">
  Secondary Action
</Button>
```

**Danger Button:**
```tsx
<Button variant="danger" size="md">
  Delete
</Button>
```

**Outline Button:**
```tsx
<Button variant="outline" size="md">
  Cancel
</Button>
```

### Cards

**Basic Card:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

### Form Inputs

**Text Input:**
```tsx
<div>
  <Label htmlFor="username" required>Username</Label>
  <Input
    id="username"
    type="text"
    placeholder="Enter username"
    error={errors.username}
  />
</div>
```

**Input with Error:**
```tsx
<Input
  type="email"
  error="Please enter a valid email address"
/>
```

## Responsive Design

### Breakpoints

- **sm**: 640px - Small tablets, large phones
- **md**: 768px - Tablets
- **lg**: 1024px - Small desktops
- **xl**: 1280px - Large desktops
- **2xl**: 1536px - Extra large desktops

### Mobile-First Approach

Always design for mobile first, then enhance for larger screens:

```tsx
<div className="
  grid 
  grid-cols-1        // Mobile: 1 column
  md:grid-cols-2     // Tablet: 2 columns
  lg:grid-cols-3     // Desktop: 3 columns
  gap-6
">
```

### Navigation Responsive Pattern

- **Desktop**: Horizontal navigation bar
- **Mobile**: Hamburger menu with slide-down menu

## Dark Mode

All components support dark mode using Tailwind's `dark:` prefix.

**Pattern:**
```tsx
<div className="
  bg-white dark:bg-gray-800
  text-gray-900 dark:text-white
  border-gray-200 dark:border-gray-700
">
```

## Accessibility

### Focus States

All interactive elements must have visible focus states:

```tsx
className="focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
```

### Touch Targets

Mobile touch targets should be at least 44x44px (11rem):

```tsx
className="min-h-[44px] min-w-[44px]"
```

### Screen Reader Support

Use semantic HTML and ARIA labels:

```tsx
<button
  aria-label="Close menu"
  aria-expanded={isOpen}
>
  <span className="sr-only">Close menu</span>
</button>
```

## Component Library

### Layout Components

- `DashboardLayout` - Main layout wrapper for authenticated pages
- `Navigation` - Top navigation bar with role-specific menu items

### UI Components

- `Button` - Reusable button with variants (primary, secondary, danger, outline)
- `Card` - Card container with header, title, and content sections
- `Input` - Form input with error handling
- `Label` - Form label with required indicator support

## Usage Guidelines

1. **Consistency**: Use design system tokens consistently across all components
2. **Responsive**: Always consider mobile, tablet, and desktop views
3. **Accessibility**: Ensure keyboard navigation and screen reader support
4. **Dark Mode**: Test components in both light and dark modes
5. **Spacing**: Use consistent spacing scale for margins and padding
6. **Colors**: Use semantic color names (primary, success, error) when possible

## References

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)








