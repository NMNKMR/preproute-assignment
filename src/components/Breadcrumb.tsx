import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface Crumb {
  label: string
  to?: string
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <Fragment key={`${item.label}-${i}`}>
            {item.to && !last ? (
              <Link to={item.to} className="text-muted hover:text-ink">
                {item.label}
              </Link>
            ) : (
              <span className={last ? 'font-medium text-ink' : 'text-muted'}>
                {item.label}
              </span>
            )}
            {!last && <ChevronRight className="h-4 w-4 text-gray-300" />}
          </Fragment>
        )
      })}
    </nav>
  )
}
