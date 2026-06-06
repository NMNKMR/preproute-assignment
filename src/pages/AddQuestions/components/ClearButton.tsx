import { X } from 'lucide-react'

interface ClearButtonProps {
  label: string
  onClick: () => void
}

/** Small inline "Clear" affordance used to reset an individual question field. */
export function ClearButton({ label, onClick }: ClearButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex items-center gap-1 text-xs text-muted hover:text-red-500"
    >
      <X className="h-3.5 w-3.5" /> Clear
    </button>
  )
}
