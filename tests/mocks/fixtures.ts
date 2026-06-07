import type { Question, Subject, SubTopic, Test, Topic } from '@/api/types'

export const subjects: Subject[] = [
  { id: 'sub-eng', name: 'English' },
  { id: 'sub-gat', name: 'General Aptitude Test' },
]

export const topicsBySubject: Record<string, Topic[]> = {
  'sub-eng': [
    { id: 'top-gram', name: 'Grammar', subject_id: 'sub-eng' },
    { id: 'top-vocab', name: 'Vocabulary', subject_id: 'sub-eng' },
  ],
  'sub-gat': [{ id: 'top-dice', name: 'Dice', subject_id: 'sub-gat' }],
}

export const subTopicsByTopic: Record<string, SubTopic[]> = {
  'top-gram': [
    { id: 'st-app', name: 'Application', topic_id: 'top-gram' },
    { id: 'st-tense', name: 'Tenses', topic_id: 'top-gram' },
  ],
  'top-vocab': [{ id: 'st-syn', name: 'Synonyms', topic_id: 'top-vocab' }],
  'top-dice': [{ id: 'st-games', name: 'Games', topic_id: 'top-dice' }],
}

export const questions: Record<string, Question> = {
  q1: {
    id: 'q1',
    type: 'mcq',
    question: '<p>What is 2 + 2?</p>',
    option1: '3',
    option2: '4',
    option3: '5',
    option4: '6',
    correct_option: 'option2',
    explanation: 'Basic addition.',
    difficulty: 'easy',
    media_url: 'https://example.com/q1.png',
    test_id: 'test-2',
  },
  q2: {
    id: 'q2',
    type: 'mcq',
    question: '<p>Capital of France?</p>',
    option1: 'Berlin',
    option2: 'Madrid',
    option3: 'Paris',
    option4: 'Rome',
    correct_option: 'option3',
    explanation: null,
    difficulty: 'easy',
    test_id: 'test-2',
  },
}

export const tests: Test[] = [
  {
    id: 'test-1',
    name: 'Algebra Basics',
    type: 'chapterwise',
    subject: 'English',
    topics: ['Grammar'],
    sub_topics: ['Application'],
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
    created_at: '2026-05-01T10:00:00Z',
    updated_at: null,
  },
  {
    id: 'test-2',
    name: 'Aptitude Mock',
    type: 'mock',
    subject: 'General Aptitude Test',
    topics: ['Dice'],
    sub_topics: ['Games'],
    questions: ['q1', 'q2'],
    correct_marks: 5,
    wrong_marks: -1,
    unattempt_marks: 0,
    difficulty: 'medium',
    total_marks: 100,
    total_time: 90,
    total_questions: 2,
    status: 'live',
    scheduled_date: null,
    expiry_date: null,
    created_at: '2026-05-10T10:00:00Z',
    updated_at: '2026-05-11T10:00:00Z',
  },
]
