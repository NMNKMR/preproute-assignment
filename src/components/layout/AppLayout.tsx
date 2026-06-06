import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  PenSquare,
  X,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/cn'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tests/new', label: 'Test Creation', icon: PenSquare },
  { to: '/dashboard', label: 'Test Tracking', icon: ListChecks, disabled: true },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line px-4 py-6 md:flex">
        <div className="px-2">
          <Logo />
        </div>
        <SidebarNav className="mt-10" />
      </aside>

      {/* Drawer (mobile) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-line bg-white px-4 py-6">
            <div className="flex items-center justify-between px-2">
              <Logo />
              <button
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="text-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav
              className="mt-8"
              onNavigate={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-line px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-gray-50 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="md:hidden">
              <Logo className="h-7" />
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              className="grid h-10 w-10 place-items-center rounded-full border border-line text-muted hover:bg-gray-50"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
            <div className="relative">
              <button
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-gray-50"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {initials(user?.name)}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-semibold leading-tight text-ink">
                    {user?.name ?? 'User'}
                  </span>
                  <span className="block text-xs capitalize leading-tight text-muted">
                    {user?.role ?? ''}
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 text-muted" />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-12 z-20 w-40 rounded-lg border border-line bg-white py-1 shadow-lg"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-white px-4 py-6 sm:px-6">
          {/* Re-mount key on path keeps the menu dropdown from lingering across pages */}
          <div key={location.pathname}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarNav({
  className,
  onNavigate,
}: {
  className?: string
  onNavigate?: () => void
}) {
  return (
    <nav className={cn('flex flex-col gap-1', className)}>
      {navItems.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          aria-disabled={item.disabled}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              item.disabled
                ? 'cursor-not-allowed text-gray-300'
                : isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-muted hover:bg-gray-50 hover:text-ink',
            )
          }
          onClick={(e) => {
            if (item.disabled) {
              e.preventDefault()
              return
            }
            onNavigate?.()
          }}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

function initials(name?: string): string {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
}
