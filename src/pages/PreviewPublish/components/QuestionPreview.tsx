import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Question } from '@/api/types'

const OPTION_FIELDS = ['option1', 'option2', 'option3', 'option4'] as const

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
          className="prose-sm min-w-0 flex-1 wrap-break-word text-sm text-ink [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded [&_p]:m-0"
          dangerouslySetInnerHTML={{ __html: question.question }}
        />
      </div>
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
    </div>
  )
}
