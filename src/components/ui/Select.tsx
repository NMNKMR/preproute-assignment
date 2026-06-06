import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  placeholder?: string
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: string
  emptyText?: string
  testId?: string
  /** Extra classes for the trigger (e.g. height). Defaults to `h-12`. */
  className?: string
  /** Show a clear (×) button when a value is selected. */
  clearable?: boolean
}

/** Custom single-select dropdown (replaces the native <select>). */
export function Select({
  label,
  placeholder = 'Choose from Drop-down',
  options,
  value,
  onChange,
  disabled = false,
  error,
  emptyText = 'No options',
  testId,
  className = 'h-12',
  clearable = false,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Matches the menu's max-h-56 (14rem) so we can decide which way to open.
  const MENU_MAX_PX = 224

  function toggle() {
    setOpen((prev) => {
      const next = !prev
      if (next && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        // Flip up only when there's too little room below AND more room above,
        // so the menu never spills past the viewport and grows the page.
        setDropUp(spaceBelow < MENU_MAX_PX && rect.top > spaceBelow)
      }
      return next
    })
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const selected = options.find((o) => o.value === value)

  function pick(v: string) {
    onChange(v)
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      {label && <span className="text-sm font-medium text-ink">{label}</span>}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          data-testid={testId}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={label}
          onClick={toggle}
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-4 text-left text-sm',
            'focus:outline-none focus:ring-2 focus:ring-brand-400',
            disabled && 'cursor-not-allowed bg-gray-50 text-gray-400',
            error ? 'border-red-400' : 'border-line',
            className,
          )}
        >
          <span className={selected ? 'text-ink' : 'text-gray-400'}>
            {selected ? selected.label : placeholder}
          </span>
          {clearable && selected && !disabled ? (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear selection"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
                setOpen(false)
              }}
              className="shrink-0 text-gray-400 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </span>
          ) : (
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-gray-400 transition-transform',
                open && 'rotate-180',
              )}
            />
          )}
        </button>

        {open && !disabled && (
          <ul
            role="listbox"
            className={cn(
              'absolute z-30 max-h-56 w-full overflow-auto rounded-lg border border-line bg-white py-1 shadow-lg',
              dropUp ? 'bottom-full mb-1' : 'top-full mt-1',
            )}
          >
            {options.length === 0 ? (
              <li className="px-4 py-2 text-sm text-muted">{emptyText}</li>
            ) : (
              options.map((o) => {
                const isSelected = o.value === value
                return (
                  <li key={o.value} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => pick(o.value)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm hover:bg-brand-50',
                        isSelected ? 'text-brand-700' : 'text-ink',
                      )}
                    >
                      {o.label}
                      {isSelected && <Check className="h-4 w-4 text-brand-600" />}
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
