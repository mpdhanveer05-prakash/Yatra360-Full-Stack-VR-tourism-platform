import { useEffect, useState } from 'react'
import { useTourStore } from '../../store/tourStore'

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m`
  if (m > 0) return `${m}m ${s % 60}s`
  return `${s}s`
}

interface Props {
  sessionStartMs: number
  engagementScore?: number
}

export default function SessionStats({ sessionStartMs, engagementScore = 0 }: Props) {
  const [elapsed, setElapsed] = useState(0)
  const navigationHistory = useTourStore(s => s.navigationHistory)
  const nodesVisited = new Set(navigationHistory).size + 1 // +1 for initial node

  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - sessionStartMs), 1000)
    return () => clearInterval(id)
  }, [sessionStartMs])

  const pct = Math.round(engagementScore * 100)

  return (
    <div className="bg-bg-surface/80 backdrop-blur-sm border border-gold/20 rounded-sm p-2.5 space-y-2 min-w-[120px]">
      <p className="font-cinzel text-[9px] tracking-widest text-text-muted uppercase">Session</p>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="font-mono text-[10px] text-text-secondary">Time</span>
          <span className="stat-value text-[11px]">{formatTime(elapsed)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-mono text-[10px] text-text-secondary">Nodes</span>
          <span className="stat-value text-[11px]">{nodesVisited}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-mono text-[10px] text-text-secondary">Engage</span>
          <span className="font-mono text-[11px] text-saffron">{pct}%</span>
        </div>
      </div>

      {/* engagement ring */}
      <div className="relative w-10 h-10 mx-auto">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(212,160,23,0.1)" strokeWidth="2.5" />
          <circle
            cx="18" cy="18" r="14" fill="none"
            stroke={pct > 60 ? '#FF6B1A' : '#D4A017'}
            strokeWidth="2.5"
            strokeDasharray={`${pct * 0.879} 87.96`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] text-cream">
          {pct}
        </span>
      </div>
    </div>
  )
}
