import type { TestStatus } from '@/api/types'
import { cn } from '@/lib/cn'

const styles: Record<string, string> = {
  live: 'bg-green-100 text-green-700',
  draft: 'bg-amber-100 text-amber-700',
  none: 'bg-gray-100 text-gray-600',
}

export function StatusBadge({ status }: { status: TestStatus }) {
  const key = status ?? 'none'
  const label = status ? status : 'unsaved'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize',
        styles[key] ?? styles.none,
      )}
    >
      {label}
    </span>
  )
}
