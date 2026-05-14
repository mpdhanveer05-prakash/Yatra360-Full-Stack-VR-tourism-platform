import { useEffect, useState } from 'react'
import { applyServiceWorkerUpdate } from '../../lib/registerSW'

/** Shows a reload-prompt toast when a new service worker is waiting. */
export default function UpdateToast() {
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    function onUpdate() { setAvailable(true) }
    window.addEventListener('yatra360:sw-update', onUpdate)
    return () => window.removeEventListener('yatra360:sw-update', onUpdate)
  }, [])

  if (!available) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="
        fixed bottom-4 left-1/2 -translate-x-1/2 z-[100]
        bg-bg-surface/96 backdrop-blur-md
        border border-gold/40 shadow-[0_0_22px_rgba(212,160,23,0.25)]
        px-4 py-3 flex items-center gap-3
      "
    >
      <span aria-hidden className="text-xl">✦</span>
      <div className="min-w-0">
        <p className="font-cinzel text-xs text-gold">New version available</p>
        <p className="font-mono text-[10px] text-text-muted">Reload to get the latest tour.</p>
      </div>
      <button
        onClick={applyServiceWorkerUpdate}
        className="btn-primary text-[10px] px-3 py-1.5"
      >
        Reload
      </button>
      <button
        onClick={() => setAvailable(false)}
        aria-label="Dismiss"
        className="text-text-muted hover:text-cream"
      >
        ✕
      </button>
    </div>
  )
}
