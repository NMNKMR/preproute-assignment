import type { Test, TestType } from '@/api/types'

export type StatusFilter = 'all' | 'draft' | 'live'
export type TypeFilter = 'all' | TestType

/** Mirrors the query params a paginated `GET /tests` would eventually accept. */
export interface TestFilters {
  search: string
  status: StatusFilter
  type: TypeFilter
  page: number
  limit: number
}

export const DEFAULT_FILTERS: TestFilters = {
  search: '',
  status: 'all',
  type: 'all',
  page: 1,
  limit: 10,
}

export interface PaginatedTests {
  items: Test[]
  total: number
  totalPages: number
  page: number
  limit: number
}

/**
 * Client-side stand-in for server-side filtering + pagination. Lives here (and is
 * applied inside `useTests`) so the page component stays agnostic about WHERE the
 * filtering happens. When the API supports `?search&status&type&page&limit`, this
 * function and its call in the hook can be deleted with no page changes.
 */
export function filterAndPaginateTests(
  tests: Test[],
  filters: TestFilters,
): PaginatedTests {
  const term = filters.search.trim().toLowerCase()

  const filtered = tests.filter((t) => {
    const matchesTerm =
      !term ||
      t.name.toLowerCase().includes(term) ||
      (t.subject?.toLowerCase().includes(term) ?? false)
    const matchesStatus =
      filters.status === 'all' || (t.status ?? '') === filters.status
    const matchesType = filters.type === 'all' || t.type === filters.type
    return matchesTerm && matchesStatus && matchesType
  })

  const total = filtered.length
  const limit = Math.max(1, filters.limit)
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const page = Math.min(Math.max(1, filters.page), totalPages)
  const start = (page - 1) * limit
  const items = filtered.slice(start, start + limit)

  return { items, total, totalPages, page, limit }
}
