import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CheckCircle2, ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DateTimeField } from '@/components/ui/DateTimeField'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingState, ErrorState } from '@/components/ui/States'
import { Breadcrumb } from '@/components/Breadcrumb'
import { ApiError } from '@/api/client'
import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/format'
import type { Test } from '@/api/types'
import { TestSummaryCard } from '@/features/tests/components/TestSummaryCard'
import { QuestionSidebar } from '@/features/tests/components/QuestionSidebar'
import { useQuestions, useTest, useUpdateTest } from '@/features/tests/queries'
import {
  LIVE_UNTIL_OPTIONS,
  combineDateTime,
  resolveExpiry,
} from '@/features/tests/publishSchedule'
import type { LiveUntil } from '@/features/tests/publishSchedule'
import { QuestionPreview } from './components/QuestionPreview'

type PublishMode = 'now' | 'schedule'

export function PreviewPublish() {
  const { id } = useParams()
  const navigate = useNavigate()
  const testQuery = useTest(id)
  const questionIds = testQuery.data?.questions ?? []
  const questionsQuery = useQuestions(questionIds)
  const updateTest = useUpdateTest()

  const [current, setCurrent] = useState(0)
  const [editingPublish, setEditingPublish] = useState(false)
  const [mode, setMode] = useState<PublishMode>('now')
  const [liveUntil, setLiveUntil] = useState<LiveUntil>('always')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('')

  if (testQuery.isLoading) return <LoadingState label="Loading test…" />
  if (testQuery.isError || !testQuery.data)
    return (
      <ErrorState message="Could not load this test." onRetry={() => testQuery.refetch()} />
    )

  const test = testQuery.data
  const questions = questionsQuery.data ?? []
  const safeIndex = questions.length ? Math.min(current, questions.length - 1) : 0
  const currentQuestion = questions[safeIndex]
  const editQuestions = () => navigate(`/tests/${id}/questions`)

  // After saving, the test detail is invalidated and refetched while the stale
  // copy (with no questions) is still cached. Treat "no ids yet but the test is
  // still refetching" as loading so we don't flash the empty state first.
  const loadingPreview =
    questionsQuery.isLoading ||
    (questionIds.length === 0 && testQuery.isFetching)

  async function publish() {
    if (!id) return
    // Build the payload incrementally; omit null dates (the API rejects nulls).
    const payload: Partial<Test> = { status: 'live' }

    if (mode === 'schedule') {
      const scheduled = combineDateTime(scheduleDate, scheduleTime)
      if (!scheduled) {
        toast.error('Pick a date and time to schedule')
        return
      }
      payload.scheduled_date = scheduled
    }

    const expiry = resolveExpiry(liveUntil, { customDate, customTime })
    if (expiry) payload.expiry_date = expiry

    await commit(payload)
  }

  async function commit(payload: Partial<Test>) {
    if (!id) return
    try {
      await updateTest.mutateAsync({ id, payload })
      toast.success('Test published successfully!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not publish')
    }
  }

  const questionsDone =
    test.total_questions > 0 && questionIds.length >= test.total_questions
  // Publishing requires exactly the configured number of questions.
  const canPublish =
    test.total_questions > 0 && questionIds.length === test.total_questions
  // A live test hides the publish controls until the user chooses to edit timings.
  const isLive = test.status === 'live'
  const showPublishControls = !isLive || editingPublish

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
      {questionIds.length > 0 && (
        <QuestionSidebar
          items={questions.map((q) => ({ key: q.id, complete: true }))}
          currentIndex={safeIndex}
          onSelect={setCurrent}
          totalCount={test.total_questions}
        />
      )}

      <div className="min-w-0 flex-1">
        <Breadcrumb
          items={[
            { label: 'Test Creation', to: '/dashboard' },
            { label: 'Preview & Publish' },
          ]}
        />

        <div className="mt-4 flex items-center gap-3">
          <h1 className="text-lg font-bold text-ink">Test created</h1>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium',
              questionsDone
                ? 'border-emerald-700 text-emerald-700'
                : 'border-amber-700 text-amber-700',
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            {questionIds.length}/{test.total_questions} Questions done
          </span>
        </div>

        <div className="mt-4">
          <TestSummaryCard test={test} onEdit={() => navigate(`/tests/${id}/edit`)} />
        </div>

        {/* Single-question preview */}
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">
              {questions.length > 0 ? (
                <>
                  Question {safeIndex + 1}
                  <span className="text-brand-500">/{questions.length}</span>
                </>
              ) : (
                'Questions'
              )}
            </h2>
            <div className="flex items-center gap-2">
              <button
                aria-label="Previous question"
                disabled={safeIndex === 0}
                onClick={() => setCurrent(Math.max(0, safeIndex - 1))}
                className="grid h-8 w-8 place-items-center rounded-md border border-line text-muted hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                aria-label="Next question"
                disabled={safeIndex >= questions.length - 1}
                onClick={() =>
                  setCurrent(Math.min(questions.length - 1, safeIndex + 1))
                }
                className="grid h-8 w-8 place-items-center rounded-md border border-line text-muted hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <Button variant="secondary" size="sm" onClick={editQuestions}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            </div>
          </div>

          <div className="mt-3">
            {loadingPreview ? (
              <LoadingState label="Loading questions…" />
            ) : questionsQuery.isError ? (
              <ErrorState
                message="Could not load questions."
                onRetry={() => questionsQuery.refetch()}
              />
            ) : questionIds.length === 0 ? (
              <div className="rounded-lg border border-line p-6 text-center text-sm text-muted">
                <p>No questions added yet.</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={editQuestions}
                >
                  Add Questions
                </Button>
              </div>
            ) : currentQuestion ? (
              <QuestionPreview question={currentQuestion} index={safeIndex} />
            ) : null}
          </div>
        </section>

        {/* Publish panel */}
        <section className="mt-8 rounded-xl border border-line p-5">
          {/* Current state */}
          <div
            className={cn(
              'flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm',
              showPublishControls && 'mb-4 border-b border-line pb-4',
            )}
          >
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="inline-flex items-center gap-2">
                <span className="text-muted">Status</span>
                <StatusBadge status={test.status} />
              </span>
              {test.scheduled_date && (
                <span>
                  <span className="text-muted">Scheduled: </span>
                  <span className="font-medium text-ink">
                    {formatDateTime(test.scheduled_date)}
                  </span>
                </span>
              )}
              {test.expiry_date && (
                <span>
                  <span className="text-muted">Live until: </span>
                  <span className="font-medium text-ink">
                    {formatDateTime(test.expiry_date)}
                  </span>
                </span>
              )}
            </div>
            {isLive && !editingPublish && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditingPublish(true)}
              >
                <Pencil className="h-4 w-4" /> Edit publish settings
              </Button>
            )}
          </div>

          {showPublishControls && (
          <>
          <div className="inline-flex rounded-lg border border-line p-1">
            {(['now', 'schedule'] as PublishMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  mode === m
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-muted hover:text-ink',
                )}
              >
                {m === 'now' ? 'Publish Now' : 'Schedule Publish'}
              </button>
            ))}
          </div>

          {mode === 'schedule' && (
            <div className="mt-5">
              <p className="text-sm font-medium text-ink">Select Date and Time</p>
              <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateTimeField
                  type="date"
                  aria-label="Schedule date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
                <DateTimeField
                  type="time"
                  aria-label="Schedule time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Live Until */}
          <div className="mt-6">
            <p className="text-sm font-semibold text-ink">Live Until</p>
            <p className="mt-1.5 text-xs text-muted">
              Choose how long this test should remain available on the platform.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {LIVE_UNTIL_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className="flex cursor-pointer items-center gap-2 text-sm text-ink"
                >
                  <input
                    type="radio"
                    name="live_until"
                    className="h-4 w-4 accent-brand-500"
                    checked={liveUntil === o.value}
                    onChange={() => setLiveUntil(o.value)}
                  />
                  {o.label}
                </label>
              ))}
            </div>

            {liveUntil === 'custom' && (
              <div className="mt-5">
                <p className="text-sm font-medium text-ink">
                  Select End Date and End Time
                </p>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DateTimeField
                    type="date"
                    aria-label="End date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                  />
                  <DateTimeField
                    type="time"
                    aria-label="End time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {canPublish ? (
                <span className="text-emerald-600">
                  All {test.total_questions} questions added — ready to publish.
                </span>
              ) : (
                <span className="text-amber-600">
                  Add all {test.total_questions} questions to publish (
                  {questionIds.length}/{test.total_questions} added).
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() =>
                  isLive && editingPublish
                    ? setEditingPublish(false)
                    : navigate('/dashboard')
                }
              >
                Cancel
              </Button>
              <Button
                onClick={publish}
                loading={updateTest.isPending}
                disabled={!canPublish}
              >
                {mode === 'schedule'
                  ? 'Schedule'
                  : isLive
                    ? 'Update'
                    : 'Publish Test'}
              </Button>
            </div>
          </div>
          </>
          )}
        </section>
      </div>
    </div>
  )
}
