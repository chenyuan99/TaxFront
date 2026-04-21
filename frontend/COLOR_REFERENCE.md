# TaxFront Color Reference Guide

Complete color palette reference with usage guidelines, contrast ratios, and implementation examples.

## Brand Colors

### Primary Blue

```
Hex:     #00AAFF
RGB:     0, 170, 255
HSL:     192°, 100%, 50%
Tailwind: bg-primary, text-primary, border-primary
Usage:   Main CTA buttons, links, active states, hover effects
```

**Implementation Examples:**
```jsx
// Button
<button className="bg-primary text-white hover:bg-dark">Action</button>

// Link
<a href="#" className="text-primary hover:text-dark">Link</a>

// Border
<div className="border-l-4 border-primary">Highlighted content</div>

// Icon
<Icon className="text-primary" />
```

### Dark Blue (Navy)

```
Hex:     #00395D
RGB:     0, 57, 93
HSL:     199°, 100%, 18%
Tailwind: bg-dark, text-dark, border-dark
Usage:   Headers, primary text, brand identity, hover states
```

**Implementation Examples:**
```jsx
// Header
<header className="bg-dark text-white">
  <h1>Title</h1>
</header>

// Text
<p className="text-dark font-bold">Important text</p>

// Hover state
<button className="hover:bg-dark hover:text-white">Hover me</button>
```

### Light Blue

```
Hex:     #E5F4FF
RGB:     229, 244, 255
HSL:     192°, 100%, 95%
Tailwind: bg-light-bg
Usage:   Backgrounds, subtle highlights, hover states for neutral elements
```

**Implementation Examples:**
```jsx
// Background
<div className="bg-light-bg p-6 rounded-lg">
  Light content
</div>

// Icon background
<div className="bg-light-bg rounded-full p-3">
  <Icon className="text-dark" />
</div>

// Hover state
<button className="hover:bg-light-bg">Subtle hover</button>
```

---

## Neutral Colors

### Grays

#### Gray-50
```
Hex:     #F9FAFB
Usage:   Page backgrounds, subtle distinctions
```

#### Gray-100
```
Hex:     #F3F4F6
Usage:   Input backgrounds, hover states, subtle backgrounds
```

#### Gray-200
```
Hex:     #E5E7EB
Usage:   Borders, dividers, disabled states
```

#### Gray-300
```
Hex:     #D1D5DB
Usage:   Disabled elements, secondary borders
```

#### Gray-400
```
Hex:     #9CA3AF
Usage:   Disabled text, placeholder text, secondary icons
```

#### Gray-500
```
Hex:     #6B7280
Usage:   Secondary text, helper text, muted content
```

#### Gray-600
```
Hex:     #4B5563
Usage:   Body text (lighter), secondary content
```

#### Gray-700
```
Hex:     #374151
Usage:   Body text, labels, primary text
```

#### Gray-800
```
Hex:     #1F2937
Usage:   Heading text, strong emphasis
```

#### Gray-900
```
Hex:     #111827
Usage:   Very dark text, strong emphasis
```

**Neutral Gray Usage:**
```jsx
// Page background
<div className="bg-gray-50">Page content</div>

// Border
<div className="border border-gray-200">Content</div>

// Text hierarchy
<h1 className="text-gray-900">Primary heading</h1>
<p className="text-gray-700">Body text</p>
<span className="text-gray-500">Secondary text</span>
<span className="text-gray-400">Disabled or placeholder</span>
```

---

## Semantic Colors

### Success (Green)

```
Light:   #F0FDF4  (green-50)
Mid:     #86EFAC  (green-300)
Dark:    #16A34A  (green-600)
Usage:   Success messages, completed states, positive actions
```

**Examples:**
```jsx
// Success message
<div className="bg-green-50 border border-green-200 rounded-lg p-4">
  <p className="text-green-800 font-medium">✓ Success!</p>
</div>

// Success button
<button className="bg-green-600 text-white hover:bg-green-700">
  Confirm
</button>

// Badge
<span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
  Active
</span>
```

### Warning (Yellow)

```
Light:   #FFFBEB  (yellow-50)
Mid:     #FCD34D  (yellow-300)
Dark:    #D97706  (amber-600)
Usage:   Warnings, alerts, cautionary information
```

**Examples:**
```jsx
// Warning message
<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
  <p className="text-yellow-800 font-medium">⚠ Warning</p>
</div>

// Warning label
<span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm">
  Pending
</span>
```

### Error (Red)

```
Light:   #FEF2F2  (red-50)
Mid:     #FCA5A5  (red-300)
Dark:    #DC2626  (red-600)
Usage:   Errors, destructive actions, negative states
```

**Examples:**
```jsx
// Error message
<div className="bg-red-50 border border-red-200 rounded-lg p-4">
  <p className="text-red-800 font-medium">✕ Error occurred</p>
</div>

// Error button
<button className="bg-red-600 text-white hover:bg-red-700">
  Delete
</button>

// Error input
<input className="border-2 border-red-300 focus:ring-red-500" />
```

### Info (Blue)

```
Light:   #EFF6FF  (blue-50)
Mid:     #93C5FD  (blue-300)
Dark:    #2563EB  (blue-600)
Usage:   Informational messages, helpful hints
```

**Examples:**
```jsx
// Info message
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <p className="text-blue-800">ℹ Information</p>
</div>
```

---

## Contrast & Accessibility

### Color Contrast Ratios

| Combination | Ratio | WCAG AA | WCAG AAA |
|---|---|---|---|
| `#00AAFF` on white | 3.2:1 | ❌ | ❌ |
| `#00AAFF` on dark | N/A | ✓ | ✓ |
| `#00395D` on white | 7.5:1 | ✓ | ✓ |
| `#00395D` on light-bg | 5.2:1 | ✓ | ✓ |
| Gray-700 on white | 11.5:1 | ✓ | ✓ |
| Gray-500 on white | 4.5:1 | ✓ | ✓ |
| Gray-400 on white | 3.2:1 | ❌ | ❌ |

### WCAG Recommendations

**Do:**
- ✓ Use `#00AAFF` as background with white text
- ✓ Use `#00395D` as text on white backgrounds
- ✓ Use Gray-700 for body text on white
- ✓ Use high contrast for all text
- ✓ Don't rely on color alone to convey meaning

**Don't:**
- ❌ Use `#00AAFF` for text on white background
- ❌ Use Gray-400 for important text
- ❌ Use light backgrounds with light text
- ❌ Use only color for error indication (add icons or text)

### Accessible Color Combinations

```jsx
// Good - High contrast
<button className="bg-dark text-white">
  Good contrast (7+ ratio)
</button>

// Bad - Low contrast
<button className="text-[#00AAFF] bg-white">
  Poor contrast (3.2:1)
</button>

// Good - Accessible backgrounds
<div className="bg-light-bg text-dark">
  Good combination
</div>

// Error with text indicator
<div className="border-l-4 border-red-600 bg-red-50 p-4">
  <p className="flex items-center gap-2 text-red-800">
    <Icon className="w-4 h-4" />
    Error message
  </p>
</div>
```

---

## Color Usage by Component

### Buttons

```jsx
// Primary Button
className="bg-primary text-white hover:bg-dark"

// Secondary Button
className="text-gray-700 border border-gray-200 hover:bg-gray-50"

// Danger Button
className="bg-red-600 text-white hover:bg-red-700"

// Disabled Button
className="bg-gray-300 text-gray-500 cursor-not-allowed"
```

### Forms

```jsx
// Active input
className="border border-gray-200 focus:ring-2 focus:ring-primary"

// Input with error
className="border-2 border-red-300 focus:ring-red-500"

// Label
className="text-gray-700 font-medium"

// Helper text
className="text-gray-500 text-sm"

// Placeholder
placeholder="..." // style with gray-400
```

### Cards

```jsx
// Card container
className="bg-white border border-gray-100"

// Card header
className="bg-gray-50 border-b border-gray-100"

// Card title
className="text-gray-900 font-bold"

// Card text
className="text-gray-700"

// Card secondary
className="text-gray-500 text-sm"
```

### Navigation

```jsx
// Nav background
className="bg-white shadow"

// Nav link
className="text-gray-500 hover:text-dark"

// Active nav link
className="text-dark border-b-2 border-dark"

// Nav icon
className="text-gray-400 hover:text-dark"
```

### Status Badges

```jsx
// Success
className="bg-green-100 text-green-800"

// Warning
className="bg-yellow-100 text-yellow-800"

// Error
className="bg-red-100 text-red-800"

// Info
className="bg-blue-100 text-blue-800"

// Default
className="bg-gray-100 text-gray-800"
```

---

## Color Implementation in Tailwind

### Using Custom Color Classes

Since we've extended the Tailwind config with custom colors, you can now use:

```jsx
// Instead of
<button className="bg-[#00AAFF]">Click</button>

// Use
<button className="bg-primary">Click</button>

// Instead of
<button className="bg-[#00395D]">Click</button>

// Use
<button className="bg-dark">Click</button>

// Instead of
<button className="bg-[#E5F4FF]">Click</button>

// Use
<button className="bg-light-bg">Click</button>
```

### Arbitrary Values (When Custom Classes Aren't Available)

```jsx
// For colors not in our palette
<div className="text-[#FF6B6B]">Custom color</div>

// With opacity
<div className="bg-[#00AAFF]/50">50% opacity</div>
```

---

## Color Psychology

### Primary Blue (#00AAFF)
- **Perception**: Trust, calm, technology, innovation
- **Usage**: Primary actions, brand identity
- **Effect**: Professional, approachable

### Dark Blue (#00395D)
- **Perception**: Authority, stability, depth
- **Usage**: Headers, strong emphasis, brand
- **Effect**: Serious, trustworthy

### Light Blue (#E5F4FF)
- **Perception**: Clarity, freshness, approachability
- **Usage**: Backgrounds, subtle highlights
- **Effect**: Light, friendly

### Grays
- **Perception**: Neutral, balance, clarity
- **Usage**: Text, borders, backgrounds
- **Effect**: Professional, readable

### Greens
- **Perception**: Growth, success, positive
- **Usage**: Confirmations, completion
- **Effect**: Reassuring, positive

### Reds
- **Perception**: Attention, danger, action required
- **Usage**: Errors, destructive actions
- **Effect**: Warning, important

---

## Migration Guide

If you have existing code using arbitrary color values, migrate to the new custom classes:

### Before
```jsx
<button className="bg-[#00AAFF] text-white hover:bg-[#00395D]">
  Click
</button>

<div className="bg-[#E5F4FF] p-4 rounded-lg">
  Content
</div>
```

### After
```jsx
<button className="bg-primary text-white hover:bg-dark">
  Click
</button>

<div className="bg-light-bg p-4 rounded-lg">
  Content
</div>
```

---

## Testing Colors

### Contrast Checking Tools
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Ratio Tool](https://contrast-ratio.com/)
- [Accessible Colors](https://accessible-colors.com/)

### Browser DevTools
- Chrome DevTools → Elements → Computed → Color
- Firefox DevTools → Inspector → Color picker

### Screen Reader Testing
- Windows: NVDA (free)
- macOS: VoiceOver (built-in)
- iOS: VoiceOver (built-in)
- Android: TalkBack (built-in)

---

## Maintenance

### When to Add New Colors
1. Multiple components use the same custom color
2. It's part of the official brand palette
3. It improves consistency and reduces arbitrary values

### Color Naming Conventions
- **Semantic names**: `primary`, `success`, `error`, `warning`
- **Descriptive names**: `dark`, `light-bg`
- **Avoid**: `color1`, `brand-blue-2`, `shade3`

### Documentation Updates
When adding new colors:
1. Update `tailwind.config.js`
2. Add to this color reference guide
3. Update DESIGN_SYSTEM.md if it's a major change
4. Communicate to the team
