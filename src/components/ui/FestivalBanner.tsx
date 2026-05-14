import { useEffect, useRef, useState } from 'react'
import type { Festival } from '../../types/festival'
import { prefersReducedMotion } from '../../hooks/useAccessibility'

interface Props {
  festival: Festival
  status:   'ongoing' | 'today' | 'upcoming'
  daysUntil: number
}

/**
 * Minimal floating banner + drifting particle overlay (canvas).
 * Particles vary by festival.particle type.
 */
export default function FestivalBanner({ festival, status, daysUntil }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Drifting particle field tinted by festival color
  useEffect(() => {
    if (dismissed) return
    if (prefersReducedMotion()) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = 0
    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; rot: number; vr: number }
    const particles: P[] = []

    function resize() {
      const c = canvas!
      c.width  = c.offsetWidth
      c.height = c.offsetHeight
    }

    function init() {
      resize()
      particles.length = 0
      const count = Math.floor((canvas!.width * canvas!.height) / 22000)
      for (let i = 0; i < count; i++) {
        particles.push({
          x:  Math.random() * canvas!.width,
          y:  Math.random() * canvas!.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: festival.particle === 'diya' ? -Math.random() * 0.35 - 0.05 : Math.random() * 0.4 + 0.1,
          r:  Math.random() * 3 + 1.5,
          a:  Math.random() * 0.5 + 0.25,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.02,
        })
      }
    }

    function drawParticle(p: P) {
      ctx!.save()
      ctx!.translate(p.x, p.y)
      ctx!.rotate(p.rot)
      ctx!.globalAlpha = p.a
      if (festival.particle === 'diya') {
        // Yellow glowing dot
        ctx!.fillStyle = festival.color
        ctx!.shadowBlur = 8
        ctx!.shadowColor = festival.color
        ctx!.beginPath()
        ctx!.arc(0, 0, p.r, 0, Math.PI * 2)
        ctx!.fill()
      } else if (festival.particle === 'color') {
        ctx!.fillStyle = festival.color
        ctx!.beginPath()
        ctx!.arc(0, 0, p.r * 2, 0, Math.PI * 2)
        ctx!.fill()
      } else if (festival.particle === 'tricolor') {
        const colors = ['#FF6B1A', '#F5EDD8', '#138808']
        ctx!.fillStyle = colors[Math.floor(p.r) % 3]
        ctx!.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.8)
      } else {
        // marigold — little hexagon-ish
        ctx!.fillStyle = festival.color
        ctx!.beginPath()
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2
          const x = Math.cos(a) * p.r
          const y = Math.sin(a) * p.r
          if (i === 0) ctx!.moveTo(x, y); else ctx!.lineTo(x, y)
        }
        ctx!.closePath()
        ctx!.fill()
      }
      ctx!.restore()
    }

    function tick() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        if (p.y > canvas!.height + 8) { p.y = -8; p.x = Math.random() * canvas!.width }
        if (p.y < -8)                  { p.y = canvas!.height + 8 }
        if (p.x < -8)                  p.x = canvas!.width + 8
        if (p.x > canvas!.width + 8)   p.x = -8
        drawParticle(p)
      }
      animId = requestAnimationFrame(tick)
    }

    init()
    tick()
    window.addEventListener('resize', init)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', init)
    }
  }, [festival, dismissed])

  if (dismissed) return null

  const statusLabel =
    status === 'today'    ? 'Today' :
    status === 'ongoing'  ? `Day ${-daysUntil + 1}` :
                            `In ${daysUntil} day${daysUntil === 1 ? '' : 's'}`

  return (
    <>
      {/* Particle overlay — covers the viewer area below the header */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
        aria-hidden
      />

      {/* Banner */}
      <div
        role="status"
        className="
          absolute top-4 left-1/2 -translate-x-1/2 z-20
          bg-bg-surface/95 backdrop-blur-md
          border rounded-sm shadow-[0_0_22px_rgba(0,0,0,0.55)]
          px-4 py-2.5 flex items-center gap-3 max-w-md
        "
        style={{ borderColor: festival.color }}
      >
        <div className="text-2xl flex-none" aria-hidden>
          {festival.particle === 'diya' ? '🪔' :
           festival.particle === 'color' ? '🌈' :
           festival.particle === 'tricolor' ? '🇮🇳' : '🌼'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color: festival.color }}>
            {festival.name} · {statusLabel}
          </p>
          <p className="font-cinzel text-xs text-cream truncate">{festival.subtitle}</p>
          <p className="font-proza text-[10px] text-text-secondary mt-0.5 line-clamp-2">{festival.blurb}</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss festival banner"
          className="text-text-muted hover:text-cream text-xs flex-none"
        >
          ✕
        </button>
      </div>
    </>
  )
}
