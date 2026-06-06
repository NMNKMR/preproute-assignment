import { useEffect, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { Select } from '@/components/ui/Select'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { NumberStepper } from '@/components/ui/NumberStepper'
import { LoadingState } from '@/components/ui/States'
import { Breadcrumb } from '@/components/Breadcrumb'
import { ApiError } from '@/api/client'
import { cn } from '@/lib/cn'
import type { CreateTestPayload, TestType } from '@/api/types'
import {
  useCreateTest,
  useSubTopics,
  useSubjects,
  useTest,
  useTopics,
  useUpdateTest,
} from '@/features/tests/queries'
import {
  DIFFICULTIES,
  TEST_TYPES,
  defaultTestValues,
  testSchema,
} from '@/features/tests/testSchema'
import type { TestFormValues } from '@/features/tests/testSchema'

export function CreateEditTest() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const subjectsQuery = useSubjects()
  const testQuery = useTest(id)
  const createTest = useCreateTest()
  const updateTest = useUpdateTest()

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: defaultTestValues,
  })

  const subjectId = useWatch({ control, name: 'subject' })
  const topicIds = useWatch({ control, name: 'topics' })
  const watchedType = useWatch({ control, name: 'type' })

  // Total Marks is derived, not entered: questions × marks per correct answer.
  const questionCount = useWatch({ control, name: 'total_questions' })
  const correctMarks = useWatch({ control, name: 'correct_marks' })
  const totalMarks =
    (Number.isFinite(questionCount) ? questionCount : 0) *
    (Number.isFinite(correctMarks) ? correctMarks : 0)

  useEffect(() => {
    setValue('total_marks', totalMarks, { shouldValidate: true })
  }, [totalMarks, setValue])

  const topicsQuery = useTopics(subjectId || undefined)
  const subTopicsQuery = useSubTopics(topicIds)

  // --- Cascade resets (skip while hydrating an existing test in edit mode) ---
  const hydratedRef = useRef(!isEdit)
  const prevSubject = useRef(subjectId)
  useEffect(() => {
    if (!hydratedRef.current) return
    if (prevSubject.current !== subjectId) {
      prevSubject.current = subjectId
      setValue('topics', [])
      setValue('sub_topics', [])
    }
  }, [subjectId, setValue])

  // Drop any selected sub-topics that no longer belong to the chosen topics.
  useEffect(() => {
    if (!hydratedRef.current) return
    const valid = new Set((subTopicsQuery.data ?? []).map((s) => s.id))
    const current = getValues('sub_topics')
    const filtered = current.filter((idv) => valid.has(idv))
    if (filtered.length !== current.length) setValue('sub_topics', filtered)
  }, [subTopicsQuery.data, getValues, setValue])

  // --- Edit-mode hydration: map API name arrays back to UUIDs, stage by stage ---
  const stage = useRef<'subject' | 'topics' | 'subtopics' | 'done'>('subject')
  useEffect(() => {
    if (!isEdit) return
    const test = testQuery.data
    const subjects = subjectsQuery.data
    if (!test || !subjects) return

    if (stage.current === 'subject') {
      const subject = subjects.find((s) => s.name === test.subject)
      setValue('type', test.type)
      setValue('name', test.name)
      setValue('difficulty', test.difficulty)
      setValue('total_time', test.total_time)
      setValue('total_questions', test.total_questions)
      // total_marks is derived (questions × correct_marks) — no need to hydrate it.
      setValue('correct_marks', test.correct_marks)
      setValue('wrong_marks', test.wrong_marks)
      setValue('unattempt_marks', test.unattempt_marks)
      if (subject) setValue('subject', subject.id)
      prevSubject.current = subject?.id ?? ''
      stage.current = 'topics'
    }
  }, [isEdit, testQuery.data, subjectsQuery.data, setValue])

  useEffect(() => {
    if (!isEdit || stage.current !== 'topics') return
    const test = testQuery.data
    const topics = topicsQuery.data
    if (!test || !topics) return
    const ids = topics.filter((t) => test.topics.includes(t.name)).map((t) => t.id)
    setValue('topics', ids)
    stage.current = 'subtopics'
  }, [isEdit, testQuery.data, topicsQuery.data, setValue])

  useEffect(() => {
    if (!isEdit || stage.current !== 'subtopics') return
    const test = testQuery.data
    const subTopics = subTopicsQuery.data
    if (!test) return
    if (test.sub_topics.length > 0 && !subTopics) return
    const ids = (subTopics ?? [])
      .filter((s) => test.sub_topics.includes(s.name))
      .map((s) => s.id)
    setValue('sub_topics', ids)
    stage.current = 'done'
    hydratedRef.current = true
  }, [isEdit, testQuery.data, subTopicsQuery.data, setValue])

  function buildPayload(values: TestFormValues): Omit<CreateTestPayload, 'status'> {
    return {
      name: values.name.trim(),
      type: values.type,
      subject: values.subject,
      topics: values.topics,
      sub_topics: values.sub_topics,
      correct_marks: values.correct_marks,
      wrong_marks: values.wrong_marks,
      unattempt_marks: values.unattempt_marks,
      difficulty: values.difficulty,
      total_time: values.total_time,
      total_marks: values.total_marks,
      total_questions: values.total_questions,
    }
  }

  async function persist(values: TestFormValues, asDraft: boolean) {
    const base = buildPayload(values)
    if (isEdit && id) {
      // Only touch status when explicitly saving a draft, so we never
      // accidentally downgrade a live test on the way to Add Questions.
      await updateTest.mutateAsync({
        id,
        payload: asDraft ? { ...base, status: 'draft' } : base,
      })
      return id
    }
    const created = await createTest.mutateAsync({ ...base, status: 'draft' })
    return created.id
  }

  // Which action is in flight, so each button shows its own spinner.
  const [pendingAction, setPendingAction] = useState<'draft' | 'next' | null>(
    null,
  )

  function onSaveDraft() {
    handleSubmit(async (values) => {
      setPendingAction('draft')
      try {
        await persist(values, true)
        toast.success('Saved as draft')
        navigate('/dashboard')
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Could not save')
      } finally {
        setPendingAction(null)
      }
    })()
  }

  function onNext(values: TestFormValues) {
    void (async () => {
      setPendingAction('next')
      try {
        const testId = await persist(values, false)
        navigate(`/tests/${testId}/questions`)
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Could not save')
      } finally {
        setPendingAction(null)
      }
    })()
  }

  const busy = pendingAction !== null

  if (isEdit && testQuery.isLoading) {
    return <LoadingState label="Loading test…" />
  }

  const typeLabel =
    TEST_TYPES.find((t) => t.value === watchedType)?.label ?? 'Chapter Wise'

  return (
    <div className="mx-auto max-w-4xl">
      <Breadcrumb
        items={[
          { label: 'Test Creation' },
          { label: isEdit ? 'Edit Test' : 'Create Test' },
          { label: typeLabel },
        ]}
      />

      {/* Test type tabs */}
      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <div className="mt-4 inline-flex rounded-lg border border-line p-1">
            {TEST_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => field.onChange(t.value as TestType)}
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  field.value === t.value
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-muted hover:text-ink',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      />

      <form onSubmit={handleSubmit(onNext)} className="mt-6 space-y-6" noValidate>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Controller
            control={control}
            name="subject"
            render={({ field }) => (
              <Select
                label="Subject"
                testId="subject-select"
                placeholder="Choose from Drop-down"
                options={(subjectsQuery.data ?? []).map((s) => ({
                  value: s.id,
                  label: s.name,
                }))}
                error={errors.subject?.message}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <TextField
            label="Name of Test"
            placeholder="Enter name of Test"
            error={errors.name?.message}
            {...register('name')}
          />

          <Controller
            control={control}
            name="topics"
            render={({ field }) => (
              <MultiSelect
                label="Topic"
                testId="topic-select"
                options={(topicsQuery.data ?? []).map((t) => ({
                  value: t.id,
                  label: t.name,
                }))}
                value={field.value}
                onChange={field.onChange}
                disabled={!subjectId}
                loading={topicsQuery.isFetching}
                error={errors.topics?.message}
                emptyText="No topics for this subject"
              />
            )}
          />
          <Controller
            control={control}
            name="sub_topics"
            render={({ field }) => (
              <MultiSelect
                label="Sub Topic"
                testId="subtopic-select"
                options={(subTopicsQuery.data ?? []).map((s) => ({
                  value: s.id,
                  label: s.name,
                }))}
                value={field.value}
                onChange={field.onChange}
                disabled={topicIds.length === 0}
                loading={subTopicsQuery.isFetching}
                emptyText="No sub-topics"
              />
            )}
          />

          <TextField
            label="Duration (Minutes)"
            type="number"
            placeholder="Enter the time"
            error={errors.total_time?.message}
            {...register('total_time', { valueAsNumber: true })}
          />
          <Controller
            control={control}
            name="difficulty"
            render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink">
                  Test Difficulty Level
                </span>
                <div className="flex h-12 items-center gap-6">
                  {DIFFICULTIES.map((d) => (
                    <label
                      key={d.value}
                      className="flex cursor-pointer items-center gap-2 text-sm text-ink"
                    >
                      <input
                        type="radio"
                        className="h-4 w-4 accent-brand-500"
                        checked={field.value === d.value}
                        onChange={() => field.onChange(d.value)}
                      />
                      {d.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          />
        </div>

        {/* Marking scheme */}
        <div>
          <h3 className="text-sm font-semibold text-ink">Marking Scheme:</h3>
          <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-5">
            <Controller
              control={control}
              name="wrong_marks"
              render={({ field }) => (
                <NumberStepper
                  label="Wrong Answer"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="unattempt_marks"
              render={({ field }) => (
                <NumberStepper
                  label="Unattempted"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="correct_marks"
              render={({ field }) => (
                <NumberStepper
                  label="Correct Answer"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <TextField
              label="No of Questions"
              type="number"
              placeholder="Ex: 50"
              error={errors.total_questions?.message}
              {...register('total_questions', { valueAsNumber: true })}
            />
            <TextField
              label="Total Marks"
              type="number"
              readOnly
              tabIndex={-1}
              value={Number.isFinite(totalMarks) ? totalMarks : 0}
              hint="Questions × Correct marks"
              error={errors.total_marks?.message}
              className="cursor-not-allowed bg-gray-50 text-muted"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onSaveDraft}
            loading={pendingAction === 'draft'}
            disabled={busy}
          >
            Save as Draft
          </Button>
          <Button
            type="submit"
            loading={pendingAction === 'next'}
            disabled={busy}
          >
            Next
          </Button>
        </div>
      </form>
    </div>
  )
}
