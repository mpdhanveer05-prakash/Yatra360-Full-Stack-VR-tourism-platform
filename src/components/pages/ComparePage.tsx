import { useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import StreetViewPanel from '../viewer/StreetViewPanel'
import locations from '../../data/indiaLocations.json'
import type { IndiaLocation } from '../../types/location'
import { eraById } from '../../lib/eras'

const allLocations = locations as IndiaLocation[]

const FEATURE_KEYS = [
  ['historical',    'Historical'    ],
  ['architectural', 'Architectural' ],
  ['religious',     'Religious'     ],
  ['natural',       'Natural'       ],
  ['cultural',      'Cultural'      ],
  ['artistic',      'Artistic'      ],
] as const

function LocationPicker({
  value, onChange, exclude, label,
}: {
  value: string | null
  onChange: (id: string) => void
  exclude?: string | null
  label: string
}) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      aria-label={label}
      className="w-full bg-bg-card border border-[var(--border)] text-cream font-cinzel text-xs px-3 py-2 focus:outline-none focus:border-gold/50 cursor-pointer"
    >
      <option value="">— Pick a location —</option>
      {allLocations
        .filter(l => l.id !== exclude)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(l => (
          <option key={l.id} value={l.id}>
            {l.name} ({l.state})
          </option>
        ))}
    </select>
  )
}

function MiniRadar({ a, b, aName, bName }: {
  a: IndiaLocation; b: IndiaLocation; aName: string; bName: string
}) {
  const N = FEATURE_KEYS.length
  const cx = 110, cy = 110, r = 80
  const angleStep = (Math.PI * 2) / N

  function polar(i: number, val: number) {
    const angle = i * angleStep - Math.PI / 2
    return { x: cx + Math.cos(angle) * r * val, y: cy + Math.sin(angle) * r * val }
  }

  function path(loc: IndiaLocation) {
    return FEATURE_KEYS
      .map(([k], i) => polar(i, loc.features[k] ?? 0))
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ') + ' Z'
  }

  return (
    <svg viewBox="0 0 220 220" className="w-full max-w-[260px] mx-auto">
      {[0.25, 0.5, 0.75, 1].map(t => (
        <circle key={t} cx={cx} cy={cy} r={r * t} fill="none" stroke="rgba(212,160,23,0.10)" strokeWidth={1} />
      ))}
      {FEATURE_KEYS.map(([, label], i) => {
        const end = polar(i, 1.12)
        return (
          <text key={label} x={end.x} y={end.y} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#A89070" fontFamily="JetBrains Mono">
            {label.slice(0, 5)}
          </text>
        )
      })}
      <path d={path(a)} fill="rgba(255,107,26,0.18)" stroke="#FF6B1A" strokeWidth={1.5} />
      <path d={path(b)} fill="rgba(212,160,23,0.18)" stroke="#D4A017" strokeWidth={1.5} />
      <g fontSize="8" fontFamily="JetBrains Mono">
        <circle cx={20} cy={205} r={3} fill="#FF6B1A" />
        <text x={28} y={208} fill="#FF6B1A">{aName}</text>
        <circle cx={120} cy={205} r={3} fill="#D4A017" />
        <text x={128} y={208} fill="#D4A017">{bName}</text>
      </g>
    </svg>
  )
}

export default function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const aId = searchParams.get('a')
  const bId = searchParams.get('b')

  const a = useMemo(() => allLocations.find(l => l.id === aId) ?? null, [aId])
  const b = useMemo(() => allLocations.find(l => l.id === bId) ?? null, [bId])

  function setLocation(slot: 'a' | 'b', id: string) {
    if (id) searchParams.set(slot, id)
    else    searchParams.delete(slot)
    setSearchParams(searchParams, { replace: true })
  }

  function dominantEraName(loc: IndiaLocation): string {
    const f = loc.features
    let best = 'modern'
    let val  = 0
    for (const k of ['ancient', 'medieval', 'colonial', 'modern'] as const) {
      if ((f[k] ?? 0) > val) { val = f[k] ?? 0; best = k }
    }
    return eraById(best === 'modern' ? 'now' : best)?.label ?? best
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Header */}
      <div className="bg-bg-surface border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs tracking-[0.3em] text-saffron uppercase mb-1">Side by Side</p>
              <h1 className="font-cinzel text-2xl text-cream">Compare Destinations</h1>
            </div>
            {(a || b) && (
              <button
                onClick={() => { searchParams.delete('a'); searchParams.delete('b'); setSearchParams(searchParams, { replace: true }) }}
                className="font-mono text-xs text-saffron hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LocationPicker value={aId} onChange={id => setLocation('a', id)} exclude={bId} label="Left location" />
            <LocationPicker value={bId} onChange={id => setLocation('b', id)} exclude={aId} label="Right location" />
          </div>
        </div>
      </div>

      {/* Body */}
      {!a || !b ? (
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="text-center space-y-3 max-w-md">
            <p className="text-5xl" aria-hidden>⇆</p>
            <h2 className="font-cinzel text-xl text-text-muted">Pick two destinations to compare</h2>
            <p className="font-proza text-sm text-text-secondary">
              Compare architectural style, historical era, and visual character side by side.
              Try Konark vs. Khajuraho, or Mehrangarh vs. Amber Fort.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-3">
              <button onClick={() => navigate('/compare?a=konark-sun-temple-odisha&b=khajuraho-temples-mp')} className="btn-secondary text-xs">
                Konark vs Khajuraho
              </button>
              <button onClick={() => navigate('/compare?a=mehrangarh-fort-jodhpur&b=amber-fort-jaipur')} className="btn-secondary text-xs">
                Mehrangarh vs Amber
              </button>
              <button onClick={() => navigate('/compare?a=ajanta-caves-maharashtra&b=ellora-caves-maharashtra')} className="btn-secondary text-xs">
                Ajanta vs Ellora
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Dual Street View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0.5 flex-1 min-h-[480px]">
            <div className="relative bg-bg-base">
              <div className="absolute top-3 left-3 z-10 bg-bg-surface/90 backdrop-blur-sm border border-saffron/50 px-2.5 py-1.5">
                <p className="font-mono text-[9px] tracking-widest text-saffron uppercase">A</p>
                <p className="font-cinzel text-xs text-cream truncate max-w-[200px]">{a.name}</p>
              </div>
              <StreetViewPanel lat={a.lat} lng={a.lng} name={a.name} />
            </div>
            <div className="relative bg-bg-base">
              <div className="absolute top-3 left-3 z-10 bg-bg-surface/90 backdrop-blur-sm border border-gold/50 px-2.5 py-1.5">
                <p className="font-mono text-[9px] tracking-widest text-gold uppercase">B</p>
                <p className="font-cinzel text-xs text-cream truncate max-w-[200px]">{b.name}</p>
              </div>
              <StreetViewPanel lat={b.lat} lng={b.lng} name={b.name} />
            </div>
          </div>

          {/* Comparison strip */}
          <div className="bg-bg-surface border-t border-[var(--border)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stats — A */}
              <div className="card p-4 space-y-2">
                <p className="font-mono text-[9px] tracking-widest text-saffron uppercase">Location A</p>
                <h3 className="font-cinzel text-lg text-cream">{a.name}</h3>
                <p className="font-mono text-[10px] text-text-muted">{a.city} · {a.state}</p>
                <div className="gold-divider" />
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px]">
                  <dt className="text-text-muted uppercase">Category</dt><dd className="text-cream capitalize">{a.category}</dd>
                  <dt className="text-text-muted uppercase">Established</dt><dd className="text-cream">{a.established ?? '—'}</dd>
                  <dt className="text-text-muted uppercase">UNESCO</dt><dd className={a.unescoStatus ? 'text-gold' : 'text-text-muted'}>{a.unescoStatus ? '✓' : '—'}</dd>
                  <dt className="text-text-muted uppercase">Dominant Era</dt><dd className="text-cream">{dominantEraName(a)}</dd>
                </dl>
                <button onClick={() => navigate(`/tour/${a.id}`)} className="btn-secondary text-xs mt-2 w-full">
                  Enter full tour →
                </button>
              </div>

              {/* Radar overlay */}
              <div className="card p-4 space-y-2">
                <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase text-center">Feature Signature</p>
                <MiniRadar a={a} b={b} aName={a.name.split(' ')[0]} bName={b.name.split(' ')[0]} />
              </div>

              {/* Stats — B */}
              <div className="card p-4 space-y-2">
                <p className="font-mono text-[9px] tracking-widest text-gold uppercase">Location B</p>
                <h3 className="font-cinzel text-lg text-cream">{b.name}</h3>
                <p className="font-mono text-[10px] text-text-muted">{b.city} · {b.state}</p>
                <div className="gold-divider" />
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px]">
                  <dt className="text-text-muted uppercase">Category</dt><dd className="text-cream capitalize">{b.category}</dd>
                  <dt className="text-text-muted uppercase">Established</dt><dd className="text-cream">{b.established ?? '—'}</dd>
                  <dt className="text-text-muted uppercase">UNESCO</dt><dd className={b.unescoStatus ? 'text-gold' : 'text-text-muted'}>{b.unescoStatus ? '✓' : '—'}</dd>
                  <dt className="text-text-muted uppercase">Dominant Era</dt><dd className="text-cream">{dominantEraName(b)}</dd>
                </dl>
                <button onClick={() => navigate(`/tour/${b.id}`)} className="btn-secondary text-xs mt-2 w-full">
                  Enter full tour →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
