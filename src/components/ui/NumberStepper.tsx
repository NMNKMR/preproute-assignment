import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/cn'

interface NumberStepperProps {
  label?: string
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
  error?: string
  className?: string
}

export function NumberStepper({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  error,
  className,
}: NumberStepperProps) {
  function clamp(n: number) {
    if (min !== undefined && n < min) return min
    if (max !== undefined && n > max) return max
    return n
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-medium text-ink">{label}</span>}
      <div
        className={cn(
          'flex h-12 items-center rounded-lg border bg-white pl-3',
          error ? 'border-red-400' : 'border-line',
          className,
        )}
      >
        <input
          type="number"
          value={Number.isNaN(value) ? '' : value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          aria-label={label}
          className="w-full bg-transparent text-sm text-ink focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <div className="flex h-full flex-col border-l border-line">
          <button
            type="button"
            aria-label="Increase"
            onClick={() => onChange(clamp(value + step))}
            className="flex flex-1 items-center justify-center px-2 text-gray-400 hover:text-ink"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Decrease"
            onClick={() => onChange(clamp(value - step))}
            className="flex flex-1 items-center justify-center border-t border-line px-2 text-gray-400 hover:text-ink"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
