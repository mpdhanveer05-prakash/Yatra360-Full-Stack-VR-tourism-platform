import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import journeysData from '../../data/journeys.json'
import locations from '../../data/indiaLocations.json'
import type { Journey } from '../../types/journey'
import type { IndiaLocation } from '../../types/location'

const journeys = journeysData.journeys as Journey[]
const allLocations = locations as IndiaLocation[]
const locById = new Map(allLocations.map(l => [l.id, l]))

const INTERMISSION_MS = 6000

export default function JourneyPage() {
  const { journeyId } = useParams<{ journeyId: string }>()
  const navigate = useNavigate()

  const journey = journeys.find(j => j.id === journeyId)
  const stops   = (journey?.stops ?? []).map(id => locById.get(id)).filter(Boolean) as IndiaLocation[]

  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<'intro' | 'intermission'>('intro')
  const [paused, setPaused] = useState(false)
  const [timeLeft, setTimeLeft] = useState(INTERMISSION_MS)
  const tickRef = useRef<number | null>(null)

  // Auto-advance timer
  useEffect(() => {
    if (paused || phase !== 'intermission' || !stops.length) return
    setTimeLeft(INTERMISSION_MS)
    const start = performance.now()
    const tick = (now: number) => {
      const remaining = INTERMISSION_MS - (now - start)
      if (remaining <= 0) {
        // Advance
        const next = idx + 1
        if (next >= stops.length) {
          // Journey complete
          return
        }
        setIdx(next)
        setPhase('intro')
        return
      }
      setTimeLeft(remaining)
      tickRef.current = requestAnimationFrame(tick)
    }
    tickRef.current = requestAnimationFrame(tick)
    return () => { if (tickRef.current) cancelAnimationFrame(tickRef.current) }
  }, [idx, phase, paused, stops.length])

  if (!journey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="text-center space-y-3">
          <p className="font-cinzel text-xl text-text-muted">Journey not found</p>
          <button onClick={() => navigate('/journeys')} className="btn-secondary text-xs">All journeys →</button>
        </div>
      </div>
    )
  }

  if (stops.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <p className="font-cinzel text-xl text-text-muted">This journey has no stops yet.</p>
      </div>
    )
  }

  const current = stops[idx]
  const isLast  = idx === stops.length - 1
  const progressPct = ((INTERMISSION_MS - timeLeft) / INTERMISSION_MS) * 100

  function goPrev() {
    if (idx === 0) return
    setIdx(idx - 1)
    setPhase('intro')
  }
  function goNext() {
    if (isLast) return
    setIdx(idx + 1)
    setPhase('intro')
  }
  function enterTour() {
    navigate(`/tour/${current.id}`)
  }
  function startIntermission() {
    setPhase('intermission')
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Header */}
      <div className="bg-bg-surface border-b border-[var(--border)] flex-none">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-widest text-saffron uppercase">
              {journey.icon} {journey.title}
            </p>
            <h1 className="font-cinzel text-base text-gold truncate">{journey.subtitle}</h1>
          </div>
          <button onClick={() => navigate('/journeys')} className="font-mono text-xs text-text-secondary hover:text-cream flex-none">
            ← All journeys
          </button>
        </div>

        {/* Progress dots */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-3 flex items-center gap-2 overflow-x-auto">
          {stops.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { setIdx(i); setPhase('intro') }}
              aria-label={`Stop ${i + 1}: ${s.name}`}
              className={`
                flex-none px-2.5 py-1 rounded-full font-mono text-[10px] transition-all
                ${i === idx
                  ? 'bg-saffron text-cream'
                  : i < idx
                    ? 'bg-bg-elevated text-gold border border-gold/30'
                    : 'bg-bg-elevated text-text-muted border border-gold/10'}
              `}
            >
              {i + 1}. {s.name.split(' ').slice(0, 2).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main stage */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-3xl w-full space-y-6 text-center animate-fade-in" key={`${idx}-${phase}`}>
          <p className="font-mono text-[10px] tracking-[0.4em] text-text-muted uppercase">
            Stop {idx + 1} of {stops.length}
          </p>
          <h2 className="font-cinzel text-4xl text-cream">{current.name}</h2>
          <p className="font-mono text-xs text-saffron tracking-widest">
            {current.city.toUpperCase()} · {current.state.toUpperCase()}
          </p>
          <p className="font-proza text-base text-text-secondary leading-relaxed max-w-2xl mx-auto">
            {current.description}
          </p>

          {phase === 'intro' ? (
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <button onClick={enterTour} className="btn-primary text-sm">
                Enter Tour →
              </button>
              <button onClick={startIntermission} className="btn-secondary text-sm">
                {isLast ? 'View next stop' : 'Skip to next stop'}
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-4">
              <p className="font-cinzel text-xs text-gold tracking-widest">
                {isLast ? 'JOURNEY COMPLETE' : 'NEXT STOP IN'}
              </p>
              {!isLast && (
                <>
                  <p className="font-mono text-2xl text-saffron">{(timeLeft / 1000).toFixed(1)}s</p>
                  <div className="h-1 max-w-xs mx-auto bg-bg-elevated rounded-full overflow-hidden">
                    <div className="h-full bg-saffron transition-[width] duration-100" style={{ width: `${progressPct}%` }} />
                  </div>
                </>
              )}
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button onClick={() => setPaused(p => !p)} className="btn-secondary text-xs">
                  {paused ? '▶ Resume' : '⏸ Pause'}
                </button>
                {!isLast && (
                  <button onClick={goNext} className="btn-primary text-xs">
                    Next now →
                  </button>
                )}
                {isLast && (
                  <button onClick={() => navigate('/journeys')} className="btn-primary text-xs">
                    Pick another journey →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer nav */}
      <div className="border-t border-[var(--border)] bg-bg-surface flex-none">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={goPrev} disabled={idx === 0} className="font-mono text-xs text-text-secondary hover:text-cream disabled:opacity-30">
            ← Previous
          </button>
          <p className="font-proza text-[11px] text-text-muted italic">{journey.description}</p>
          <button onClick={goNext} disabled={isLast} className="font-mono text-xs text-text-secondary hover:text-cream disabled:opacity-30">
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
