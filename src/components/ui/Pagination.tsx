import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
  limitOptions?: number[]
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions = [5, 10, 20, 50],
}: PaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm sm:flex-row">
      <div className="flex items-center gap-3 text-muted">
        <span>
          Showing <span className="font-medium text-ink">{start}</span>–
          <span className="font-medium text-ink">{end}</span> of{' '}
          <span className="font-medium text-ink">{total}</span>
        </span>
        {onLimitChange && (
          <label className="flex items-center gap-1.5">
            <span className="hidden sm:inline">Rows</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              aria-label="Rows per page"
              className="h-8 rounded-md border border-line bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {limitOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1">
        <PageButton
          ariaLabel="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </PageButton>

        {pageWindow(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-2 text-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'h-8 min-w-8 rounded-md px-2 text-sm font-medium transition-colors',
                p === page
                  ? 'bg-brand-500 text-white'
                  : 'text-ink hover:bg-gray-100',
              )}
            >
              {p}
            </button>
          ),
        )}

        <PageButton
          ariaLabel="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </PageButton>
      </div>
    </div>
  )
}

function PageButton({
  children,
  ariaLabel,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  ariaLabel: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-md border border-line text-muted hover:bg-gray-50 disabled:opacity-40"
    >
      {children}
    </button>
  )
}

/** Windowed page numbers, e.g. 1 … 4 5 [6] 7 8 … 20 */
function pageWindow(page: number, totalPages: number): (number | '…')[] {
  const pages: (number | '…')[] = []
  const push = (p: number) => pages.push(p)

  if (totalPages <= 7) {
    for (let p = 1; p <= totalPages; p++) push(p)
    return pages
  }

  push(1)
  const left = Math.max(2, page - 1)
  const right = Math.min(totalPages - 1, page + 1)
  if (left > 2) pages.push('…')
  for (let p = left; p <= right; p++) push(p)
  if (right < totalPages - 1) pages.push('…')
  push(totalPages)
  return pages
}
