import { api, unwrap } from '@/api/client'
import type {
  CreateTestPayload,
  NewQuestion,
  Question,
  SubTopic,
  Subject,
  Test,
  Topic,
} from '@/api/types'

export function getSubjects() {
  return unwrap<Subject[]>(api.get('/subjects'))
}

export function getTopicsBySubject(subjectId: string) {
  return unwrap<Topic[]>(api.get(`/topics/subject/${subjectId}`))
}

export function getSubTopicsByTopics(topicIds: string[]) {
  if (topicIds.length === 0) return Promise.resolve<SubTopic[]>([])
  return unwrap<SubTopic[]>(
    api.post('/sub-topics/multi-topics', { topicIds }),
  )
}

export function getTests() {
  return unwrap<Test[]>(api.get('/tests'))
}

export function getTest(id: string) {
  return unwrap<Test>(api.get(`/tests/${id}`))
}

export function createTest(payload: CreateTestPayload) {
  return unwrap<Test>(api.post('/tests', payload))
}

export function updateTest(id: string, payload: Partial<Test>) {
  return unwrap<Test>(api.put(`/tests/${id}`, payload))
}

export function deleteTest(id: string) {
  return unwrap<unknown>(api.delete(`/tests/${id}`))
}

export function bulkCreateQuestions(questions: NewQuestion[]) {
  return unwrap<Question[]>(api.post('/questions/bulk', { questions }))
}

export function updateQuestion(id: string, payload: Partial<NewQuestion>) {
  return unwrap<Question>(api.put(`/questions/${id}`, payload))
}

export function deleteQuestion(id: string) {
  return unwrap<unknown>(api.delete(`/questions/${id}`))
}

export function fetchBulkQuestions(questionIds: string[]) {
  if (questionIds.length === 0) return Promise.resolve<Question[]>([])
  return unwrap<Question[]>(
    api.post('/questions/fetchBulk', { question_ids: questionIds }),
  )
}
