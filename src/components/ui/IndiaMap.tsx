import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { IndiaLocation } from '../../types/location'

interface Props {
  locations: IndiaLocation[]
}

// World bounding box covering all six populated continents.
const LAT_MIN = -55,  LAT_MAX = 75
const LNG_MIN = -170, LNG_MAX = 180

const REGION_COLOR: Record<string, string> = {
  // India sub-regions (legacy)
  north:           '#FF6B1A',
  south:           '#D4A017',
  east:            '#C4622D',
  west:            '#F0C040',
  northeast:       '#8FD4A7',
  central:         '#A89070',
  // Continents
  'europe':        '#4F9CFF',
  'asia':          '#FF6B1A',
  'africa':        '#F0C040',
  'oceania':       '#8FD4A7',
  'north-america': '#C4622D',
  'south-america': '#D4A017',
}

/**
 * Scatter "map" view of all locations projected onto a normalized SVG canvas.
 * Lightweight — no Leaflet / map tiles required.
 */
export default function IndiaMap({ locations }: Props) {
  const navigate = useNavigate()
  const [hoverId, setHoverId] = useState<string | null>(null)

  const W = 1000, H = 500   // world map aspect ~2:1
  const project = useMemo(() => (lat: number, lng: number) => {
    const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * W
    const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H
    return { x, y }
  }, [])

  return (
    <div className="card p-3 overflow-hidden">
      <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" aria-label="World map of destinations">
          {/* Background */}
          <rect x={0} y={0} width={W} height={H} fill="rgba(13,15,26,0.6)" />

          {/* Grid lines (every 5°) */}
          {Array.from({ length: Math.floor((LAT_MAX - LAT_MIN) / 5) + 1 }, (_, i) => {
            const lat = LAT_MIN + i * 5
            const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H
            return <line key={`la${i}`} x1={0} x2={W} y1={y} y2={y} stroke="rgba(212,160,23,0.08)" strokeWidth={1} />
          })}
          {Array.from({ length: Math.floor((LNG_MAX - LNG_MIN) / 5) + 1 }, (_, i) => {
            const lng = LNG_MIN + i * 5
            const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * W
            return <line key={`ln${i}`} x1={x} x2={x} y1={0} y2={H} stroke="rgba(212,160,23,0.08)" strokeWidth={1} />
          })}

          {/* Pins */}
          {locations.map(loc => {
            const { x, y } = project(loc.lat, loc.lng)
            const color = REGION_COLOR[loc.region] ?? '#D4A017'
            const isHover = hoverId === loc.id
            const r = isHover ? 7 : 4.5
            return (
              <g
                key={loc.id}
                onClick={() => navigate(`/tour/${loc.id}`)}
                onMouseEnter={() => setHoverId(loc.id)}
                onMouseLeave={() => setHoverId(null)}
                style={{ cursor: 'pointer' }}
                tabIndex={0}
                role="link"
                aria-label={`${loc.name}, ${loc.state}`}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/tour/${loc.id}`)
                  }
                }}
              >
                <circle cx={x} cy={y} r={r + 4} fill={color} opacity={isHover ? 0.25 : 0.12} />
                <circle cx={x} cy={y} r={r} fill={color} stroke="#F5EDD8" strokeWidth={1.2} />
                {isHover && (
                  <g>
                    <rect x={x + 10} y={y - 14} width={Math.max(80, loc.name.length * 7 + 16)} height={28} fill="rgba(13,15,26,0.92)" stroke={color} strokeWidth={1} />
                    <text x={x + 18} y={y + 4} fill="#F5EDD8" fontSize={11} fontFamily="Cinzel, serif">
                      {loc.name}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-mono pointer-events-none">
          {Object.entries(REGION_COLOR).map(([region, color]) => (
            <div key={region} className="flex items-center gap-1 text-text-muted">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
              <span className="capitalize">{region}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
