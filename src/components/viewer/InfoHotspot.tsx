import { useState } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Hotspot } from '../../types/location'

interface Props {
  hotspot: Hotspot
}

function hotspotPosition(azimuth: number, elevation: number, r = 8): [number, number, number] {
  const phi   = Math.PI / 2 - elevation * (Math.PI / 180)
  const theta = azimuth * (Math.PI / 180)
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ]
}

export default function InfoHotspot({ hotspot }: Props) {
  const [open, setOpen]     = useState(false)
  const [hovered, setHovered] = useState(false)
  const pos = hotspotPosition(hotspot.azimuth, hotspot.elevation)

  return (
    <group position={pos}>
      {/* marker diamond */}
      <mesh
        rotation={[0, 0, Math.PI / 4]}
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerLeave={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default' }}
        scale={hovered ? 1.3 : 1}
      >
        <boxGeometry args={[0.14, 0.14, 0.04]} />
        <meshStandardMaterial
          color="#D4A017"
          emissive="#D4A017"
          emissiveIntensity={hovered ? 2 : 0.8}
          roughness={0.1}
          metalness={0.5}
        />
      </mesh>

      {/* outer glow */}
      <mesh scale={hovered ? 1.8 : 1.5} rotation={[0, 0, Math.PI / 4]}>
        <ringGeometry args={[0.12, 0.16, 4]} />
        <meshBasicMaterial
          color="#F0C040"
          transparent
          opacity={hovered ? 0.5 : 0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* HTML billboard */}
      <Html center distanceFactor={6}>
        <div style={{ pointerEvents: 'auto' }}>
          {/* label pill */}
          <div
            className={`
              px-2 py-1 rounded-sm text-xs font-cinzel tracking-wider whitespace-nowrap cursor-pointer
              bg-bg-elevated/95 border border-gold/60 text-gold
              transition-all duration-150 select-none
              ${open ? 'opacity-100' : 'opacity-80 hover:opacity-100'}
            `}
            style={{ transform: 'translateY(-26px)', fontSize: '10px' }}
            onClick={() => setOpen(o => !o)}
          >
            ℹ {hotspot.label}
          </div>

          {/* content popup */}
          {open && hotspot.content && (
            <div
              className="absolute left-1/2 -translate-x-1/2 mt-1 w-56 rounded-sm
                         bg-bg-surface/97 border border-gold/40 p-2.5 shadow-lg"
              style={{ top: '100%', fontSize: '11px', lineHeight: 1.5 }}
            >
              <p className="text-cream font-proza">{hotspot.content}</p>
              <button
                className="mt-1.5 text-[10px] text-gold/70 hover:text-gold"
                onClick={() => setOpen(false)}
              >
                ✕ close
              </button>
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}
