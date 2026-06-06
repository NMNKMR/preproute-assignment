import type { Difficulty, NewQuestion, Question } from '@/api/types'
import { isRichTextEmpty } from '@/lib/richText'

export type CorrectOption = '' | 'option1' | 'option2' | 'option3' | 'option4'

export interface QuestionDraft {
  localId: string
  /** Set when this draft came from an existing saved question (edit mode). */
  serverId?: string
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  correct_option: CorrectOption
  explanation: string
  difficulty: Difficulty | ''
  topic: string
  sub_topic: string
  media_url: string
}

export function makeEmptyDraft(localId: string): QuestionDraft {
  return {
    localId,
    question: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correct_option: '',
    explanation: '',
    difficulty: '',
    topic: '',
    sub_topic: '',
    media_url: '',
  }
}

/** Build an editable draft from a saved question (edit mode hydration). */
export function questionToDraft(q: Question, localId: string): QuestionDraft {
  return {
    localId,
    serverId: q.id,
    question: q.question ?? '',
    option1: q.option1 ?? '',
    option2: q.option2 ?? '',
    option3: q.option3 ?? '',
    option4: q.option4 ?? '',
    correct_option: q.correct_option ?? '',
    explanation: q.explanation ?? '',
    difficulty: q.difficulty ?? '',
    topic: q.topic ?? '',
    sub_topic: q.sub_topic ?? '',
    media_url: q.media_url ?? '',
  }
}

/** Reset every editable field but keep identity (localId + serverId). */
export function clearDraft(d: QuestionDraft): QuestionDraft {
  return { ...makeEmptyDraft(d.localId), serverId: d.serverId }
}

/** A draft is complete when it has body text, all four options, and a marked answer. */
export function isDraftComplete(d: QuestionDraft): boolean {
  return (
    !isRichTextEmpty(d.question) &&
    d.option1.trim() !== '' &&
    d.option2.trim() !== '' &&
    d.option3.trim() !== '' &&
    d.option4.trim() !== '' &&
    d.correct_option !== ''
  )
}

/** Human-readable reason a draft is not yet complete (first failing rule). */
export function draftError(d: QuestionDraft): string | null {
  if (isRichTextEmpty(d.question)) return 'Question text is required'
  if ([d.option1, d.option2, d.option3, d.option4].some((o) => !o.trim()))
    return 'All four options are required'
  if (d.correct_option === '') return 'Select the correct option'
  return null
}

export type QuestionFields = Omit<NewQuestion, 'test_id'>

/** Shared field mapping for create + update payloads (omits blank optionals). */
function draftToFields(d: QuestionDraft, subjectId: string): QuestionFields {
  const fields: QuestionFields = {
    type: 'mcq',
    question: d.question,
    option1: d.option1,
    option2: d.option2,
    option3: d.option3,
    option4: d.option4,
    correct_option: d.correct_option as Exclude<CorrectOption, ''>,
    subject: subjectId,
  }
  // Only include optional fields when filled — the API rejects null values.
  if (d.explanation.trim()) fields.explanation = d.explanation.trim()
  if (d.difficulty) fields.difficulty = d.difficulty
  if (d.topic) fields.topic = d.topic
  if (d.sub_topic) fields.sub_topic = d.sub_topic
  if (d.media_url.trim()) fields.media_url = d.media_url.trim()
  return fields
}

/** Payload for POST /questions/bulk (create). */
export function draftToPayload(
  d: QuestionDraft,
  testId: string,
  subjectId: string,
): NewQuestion {
  return { ...draftToFields(d, subjectId), test_id: testId }
}

/** Payload for PUT /questions/:id (update existing). */
export function draftToUpdatePayload(
  d: QuestionDraft,
  subjectId: string,
): QuestionFields {
  return draftToFields(d, subjectId)
}
