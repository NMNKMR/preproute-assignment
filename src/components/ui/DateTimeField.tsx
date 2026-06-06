import { forwardRef, useRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/cn'

interface DateTimeFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type: 'date' | 'time'
  label?: ReactNode
  error?: string
}

/**
 * A styled date/time field that renders its own Calendar/Clock icon and opens
 * the browser's native picker on click (anywhere in the field). The native
 * picker indicator is hidden so the icon is the single, consistent affordance.
 */
export const DateTimeField = forwardRef<HTMLInputElement, DateTimeFieldProps>(
  function DateTimeField({ type, label, error, className, id, ...props }, ref) {
    const innerRef = useRef<HTMLInputElement | null>(null)
    const inputId = id ?? props.name
    const Icon = type === 'date' ? Calendar : Clock

    function openPicker() {
      const el = innerRef.current
      if (!el || props.disabled) return
      if (typeof el.showPicker === 'function') {
        try {
          el.showPicker()
          return
        } catch {
          // Some browsers throw outside a user gesture — fall back to focus.
        }
      }
      el.focus()
    }

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <div
          className={cn(
            'relative flex h-12 items-center rounded-lg border bg-white pr-2',
            'focus-within:ring-2 focus-within:ring-brand-400',
            error ? 'border-red-400 focus-within:ring-red-300' : 'border-line',
            props.disabled && 'cursor-not-allowed bg-gray-50 opacity-60',
          )}
        >
          <input
            id={inputId}
            ref={(node) => {
              innerRef.current = node
              if (typeof ref === 'function') ref(node)
              else if (ref) ref.current = node
            }}
            type={type}
            aria-invalid={Boolean(error)}
            onClick={openPicker}
            className={cn(
              'h-full w-full rounded-lg bg-transparent pl-3 text-sm text-ink',
              'focus:outline-none',
              // Hide the native picker indicator — our icon button replaces it.
              '[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none',
              !props.value && 'text-gray-400',
              className,
            )}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={openPicker}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-muted hover:text-brand-600"
          >
            <Icon className="h-5 w-5" />
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  },
)
