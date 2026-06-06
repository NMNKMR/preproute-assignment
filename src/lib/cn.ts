import clsx from 'clsx'
import type { ClassValue } from 'clsx'

/** Tiny class-name combiner. (Tailwind v4; no twMerge needed for our usage.) */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}
