import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4 text-center">
      <div>
        <p className="text-6xl font-extrabold text-brand-500">404</p>
        <p className="mt-3 text-lg font-medium text-ink">Page not found</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
