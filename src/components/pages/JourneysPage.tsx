import { useNavigate } from 'react-router-dom'
import journeysData from '../../data/journeys.json'
import locations from '../../data/indiaLocations.json'
import type { Journey } from '../../types/journey'
import type { IndiaLocation } from '../../types/location'

const journeys = journeysData.journeys as Journey[]
const allLocations = locations as IndiaLocation[]
const locById = new Map(allLocations.map(l => [l.id, l]))

export default function JourneysPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div>
          <p className="font-mono text-xs tracking-[0.3em] text-saffron uppercase mb-1">Curated Routes</p>
          <h1 className="font-cinzel text-2xl text-cream">Themed Journeys</h1>
          <p className="font-proza text-sm text-text-secondary max-w-2xl mt-2">
            Hand-picked multi-location playlists. Auto-advance between stops with a cinematic
            transition. Pause, skip, or jump ahead at any time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {journeys.map(j => {
            const stops = j.stops.map(id => locById.get(id)).filter(Boolean) as IndiaLocation[]
            return (
              <button
                key={j.id}
                onClick={() => navigate(`/journey/${j.id}`)}
                className="card p-5 text-left space-y-3 hover:shadow-[0_0_22px_rgba(212,160,23,0.18)] transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-3xl flex-none" aria-hidden>{j.icon}</div>
                  <span className="font-mono text-[9px] text-text-muted tracking-widest uppercase">{j.duration}</span>
                </div>
                <div>
                  <h2 className="font-cinzel text-lg text-gold">{j.title}</h2>
                  <p className="font-mono text-[10px] tracking-widest text-saffron uppercase mt-0.5">{j.subtitle}</p>
                </div>
                <p className="font-proza text-xs text-text-secondary leading-relaxed line-clamp-3">{j.description}</p>
                <div className="flex flex-wrap gap-1 pt-2 border-t border-gold/15">
                  {stops.slice(0, 4).map(s => (
                    <span key={s.id} className="font-mono text-[9px] text-text-muted bg-bg-elevated px-1.5 py-0.5 rounded-full">
                      {s.name}
                    </span>
                  ))}
                  {stops.length > 4 && (
                    <span className="font-mono text-[9px] text-saffron">+{stops.length - 4} more</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
