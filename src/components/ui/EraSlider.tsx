import { useEffect } from 'react'
import { useTimeStore } from '../../store/timeStore'
import { erasForLocation, eraContext, hasTimeTravel, eraById } from '../../lib/eras'

interface Props {
  locationId:   string
  locationName: string
}

/**
 * Era slider. Only renders when the location has reconstruction data.
 * Applies the active era's CSS filter via a `data-yatra-era` attribute on
 * the document body — the Pannellum container picks it up via CSS.
 */
export default function EraSlider({ locationId, locationName }: Props) {
  const currentEra = useTimeStore(s => s.currentEra)
  const setEra     = useTimeStore(s => s.setEra)
  const reset      = useTimeStore(s => s.reset)

  // Reset on location change
  useEffect(() => {
    reset()
  }, [locationId, reset])

  // Mirror era to <body data-yatra-era> for global CSS to react.
  useEffect(() => {
    document.body.setAttribute('data-yatra-era', currentEra)
    return () => { document.body.removeAttribute('data-yatra-era') }
  }, [currentEra])

  if (!hasTimeTravel(locationId)) return null

  const eras = erasForLocation(locationId)
  const era  = eraById(currentEra) ?? eras[eras.length - 1]
  const ctx  = eraContext(locationId, era.id)

  const idx  = Math.max(0, eras.findIndex(e => e.id === era.id))

  return (
    <div className="
      bg-bg-surface/95 backdrop-blur-md
      border border-gold/30 rounded-sm
      px-3 py-2.5 w-72 space-y-2
      shadow-[0_0_20px_rgba(0,0,0,0.55)]
    ">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[9px] tracking-widest text-saffron uppercase">Time Travel</p>
          <p className="font-cinzel text-xs text-gold truncate">{era.label}</p>
        </div>
        <span className="font-mono text-[9px] text-text-muted flex-none">{era.yearLabel}</span>
      </div>

      <input
        type="range"
        min={0}
        max={eras.length - 1}
        step={1}
        value={idx}
        onChange={e => setEra(eras[parseInt(e.target.value, 10)].id)}
        aria-label={`Era slider for ${locationName}`}
        className="w-full accent-saffron"
      />

      <div className="flex justify-between font-mono text-[8px] text-text-muted">
        {eras.map(e => (
          <button
            key={e.id}
            onClick={() => setEra(e.id)}
            className={`hover:text-cream transition-colors ${e.id === era.id ? 'text-gold' : ''}`}
            aria-pressed={e.id === era.id}
          >
            {e.yearLabel.split('–')[0]}
          </button>
        ))}
      </div>

      <p className="font-proza text-[11px] text-text-secondary leading-snug pt-1 border-t border-gold/15">
        {ctx}
      </p>
    </div>
  )
}
