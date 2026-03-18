/**
 * cn.ts - Tailwind class name merger
 * Wrapper for clsx + tailwind-merge
 *
 * [Ver001.000]
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export default cn
