# TaxFront Design System

A comprehensive guide to the design patterns, components, and standards used in the TaxFront application. Built with React, TypeScript, Tailwind CSS, and Lucide React icons.

## Table of Contents

- [Color Palette](#color-palette)
- [Typography](#typography)
- [Spacing & Layout](#spacing--layout)
- [Components](#components)
- [Icons](#icons)
- [Responsive Design](#responsive-design)
- [Accessibility](#accessibility)
- [Usage Examples](#usage-examples)

---

## Color Palette

### Primary Colors

| Color | Hex Value | Usage | Tailwind Class |
|-------|-----------|-------|---|
| **Primary Blue** | `#00AAFF` | CTA buttons, active states, hover effects | `bg-[#00AAFF]` |
| **Dark Blue** | `#00395D` | Headers, text, primary brand color | `text-[#00395D]`, `bg-[#00395D]` |
| **Light Blue** | `#E5F4FF` | Backgrounds, hover states, subtle highlights | `bg-[#E5F4FF]` |

### Neutral Colors

| Color | Usage | Tailwind Class |
|-------|-------|---|
| **White** | Base background, cards, modals | `bg-white` |
| **Gray-50** | Page backgrounds | `bg-gray-50` |
| **Gray-100** | Subtle backgrounds, hover states | `bg-gray-100` |
| **Gray-200** | Borders, dividers | `border-gray-200` |
| **Gray-400** | Disabled states, secondary text | `text-gray-400` |
| **Gray-500** | Secondary text, placeholders | `text-gray-500` |
| **Gray-700** | Body text | `text-gray-700` |
| **Gray-900** | Heading text | `text-gray-900` |

### Usage Guidelines

- **Primary actions**: Use `#00AAFF` (Primary Blue)
- **Secondary actions**: Use `gray-700` or `gray-500`
- **Backgrounds**: Use `gray-50` for main background, `white` for containers
- **Hover states**: Use `#00395D` (Dark Blue) for buttons, `#E5F4FF` for backgrounds
- **Disabled states**: Use `gray-400` for text, `gray-100` for backgrounds
- **Brand presence**: Use the Primary and Dark Blue combination for header/navigation

---

## Typography

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
             'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
             sans-serif;
```

### Font Weights

| Weight | Usage |
|--------|-------|
| **Light (300)** | Secondary text, subtitles, chat headers |
| **Normal (400)** | Body text, default text |
| **Medium (500)** | Emphasis within body text, labels, menu items |
| **Bold (700)** | Headings, strong emphasis, brand text |

### Text Sizes & Styles

| Type | Size | Weight | Usage | Example Class |
|------|------|--------|-------|---|
| **Heading 1** | 24-32px | Bold | Page titles, major sections | `text-2xl sm:text-3xl font-bold` |
| **Heading 2** | 20px | Bold | Section headings | `text-xl font-bold` |
| **Heading 3** | 16-18px | Bold | Sub-section headings | `text-lg font-bold` |
| **Body Large** | 16px | Normal | Primary body text | `text-base` |
| **Body** | 14px | Normal | Standard body text | `text-sm` |
| **Small** | 12px | Normal | Secondary info, captions | `text-xs` |
| **Label** | 14px | Medium | Form labels, UI labels | `text-sm font-medium` |

### Text Color Hierarchy

```
Primary Text:    text-gray-900
Secondary Text:  text-gray-700
Tertiary Text:   text-gray-500
Disabled Text:   text-gray-400
Brand Text:      text-[#00395D]
Link/Action:     text-[#00AAFF]
```

---

## Spacing & Layout

### Spacing Scale

Based on Tailwind's default spacing (4px base unit):

```
2   = 8px
3   = 12px
4   = 16px
6   = 24px
8   = 32px
12  = 48px
16  = 64px
```

### Common Spacing Patterns

| Pattern | Tailwind Classes | Usage |
|---------|---|---|
| **Padding** | `p-4`, `px-6`, `py-3` | Internal spacing within components |
| **Margins** | `m-4`, `mx-auto`, `mb-6` | Space between components |
| **Gaps** | `gap-4`, `space-y-2`, `space-x-4` | Spacing in flex/grid layouts |

### Layout Grid

- **Container Max Width**: `max-w-7xl` (80rem/1280px)
- **Container Padding**: `px-4` (mobile), `px-6`/`px-8` (desktop)
- **Horizontal Spacing**: `sm:px-6 lg:px-8`
- **Vertical Spacing**: Sections separated by `py-8` or `py-12`

### Responsive Breakpoints

```
sm: 640px   - Tablets
md: 768px   - Small laptops
lg: 1024px  - Desktops
xl: 1280px  - Large screens
```

---

## Components

### Buttons

#### Primary Button

```jsx
<button className="px-4 py-2 bg-[#00AAFF] text-white rounded hover:bg-[#00395D] transition-colors">
  Action
</button>
```

**Usage**: Main calls-to-action, form submissions
**States**:
- Default: `bg-[#00AAFF]`
- Hover: `hover:bg-[#00395D]`
- Focus: `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00AAFF]`

#### Secondary Button

```jsx
<button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors">
  Secondary Action
</button>
```

**Usage**: Less important actions, cancel buttons

#### Button Sizes

```jsx
// Small
<button className="px-3 py-1 text-sm ...">Small</button>

// Medium (default)
<button className="px-4 py-2 ...">Medium</button>

// Large
<button className="px-6 py-3 text-lg ...">Large</button>
```

### Cards

```jsx
<div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
  <h3 className="text-lg font-bold text-gray-900 mb-2">Card Title</h3>
  <p className="text-gray-600">Card content goes here</p>
</div>
```

**Components**:
- Background: `bg-white`
- Border: `border border-gray-100`
- Shadow: `shadow-sm` (subtle), `shadow-lg` (prominent)
- Padding: `p-4` to `p-6`
- Rounded corners: `rounded-lg` or `rounded-md`

### Navigation/Navbar

```jsx
<nav className="bg-white shadow">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between h-16">
      {/* Brand Logo */}
      <span className="text-xl font-bold text-[#00AAFF]">TaxFront</span>
      
      {/* Nav Links */}
      <Link className="text-sm font-medium text-gray-500 hover:text-[#00395D]">
        Link
      </Link>
    </div>
  </div>
</nav>
```

**Features**:
- Background: `bg-white`
- Shadow: `shadow` (subtle elevation)
- Height: `h-16` (64px)
- Active state: `text-[#00395D] border-b-2 border-[#00395D]`
- Hover state: `hover:text-[#00395D]`

### Dropdowns/Menus

```jsx
<div className="relative">
  <button onClick={() => setIsOpen(!isOpen)}>Menu</button>
  
  <div className={`${
    isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
  } transition ease-out duration-100 origin-top-right absolute right-0 mt-2 w-56 
  rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5`}>
    {/* Menu items */}
  </div>
</div>
```

**Features**:
- Animation: `transition ease-out duration-100`
- Position: `origin-top-right absolute right-0 mt-2`
- Styling: `bg-white ring-1 ring-black ring-opacity-5`
- Items: `divide-y divide-gray-100` for separators

### Forms

#### Input Field

```jsx
<input
  type="text"
  placeholder="Enter value"
  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none 
  focus:ring-2 focus:ring-[#00AAFF] focus:border-transparent"
/>
```

#### Form Label

```jsx
<label className="block text-sm font-medium text-gray-700 mb-2">
  Label Text
</label>
```

**Focus States**:
- Border: `border-gray-200`
- Focus Ring: `focus:ring-2 focus:ring-[#00AAFF]`
- No Outline: `focus:outline-none`
- Transparent Border: `focus:border-transparent`

### Badges & Tags

```jsx
// Success
<span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
  Active
</span>

// Warning
<span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
  Pending
</span>

// Error
<span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
  Error
</span>
```

### Modals/Dialogs

```jsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg shadow-xl w-96 p-6">
    <h2 className="text-xl font-bold text-gray-900 mb-4">Modal Title</h2>
    <p className="text-gray-700 mb-6">Modal content</p>
    <div className="flex gap-3">
      <button className="flex-1 px-4 py-2 bg-[#00AAFF] text-white rounded hover:bg-[#00395D]">
        Confirm
      </button>
      <button className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded hover:bg-gray-50">
        Cancel
      </button>
    </div>
  </div>
</div>
```

### Loaders

```jsx
// Spinner
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>

// With text
<div className="flex items-center justify-center">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00AAFF]"></div>
  <span className="ml-3 text-gray-600">Loading...</span>
</div>
```

---

## Icons

### Using Lucide React Icons

All icons are sourced from [Lucide React](https://lucide.dev/).

```jsx
import { MessageSquare, X, User, LogOut, Menu, Bell, Upload } from 'lucide-react';

// Basic usage
<MessageSquare className="w-6 h-6" />

// With color
<User className="w-5 h-5 text-[#00395D]" />

// As button icon
<button className="flex items-center gap-2">
  <LogOut className="w-4 h-4" />
  Sign out
</button>
```

### Icon Sizes

| Size | Class | Usage |
|------|-------|-------|
| Small | `w-4 h-4` | Form inputs, inline text |
| Medium | `w-5 h-5`, `w-6 h-6` | Navigation, buttons |
| Large | `w-8 h-8`, `w-10 h-10` | Avatars, prominent icons |

### Common Icons

| Purpose | Icon | Import |
|---------|------|--------|
| Navigation | `Menu`, `X` | From lucide-react |
| User | `User` | From lucide-react |
| Actions | `LogOut`, `Upload`, `Download` | From lucide-react |
| Notifications | `Bell` | From lucide-react |
| Chat | `MessageSquare` | From lucide-react |
| Document | File-related icons | From lucide-react |
| Bugs/Issues | `Bug` | From lucide-react |

---

## Responsive Design

### Mobile-First Approach

All components are built mobile-first, with responsive classes added for larger screens.

### Common Responsive Patterns

```jsx
// Hidden on mobile, visible on desktop
<div className="hidden sm:block">Desktop only</div>

// Different layouts
<div className="flex flex-col sm:flex-row gap-4">
  {/* Stacked on mobile, side-by-side on desktop */}
</div>

// Responsive padding
<div className="px-4 sm:px-6 lg:px-8">
  {/* More padding on larger screens */}
</div>

// Responsive text sizes
<h1 className="text-2xl sm:text-3xl lg:text-4xl">
  {/* Larger text on larger screens */}
</h1>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* 1 column mobile, 2 columns tablet, 3 columns desktop */}
</div>
```

### Navigation Responsive Pattern

```jsx
// Desktop nav
<div className="hidden sm:flex sm:space-x-8">
  {/* Navigation items */}
</div>

// Mobile menu
<div className="flex sm:hidden">
  {/* Mobile hamburger menu */}
</div>

// Mobile menu content
{isOpen && (
  <div className="sm:hidden">
    {/* Full mobile menu */}
  </div>
)}
```

---

## Accessibility

### ARIA Labels

Always include aria labels for icon-only buttons:

```jsx
<button className="..." aria-label="View notifications">
  <Bell className="h-6 w-6" />
</button>
```

### Keyboard Navigation

- All interactive elements should be keyboard accessible
- Use `:focus` states for keyboard navigation
- Maintain proper tab order in forms

```jsx
<button className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00AAFF]">
  Click me
</button>
```

### Color Contrast

- Primary text on white: `text-gray-900` (sufficient contrast)
- Secondary text on white: `text-gray-700` (sufficient contrast)
- Buttons: `bg-[#00AAFF]` with `text-white` (sufficient contrast)

### Semantic HTML

```jsx
// Good
<nav>...</nav>
<main>...</main>
<button>Click</button>

// Avoid
<div onClick={...}>Click</div>
<div role="button">Click</div>
```

### Form Accessibility

```jsx
<label htmlFor="email" className="block text-sm font-medium text-gray-700">
  Email
</label>
<input
  id="email"
  type="email"
  className="..."
/>
```

---

## Usage Examples

### Example 1: Login Page

```jsx
export function Auth() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AAFF]"
            />
          </div>
          
          <button className="w-full p-3 bg-[#00AAFF] text-white rounded-lg hover:bg-[#00395D] font-medium">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Example 2: Dashboard Card

```jsx
export function DocumentCard({ doc }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{doc.name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            Uploaded {formatDate(doc.uploadedAt)}
          </p>
        </div>
        <button className="p-2 text-gray-400 hover:text-[#00395D]">
          <Menu className="w-5 h-5" />
        </button>
      </div>
      
      <div className="mt-4 flex gap-2">
        <button className="flex-1 px-4 py-2 bg-[#00AAFF] text-white rounded hover:bg-[#00395D]">
          View
        </button>
        <button className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded hover:bg-gray-50">
          Download
        </button>
      </div>
    </div>
  );
}
```

### Example 3: Form with Validation

```jsx
export function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document
        </label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full p-3 border border-gray-200 rounded-lg"
        />
        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}
      </div>
      
      <button
        disabled={!file}
        className="w-full p-3 bg-[#00AAFF] text-white rounded-lg hover:bg-[#00395D] disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Upload className="w-4 h-4" />
        Upload
      </button>
    </div>
  );
}
```

---

## Implementation Guidelines

### Do's

✅ Use Tailwind classes for styling
✅ Follow the color palette for consistency
✅ Use Lucide React for all icons
✅ Implement responsive design from mobile-first
✅ Include focus states for keyboard navigation
✅ Use semantic HTML elements
✅ Test components on mobile and desktop

### Don'ts

❌ Don't hardcode colors outside the palette
❌ Don't use margin for spacing inside components (use padding instead)
❌ Don't skip accessibility features
❌ Don't use custom fonts without justification
❌ Don't create duplicate components
❌ Don't ignore keyboard navigation

---

## Tailwind CSS Configuration

The project uses the default Tailwind CSS configuration with no custom theme overrides. Custom colors are applied using arbitrary value syntax:

```jsx
bg-[#00AAFF]  // Primary blue
bg-[#00395D]  // Dark blue
bg-[#E5F4FF]  // Light blue
text-[#00395D]
```

---

## Future Enhancements

- Consider extracting custom Tailwind theme configuration for cleaner color definitions
- Document animation patterns and transitions
- Add dark mode variant guidelines
- Create component-specific storybook documentation
- Establish type definitions for common component props
- Document form validation patterns

---

## References

- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Lucide React Icons](https://lucide.dev/)
- [React Documentation](https://react.dev/)
- [Web Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)
