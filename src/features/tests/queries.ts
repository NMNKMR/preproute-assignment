import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bulkCreateQuestions,
  createTest,
  deleteTest,
  fetchBulkQuestions,
  getSubTopicsByTopics,
  getSubjects,
  getTest,
  getTests,
  getTopicsBySubject,
  updateTest,
} from './api'
import { filterAndPaginateTests } from './filterTests'
import type { TestFilters } from './filterTests'
import type { CreateTestPayload, NewQuestion, Test } from '@/api/types'

export const testKeys = {
  all: ['tests'] as const,
  list: () => [...testKeys.all, 'list'] as const,
  detail: (id: string) => [...testKeys.all, 'detail', id] as const,
}

export const taxonomyKeys = {
  subjects: ['subjects'] as const,
  topics: (subjectId: string) => ['topics', subjectId] as const,
  subTopics: (topicIds: string[]) => ['subtopics', ...topicIds] as const,
}

export function useSubjects() {
  return useQuery({
    queryKey: taxonomyKeys.subjects,
    queryFn: getSubjects,
    staleTime: 5 * 60_000,
  })
}

export function useTopics(subjectId: string | undefined) {
  return useQuery({
    queryKey: taxonomyKeys.topics(subjectId ?? ''),
    queryFn: () => getTopicsBySubject(subjectId!),
    enabled: Boolean(subjectId),
  })
}

export function useSubTopics(topicIds: string[]) {
  return useQuery({
    queryKey: taxonomyKeys.subTopics(topicIds),
    queryFn: () => getSubTopicsByTopics(topicIds),
    enabled: topicIds.length > 0,
  })
}

/**
 * Lists tests with filtering + pagination owned by the hook.
 *
 * Today the API returns the full list, so we fetch once and filter/paginate on
 * the client. The page component only consumes the returned `items` + meta and
 * never knows the difference.
 *
 * When the API supports `?search&status&type&page&limit`:
 *   1. add `filters` to the query key: `testKeys.list(filters)`
 *   2. pass them to the request: `getTests(filters)`
 *   3. delete the `filterAndPaginateTests` block below and return the API's
 *      data + meta directly.
 * No change to the page component is required.
 */
export function useTests(filters: TestFilters) {
  const query = useQuery({ queryKey: testKeys.list(), queryFn: getTests })

  const result = useMemo(
    () => filterAndPaginateTests(query.data ?? [], filters),
    [query.data, filters],
  )

  return {
    ...query,
    tests: result.items,
    total: result.total,
    totalPages: result.totalPages,
    page: result.page,
    limit: result.limit,
    allCount: query.data?.length ?? 0,
  }
}

export function useTest(id: string | undefined) {
  return useQuery({
    queryKey: testKeys.detail(id ?? ''),
    queryFn: () => getTest(id!),
    enabled: Boolean(id),
  })
}

export function useCreateTest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTestPayload) => createTest(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: testKeys.list() }),
  })
}

export function useUpdateTest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Test> }) =>
      updateTest(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: testKeys.list() })
      qc.invalidateQueries({ queryKey: testKeys.detail(vars.id) })
    },
  })
}

export function useDeleteTest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: testKeys.list() }),
  })
}

export function useBulkCreateQuestions() {
  return useMutation({
    mutationFn: (questions: NewQuestion[]) => bulkCreateQuestions(questions),
  })
}

export function useFetchBulkQuestions() {
  return useMutation({
    mutationFn: (ids: string[]) => fetchBulkQuestions(ids),
  })
}

export function useQuestions(ids: string[] | null | undefined) {
  const list = ids ?? []
  
  return useQuery({
    queryKey: ['questions', ...list],
    queryFn: () => fetchBulkQuestions(list),
    enabled: list.length > 0,
  })
}
