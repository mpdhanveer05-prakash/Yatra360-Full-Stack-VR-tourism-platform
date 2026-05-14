import { useState, useEffect, useRef } from 'react'
import { useUIStore } from '../../store/uiStore'

/** Toggleable accessibility menu (high-contrast, reduce-motion). */
export default function AccessibilityMenu() {
  const highContrast = useUIStore(s => s.highContrast)
  const reduceMotion = useUIStore(s => s.reduceMotion)
  const setHigh = useUIStore(s => s.setHighContrast)
  const setRed  = useUIStore(s => s.setReduceMotion)

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Accessibility settings"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(o => !o)}
        className="
          px-2.5 py-1.5 font-mono text-[11px] tracking-widest uppercase rounded-sm
          border border-gold/20 bg-bg-elevated text-text-secondary
          hover:border-gold/50 hover:text-cream transition-colors
        "
        title="Accessibility"
      >
        <span aria-hidden>♿</span>
        <span className="sr-only">Accessibility settings</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Accessibility settings"
          className="absolute right-0 top-full mt-2 z-50 w-60 bg-bg-surface/96 backdrop-blur-md border border-gold/30 p-4 space-y-3 shadow-2xl rounded-sm"
        >
          <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase">Accessibility</p>

          <Row
            label="High contrast"
            checked={highContrast}
            onChange={setHigh}
            hint="Increases color contrast across the app."
          />
          <Row
            label="Reduce motion"
            checked={reduceMotion}
            onChange={setRed}
            hint="Disables auto-rotate, particles, transitions."
          />
        </div>
      )}
    </div>
  )
}

function Row({
  label, checked, onChange, hint,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  hint?: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-cinzel text-xs text-cream">{label}</span>
        <button
          role="switch"
          aria-checked={checked}
          aria-label={label}
          onClick={() => onChange(!checked)}
          className={`
            relative w-9 h-5 rounded-full transition-colors
            ${checked ? 'bg-saffron' : 'bg-bg-elevated border border-gold/20'}
          `}
        >
          <span
            className={`
              absolute top-0.5 w-4 h-4 rounded-full bg-cream transition-transform
              ${checked ? 'translate-x-4' : 'translate-x-0.5'}
            `}
          />
        </button>
      </div>
      {hint && <p className="font-mono text-[9px] text-text-muted">{hint}</p>}
    </div>
  )
}
