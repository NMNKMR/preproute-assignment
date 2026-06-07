import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Difficulty, Question } from '@/api/types'

const OPTION_FIELDS = ['option1', 'option2', 'option3', 'option4'] as const

const DIFFICULTY_CHIP: Record<Difficulty, string> = {
  easy: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  difficult: 'border-red-200 bg-red-50 text-red-700',
}

interface QuestionPreviewProps {
  question: Question
  index: number
}

/** Read-only card showing a question, its options (correct one highlighted), and solution. */
export function QuestionPreview({ question, index }: QuestionPreviewProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-line p-4">
      <div className="flex items-start gap-2">
        <span className="shrink-0 text-sm font-semibold text-brand-600">
          Q{index + 1}.
        </span>
        <div
          className="rich-content prose-sm min-w-0 flex-1 wrap-break-word text-sm text-ink [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded [&_p]:m-0"
          dangerouslySetInnerHTML={{ __html: question.question }}
        />
      </div>
      {question.media_url && (
        <img
          src={question.media_url}
          alt={`Question ${index + 1} media`}
          className="mt-3 max-h-60 rounded-lg border border-line object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )}
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {OPTION_FIELDS.map((field) => {
          const isCorrect = question.correct_option === field
          return (
            <li
              key={field}
              className={cn(
                'flex items-center gap-2 rounded-md border px-3 py-2 text-sm',
                isCorrect
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-line text-ink',
              )}
            >
              {isCorrect && (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              )}
              <span className="min-w-0 wrap-break-word">{question[field]}</span>
            </li>
          )
        })}
      </ul>
      {question.explanation && (
        <p className="mt-3 wrap-break-word text-xs text-muted">
          <span className="font-medium text-ink">Solution: </span>
          {question.explanation}
        </p>
      )}

      {(question.difficulty || question.topic || question.sub_topic) && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
          {question.difficulty && (
            <span
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
                DIFFICULTY_CHIP[question.difficulty],
              )}
            >
              {question.difficulty}
            </span>
          )}
          {question.topic && (
            <span className="rounded-full border border-line bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-muted">
              {question.topic}
            </span>
          )}
          {question.sub_topic && (
            <span className="rounded-full border border-line bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-muted">
              {question.sub_topic}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
