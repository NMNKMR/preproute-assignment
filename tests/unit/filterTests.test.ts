import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FILTERS,
  filterAndPaginateTests,
} from '@/features/tests/filterTests'
import type { TestFilters } from '@/features/tests/filterTests'
import type { Test } from '@/api/types'

function makeTest(over: Partial<Test>): Test {
  return {
    id: 'id',
    name: 'Test',
    type: 'chapterwise',
    subject: 'English',
    topics: [],
    sub_topics: [],
    questions: null,
    correct_marks: 4,
    wrong_marks: -1,
    unattempt_marks: 0,
    difficulty: 'easy',
    total_marks: 40,
    total_time: 60,
    total_questions: 10,
    status: 'draft',
    scheduled_date: null,
    expiry_date: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: null,
    ...over,
  }
}

const sample: Test[] = [
  makeTest({ id: '1', name: 'Algebra', subject: 'Maths', type: 'chapterwise', status: 'draft' }),
  makeTest({ id: '2', name: 'Aptitude Mock', subject: 'GAT', type: 'mock', status: 'live' }),
  makeTest({ id: '3', name: 'History PYQ', subject: 'History', type: 'pyq', status: 'live' }),
]

const filters = (over: Partial<TestFilters> = {}): TestFilters => ({
  ...DEFAULT_FILTERS,
  ...over,
})

describe('filterAndPaginateTests', () => {
  it('returns everything by default', () => {
    const r = filterAndPaginateTests(sample, filters())
    expect(r.items).toHaveLength(3)
    expect(r.total).toBe(3)
    expect(r.totalPages).toBe(1)
  })

  it('filters by search across name and subject', () => {
    expect(filterAndPaginateTests(sample, filters({ search: 'apt' })).items).toHaveLength(1)
    // subject match
    expect(filterAndPaginateTests(sample, filters({ search: 'history' })).items[0].id).toBe('3')
  })

  it('filters by status', () => {
    const r = filterAndPaginateTests(sample, filters({ status: 'live' }))
    expect(r.items.map((t) => t.id)).toEqual(['2', '3'])
  })

  it('filters by type', () => {
    const r = filterAndPaginateTests(sample, filters({ type: 'pyq' }))
    expect(r.items.map((t) => t.id)).toEqual(['3'])
  })

  it('combines filters', () => {
    const r = filterAndPaginateTests(sample, filters({ status: 'live', type: 'mock' }))
    expect(r.items.map((t) => t.id)).toEqual(['2'])
  })

  it('paginates and reports meta', () => {
    const big = Array.from({ length: 25 }, (_, i) =>
      makeTest({ id: `${i}`, name: `T${i}` }),
    )
    const p1 = filterAndPaginateTests(big, filters({ limit: 10, page: 1 }))
    expect(p1.items).toHaveLength(10)
    expect(p1.totalPages).toBe(3)
    expect(p1.total).toBe(25)

    const p3 = filterAndPaginateTests(big, filters({ limit: 10, page: 3 }))
    expect(p3.items).toHaveLength(5)
    expect(p3.items[0].id).toBe('20')
  })

  it('clamps an out-of-range page to the last page', () => {
    const r = filterAndPaginateTests(sample, filters({ limit: 2, page: 99 }))
    expect(r.page).toBe(2)
    expect(r.items).toHaveLength(1)
  })

  it('reports a single empty page when nothing matches', () => {
    const r = filterAndPaginateTests(sample, filters({ search: 'zzz' }))
    expect(r.items).toHaveLength(0)
    expect(r.total).toBe(0)
    expect(r.totalPages).toBe(1)
  })
})
