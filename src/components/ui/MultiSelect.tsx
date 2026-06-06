import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  label?: string
  placeholder?: string
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  loading?: boolean
  error?: string
  emptyText?: string
  testId?: string
}

export function MultiSelect({
  label,
  placeholder = 'Choose from Drop-down',
  options,
  value,
  onChange,
  disabled = false,
  loading = false,
  error,
  emptyText = 'No options',
  testId,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const selected = options.filter((o) => value.includes(o.value))

  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  }

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      {label && <span className="text-sm font-medium text-ink">{label}</span>}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          data-testid={testId}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex min-h-12 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-left text-sm',
            'focus:outline-none focus:ring-2 focus:ring-brand-400',
            disabled && 'cursor-not-allowed bg-gray-50 text-gray-400',
            error ? 'border-red-400' : 'border-line',
          )}
        >
          <span className="flex flex-1 flex-wrap gap-1.5">
            {selected.length === 0 ? (
              <span className="text-gray-400">{placeholder}</span>
            ) : (
              selected.map((o) => (
                <span
                  key={o.value}
                  className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                >
                  {o.label}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-amber-900"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggle(o.value)
                    }}
                  />
                </span>
              ))
            )}
          </span>
          {loading ? (
            <Spinner className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
          )}
        </button>

        {open && !disabled && (
          <ul
            role="listbox"
            className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-line bg-white py-1 shadow-lg"
          >
            {options.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted">{emptyText}</li>
            ) : (
              options.map((o) => {
                const checked = value.includes(o.value)
                return (
                  <li key={o.value} role="option" aria-selected={checked}>
                    <button
                      type="button"
                      onClick={() => toggle(o.value)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-brand-50"
                    >
                      <span className={checked ? 'text-brand-700' : 'text-ink'}>
                        {o.label}
                      </span>
                      {checked && <Check className="h-4 w-4 text-brand-600" />}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
