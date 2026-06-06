import { describe, expect, it } from 'vitest'
import {
  clearDraft,
  draftError,
  draftToPayload,
  draftToUpdatePayload,
  isDraftComplete,
  makeEmptyDraft,
  questionToDraft,
} from '@/features/tests/questionDraft'
import type { Question } from '@/api/types'

function completeDraft() {
  return {
    ...makeEmptyDraft('x'),
    question: '<p>What is 2 + 2?</p>',
    option1: '3',
    option2: '4',
    option3: '5',
    option4: '6',
    correct_option: 'option2' as const,
  }
}

describe('questionDraft', () => {
  it('treats a fully filled draft as complete', () => {
    expect(isDraftComplete(completeDraft())).toBe(true)
    expect(draftError(completeDraft())).toBeNull()
  })

  it('flags empty question body', () => {
    const d = { ...completeDraft(), question: '<p><br></p>' }
    expect(isDraftComplete(d)).toBe(false)
    expect(draftError(d)).toMatch(/question text/i)
  })

  it('flags missing options', () => {
    const d = { ...completeDraft(), option3: '  ' }
    expect(draftError(d)).toMatch(/four options/i)
  })

  it('flags missing correct option', () => {
    const d = { ...completeDraft(), correct_option: '' as const }
    expect(draftError(d)).toMatch(/correct option/i)
  })

  it('maps a draft to the bulk-create payload shape', () => {
    const payload = draftToPayload(completeDraft(), 'test-9', 'subject-9')
    expect(payload).toMatchObject({
      type: 'mcq',
      question: '<p>What is 2 + 2?</p>',
      correct_option: 'option2',
      subject: 'subject-9',
      test_id: 'test-9',
    })
    // optional fields are omitted (not null) when blank — API rejects null
    expect('explanation' in payload).toBe(false)
    expect('difficulty' in payload).toBe(false)
  })

  it('includes optional fields only when filled', () => {
    const d = {
      ...completeDraft(),
      explanation: 'Because math.',
      difficulty: 'easy' as const,
      topic: 'Grammar',
    }
    const payload = draftToPayload(d, 'test-9', 'subject-9')
    expect(payload.explanation).toBe('Because math.')
    expect(payload.difficulty).toBe('easy')
    expect(payload.topic).toBe('Grammar')
    expect('sub_topic' in payload).toBe(false)
  })

  it('hydrates a draft from a saved question, keeping its serverId', () => {
    const q: Question = {
      id: 'q-77',
      type: 'mcq',
      question: '<p>Hi?</p>',
      option1: 'a',
      option2: 'b',
      option3: 'c',
      option4: 'd',
      correct_option: 'option3',
      explanation: 'because',
      difficulty: 'medium',
      topic: 'Grammar',
      sub_topic: null,
      media_url: null,
      test_id: 't1',
    }
    const d = questionToDraft(q, 'local-1')
    expect(d).toMatchObject({
      localId: 'local-1',
      serverId: 'q-77',
      question: '<p>Hi?</p>',
      correct_option: 'option3',
      explanation: 'because',
      difficulty: 'medium',
      topic: 'Grammar',
      sub_topic: '',
      media_url: '',
    })
  })

  it('builds an update payload without test_id', () => {
    const payload = draftToUpdatePayload(completeDraft(), 'subject-9')
    expect(payload).toMatchObject({ subject: 'subject-9', correct_option: 'option2' })
    expect('test_id' in payload).toBe(false)
  })

  it('clears all fields but keeps identity', () => {
    const d = { ...completeDraft(), localId: 'L1', serverId: 'S1' }
    const cleared = clearDraft(d)
    expect(cleared.localId).toBe('L1')
    expect(cleared.serverId).toBe('S1')
    expect(cleared.question).toBe('')
    expect(cleared.option1).toBe('')
    expect(cleared.correct_option).toBe('')
  })
})
