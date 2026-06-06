/** Every PrepRoute endpoint wraps its payload in this envelope. */
export interface ApiEnvelope<T> {
  status: 'success' | 'error'
  message: string
  data: T
}

export interface AuthUser {
  id: string
  userId: string
  name: string
  role: string
  subrole?: string | null
  [key: string]: unknown
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

export interface Subject {
  id: string
  name: string
}

export interface Topic {
  id: string
  name: string
  subject_id: string
}

export interface SubTopic {
  id: string
  name: string
  topic_id: string
}

export type TestType = 'chapterwise' | 'pyq' | 'mock'
export type Difficulty = 'easy' | 'medium' | 'difficult'
export type TestStatus = 'draft' | 'live' | null

/** Shape returned by GET /tests and GET /tests/:id (topics/sub_topics are NAMES here). */
export interface Test {
  id: string
  name: string
  type: TestType
  subject: string
  topics: string[]
  sub_topics: string[]
  questions: string[] | null
  correct_marks: number
  wrong_marks: number
  unattempt_marks: number
  difficulty: Difficulty
  total_marks: number
  total_time: number
  total_questions: number
  status: TestStatus
  scheduled_date: string | null
  expiry_date: string | null
  created_at: string
  updated_at: string | null
}

/** Payload for POST /tests (topics/sub_topics are UUIDs here). */
export interface CreateTestPayload {
  name: string
  type: TestType
  subject: string
  topics: string[]
  sub_topics: string[]
  correct_marks: number
  wrong_marks: number
  unattempt_marks: number
  difficulty: Difficulty
  total_time: number
  total_marks: number
  total_questions: number
  status: TestStatus
}

export interface Question {
  id: string
  type: 'mcq'
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  correct_option: 'option1' | 'option2' | 'option3' | 'option4'
  subject?: string
  explanation?: string | null
  difficulty?: Difficulty | null
  topic?: string | null
  sub_topic?: string | null
  media_url?: string | null
  test_id: string
}

/**
 * Payload for POST /questions/bulk. `subject` (UUID) is REQUIRED by the API.
 * Optional fields must be omitted when blank — the backend rejects explicit null.
 */
export interface NewQuestion {
  type: 'mcq'
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  correct_option: 'option1' | 'option2' | 'option3' | 'option4'
  subject: string
  test_id: string
  explanation?: string
  difficulty?: Difficulty
  topic?: string
  sub_topic?: string
  media_url?: string
}
