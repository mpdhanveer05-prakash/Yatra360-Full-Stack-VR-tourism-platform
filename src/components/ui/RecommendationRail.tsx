import { useNavigate } from 'react-router-dom'
import { useAIStore } from '../../store/aiStore'
import { useTourStore } from '../../store/tourStore'
import { buildKeywords, getWideImage } from '../../api/unsplash'
import locations from '../../data/indiaLocations.json'
import type { IndiaLocation } from '../../types/location'

const allLocations = locations as IndiaLocation[]

export default function RecommendationRail() {
  const navigate      = useNavigate()
  const { recommendations, isLoadingRecs } = useAIStore()
  const setActiveLocation = useTourStore(s => s.setActiveLocation)

  function handleClick(locationId: string) {
    const loc = allLocations.find(l => l.id === locationId)
    if (loc) setActiveLocation(loc)
    navigate(`/tour/${locationId}`)
  }

  if (isLoadingRecs) {
    return (
      <div className="flex gap-3 overflow-x-auto py-2 px-1 scrollbar-none">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton flex-none w-36 h-20 rounded-sm" />
        ))}
      </div>
    )
  }

  if (recommendations.length === 0) return null

  return (
    <div className="space-y-1.5">
      <p className="font-cinzel text-[10px] tracking-[0.25em] text-text-muted uppercase px-1">
        ✦ AI Suggested Next
      </p>
      <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none">
        {recommendations.map(rec => {
          const loc = allLocations.find(l => l.id === rec.id)
          const img = loc
            ? getWideImage(buildKeywords(loc.name, loc.category, loc.tags))
            : undefined

          return (
            <button
              key={rec.id}
              onClick={() => handleClick(rec.id)}
              className="
                flex-none w-36 rounded-sm overflow-hidden border border-gold/20
                hover:border-gold/60 transition-all duration-200 text-left
                bg-bg-card group
              "
              title={rec.reason}
            >
              {img && (
                <div className="h-16 overflow-hidden bg-bg-elevated">
                  <img
                    src={img}
                    alt={rec.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-1.5">
                <p className="font-cinzel text-[10px] text-cream leading-tight line-clamp-1">{rec.name}</p>
                {typeof rec.score === 'number' && (
                  <p className="font-mono text-[9px] text-saffron mt-0.5">{rec.score}% match</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
