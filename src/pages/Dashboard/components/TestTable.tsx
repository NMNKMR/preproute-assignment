import type { ReactNode } from 'react'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/format'
import type { Test, TestStatus } from '@/api/types'

interface TestTableProps {
  tests: Test[]
  onView: (t: Test) => void
  onEdit: (t: Test) => void
  onDelete: (t: Test) => void
}

export function TestTable({ tests, onView, onEdit, onDelete }: TestTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-brand-50 text-xs uppercase tracking-wide text-brand-700">
          <tr>
            <th className="px-4 py-3 font-semibold">Name</th>
            <th className="px-4 py-3 font-semibold">Subject</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Created</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {tests.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-ink">{t.name}</td>
              <td className="px-4 py-3 text-muted">{t.subject || '—'}</td>
              <td className="px-4 py-3 capitalize text-muted">
                {prettyType(t.type)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={t.status as TestStatus} />
              </td>
              <td className="px-4 py-3 text-muted">{formatDate(t.created_at)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <IconButton label="View" onClick={() => onView(t)}>
                    <Eye className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Edit" onClick={() => onEdit(t)}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Delete" destructive onClick={() => onDelete(t)}>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function IconButton({
  label,
  children,
  onClick,
  destructive = false,
}: {
  label: string
  children: ReactNode
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={
        'grid h-8 w-8 place-items-center rounded-md text-muted transition-colors hover:bg-gray-100 ' +
        (destructive ? 'hover:text-red-600' : 'hover:text-brand-600')
      }
    >
      {children}
    </button>
  )
}

function prettyType(type: string): string {
  if (type === 'chapterwise') return 'Chapter Wise'
  if (type === 'pyq') return 'PYQ'
  if (type === 'mock') return 'Mock Test'
  return type
}
