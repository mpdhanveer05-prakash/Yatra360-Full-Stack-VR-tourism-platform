import { useEffect, useState } from 'react'
import { usePassportStore } from '../../store/passportStore'
import type { Badge } from '../../types/passport'

/**
 * Listens for newly-earned badges and shows a stack of animated toasts.
 * Mount once at app root (e.g. AppShell).
 */
export default function StampToast() {
  const pending      = usePassportStore(s => s.pendingBadges)
  const clearPending = usePassportStore(s => s.clearPending)

  const [active, setActive] = useState<Badge[]>([])

  // Promote pending → active asynchronously so React doesn't see a cascading render.
  useEffect(() => {
    if (pending.length === 0) return
    const id = setTimeout(() => {
      setActive(prev => [...prev, ...pending])
      clearPending()
    }, 0)
    return () => clearTimeout(id)
  }, [pending, clearPending])

  // Auto-dismiss each toast after 5s
  useEffect(() => {
    if (active.length === 0) return
    const id = setTimeout(() => setActive(prev => prev.slice(1)), 5000)
    return () => clearTimeout(id)
  }, [active])

  if (active.length === 0) return null

  return (
    <div
      aria-live="polite"
      role="status"
      className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
    >
      {active.slice(0, 3).map(b => (
        <div
          key={`${b.id}-${b.earnedAt}`}
          className="
            pointer-events-auto
            w-72 bg-bg-surface/95 backdrop-blur-md
            border border-gold/40 shadow-[0_0_22px_rgba(212,160,23,0.25)]
            p-3 flex items-start gap-3
            animate-slide-up
          "
        >
          <div className="text-3xl flex-none" aria-hidden>{b.icon}</div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9px] tracking-widest text-saffron uppercase">Badge Earned</p>
            <p className="font-cinzel text-sm text-cream truncate">{b.name}</p>
            <p className="font-proza text-[11px] text-text-secondary mt-0.5">{b.description}</p>
          </div>
          <button
            onClick={() => setActive(prev => prev.filter(x => x.id !== b.id))}
            aria-label="Dismiss"
            className="text-text-muted hover:text-cream text-xs px-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
