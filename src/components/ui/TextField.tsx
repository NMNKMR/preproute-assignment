import { forwardRef, useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/cn'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode
  error?: string
  hint?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, error, hint, className, id, type, ...props }, ref) {
    const inputId = id ?? props.name
    const isPassword = type === 'password'
    const [show, setShow] = useState(false)
    const resolvedType = isPassword ? (show ? 'text' : 'password') : type

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type={resolvedType}
            aria-invalid={Boolean(error)}
            className={cn(
              'h-12 w-full rounded-lg border bg-white px-4 text-sm text-ink placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-brand-400',
              isPassword && 'pr-11',
              error ? 'border-red-400 focus:ring-red-300' : 'border-line',
              className,
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Hide password' : 'Show password'}
              aria-pressed={show}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink"
            >
              {show ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-500" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-muted">{hint}</p>
        ) : null}
      </div>
    )
  },
)
