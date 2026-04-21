# TaxFront Component Patterns

A practical guide to common component patterns and reusable patterns used throughout the TaxFront application.

## Table of Contents

- [Button Patterns](#button-patterns)
- [Form Patterns](#form-patterns)
- [Layout Patterns](#layout-patterns)
- [Navigation Patterns](#navigation-patterns)
- [Modal Patterns](#modal-patterns)
- [Card Patterns](#card-patterns)
- [State Management Patterns](#state-management-patterns)
- [Hook Patterns](#hook-patterns)
- [Error Handling Patterns](#error-handling-patterns)

---

## Button Patterns

### Basic Button Types

#### Primary Action Button

```tsx
<button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-dark transition-colors font-medium">
  Primary Action
</button>
```

**Usage**: Main call-to-action, form submission, save actions

#### Secondary Button

```tsx
<button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium">
  Secondary Action
</button>
```

**Usage**: Cancel, secondary options, less important actions

#### Danger Button

```tsx
<button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
  Delete
</button>
```

**Usage**: Destructive actions, delete operations

#### Link Button

```tsx
<button className="text-primary hover:text-dark transition-colors font-medium">
  Link Button
</button>
```

**Usage**: Navigation without emphasizing as button

### Button with Icon

```tsx
import { Download, Trash2 } from 'lucide-react';

<button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-dark">
  <Download className="w-4 h-4" />
  Download
</button>

<button className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
  <Trash2 className="w-4 h-4" />
  Delete
</button>
```

### Button States

```tsx
<div className="space-y-2">
  {/* Active */}
  <button className="px-4 py-2 bg-primary text-white rounded-lg">Active</button>
  
  {/* Hover */}
  <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-dark">Hover</button>
  
  {/* Focus */}
  <button className="px-4 py-2 bg-primary text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
    Focus
  </button>
  
  {/* Disabled */}
  <button disabled className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">
    Disabled
  </button>
  
  {/* Loading */}
  <button disabled className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2">
    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
    Loading...
  </button>
</div>
```

### Button Group

```tsx
<div className="flex gap-2">
  <button className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-dark">
    Save
  </button>
  <button className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">
    Cancel
  </button>
</div>
```

---

## Form Patterns

### Basic Text Input

```tsx
<div>
  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
    Email Address
  </label>
  <input
    id="email"
    type="email"
    placeholder="you@example.com"
    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700"
  />
</div>
```

### Input with Error State

```tsx
import { AlertCircle } from 'lucide-react';

function TextInputWithError() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  
  return (
    <div>
      <label htmlFor="field" className="block text-sm font-medium text-gray-700 mb-2">
        Field Label
      </label>
      <div className="relative">
        <input
          id="field"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-200 focus:ring-primary focus:border-transparent'
          }`}
        />
        {error && (
          <AlertCircle className="absolute right-3 top-3 w-5 h-5 text-red-500" />
        )}
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
```

### Form Group

```tsx
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Submit logic
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

### Select/Dropdown

```tsx
<div>
  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
    Role
  </label>
  <select
    id="role"
    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-700"
  >
    <option value="">Select a role</option>
    <option value="user">User</option>
    <option value="admin">Administrator</option>
  </select>
</div>
```

### Checkbox

```tsx
<div className="flex items-center">
  <input
    id="agree"
    type="checkbox"
    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
  />
  <label htmlFor="agree" className="ml-2 block text-sm text-gray-700">
    I agree to the terms and conditions
  </label>
</div>
```

### File Input

```tsx
import { Upload } from 'lucide-react';

function FileUploadInput() {
  const [file, setFile] = useState<File | null>(null);
  
  return (
    <div>
      <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
        Upload Document
      </label>
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
        <input
          id="file"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />
        <label htmlFor="file" className="cursor-pointer flex flex-col items-center">
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm font-medium text-gray-700">
            {file ? file.name : 'Choose a file or drag and drop'}
          </span>
          <span className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX up to 10MB</span>
        </label>
      </div>
    </div>
  );
}
```

---

## Layout Patterns

### Container with Max Width

```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Two Column Layout

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>{/* Column 1 */}</div>
  <div>{/* Column 2 */}</div>
</div>
```

### Three Column Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <div key={item.id}>{/* Card */}</div>
  ))}
</div>
```

### Sidebar Layout

```tsx
<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
  <aside className="lg:col-span-1">
    {/* Sidebar */}
  </aside>
  <main className="lg:col-span-3">
    {/* Main content */}
  </main>
</div>
```

### Centered Content

```tsx
<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
  <div className="w-full max-w-md">
    {/* Content */}
  </div>
</div>
```

---

## Navigation Patterns

### Top Navigation Bar

```tsx
import { Menu, X, User } from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-xl font-bold text-primary">TaxFront</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            <a href="/" className="text-gray-500 hover:text-dark text-sm font-medium">
              Dashboard
            </a>
            <a href="/forms" className="text-gray-500 hover:text-dark text-sm font-medium">
              Forms
            </a>
            <button className="p-2 text-gray-400 hover:text-dark">
              <User className="h-6 w-6" />
            </button>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center">
            <button onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isOpen && (
          <div className="sm:hidden pt-2 pb-3 space-y-1">
            <a href="/" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              Dashboard
            </a>
            <a href="/forms" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              Forms
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
```

### Breadcrumbs

```tsx
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function Breadcrumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="flex items-center space-x-1">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />}
          {item.href ? (
            <Link to={item.href} className="text-primary hover:text-dark text-sm">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-700 text-sm">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
```

---

## Modal Patterns

### Simple Confirmation Modal

```tsx
function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  isOpen,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
}) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-dark"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Alert Modal

```tsx
import { AlertCircle, CheckCircle } from 'lucide-react';

function AlertModal({
  type = 'info',
  title,
  message,
  onClose,
  isOpen,
}: {
  type?: 'info' | 'success' | 'error' | 'warning';
  title: string;
  message: string;
  onClose: () => void;
  isOpen: boolean;
}) {
  const colors = {
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-500' },
    success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: 'text-green-500' },
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-500' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: 'text-yellow-500' },
  };
  
  const color = colors[type];
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${color.bg} border ${color.border} rounded-lg p-6 max-w-sm w-full mx-4`}>
        <div className="flex items-start gap-3">
          <AlertCircle className={`w-6 h-6 ${color.icon} flex-shrink-0`} />
          <div className="flex-1">
            <h3 className={`font-bold ${color.text} mb-1`}>{title}</h3>
            <p className={`${color.text} text-sm opacity-90`}>{message}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`mt-4 w-full px-4 py-2 ${color.text} border ${color.border} rounded-lg hover:opacity-80 font-medium`}
        >
          Close
        </button>
      </div>
    </div>
  );
}
```

---

## Card Patterns

### Basic Card

```tsx
<div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
  <h3 className="text-lg font-bold text-gray-900 mb-2">Card Title</h3>
  <p className="text-gray-600 text-sm">Card content goes here</p>
</div>
```

### Card with Header

```tsx
<div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
  <div className="bg-gray-50 border-b border-gray-100 px-6 py-4">
    <h3 className="text-lg font-bold text-gray-900">Card Title</h3>
  </div>
  <div className="p-6">
    <p className="text-gray-600">Card content</p>
  </div>
</div>
```

### Card with Actions

```tsx
import { MoreVertical } from 'lucide-react';

function ActionCard({ title, description, onEdit, onDelete }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-10">
              <button
                onClick={() => { onEdit(); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => { onDelete(); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 text-sm"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## State Management Patterns

### useState for Simple State

```tsx
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

### useEffect for Data Fetching

```tsx
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Multiple State with useReducer

```tsx
type State = {
  isOpen: boolean;
  loading: boolean;
  error: string | null;
};

type Action =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

function modalReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'OPEN':
      return { ...state, isOpen: true };
    case 'CLOSE':
      return { ...state, isOpen: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

function Modal() {
  const [state, dispatch] = useReducer(modalReducer, {
    isOpen: false,
    loading: false,
    error: null,
  });
  
  return (
    <div>
      <button onClick={() => dispatch({ type: 'OPEN' })}>Open</button>
      {state.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            {state.loading && <p>Loading...</p>}
            {state.error && <p className="text-red-600">{state.error}</p>}
            <button onClick={() => dispatch({ type: 'CLOSE' })}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Hook Patterns

### Custom Hook for API Calls

```tsx
function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('API request failed');
        const json = await response.json();
        if (isMounted) setData(json);
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchData();
    
    return () => { isMounted = false; };
  }, [url]);
  
  return { data, loading, error };
}

// Usage
function Users() {
  const { data: users, loading, error } = useApi<User[]>('/api/users');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <ul>{users?.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

### Custom Hook for Toggle State

```tsx
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = () => setValue(!value);
  
  return { value, toggle, setValue };
}

// Usage
function Menu() {
  const { value: isOpen, toggle } = useToggle();
  
  return (
    <>
      <button onClick={toggle}>{isOpen ? 'Close' : 'Open'}</button>
      {isOpen && <div>Menu content</div>}
    </>
  );
}
```

### Custom Hook for Outside Click

```tsx
function useClickOutside(ref: RefObject<HTMLDivElement>, callback: () => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, callback]);
}

// Usage in Navbar
function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useClickOutside(dropdownRef, () => setIsProfileOpen(false));
  
  return <div ref={dropdownRef}>{/* Menu */}</div>;
}
```

---

## Error Handling Patterns

### Try-Catch with Toast

```tsx
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  try {
    setLoading(true);
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) throw new Error('Request failed');
    
    showToast('Success!', 'success');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    showToast(`Error: ${message}`, 'error');
  } finally {
    setLoading(false);
  }
}
```

### Async Wrapper for Error Handling

```tsx
function asyncHandler(fn: Function) {
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };
}

// Usage
const handleDelete = asyncHandler(async (id: string) => {
  await fetch(`/api/items/${id}`, { method: 'DELETE' });
});
```

---

## Best Practices

1. **Component Organization**: Group related components in directories
2. **Props Typing**: Always type component props with TypeScript
3. **Key Props**: Always provide unique `key` props in lists
4. **Event Handlers**: Use explicit event types (React.FormEvent, React.MouseEvent)
5. **Cleanup**: Always clean up side effects in useEffect
6. **Accessibility**: Include aria labels for icon-only buttons
7. **Loading States**: Always show loading states for async operations
8. **Error Messages**: Display user-friendly error messages
9. **Responsive Design**: Test on mobile and desktop
10. **Performance**: Use React.memo and useMemo for optimization when needed
