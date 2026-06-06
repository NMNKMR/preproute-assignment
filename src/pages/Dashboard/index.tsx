import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { ApiError } from '@/api/client'
import type { Test } from '@/api/types'
import { useDeleteTest, useTests } from '@/features/tests/queries'
import { DEFAULT_FILTERS } from '@/features/tests/filterTests'
import type { StatusFilter, TestFilters } from '@/features/tests/filterTests'
import { TestTable } from './components/TestTable'

const STATUS_TABS: StatusFilter[] = ['all', 'draft', 'live']

const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'chapterwise', label: 'Chapter Wise' },
  { value: 'pyq', label: 'PYQ' },
  { value: 'mock', label: 'Mock Test' },
]

export function Dashboard() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<TestFilters>(DEFAULT_FILTERS)
  const [pendingDelete, setPendingDelete] = useState<Test | null>(null)

  const { tests, total, totalPages, page, limit, allCount, isLoading, isError, error, refetch } =
    useTests(filters)
  const deleteTest = useDeleteTest()

  // Any filter change resets to page 1; explicit page changes are respected.
  function patchFilters(patch: Partial<TestFilters>) {
    setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }))
  }

  function confirmDelete() {
    if (!pendingDelete) return
    deleteTest.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success('Test deleted')
        setPendingDelete(null)
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : 'Delete failed')
        setPendingDelete(null)
      },
    })
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Tests</h1>
          <p className="mt-1 text-sm text-muted">
            Create, manage and publish your tests.
          </p>
        </div>
        <Button onClick={() => navigate('/tests/new')}>
          <Plus className="h-4 w-4" /> Create New Test
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={filters.search}
            onChange={(e) => patchFilters({ search: e.target.value })}
            placeholder="Search by name or subject"
            aria-label="Search tests"
            className="h-10 w-full rounded-lg border border-line pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div className="flex gap-1 rounded-lg border border-line p-1">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => patchFilters({ status: s })}
              className={
                'rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ' +
                (filters.status === s
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-muted hover:text-ink')
              }
            >
              {s}
            </button>
          ))}
        </div>

        <div className="w-40">
          <Select
            testId="type-filter"
            className="h-10"
            options={TYPE_OPTIONS}
            value={filters.type}
            onChange={(v) => patchFilters({ type: v as TestFilters['type'] })}
          />
        </div>
      </div>

      {/* Content */}
      <div className="mt-4 overflow-hidden rounded-xl border border-line">
        {isLoading ? (
          <LoadingState label="Loading tests…" />
        ) : isError ? (
          <ErrorState
            message={error instanceof ApiError ? error.message : undefined}
            onRetry={() => refetch()}
          />
        ) : total === 0 ? (
          <EmptyState
            title={allCount ? 'No matching tests' : 'No tests yet'}
            description={
              allCount
                ? 'Try a different search or filter.'
                : 'Create your first test to get started.'
            }
            action={
              !allCount ? (
                <Button onClick={() => navigate('/tests/new')}>
                  <Plus className="h-4 w-4" /> Create New Test
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <TestTable
              tests={tests}
              onView={(t) => navigate(`/tests/${t.id}/preview`)}
              onEdit={(t) => navigate(`/tests/${t.id}/edit`)}
              onDelete={setPendingDelete}
            />
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={(p) => patchFilters({ page: p })}
              onLimitChange={(l) => patchFilters({ limit: l })}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete test?"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" will be permanently removed.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        loading={deleteTest.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
