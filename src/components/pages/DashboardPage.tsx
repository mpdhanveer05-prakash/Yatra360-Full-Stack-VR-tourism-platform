import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../../store/userStore'
import { useAuthStore } from '../../store/authStore'
import { useAIStore } from '../../store/aiStore'
import { usePassportStore } from '../../store/passportStore'
import PassportPanel from '../ui/PassportPanel'
import locations from '../../data/indiaLocations.json'
import type { IndiaLocation } from '../../types/location'

const allLocations = locations as IndiaLocation[]

const FEATURE_KEYS: { key: keyof import('../../types/location').FeatureVector; label: string }[] = [
  { key: 'historical',     label: 'Historical'     },
  { key: 'architectural',  label: 'Architectural'  },
  { key: 'religious',      label: 'Religious'      },
  { key: 'natural',        label: 'Natural'        },
  { key: 'cultural',       label: 'Cultural'       },
  { key: 'artistic',       label: 'Artistic'       },
  { key: 'educational',    label: 'Educational'    },
  { key: 'adventurous',    label: 'Adventurous'    },
]

function RadarChart({ vector }: { vector: Record<string, number> }) {
  const N = FEATURE_KEYS.length
  const cx = 120, cy = 120, r = 90
  const angleStep = (Math.PI * 2) / N

  function polar(i: number, val: number) {
    const a = i * angleStep - Math.PI / 2
    return {
      x: cx + Math.cos(a) * r * val,
      y: cy + Math.sin(a) * r * val,
    }
  }

  const webPoints = FEATURE_KEYS.map((f, i) => polar(i, vector[f.key] ?? 0))
  const webPath   = webPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[220px] mx-auto">
      {/* grid circles */}
      {[0.25, 0.5, 0.75, 1].map(t => (
        <circle key={t} cx={cx} cy={cy} r={r * t} fill="none" stroke="rgba(212,160,23,0.12)" strokeWidth="1" />
      ))}
      {/* axes */}
      {FEATURE_KEYS.map((_, i) => {
        const end = polar(i, 1)
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(212,160,23,0.2)" strokeWidth="1" />
      })}
      {/* filled polygon */}
      <path d={webPath} fill="rgba(212,160,23,0.18)" stroke="#D4A017" strokeWidth="1.5" />
      {/* labels */}
      {FEATURE_KEYS.map((f, i) => {
        const pt = polar(i, 1.18)
        return (
          <text
            key={f.key}
            x={pt.x}
            y={pt.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
            fill="#A89070"
            fontFamily="JetBrains Mono, monospace"
          >
            {f.label}
          </text>
        )
      })}
    </svg>
  )
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  if (m < 1) return `${s}s`
  return `${m}m ${s % 60}s`
}

function UserHeader() {
  const user = useAuthStore(s => s.user)
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="font-mono text-xs tracking-[0.3em] text-saffron uppercase mb-1">Personal Analytics</p>
        <h1 className="font-cinzel text-2xl text-cream">
          {user ? (
            <>Welcome back, <span className="text-gold">{user.username}</span></>
          ) : (
            <>Your Journey</>
          )}
        </h1>
        {user?.email && (
          <p className="font-mono text-[11px] text-text-muted mt-1">{user.email}</p>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate   = useNavigate()
  const { sessionHistory, preferenceVector } = useUserStore()
  const { recommendations } = useAIStore()

  const recentSessions = [...sessionHistory].reverse().slice(0, 20)

  const visitedIds = useMemo(
    () => new Set(sessionHistory.map(s => s.locationId)),
    [sessionHistory]
  )

  const suggestedLocations = useMemo(() => {
    if (recommendations.length > 0) {
      return recommendations
        .map(r => allLocations.find(l => l.id === r.id))
        .filter(Boolean) as IndiaLocation[]
    }
    return allLocations
      .filter(l => !visitedIds.has(l.id))
      .sort((a, b) => {
        const scoreA = Object.keys(preferenceVector).reduce(
          (acc, k) => acc + (preferenceVector[k as keyof typeof preferenceVector] * (a.features[k as keyof typeof a.features] ?? 0)), 0
        )
        const scoreB = Object.keys(preferenceVector).reduce(
          (acc, k) => acc + (preferenceVector[k as keyof typeof preferenceVector] * (b.features[k as keyof typeof b.features] ?? 0)), 0
        )
        return scoreB - scoreA
      })
      .slice(0, 3)
  }, [recommendations, visitedIds, preferenceVector])

  const totalDwell = sessionHistory.reduce((acc, s) => acc + (s.durationMs ?? 0), 0)
  const avgScore   = sessionHistory.length
    ? (sessionHistory.reduce((acc, s) => acc + s.engagementScore, 0) / sessionHistory.length)
    : 0

  const hasData = sessionHistory.length > 0

  const stampCount = usePassportStore(s => s.stamps.length)
  const [tab, setTab] = useState<'analytics' | 'passport'>('analytics')

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* header */}
        <UserHeader />

        {/* tabs */}
        <div role="tablist" aria-label="Dashboard sections" className="flex gap-1 border-b border-[var(--border)]">
          {([
            { key: 'analytics', label: 'Analytics' },
            { key: 'passport',  label: `Passport${stampCount ? ` · ${stampCount}` : ''}` },
          ] as const).map(t => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`
                px-4 py-2 font-mono text-xs tracking-widest uppercase transition-colors -mb-px border-b-2
                ${tab === t.key
                  ? 'border-saffron text-gold'
                  : 'border-transparent text-text-secondary hover:text-cream'}
              `}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'passport' && (
          <div role="tabpanel"><PassportPanel /></div>
        )}

        {tab === 'analytics' && (!hasData ? (
          <div className="py-24 text-center space-y-4">
            <p className="font-cinzel text-xl text-text-muted">No tours yet</p>
            <p className="font-proza text-sm text-text-secondary">
              Explore a destination and come back to see your analytics.
            </p>
            <button onClick={() => navigate('/explore')} className="btn-primary text-sm">
              Start Exploring →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* left column: stats + history */}
            <div className="lg:col-span-2 space-y-6">

              {/* quick stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Sites Visited', value: visitedIds.size.toString() },
                  { label: 'Total Time',    value: formatMs(totalDwell) },
                  { label: 'Avg Engagement', value: `${Math.round(avgScore * 100)}%` },
                ].map(s => (
                  <div key={s.label} className="card p-4 text-center space-y-1">
                    <p className="font-cinzel font-black text-2xl text-gold">{s.value}</p>
                    <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* session history */}
              <div className="card p-4 space-y-3">
                <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase">Recent Sessions</p>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {recentSessions.map((session, i) => {
                    const loc = allLocations.find(l => l.id === session.locationId)
                    return (
                      <div
                        key={i}
                        onClick={() => navigate(`/tour/${session.locationId}`)}
                        className="flex items-center justify-between p-2 bg-bg-elevated/40 hover:bg-bg-elevated cursor-pointer transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-cinzel text-xs text-cream group-hover:text-gold transition-colors truncate">
                            {loc?.name ?? session.locationId}
                          </p>
                          <p className="font-mono text-[10px] text-text-muted">
                            {loc?.city}, {loc?.state}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-3 flex-none">
                          {session.durationMs != null && (
                            <span className="font-mono text-[10px] text-text-secondary">{formatMs(session.durationMs)}</span>
                          )}
                          <div className="flex items-center gap-1">
                            <div
                              className="h-1 rounded-full bg-gradient-to-r from-saffron to-gold"
                              style={{ width: `${Math.round(session.engagementScore * 40)}px` }}
                            />
                            <span className="font-mono text-[10px] text-gold">{Math.round(session.engagementScore * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>

            {/* right column: radar + recommendations */}
            <div className="space-y-6">

              {/* radar chart */}
              <div className="card p-4 space-y-3">
                <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase">Your Interests</p>
                <RadarChart vector={preferenceVector as unknown as Record<string, number>} />
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {FEATURE_KEYS.map(f => {
                    const val = (preferenceVector as unknown as Record<string, number>)[f.key] ?? 0
                    return (
                      <div key={f.key} className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-text-muted">{f.label}</span>
                        <span className="font-mono text-[9px] text-gold">{Math.round(val * 100)}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* suggestions */}
              {suggestedLocations.length > 0 && (
                <div className="card p-4 space-y-3">
                  <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase">Recommended Next</p>
                  <div className="space-y-2">
                    {suggestedLocations.slice(0, 3).map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => navigate(`/tour/${loc.id}`)}
                        className="w-full text-left p-2 bg-bg-elevated/40 hover:bg-bg-elevated transition-colors group"
                      >
                        <p className="font-cinzel text-xs text-cream group-hover:text-gold transition-colors">{loc.name}</p>
                        <p className="font-mono text-[9px] text-text-muted">{loc.city} · {loc.category}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        ))}

        {/* explore CTA */}
        {hasData && (
          <div className="text-center pt-4 border-t border-[var(--border)]">
            <button onClick={() => navigate('/explore')} className="btn-secondary text-xs">
              Browse All 20 Destinations →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
