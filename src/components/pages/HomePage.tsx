import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import LocationCard from '../ui/LocationCard'
import locations from '../../data/indiaLocations.json'
import type { IndiaLocation, LocationCategory } from '../../types/location'
import { prefersReducedMotion } from '../../hooks/useAccessibility'

const allLocations = locations as IndiaLocation[]

// ─── Particle Canvas ───────────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = []

    function resize() {
      canvas!.width  = canvas!.offsetWidth
      canvas!.height = canvas!.offsetHeight
    }

    function init() {
      resize()
      particles.length = 0
      const count = Math.floor((canvas!.width * canvas!.height) / 14000)
      for (let i = 0; i < count; i++) {
        particles.push({
          x:  Math.random() * canvas!.width,
          y:  Math.random() * canvas!.height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r:  Math.random() * 1.6 + 0.4,
          a:  Math.random() * 0.5 + 0.1,
        })
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas!.width
        if (p.x > canvas!.width) p.x = 0
        if (p.y < 0) p.y = canvas!.height
        if (p.y > canvas!.height) p.y = 0
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(212,160,23,${p.a})`
        ctx!.fill()
      }
      animId = requestAnimationFrame(draw)
    }

    init()
    draw()
    window.addEventListener('resize', init)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', init) }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
}

// ─── Rotating Stupa (R3F) ───────────────────────────────────────────────────────
function StupaModel() {
  const group = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (group.current && !prefersReducedMotion()) group.current.rotation.y += dt * 0.4
  })

  const gold  = new THREE.MeshStandardMaterial({ color: '#D4A017', emissive: '#D4A017', emissiveIntensity: 0.3, roughness: 0.3, metalness: 0.6 })
  const safr  = new THREE.MeshStandardMaterial({ color: '#FF6B1A', emissive: '#FF6B1A', emissiveIntensity: 0.6 })

  return (
    <group ref={group}>
      <mesh position={[0, -0.9, 0]} material={gold}><cylinderGeometry args={[1, 1.2, 0.2, 8]} /></mesh>
      <mesh position={[0, -0.6, 0]} material={gold}><cylinderGeometry args={[0.7, 1, 0.4, 8]} /></mesh>
      <mesh position={[0,  0.1, 0]} material={gold}><sphereGeometry   args={[0.7, 16, 16]}    /></mesh>
      <mesh position={[0,  0.9, 0]} material={gold}><cylinderGeometry args={[0.08, 0.08, 0.6, 8]} /></mesh>
      <mesh position={[0,  1.3, 0]} material={safr}><coneGeometry     args={[0.2, 0.4, 8]}    /></mesh>
    </group>
  )
}

function RotatingStupa() {
  return (
    <Canvas camera={{ position: [0, 0, 4], fov: 45 }} style={{ background: 'transparent' }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[3, 3, 3]} intensity={1.5} color="#F0C040" />
      <StupaModel />
    </Canvas>
  )
}

// ─── Category Grid ─────────────────────────────────────────────────────────────
const CATEGORIES: { value: LocationCategory | 'all'; label: string; icon: string; desc: string }[] = [
  { value: 'heritage',     icon: '🏛', label: 'Heritage',     desc: 'UNESCO & Archaeological' },
  { value: 'fort',         icon: '🏰', label: 'Forts',        desc: 'Rajput & Mughal Citadels' },
  { value: 'temple',       icon: '⛩',  label: 'Temples',      desc: 'Dravidian & Nagara' },
  { value: 'spiritual',    icon: '🕌', label: 'Spiritual',    desc: 'Pilgrimage & Sacred Sites' },
  { value: 'nature',       icon: '🌿', label: 'Nature',       desc: 'Parks, Wildlife & Landscapes' },
  { value: 'museum',       icon: '🎭', label: 'Museums',      desc: 'Art, Science & Landmarks' },
  { value: 'hill-station', icon: '⛰',  label: 'Hill Stations',desc: 'Tea Estates & Mountain Views' },
]

// ─── HomePage ──────────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate()

  const featured = allLocations.filter(l => l.unescoStatus).slice(0, 6)

  const catCounts = CATEGORIES.reduce((acc, c) => {
    acc[c.value] = allLocations.filter(l => l.category === c.value).length
    return acc
  }, {} as Record<string, number>)

  const [, setFeaturedIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setFeaturedIdx(i => (i + 1) % featured.length), 4000)
    return () => clearInterval(id)
  }, [featured.length])

  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* background layers */}
        <div className="absolute inset-0 bg-bg-base" />
        <ParticleCanvas />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-base" />

        {/* content */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 px-6 max-w-6xl w-full mx-auto">
          {/* text */}
          <div className="flex-1 text-center lg:text-left space-y-6">
            <p className="font-mono text-xs tracking-[0.4em] text-saffron uppercase animate-fade-in">
              Browser-Native Virtual Reality
            </p>
            <h1 className="font-cinzel font-black text-4xl sm:text-5xl lg:text-6xl leading-tight text-cream animate-slide-up">
              Explore India<br />
              <span className="text-gold">Every Angle.</span><br />
              <span className="text-saffron">Every Era.</span>
            </h1>
            <p className="font-proza text-base text-text-secondary max-w-xl animate-fade-in">
              15 real Indian heritage sites, forts, temples, and landmarks — fully immersive 360° tours
              powered by AI. No headset, no download, no cost.
            </p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start animate-slide-up">
              <button onClick={() => navigate('/explore')} className="btn-primary text-sm">
                Start Exploring →
              </button>
              <button onClick={() => navigate('/tour/taj-mahal-agra')} className="btn-secondary text-sm">
                Try Taj Mahal
              </button>
            </div>
          </div>

          {/* 3D stupa */}
          <div className="w-48 h-48 lg:w-64 lg:h-64 flex-none">
            <RotatingStupa />
          </div>
        </div>

        {/* scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-bounce">
          <span className="font-mono text-[10px] tracking-widest text-text-muted uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-gold/40 to-transparent" />
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-y border-[var(--border)] bg-bg-surface">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-wrap justify-center gap-x-10 gap-y-3">
          {[
            ['15', 'Destinations'],
            ['28', 'States'],
            ['5,000+', 'Years of History'],
            ['Free', 'Forever'],
          ].map(([num, label]) => (
            <div key={label} className="flex items-baseline gap-2">
              <span className="font-cinzel font-black text-2xl text-gold">{num}</span>
              <span className="font-mono text-xs tracking-widest text-text-muted uppercase">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Destinations ── */}
      <section className="max-w-7xl mx-auto px-6 py-16 space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-xs tracking-[0.3em] text-saffron uppercase mb-2">UNESCO World Heritage</p>
            <h2 className="font-cinzel text-2xl text-cream">Featured Destinations</h2>
          </div>
          <button onClick={() => navigate('/explore')} className="btn-secondary text-xs py-2 hidden sm:block">
            View All 15 →
          </button>
        </div>

        {/* horizontal scroll */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map(loc => (
            <LocationCard key={loc.id} location={loc} />
          ))}
        </div>

        <div className="text-center sm:hidden">
          <button onClick={() => navigate('/explore')} className="btn-secondary text-xs py-2">
            View All 15 Destinations →
          </button>
        </div>
      </section>

      {/* ── Category Grid ── */}
      <section className="bg-bg-surface border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-16 space-y-8">
          <div className="text-center space-y-2">
            <p className="font-mono text-xs tracking-[0.3em] text-saffron uppercase">Browse by Type</p>
            <h2 className="font-cinzel text-2xl text-cream">Every Corner of India</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => navigate(`/explore?category=${cat.value}`)}
                className="card rounded-sm p-4 text-left group space-y-2 hover:bg-bg-elevated/50 transition-colors"
              >
                <div className="text-3xl">{cat.icon}</div>
                <div>
                  <p className="font-cinzel text-sm text-cream group-hover:text-gold transition-colors">
                    {cat.label}
                  </p>
                  <p className="font-proza text-[11px] text-text-secondary mt-0.5">{cat.desc}</p>
                </div>
                <p className="font-mono text-xs text-text-muted">{catCounts[cat.value] ?? 0} sites</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center space-y-6">
        <h2 className="font-cinzel text-3xl text-cream">
          Begin Your <span className="text-gold">Yatra</span>
        </h2>
        <p className="font-proza text-text-secondary">
          AI personalises your tour in real time based on where you look and what you explore.
          The longer you wander, the smarter your guide becomes.
        </p>
        <button onClick={() => navigate('/explore')} className="btn-primary">
          Explore All 15 Destinations →
        </button>
      </section>

      {/* ── Footer ornament ── */}
      <div className="border-t border-[var(--border)] py-6 text-center">
        <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase">
          Yatra360 · Open Source · Powered by Wikipedia & Wikimedia Commons
        </p>
      </div>
    </div>
  )
}
