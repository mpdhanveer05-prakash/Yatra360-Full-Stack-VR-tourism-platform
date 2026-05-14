import { useNavigate } from 'react-router-dom'
import { usePassportStore } from '../../store/passportStore'
import { BADGE_DEFS } from '../../lib/badgeRules'
import locations from '../../data/indiaLocations.json'
import type { IndiaLocation } from '../../types/location'

const allLocations = locations as IndiaLocation[]

export default function PassportPanel() {
  const navigate = useNavigate()
  const { stamps, badges, streak, resetPassport } = usePassportStore()

  const earnedIds = new Set(badges.map(b => b.id))
  const visitedIds = new Set(stamps.map(s => s.locationId))

  const totalSites    = allLocations.length
  const visitedCount  = visitedIds.size
  const completionPct = Math.round((visitedCount / totalSites) * 100)

  return (
    <div className="space-y-6">
      {/* Hero stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Stamps"     value={visitedCount.toString()} sub={`/ ${totalSites}`} />
        <Stat label="Badges"     value={`${badges.length}`}      sub={`/ ${BADGE_DEFS.length}`} />
        <Stat label="Streak"     value={`${streak.current}d`}    sub={streak.longest ? `best ${streak.longest}d` : ''} />
        <Stat label="Completion" value={`${completionPct}%`} />
      </div>

      {/* Badge wall */}
      <section aria-labelledby="badge-wall-h" className="space-y-3">
        <h3 id="badge-wall-h" className="font-mono text-[10px] tracking-widest text-text-muted uppercase">
          Badge Wall
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {BADGE_DEFS.map(def => {
            const earned = earnedIds.has(def.id)
            return (
              <div
                key={def.id}
                className={`
                  card p-3 text-center space-y-1.5 transition-all
                  ${earned ? 'border-gold/60 shadow-[0_0_14px_rgba(212,160,23,0.18)]' : 'opacity-45'}
                `}
                title={earned ? def.description : `Locked — ${def.description}`}
              >
                <div className="text-2xl" aria-hidden>{earned ? def.icon : '🔒'}</div>
                <p className={`font-cinzel text-[11px] truncate ${earned ? 'text-gold' : 'text-text-muted'}`}>
                  {def.name}
                </p>
                <p className="font-mono text-[9px] text-text-muted line-clamp-2">{def.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Stamps */}
      <section aria-labelledby="stamps-h" className="space-y-3">
        <h3 id="stamps-h" className="font-mono text-[10px] tracking-widest text-text-muted uppercase">
          Collected Stamps
        </h3>
        {stamps.length === 0 ? (
          <p className="font-proza text-sm text-text-secondary">
            Visit any destination to earn your first stamp.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {stamps
              .slice()
              .sort((a, b) => b.visitedAt - a.visitedAt)
              .map(s => (
                <button
                  key={s.locationId}
                  onClick={() => navigate(`/tour/${s.locationId}`)}
                  className="card p-3 text-left space-y-1 hover:bg-bg-elevated/40 transition-colors"
                >
                  <p className="font-cinzel text-xs text-cream truncate">{s.locationName}</p>
                  <p className="font-mono text-[9px] text-text-muted">{s.state} · {s.category}</p>
                  {s.visits > 1 && (
                    <p className="font-mono text-[9px] text-gold">×{s.visits} visits</p>
                  )}
                </button>
              ))}
          </div>
        )}
      </section>

      {/* Reset */}
      {stamps.length > 0 && (
        <div className="pt-4 border-t border-[var(--border)] text-center">
          <button
            onClick={() => {
              if (confirm('Reset your passport? This clears all stamps and badges.')) resetPassport()
            }}
            className="font-mono text-xs text-text-muted hover:text-saffron underline"
          >
            Reset passport
          </button>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4 text-center space-y-1">
      <p className="font-cinzel font-black text-2xl text-gold">{value}</p>
      {sub && <p className="font-mono text-[9px] text-text-muted">{sub}</p>}
      <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase">{label}</p>
    </div>
  )
}
