import { useState } from 'react'
import {
  Check,
  ChevronsLeft,
  ChevronsRight,
  CircleDot,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

export interface QuestionSidebarItem {
  /** Stable React key (e.g. draft localId or question id). */
  key: string
  complete?: boolean
}

interface QuestionSidebarProps {
  items: QuestionSidebarItem[]
  currentIndex: number
  onSelect: (index: number) => void
  /** Number shown in the "Total Questions" label. Defaults to items.length. */
  totalCount?: number
  title?: string
  /** When provided, an Add button is shown ("+" icon when collapsed). */
  onAdd?: () => void
  addLabel?: string
  /** When provided, a delete icon is shown on each item. */
  onDelete?: (index: number) => void
}

/**
 * Question navigation rail shared by Add-Questions and Preview. Collapses to a
 * compact numbers-only strip via the chevron toggle.
 */
export function QuestionSidebar({
  items,
  currentIndex,
  onSelect,
  totalCount,
  title = 'Question creation',
  onAdd,
  addLabel = 'Add Question',
  onDelete,
}: QuestionSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'shrink-0 self-start rounded-xl border border-line p-3 transition-all',
        collapsed ? 'w-16' : 'w-full lg:w-56',
      )}
    >
      <div
        className={cn(
          'flex items-center',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        {!collapsed && (
          <p className="text-sm font-semibold text-ink">{title}</p>
        )}
        <button
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((c) => !c)}
          className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-gray-100"
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {!collapsed && (
        <p className="mt-1 text-xs text-muted">
          Total Questions · {totalCount ?? items.length}
        </p>
      )}

      <ul className={cn('mt-4 space-y-2', collapsed && 'flex flex-col items-center')}>
        {items.map((item, i) => {
          const active = i === currentIndex
          const StatusIcon = item.complete ? Check : CircleDot
          const statusColor = item.complete ? 'text-emerald-500' : 'text-gray-300'
          // Keep at least one item; mirror the footer's "delete" affordance.
          const canDelete = Boolean(onDelete) && items.length > 1

          if (collapsed) {
            return (
              <li key={item.key} className="group relative">
                <button
                  type="button"
                  title={`Question ${i + 1}`}
                  onClick={() => onSelect(i)}
                  className={cn(
                    'relative grid h-9 w-9 place-items-center rounded-lg border text-sm font-medium transition-colors',
                    active
                      ? 'border-brand-300 bg-brand-50 text-brand-700'
                      : 'border-line text-ink hover:bg-gray-50',
                  )}
                >
                  {i + 1}
                  <StatusIcon
                    className={cn(
                      'absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-white',
                      statusColor,
                    )}
                  />
                </button>
                {canDelete && (
                  <button
                    type="button"
                    aria-label={`Delete question ${i + 1}`}
                    title={`Delete question ${i + 1}`}
                    onClick={() => onDelete!(i)}
                    className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-white text-gray-400 opacity-0 shadow-sm transition-opacity hover:text-red-500 focus:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </li>
            )
          }

          return (
            <li key={item.key} className="group relative">
              <button
                type="button"
                onClick={() => onSelect(i)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg border py-2 pl-3 text-sm transition-colors',
                  canDelete ? 'pr-9' : 'pr-3',
                  active
                    ? 'border-brand-300 bg-brand-50 text-brand-700'
                    : 'border-line text-ink hover:bg-gray-50',
                )}
              >
                <StatusIcon className={cn('h-4 w-4', statusColor)} />
                Question {i + 1}
              </button>
              {canDelete && (
                <button
                  type="button"
                  aria-label={`Delete question ${i + 1}`}
                  title={`Delete question ${i + 1}`}
                  onClick={() => onDelete!(i)}
                  className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 focus:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          )
        })}
      </ul>

      {onAdd &&
        (collapsed ? (
          <button
            type="button"
            aria-label={addLabel}
            title={addLabel}
            onClick={onAdd}
            className="mx-auto mt-4 grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100"
          >
            <Plus className="h-4 w-4" />
          </button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="mt-4 w-full"
            onClick={onAdd}
          >
            <Plus className="h-4 w-4" /> {addLabel}
          </Button>
        ))}
    </aside>
  )
}
