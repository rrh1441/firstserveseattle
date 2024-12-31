// src/lib/utils.ts
import { clsx, ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge class names conditionally.
 * Combines Tailwind classes and removes duplicates.
 */
export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes))
}
