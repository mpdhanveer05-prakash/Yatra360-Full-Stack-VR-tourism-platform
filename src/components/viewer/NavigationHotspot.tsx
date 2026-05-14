import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Hotspot } from '../../types/location'

interface Props {
  hotspot: Hotspot
  onClick: () => void
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

export default function NavigationHotspot({ hotspot, onClick }: Props) {
  const meshRef  = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const timeRef  = useRef(0)
  const [hovered, setHovered] = useState(false)

  const [bx, by, bz] = hotspotPosition(hotspot.azimuth, hotspot.elevation)

  useFrame((_, delta) => {
    timeRef.current += delta
    if (meshRef.current) {
      meshRef.current.position.y = by + Math.sin(timeRef.current * 1.8) * 0.12
    }
    if (lightRef.current) {
      lightRef.current.intensity = hovered
        ? 1.8 + Math.sin(timeRef.current * 4) * 0.4
        : 0.9 + Math.sin(timeRef.current * 2) * 0.2
    }
  })

  return (
    <group position={[bx, by, bz]}>
      {/* glow point light */}
      <pointLight
        ref={lightRef}
        color="#FF6B1A"
        intensity={0.9}
        distance={3}
        decay={2}
      />

      {/* main sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick() }}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerLeave={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default' }}
        scale={hovered ? 1.25 : 1}
      >
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial
          color="#FF6B1A"
          emissive="#FF4500"
          emissiveIntensity={hovered ? 2.5 : 1.2}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* outer glow ring */}
      <mesh scale={hovered ? 1.6 : 1.35}>
        <ringGeometry args={[0.18, 0.22, 32]} />
        <meshBasicMaterial
          color="#FF8C42"
          transparent
          opacity={hovered ? 0.6 : 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* HTML label */}
      <Html
        center
        distanceFactor={6}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className={`
            px-2 py-1 rounded-sm text-xs font-cinzel tracking-wider whitespace-nowrap
            bg-bg-surface/90 border border-saffron/60 text-cream
            transition-all duration-200
            ${hovered ? 'opacity-100 scale-105' : 'opacity-70 scale-100'}
          `}
          style={{ transform: 'translateY(-28px)', fontSize: '10px' }}
        >
          ▶ {hotspot.label}
        </div>
      </Html>
    </group>
  )
}
