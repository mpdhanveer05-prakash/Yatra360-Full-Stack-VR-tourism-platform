import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import AccessibilityMenu from '../ui/AccessibilityMenu'

const links = [
  { to: '/explore',   label: 'Explore'   },
  { to: '/journeys',  label: 'Journeys'  },
  { to: '/compare',   label: 'Compare'   },
  { to: '/classroom', label: 'Classroom' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/about',     label: 'About'     },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

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
        <nav aria-label="Primary" className="hidden sm:flex items-center gap-8">
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
        </nav>

        {/* mobile hamburger */}
        <button
          className="sm:hidden text-text-secondary hover:text-cream transition-colors p-1"
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
        <nav aria-label="Mobile" className="sm:hidden border-t border-[var(--border)] bg-bg-surface px-4 py-4 flex flex-col gap-4">
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
          <div className="pt-2 border-t border-[var(--border)]">
            <AccessibilityMenu />
          </div>
        </nav>
      )}
    </header>
  )
}
