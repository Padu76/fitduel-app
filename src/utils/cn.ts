import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes with proper precedence
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 * 
 * @param inputs - Class values to be merged
 * @returns Merged and deduplicated class string
 * 
 * @example
 * cn('px-2 py-1', 'px-4') // Returns: 'py-1 px-4'
 * cn('bg-red-500', condition && 'bg-blue-500') // Conditional classes
 * cn(['text-sm', 'font-bold'], { 'text-red-500': isError }) // Multiple formats
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}