import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ChevronLeft, ChevronRight, Plus, Trash2, Upload, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { LoadingState, ErrorState } from '@/components/ui/States'
import { Breadcrumb } from '@/components/Breadcrumb'
import { ApiError } from '@/api/client'
import { isRichTextEmpty } from '@/lib/richText'
import { DIFFICULTIES } from '@/features/tests/testSchema'
import { TestSummaryCard } from '@/features/tests/components/TestSummaryCard'
import { QuestionSidebar } from '@/features/tests/components/QuestionSidebar'
import { deleteQuestion, updateQuestion } from '@/features/tests/api'
import { parseQuestionsCsv } from '@/features/tests/csvImport'
import { ClearButton } from './components/ClearButton'
import {
  clearDraft,
  draftError,
  draftToPayload,
  draftToUpdatePayload,
  isDraftComplete,
  makeEmptyDraft,
  questionToDraft,
} from '@/features/tests/questionDraft'
import type { CorrectOption, QuestionDraft } from '@/features/tests/questionDraft'
import {
  useBulkCreateQuestions,
  useQuestions,
  useSubjects,
  useTest,
  useUpdateTest,
} from '@/features/tests/queries'

const OPTION_KEYS = ['option1', 'option2', 'option3', 'option4'] as const

function newId() {
  return crypto.randomUUID()
}

function isEmptyDraft(d: QuestionDraft): boolean {
  return (
    isRichTextEmpty(d.question) &&
    !d.option1 &&
    !d.option2 &&
    !d.option3 &&
    !d.option4 &&
    !d.explanation
  )
}

export function AddQuestions() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const testQuery = useTest(id)
  const subjectsQuery = useSubjects()
  const existingQuestions = useQuestions(testQuery.data?.questions)
  const bulkCreate = useBulkCreateQuestions()
  const updateTest = useUpdateTest()

  const [drafts, setDrafts] = useState<QuestionDraft[]>([makeEmptyDraft(newId())])
  const [current, setCurrent] = useState(0)
  // serverIds of existing questions the user removed; deleted on save.
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const test = testQuery.data

  // Edit mode: hydrate drafts from the test's existing questions, once per test.
  // Done during render (not in an effect) to avoid cascading re-renders.
  const [hydratedFor, setHydratedFor] = useState<string | null>(null)
  if (test && hydratedFor !== test.id) {
    const ids = test.questions ?? []
    const ready = ids.length === 0 || !existingQuestions.isLoading
    if (ready) {
      setHydratedFor(test.id)
      const fetched = existingQuestions.data ?? []
      if (fetched.length > 0) {
        setDrafts(fetched.map((q) => questionToDraft(q, newId())))
        setCurrent(0)
      }
    }
  }

  const draft = drafts[current]

  function patch(partial: Partial<QuestionDraft>) {
    setDrafts((prev) =>
      prev.map((d, i) => (i === current ? { ...d, ...partial } : d)),
    )
  }

  function clearAllEdits() {
    setDrafts((prev) => prev.map((d, i) => (i === current ? clearDraft(d) : d)))
  }

  function addQuestion() {
    setDrafts((prev) => [...prev, makeEmptyDraft(newId())])
    setCurrent(drafts.length)
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const topRef = useRef<HTMLDivElement>(null)

  async function onCsvSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return

    let text: string
    try {
      text = await file.text()
    } catch {
      toast.error('Could not read the file')
      return
    }

    const { questions, errors } = parseQuestionsCsv(text)
    if (questions.length === 0) {
      toast.error(errors[0] ?? 'No valid questions found in the file')
      return
    }

    const imported = questions.map((q) => ({ ...makeEmptyDraft(newId()), ...q }))
    // Replace the lone empty starter draft; otherwise append.
    const onlyEmpty = drafts.length === 1 && isEmptyDraft(drafts[0])
    const base = onlyEmpty ? [] : drafts

    // Respect the configured question limit.
    const remaining = test ? test.total_questions - base.length : imported.length
    if (remaining <= 0) {
      toast.error(`This test already has its ${test?.total_questions} questions`)
      return
    }
    const accepted = imported.slice(0, remaining)
    setDrafts([...base, ...accepted])
    setCurrent(base.length)

    toast.success(
      `Imported ${accepted.length} question${accepted.length > 1 ? 's' : ''}`,
    )
    const skipped = errors.length + (imported.length - accepted.length)
    if (skipped > 0) {
      toast(`${skipped} row${skipped > 1 ? 's' : ''} skipped`, { icon: '⚠️' })
    }
  }

  function removeQuestion(index: number) {
    const removed = drafts[index]
    if (removed?.serverId) {
      setDeletedIds((prev) => [...prev, removed.serverId!])
    }
    setDrafts((prev) => {
      const next = prev.filter((_, i) => i !== index)
      return next.length ? next : [makeEmptyDraft(newId())]
    })
    setCurrent((c) =>
      Math.max(0, c > index ? c - 1 : c === index ? Math.min(c, drafts.length - 2) : c),
    )
  }

  async function saveAndGoToPreview() {
    if (!test || !id) return

    const nonEmpty = drafts.filter((d) => !isEmptyDraft(d))
    if (nonEmpty.length === 0) {
      toast.error('Add at least one question before continuing')
      return
    }
    const incomplete = nonEmpty.find((d) => !isDraftComplete(d))
    if (incomplete) {
      toast.error(draftError(incomplete) ?? 'Some questions are incomplete')
      return
    }

    // Questions require the subject UUID, but getTest only returns its name.
    const subjectId = subjectsQuery.data?.find((s) => s.name === test.subject)?.id
    if (!subjectId) {
      toast.error('Could not resolve the test subject. Please retry.')
      return
    }

    // Existing questions that were cleared out count as deletions too.
    const clearedIds = drafts
      .filter((d) => d.serverId && isEmptyDraft(d))
      .map((d) => d.serverId!)
    const toDelete = Array.from(new Set([...deletedIds, ...clearedIds]))

    setSubmitting(true)
    try {
      // 1. delete removed questions
      if (toDelete.length) {
        await Promise.all(toDelete.map((qid) => deleteQuestion(qid)))
      }
      // 2. update existing (edited) questions
      const existing = nonEmpty.filter((d) => d.serverId)
      await Promise.all(
        existing.map((d) =>
          updateQuestion(d.serverId!, draftToUpdatePayload(d, subjectId)),
        ),
      )
      // 3. create new questions
      const newDrafts = nonEmpty.filter((d) => !d.serverId)
      const created = newDrafts.length
        ? await bulkCreate.mutateAsync(
            newDrafts.map((d) => draftToPayload(d, id, subjectId)),
          )
        : []

      // 4. rebuild the test's question id list in display order
      const createdQueue = created.map((q) => q.id)
      const orderedIds = nonEmpty.map((d) => d.serverId ?? createdQueue.shift()!)

      await updateTest.mutateAsync({
        id,
        // Only the question list changes. total_questions / total_marks stay as
        // configured at creation, and status stays draft (publish is done in Preview).
        payload: { questions: orderedIds },
      })

      queryClient.invalidateQueries({ queryKey: ['questions'] })
      setDeletedIds([])
      toast.success(
        `Saved ${orderedIds.length} question${orderedIds.length > 1 ? 's' : ''}`,
      )
      navigate(`/tests/${id}/preview`)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Could not save questions',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (testQuery.isLoading) return <LoadingState label="Loading test…" />
  if (testQuery.isError || !test)
    return (
      <ErrorState
        message="Could not load this test."
        onRetry={() => testQuery.refetch()}
      />
    )

  // More questions can be added only while we're under the configured count.
  const canAdd = drafts.length < test.total_questions
  const atLastDraft = current === drafts.length - 1
  // On the final required slot with no room left → save instead of "Next".
  const isFinalSlot = atLastDraft && !canAdd

  // Anchor at the top of the editor so advancing scrolls back up (the scroll
  // container is <main>, not the window, so scrollIntoView is the reliable path).
  function scrollToTop() {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // "Next": go to the next draft, or add one (when room) after completing this.
  function handleNext() {
    if (!atLastDraft) {
      setCurrent((c) => c + 1)
      scrollToTop()
      return
    }
    if (!canAdd) return
    if (!isDraftComplete(draft)) {
      toast.error(draftError(draft) ?? 'Complete this question first')
      return
    }
    addQuestion()
    scrollToTop()
  }

  return (
    <div
      ref={topRef}
      className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row"
    >
      {/* Question list rail */}
      <QuestionSidebar
        items={drafts.map((d) => ({
          key: d.localId,
          complete: isDraftComplete(d),
        }))}
        currentIndex={current}
        onSelect={setCurrent}
        totalCount={test.total_questions}
        onAdd={canAdd ? addQuestion : undefined}
        onDelete={removeQuestion}
      />

      {/* Editor column */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <Breadcrumb
            items={[
              { label: 'Test Creation', to: '/dashboard' },
              { label: 'Create Test' },
              { label: 'Add Questions' },
            ]}
          />
          <Button size="sm" onClick={saveAndGoToPreview} loading={submitting}>
            Save &amp; Publish
          </Button>
        </div>

        <div className="mt-4">
          <TestSummaryCard test={test} onEdit={() => navigate(`/tests/${id}/edit`)} />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">
            Question {current + 1}
            <span className="text-brand-500">/{test.total_questions}</span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              aria-label="Previous question"
              disabled={current === 0}
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              className="grid h-8 w-8 place-items-center rounded-md border border-line text-muted hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              aria-label="Next question"
              disabled={current === drafts.length - 1}
              onClick={() => setCurrent((c) => Math.min(drafts.length - 1, c + 1))}
              className="grid h-8 w-8 place-items-center rounded-md border border-line text-muted hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {canAdd && (
              <Button variant="secondary" size="sm" onClick={addQuestion}>
                <Plus className="h-4 w-4" /> MCQ
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              aria-label="Import questions CSV"
              className="hidden"
              onChange={onCsvSelected}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" /> CSV
            </Button>
            <a
              href="/sample-questions.csv"
              download
              className="text-xs text-brand-600 hover:underline"
            >
              sample
            </a>
          </div>
        </div>

        {/* Delete all edits for this question */}
        <button
          type="button"
          onClick={clearAllEdits}
          disabled={isEmptyDraft(draft)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" /> Delete All Edits
        </button>

        {/* Question body */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm font-medium text-ink">Question</p>
          {!isRichTextEmpty(draft.question) && (
            <ClearButton label="Clear question" onClick={() => patch({ question: '' })} />
          )}
        </div>
        <div className="mt-2">
          {/* key per draft → fresh editor instance when switching questions, so
              react-quill never bleeds a stale value between questions. */}
          <RichTextEditor
            key={draft.localId}
            value={draft.question}
            onChange={(html) => patch({ question: html })}
          />
        </div>

        {/* Options */}
        <p className="mt-5 text-sm font-medium text-ink">Type the options below</p>
        <div className="mt-2 space-y-3">
          {OPTION_KEYS.map((key, i) => (
            <div key={key} className="flex items-center gap-3">
              <input
                type="radio"
                name="correct_option"
                aria-label={`Mark option ${i + 1} correct`}
                checked={draft.correct_option === key}
                onChange={() => patch({ correct_option: key as CorrectOption })}
                className="h-4 w-4 shrink-0 accent-brand-500"
              />
              <div className="relative flex-1">
                <input
                  value={draft[key]}
                  onChange={(e) => patch({ [key]: e.target.value })}
                  placeholder={`Type Option ${i + 1} here`}
                  aria-label={`Option ${i + 1}`}
                  className="h-11 w-full rounded-lg border border-line px-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                {draft[key] && (
                  <button
                    type="button"
                    aria-label={`Clear option ${i + 1}`}
                    onClick={() => patch({ [key]: '' })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Solution */}
        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm font-medium text-ink">Add Solution</p>
          {draft.explanation && (
            <ClearButton
              label="Clear solution"
              onClick={() => patch({ explanation: '' })}
            />
          )}
        </div>
        <textarea
          value={draft.explanation}
          onChange={(e) => patch({ explanation: e.target.value })}
          placeholder="Type here"
          rows={3}
          aria-label="Solution"
          className="mt-2 w-full rounded-lg border border-line p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />

        {/* Per-question settings */}
        <h3 className="mt-6 text-sm font-semibold text-ink">Question settings</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select
            label="Level of Difficulty"
            placeholder="Select from Drop-down"
            clearable
            options={DIFFICULTIES.map((d) => ({ value: d.value, label: d.label }))}
            value={draft.difficulty}
            onChange={(v) => patch({ difficulty: v as QuestionDraft['difficulty'] })}
          />
          <Select
            label="Topic"
            placeholder="Select from Drop-down"
            clearable
            options={test.topics.map((t) => ({ value: t, label: t }))}
            value={draft.topic}
            onChange={(v) => patch({ topic: v })}
          />
          <Select
            label="Sub-topic"
            placeholder="Select from Drop-down"
            clearable
            options={test.sub_topics.map((s) => ({ value: s, label: s }))}
            value={draft.sub_topic}
            onChange={(v) => patch({ sub_topic: v })}
          />
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex items-center justify-between">
          <Button variant="danger" onClick={() => navigate('/dashboard')}>
            Exit Test Creation
          </Button>
          <div className="flex items-center gap-3">
            {drafts.length > 1 && (
              <Button variant="ghost" onClick={() => removeQuestion(current)}>
                Delete this question
              </Button>
            )}
            {isFinalSlot ? (
              <Button onClick={saveAndGoToPreview} loading={submitting}>
                Save &amp; Publish
              </Button>
            ) : (
              <Button onClick={handleNext}>Next</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
