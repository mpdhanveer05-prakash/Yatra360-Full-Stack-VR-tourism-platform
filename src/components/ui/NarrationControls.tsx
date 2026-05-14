import { useState, useEffect, useRef } from 'react'
import { useUIStore } from '../../store/uiStore'
import { tts, NARRATION_LANGS } from '../../lib/tts'
import type { TTSStatus } from '../../lib/tts'
import { ambient } from '../../lib/ambientAudio'

interface Props {
  /** Text the narrator will read (usually the current node description). */
  text:      string | null
  /** Compact icon-only button (for tour header). */
  compact?:  boolean
}

export default function NarrationControls({ text, compact = false }: Props) {
  const enabled  = useUIStore(s => s.narrationEnabled)
  const lang     = useUIStore(s => s.narrationLang)
  const rate     = useUIStore(s => s.narrationRate)
  const setEnabled = useUIStore(s => s.setNarrationEnabled)
  const setLang    = useUIStore(s => s.setNarrationLang)
  const setRate    = useUIStore(s => s.setNarrationRate)

  const ambientEnabled  = useUIStore(s => s.ambientEnabled)
  const ambientVolume   = useUIStore(s => s.ambientVolume)
  const setAmbientEnabled = useUIStore(s => s.setAmbientEnabled)
  const setAmbientVolume  = useUIStore(s => s.setAmbientVolume)

  const [status, setStatus] = useState<TTSStatus>(tts.getStatus())
  const [open,   setOpen]   = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => tts.subscribe(setStatus), [])

  // Close popover on outside click
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open])

  function handleToggleEnable() {
    const next = !enabled
    setEnabled(next)
    if (!next) tts.cancel()
    else if (text) tts.speak(text, { lang, rate })
  }

  function handlePlayPause() {
    if (status === 'speaking') tts.pause()
    else if (status === 'paused') tts.resume()
    else if (text) tts.speak(text, { lang, rate })
  }

  function handleStop() { tts.cancel() }

  function handleLangChange(newLang: string) {
    setLang(newLang)
    if (enabled && text) tts.speak(text, { lang: newLang, rate })
  }

  function handleRateChange(newRate: number) {
    setRate(newRate)
    if (status === 'speaking' && text) tts.speak(text, { lang, rate: newRate })
  }

  if (!tts.supported) return null

  const icon =
    status === 'speaking' ? '⏸' :
    status === 'paused'   ? '▶' :
    enabled               ? '🔊' : '🔇'

  return (
    <div className="relative" ref={panelRef}>
      <div className="flex items-center gap-1">
        <button
          aria-label={enabled ? 'Disable narration' : 'Enable narration'}
          aria-pressed={enabled}
          onClick={handleToggleEnable}
          title={enabled ? 'Narration on' : 'Narration off'}
          className={`
            px-2.5 py-1.5 font-mono text-[11px] tracking-widest uppercase rounded-sm
            border transition-all
            ${enabled
              ? 'bg-saffron text-cream border-saffron shadow-[0_0_10px_rgba(255,107,26,0.35)]'
              : 'bg-bg-elevated text-text-secondary border-gold/20 hover:border-gold/50 hover:text-cream'}
          `}
        >
          <span aria-hidden>{icon}</span>
          {!compact && <span className="ml-1.5">Narrate</span>}
        </button>

        {enabled && (
          <>
            <button
              aria-label={status === 'speaking' ? 'Pause' : 'Play'}
              onClick={handlePlayPause}
              disabled={!text}
              className="px-2 py-1.5 text-cream bg-bg-elevated border border-gold/20 hover:border-gold/50 rounded-sm font-mono text-[11px] disabled:opacity-40"
            >
              {status === 'speaking' ? '⏸' : '▶'}
            </button>
            <button
              aria-label="Stop narration"
              onClick={handleStop}
              disabled={status === 'idle'}
              className="px-2 py-1.5 text-cream bg-bg-elevated border border-gold/20 hover:border-gold/50 rounded-sm font-mono text-[11px] disabled:opacity-40"
            >
              ■
            </button>
          </>
        )}

        <button
          aria-label="Narration settings"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          className="px-2 py-1.5 text-text-secondary bg-bg-elevated border border-gold/20 hover:border-gold/50 hover:text-cream rounded-sm font-mono text-[11px]"
        >
          ⚙
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Narration settings"
          className="absolute right-0 top-full mt-2 z-50 w-64 bg-bg-surface/96 backdrop-blur-md border border-gold/30 p-4 space-y-3 shadow-2xl rounded-sm"
        >
          <div>
            <label className="font-mono text-[10px] tracking-widest text-text-muted uppercase block mb-1.5">
              Language
            </label>
            <select
              value={lang}
              onChange={e => handleLangChange(e.target.value)}
              className="w-full bg-bg-card border border-[var(--border)] text-cream font-mono text-xs px-2 py-1.5 focus:outline-none focus:border-gold/50"
            >
              {NARRATION_LANGS.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
            <p className="font-mono text-[9px] text-text-muted mt-1">
              Uses your device's installed voices.
            </p>
          </div>

          <div>
            <label className="font-mono text-[10px] tracking-widest text-text-muted uppercase flex items-center justify-between mb-1.5">
              <span>Speed</span>
              <span className="text-gold">{rate.toFixed(2)}×</span>
            </label>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={rate}
              onChange={e => handleRateChange(parseFloat(e.target.value))}
              className="w-full accent-saffron"
            />
          </div>

          <p className="font-mono text-[9px] text-text-muted">
            Narration auto-plays each viewpoint. Toggle off to silence.
          </p>

          <div className="border-t border-gold/15 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-widest text-text-muted uppercase">Ambient</span>
              <button
                role="switch"
                aria-checked={ambientEnabled}
                onClick={() => {
                  const next = !ambientEnabled
                  setAmbientEnabled(next)
                  if (!next) ambient.stop()
                }}
                className={`
                  relative w-9 h-5 rounded-full transition-colors
                  ${ambientEnabled ? 'bg-saffron' : 'bg-bg-elevated border border-gold/20'}
                `}
              >
                <span
                  className={`
                    absolute top-0.5 w-4 h-4 rounded-full bg-cream transition-transform
                    ${ambientEnabled ? 'translate-x-4' : 'translate-x-0.5'}
                  `}
                />
              </button>
            </div>
            <div>
              <label className="font-mono text-[10px] tracking-widest text-text-muted uppercase flex items-center justify-between mb-1.5">
                <span>Volume</span>
                <span className="text-gold">{Math.round(ambientVolume * 100)}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={ambientVolume}
                onChange={e => setAmbientVolume(parseFloat(e.target.value))}
                disabled={!ambientEnabled}
                className="w-full accent-saffron disabled:opacity-40"
              />
            </div>
            <p className="font-mono text-[9px] text-text-muted">
              Background soundscape, varies by site type.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
