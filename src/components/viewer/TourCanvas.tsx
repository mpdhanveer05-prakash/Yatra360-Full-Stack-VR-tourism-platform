import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useTourStore } from '../../store/tourStore'
import { useTourNavigation } from '../../hooks/useTourNavigation'
import { useLocationImages } from '../../hooks/useLocationImages'
import PanoramaViewer from './PanoramaViewer'
import CameraController from './CameraController'
import SkyEnvironment from './SkyEnvironment'
import NavigationHotspot from './NavigationHotspot'
import InfoHotspot from './InfoHotspot'
import TransitionEffect from './TransitionEffect'
import VRButton from './VRButton'

interface Props {
  sessionId: string
}

export default function TourCanvas({ sessionId }: Props) {
  const activeLocation = useTourStore(s => s.activeLocation)
  const currentNode    = useTourStore(s => s.currentNode)
  const vrActive       = useTourStore(s => s.vrActive)
  const { goToNode }   = useTourNavigation(sessionId)

  // Fetch real Wikimedia panoramas for this location
  const { panoramaUrl: wikiPanorama, tier } = useLocationImages(activeLocation)

  if (!activeLocation || !currentNode) return null

  // Prefer a real Wikimedia panorama over the JSON Unsplash placeholder URLs.
  // Fall back to the node's own URL (which may also work on some environments).
  const primaryUrl  = wikiPanorama || currentNode.panoramaUrl
  const fallbackUrl = currentNode.fallbackImageUrl || currentNode.panoramaUrl

  return (
    <div className="relative w-full h-full" style={{ touchAction: 'none' }}>
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 1100 }}
        gl={{ antialias: true }}
        style={{ background: '#0D0F1A' }}
        onCreated={({ gl }) => { gl.domElement.style.touchAction = 'none' }}
      >
        <Suspense fallback={null}>
          <SkyEnvironment />

          <PanoramaViewer
            url={primaryUrl}
            fallbackUrl={fallbackUrl}
          />

          {currentNode.hotspots.map(hs => {
            if (hs.type === 'navigation') {
              const target = activeLocation.nodes.find(n => n.id === hs.targetNodeId)
              if (!target) return null
              return (
                <NavigationHotspot
                  key={hs.id}
                  hotspot={hs}
                  onClick={() => goToNode(target, 'hotspot')}
                />
              )
            }
            if (hs.type === 'info') {
              return <InfoHotspot key={hs.id} hotspot={hs} />
            }
            return null
          })}

          <CameraController />
        </Suspense>
      </Canvas>

      {!vrActive && (
        <>
          <TransitionEffect />
          <VRButton sessionId={sessionId} locationId={activeLocation.id} />

          {/* node label */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <p className="font-cinzel text-xs tracking-widest text-gold/70 uppercase">
              {activeLocation.name}
            </p>
            <p className="font-cinzel text-sm tracking-wide text-cream mt-0.5">
              {currentNode.label}
            </p>
          </div>

          {/* image source badge */}
          <div className="absolute bottom-20 left-4 z-20 pointer-events-none">
            <span className="font-mono text-[10px] tracking-widest text-text-muted uppercase bg-bg-surface/60 px-2 py-0.5 rounded-sm">
              {tier === 'wikimedia' ? '📷 Wikimedia · 360°' : '🌐 360° Scene'}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
