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
        {/* World map background (equirectangular, lat/lng to x/y is linear) */}
        <img
          src="/world-map.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-60 select-none pointer-events-none"
          draggable={false}
        />
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" aria-label="World map of destinations">
          {/* Dark tint overlay so pins pop */}
          <rect x={0} y={0} width={W} height={H} fill="rgba(13,15,26,0.35)" />

          {/* Grid lines (every 30° — light reference only) */}
          {Array.from({ length: Math.floor((LAT_MAX - LAT_MIN) / 30) + 1 }, (_, i) => {
            const lat = LAT_MIN + i * 30
            const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H
            return <line key={`la${i}`} x1={0} x2={W} y1={y} y2={y} stroke="rgba(212,160,23,0.10)" strokeWidth={0.6} />
          })}
          {Array.from({ length: Math.floor((LNG_MAX - LNG_MIN) / 30) + 1 }, (_, i) => {
            const lng = LNG_MIN + i * 30
            const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * W
            return <line key={`ln${i}`} x1={x} x2={x} y1={0} y2={H} stroke="rgba(212,160,23,0.10)" strokeWidth={0.6} />
          })}

          {/* Pins */}
          {locations.map(loc => {
            const { x, y } = project(loc.lat, loc.lng)
            const color = REGION_COLOR[loc.region] ?? '#D4A017'
            const isHover = hoverId === loc.id
            const r = isHover ? 9 : 7
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
                {/* outer glow halo */}
                <circle cx={x} cy={y} r={r + 8} fill={color} opacity={isHover ? 0.35 : 0.18} />
                {/* white outline for visibility on light map */}
                <circle cx={x} cy={y} r={r + 2} fill="#0D0F1A" opacity={0.9} />
                <circle cx={x} cy={y} r={r} fill={color} stroke="#F5EDD8" strokeWidth={1.8} />
                {isHover && (
                  <g>
                    <rect x={x + 12} y={y - 16} width={Math.max(100, loc.name.length * 8 + 20)} height={32} fill="rgba(13,15,26,0.95)" stroke={color} strokeWidth={1.4} rx={3} />
                    <text x={x + 22} y={y + 5} fill="#F5EDD8" fontSize={13} fontFamily="Cinzel, serif" fontWeight="bold">
                      {loc.name}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>

        {/* Legend — continent colors only */}
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-mono pointer-events-none bg-bg-base/70 rounded-sm px-2 py-1">
          {[
            ['europe',        'Europe'],
            ['asia',          'Asia'],
            ['africa',        'Africa'],
            ['oceania',       'Oceania'],
            ['north-america', 'North America'],
            ['south-america', 'South America'],
          ].map(([region, label]) => (
            <div key={region} className="flex items-center gap-1 text-text-secondary">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: REGION_COLOR[region] }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
        <p className="absolute top-2 right-2 font-mono text-[9px] text-text-muted bg-bg-base/70 rounded-sm px-2 py-1 pointer-events-none">
          Click any pin to start the tour
        </p>
      </div>
    </div>
  )
}
