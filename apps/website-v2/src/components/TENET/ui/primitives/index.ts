/** [Ver001.000] */
/**
 * TENET UI Primitives
 * ===================
 * Base UI components exported for use across the application.
 */

export { Button, type ButtonProps } from './Button';
export { Input, type InputProps } from './Input';

// Placeholder exports for remaining primitives
// These will be implemented in subsequent iterations

export const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
    {children}
  </span>
);

export const Avatar = ({ src, alt }: { src?: string; alt?: string }) => (
  <img
    src={src || 'https://via.placeholder.com/40'}
    alt={alt || 'Avatar'}
    className="inline-block h-10 w-10 rounded-full"
  />
);

export const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={`animate-spin h-5 w-5 text-primary-600 ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// Re-export from actual implementations when available
export { default as Checkbox } from './Checkbox';
export { default as Radio } from './Radio';
export { default as Switch } from './Switch';
export { default as Select } from './Select';
export { default as Textarea } from './Textarea';
