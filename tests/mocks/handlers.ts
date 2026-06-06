import { http, HttpResponse } from 'msw'
import { API_BASE_URL } from '@/lib/env'
import {
  questions,
  subTopicsByTopic,
  subjects,
  tests,
  topicsBySubject,
} from '@tests/mocks/fixtures'

const url = (path: string) => `${API_BASE_URL}${path}`

const ok = <T,>(data: T, message = 'ok') =>
  HttpResponse.json({ status: 'success', message, data })

/** Default happy-path handlers. Individual tests override with server.use(). */
export const handlers = [
  http.post(url('/auth/login'), async ({ request }) => {
    const body = (await request.json()) as { userId: string; password: string }
    if (body.userId === 'vedant-admin' && body.password === 'vedant123') {
      return ok(
        {
          token: 'test-jwt-token',
          user: {
            id: '1',
            userId: 'vedant-admin',
            name: 'VEDANT BOSS',
            role: 'admin',
          },
        },
        'Login successful',
      )
    }
    return HttpResponse.json(
      { status: 'error', message: 'Invalid credentials', data: null },
      { status: 401 },
    )
  }),

  http.get(url('/subjects'), () => ok(subjects)),

  http.get(url('/topics/subject/:subjectId'), ({ params }) =>
    ok(topicsBySubject[params.subjectId as string] ?? []),
  ),

  http.post(url('/sub-topics/multi-topics'), async ({ request }) => {
    const { topicIds } = (await request.json()) as { topicIds: string[] }
    const result = topicIds.flatMap((id) => subTopicsByTopic[id] ?? [])
    return ok(result)
  }),

  http.get(url('/tests'), () => ok(tests)),

  http.get(url('/tests/:id'), ({ params }) => {
    const found = tests.find((t) => t.id === params.id)
    if (!found) {
      return HttpResponse.json(
        { status: 'error', message: 'Not found', data: null },
        { status: 404 },
      )
    }
    return ok(found)
  }),

  http.post(url('/tests'), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return ok({ ...body, id: 'new-test-id' }, 'Test created successfully')
  }),

  http.put(url('/tests/:id'), async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return ok({ id: params.id, ...body }, 'Test updated successfully')
  }),

  http.delete(url('/tests/:id'), () => ok(null, 'Test deleted')),

  http.post(url('/questions/bulk'), async ({ request }) => {
    const { questions } = (await request.json()) as {
      questions: Record<string, unknown>[]
    }
    return ok(
      questions.map((q, i) => ({ ...q, id: `q-${i + 1}` })),
      `Successfully created ${questions.length} questions`,
    )
  }),

  http.post(url('/questions/fetchBulk'), async ({ request }) => {
    const { question_ids } = (await request.json()) as {
      question_ids: string[]
    }
    return ok(question_ids.map((id) => questions[id] ?? { id }))
  }),

  http.put(url('/questions/:id'), async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return ok({ id: params.id, ...body }, 'Question updated successfully')
  }),

  http.delete(url('/questions/:id'), () => ok(null, 'Question deleted')),
]
