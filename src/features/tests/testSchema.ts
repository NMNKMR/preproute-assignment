import { z } from 'zod'

export const TEST_TYPES = [
  { value: 'chapterwise', label: 'Chapter Wise' },
  { value: 'pyq', label: 'PYQ' },
  { value: 'mock', label: 'Mock Test' },
] as const

export const DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'difficult', label: 'Difficult' },
] as const

export const testSchema = z.object({
  type: z.enum(['chapterwise', 'pyq', 'mock']),
  name: z.string().trim().min(1, 'Test name is required'),
  subject: z.string().min(1, 'Subject is required'),
  topics: z.array(z.string()).min(1, 'Select at least one topic'),
  sub_topics: z.array(z.string()),
  difficulty: z.enum(['easy', 'medium', 'difficult']),
  total_time: z
    .number({ message: 'Enter duration' })
    .int('Whole minutes only')
    .positive('Duration must be greater than 0'),
  total_questions: z
    .number({ message: 'Enter number of questions' })
    .int()
    .positive('Must be greater than 0'),
  total_marks: z
    .number({ message: 'Enter total marks' })
    .positive('Must be greater than 0'),
  correct_marks: z.number({ message: 'Required' }),
  wrong_marks: z.number({ message: 'Required' }),
  unattempt_marks: z.number({ message: 'Required' }),
})

export type TestFormValues = z.infer<typeof testSchema>

export const defaultTestValues: TestFormValues = {
  type: 'chapterwise',
  name: '',
  subject: '',
  topics: [],
  sub_topics: [],
  difficulty: 'easy',
  total_time: 60,
  total_questions: 5,
  total_marks: 20,
  correct_marks: 4,
  wrong_marks: -1,
  unattempt_marks: 0,
}
