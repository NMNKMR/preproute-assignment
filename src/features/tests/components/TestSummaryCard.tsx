import { BookOpen, FileQuestion, Pencil, PercentCircle, Timer } from 'lucide-react'
import type { Test } from '@/api/types'
import { cn } from '@/lib/cn'

const TYPE_LABELS: Record<string, string> = {
  chapterwise: 'Chapter Wise',
  pyq: 'PYQ',
  mock: 'Mock Test',
}

const DIFF_STYLES: Record<string, string> = {
  easy: 'bg-emerald-700',
  medium: 'bg-amber-700',
  difficult: 'bg-rose-700',
}

export function TestSummaryCard({
  test,
  onEdit,
}: {
  test: Test
  onEdit?: () => void
}) {
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex items-start justify-between">
        <span className="rounded-md bg-ink px-3 py-1 text-xs font-semibold text-white">
          {TYPE_LABELS[test.type] ?? test.type}
        </span>
        {onEdit && (
          <button
            type="button"
            aria-label="Edit test details"
            onClick={onEdit}
            className="text-brand-500 bg-brand-50 rounded-full p-2 hover:text-brand-700"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-amber-500" />
          <span className="text-base font-semibold text-ink">{test.name}</span>
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-xs text-white font-medium capitalize",
              DIFF_STYLES[test.difficulty] ?? "bg-gray-100 text-gray-600",
            )}
          >
            {test.difficulty}
          </span>
        </div>
        <div className="flex items-center border border-gray-300 p-1 rounded-md text-xs font-medium text-muted [&_svg]:text-gray-400/70">
          <span className="inline-flex items-center gap-1 border-r border-gray-300 pr-2">
            <Timer className="h-4 w-4" /> {test.total_time} Min
          </span>
          <span className="inline-flex items-center gap-1 border-r border-gray-300 px-2">
            <FileQuestion className="h-4 w-4" /> {test.total_questions} Q's
          </span>
          <span className="inline-flex items-center gap-1 pl-2">
            <PercentCircle className="h-4 w-4" /> {test.total_marks} Marks
          </span>
        </div>
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        <Row label="Subject">
          <span className="text-ink">{test.subject}</span>
        </Row>
        <Row label="Topic">
          <Chips items={test.topics} tone="topic" />
        </Row>
        <Row label="Sub Topic">
          <Chips items={test.sub_topics} tone="sub" />
        </Row>
      </dl>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-muted">{label}</dt>
      <dd className="flex flex-wrap items-center gap-1.5">: {children}</dd>
    </div>
  )
}

function Chips({ items, tone }: { items: string[]; tone: 'topic' | 'sub' }) {
  if (!items?.length) return <span className="text-muted">—</span>
  const cls =
    tone === 'topic'
      ? 'bg-orange-50 text-orange-600'
      : 'bg-violet-50 text-violet-600'
  return (
    <>
      {items.map((it) => (
        <span
          key={it}
          className={cn('rounded-md px-2 py-0.5 text-xs font-medium', cls)}
        >
          {it}
        </span>
      ))}
    </>
  )
}
