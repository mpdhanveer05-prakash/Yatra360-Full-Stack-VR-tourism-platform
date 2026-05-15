import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import AccessibilityMenu from '../ui/AccessibilityMenu'
import { useAuthStore } from '../../store/authStore'

const links = [
  { to: '/explore',   label: 'Explore'   },
  { to: '/journeys',  label: 'Journeys'  },
  { to: '/compare',   label: 'Compare'   },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/about',     label: 'About'     },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const user         = useAuthStore(s => s.user)
  const clearSession = useAuthStore(s => s.clearSession)
  const navigate     = useNavigate()

  function handleLogout() {
    clearSession()
    setMobileOpen(false)
    navigate('/', { replace: true })
  }

  return (
    <header className="sticky top-0 z-50 bg-bg-surface/80 backdrop-blur-md border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* logo */}
        <Link
          to="/"
          className="font-cinzel font-black text-xl tracking-widest text-gold hover:text-gold-light transition-colors"
          onClick={() => setMobileOpen(false)}
        >
          YATRA<span className="text-saffron">360</span>
        </Link>

        {/* desktop nav */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-6">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `font-cinzel text-sm tracking-widest uppercase transition-colors ${
                  isActive ? 'text-gold' : 'text-text-secondary hover:text-cream'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <AccessibilityMenu />

          {/* auth controls */}
          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-gold/20">
              <span
                className="font-mono text-[11px] text-text-secondary"
                title={user.email}
              >
                Hi, <span className="text-gold">{user.username}</span>
              </span>
              <button
                onClick={handleLogout}
                className="font-cinzel text-xs tracking-widest uppercase px-3 py-1 border border-gold/30 text-text-secondary hover:bg-saffron hover:border-saffron hover:text-cream rounded-sm transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-3 border-l border-gold/20">
              <Link
                to="/login"
                className="font-cinzel text-xs tracking-widest uppercase text-text-secondary hover:text-cream transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="font-cinzel text-xs tracking-widest uppercase px-3 py-1 bg-saffron text-cream hover:bg-saffron-light rounded-sm transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>

        {/* mobile hamburger */}
        <button
          className="md:hidden text-text-secondary hover:text-cream transition-colors p-1"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <div className="space-y-1.5">
            <span className={`block w-5 h-0.5 bg-current transition-all duration-200 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-current transition-all duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-current transition-all duration-200 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {/* mobile drawer */}
      {mobileOpen && (
        <nav aria-label="Mobile" className="md:hidden border-t border-[var(--border)] bg-bg-surface px-4 py-4 flex flex-col gap-4">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `font-cinzel text-sm tracking-widest uppercase transition-colors ${
                  isActive ? 'text-gold' : 'text-text-secondary'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-[var(--border)] flex flex-col gap-3">
            <AccessibilityMenu />
            {user ? (
              <>
                <p className="font-mono text-[11px] text-text-secondary">
                  Signed in as <span className="text-gold">{user.username}</span>
                </p>
                <button
                  onClick={handleLogout}
                  className="font-cinzel text-xs tracking-widest uppercase px-3 py-2 border border-gold/30 text-text-secondary hover:bg-saffron hover:border-saffron hover:text-cream rounded-sm transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center font-cinzel text-xs tracking-widest uppercase px-3 py-2 border border-gold/30 text-text-secondary hover:text-cream rounded-sm transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center font-cinzel text-xs tracking-widest uppercase px-3 py-2 bg-saffron text-cream rounded-sm transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
