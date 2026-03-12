import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn - Class name utility
 * Merges Tailwind classes, handles conflicts
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
