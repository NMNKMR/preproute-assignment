import { cn } from '@/lib/cn'

/** PrepRoute wordmark. `className` controls sizing (defaults to a sensible height). */
export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="PrepRoute"
      className={cn('h-8 w-auto select-none', className)}
    />
  )
}
