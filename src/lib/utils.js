import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge Tailwind CSS class names.
 * Combines clsx (conditional class logic) with tailwind-merge (conflict resolution).
 * This is the standard shadcn/ui pattern.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
