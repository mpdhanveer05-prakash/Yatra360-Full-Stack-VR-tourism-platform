import { useEffect, useRef, useState, useCallback } from 'react'
import type { IndiaLocation } from '../../types/location'
import { prefersReducedMotion } from '../../hooks/useAccessibility'

// ── Pannellum types ────────────────────────────────────────────────────────────
interface PHotspot {
  pitch:     number
  yaw:       number
  type:      'scene' | 'info' | 'custom'
  text?:     string
  sceneId?:  string
  cssClass?: string
  id?:       string
}
interface PScene {
  type:         'equirectangular'
  panorama:     string
  title?:       string
  hotSpots?:    PHotspot[]
  crossOrigin?: string
  hfov?:        number
}
interface PTourConfig {
  default: {
    firstScene:                 string
    sceneFadeDuration?:         number
    autoLoad?:                  boolean
    autoRotate?:                number
    autoRotateInactivityDelay?: number
    showZoomCtrl?:              boolean
    showFullscreenCtrl?:        boolean
    hfov?:                      number
    minHfov?:                   number
    maxHfov?:                   number
    yaw?:                       number
    pitch?:                     number
  }
  scenes: Record<string, PScene>
}
interface PViewer {
  destroy():                            void
  on(event: string, cb: (d?: unknown) => void): void
  loadScene(sceneId: string, pitch?: number, yaw?: number, hfov?: number): void
  getScene():                           string
  getYaw():                             number
  getPitch():                           number
  getHfov():                            number
}
declare global {
  interface Window {
    pannellum: { viewer(el: HTMLElement, cfg: PTourConfig): PViewer }
  }
}

// ── CDN loader (shared singleton) ─────────────────────────────────────────────
let _pLoaded = false
let _pPromise: Promise<void> | null = null

function loadPannellum(): Promise<void> {
  if (_pLoaded && window.pannellum) return Promise.resolve()
  if (_pPromise) return _pPromise
  _pPromise = new Promise<void>(resolve => {
    if (!document.getElementById('pannellum-css')) {
      const l = document.createElement('link')
      l.id = 'pannellum-css'; l.rel = 'stylesheet'
      l.href = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css'
      document.head.appendChild(l)
    }
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js'
    s.onload = () => { _pLoaded = true; resolve() }
    s.onerror = () => resolve()
    document.head.appendChild(s)
  })
  return _pPromise
}

// ── Config builder ────────────────────────────────────────────────────────────
function buildConfig(
  location: IndiaLocation,
  nodeImages: Map<string, string>,
  firstNodeId: string,
  initial?: { yaw?: number; pitch?: number; hfov?: number },
): PTourConfig {
  const scenes: Record<string, PScene> = {}

  for (const node of location.nodes) {
    const panorama = nodeImages.get(node.id) ?? `https://picsum.photos/seed/${node.id.length * 37}/3840/1920`
    const hotSpots: PHotspot[] = []

    for (const hs of node.hotspots) {
      if (hs.type === 'navigation' && hs.targetNodeId) {
        hotSpots.push({
          id:       hs.id,
          type:     'scene',
          // Place navigation arrows slightly below the horizon so they read naturally
          pitch:    -12,
          yaw:      hs.azimuth,
          text:     `→ ${hs.label}`,
          sceneId:  hs.targetNodeId,
          cssClass: 'yatra-nav-hs',
        })
      } else if (hs.type === 'info' && hs.content) {
        hotSpots.push({
          id:      hs.id,
          type:    'info',
          pitch:   hs.elevation,
          yaw:     hs.azimuth,
          text:    hs.content,
          cssClass:'yatra-info-hs',
        })
      }
    }

    scenes[node.id] = {
      type:        'equirectangular',
      panorama,
      title:       node.label,
      hotSpots,
      crossOrigin: 'anonymous',
    }
  }

  const reduceMotion = prefersReducedMotion()
  return {
    default: {
      firstScene:                 firstNodeId,
      sceneFadeDuration:          reduceMotion ? 0 : 600,
      autoLoad:                   true,
      autoRotate:                 reduceMotion ? 0 : (initial?.yaw != null ? 0 : -1.2),
      autoRotateInactivityDelay:  4000,
      showZoomCtrl:               true,
      showFullscreenCtrl:         true,
      hfov:                       initial?.hfov ?? 100,
      minHfov:                    50,
      maxHfov:                    120,
      ...(initial?.yaw   != null ? { yaw:   initial.yaw }   : {}),
      ...(initial?.pitch != null ? { pitch: initial.pitch } : {}),
    },
    scenes,
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export interface CameraSnapshot {
  nodeId: string
  yaw:    number
  pitch:  number
  hfov:   number
}

interface Props {
  location:     IndiaLocation
  nodeImages:   Map<string, string>
  firstNodeId:  string
  initialView?: { yaw?: number; pitch?: number; hfov?: number }
  onSceneChange?: (nodeId: string) => void
  /** Provides a snapshot getter once the viewer is ready. */
  onReady?:     (getSnapshot: () => CameraSnapshot | null) => void
}

export default function PannellumTour({ location, nodeImages, firstNodeId, initialView, onSceneChange, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef    = useRef<PViewer | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [currentLabel, setCurrentLabel] = useState('')

  // Stable ref so the Pannellum callback always sees the latest handler
  const onSceneChangeRef = useRef(onSceneChange)
  useEffect(() => { onSceneChangeRef.current = onSceneChange }, [onSceneChange])

  const initViewer = useCallback(() => {
    if (!containerRef.current || !window.pannellum || nodeImages.size === 0) return

    viewerRef.current?.destroy()
    viewerRef.current = null

    try {
      const cfg    = buildConfig(location, nodeImages, firstNodeId, initialView)
      const viewer = window.pannellum.viewer(containerRef.current, cfg)
      viewerRef.current = viewer
      setStatus('ready')

      const firstNode = location.nodes.find(n => n.id === firstNodeId)
      setCurrentLabel(firstNode?.label ?? '')

      viewer.on('scenechange', (sceneId) => {
        const id    = sceneId as string
        const label = location.nodes.find(n => n.id === id)?.label ?? id
        setCurrentLabel(label)
        onSceneChangeRef.current?.(id)
      })

      onReady?.(() => {
        const v = viewerRef.current
        if (!v) return null
        return {
          nodeId: v.getScene(),
          yaw:    v.getYaw(),
          pitch:  v.getPitch(),
          hfov:   v.getHfov(),
        }
      })
    } catch (err) {
      console.error('[PannellumTour] init failed:', err)
      setStatus('error')
    }
  }, [location, nodeImages, firstNodeId, initialView, onReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load Pannellum then init
  useEffect(() => {
    if (nodeImages.size === 0) return
    let cancelled = false
    setStatus('loading')

    loadPannellum().then(() => {
      if (cancelled) return
      if (!window.pannellum) { setStatus('error'); return }
      initViewer()
    })

    return () => {
      cancelled = true
      viewerRef.current?.destroy()
      viewerRef.current = null
    }
  }, [initViewer])

  return (
    <div className="w-full h-full relative" style={{ userSelect: 'none' }}>
      {/* Pannellum mounts here */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-bg-base pointer-events-none">
          <div className="w-10 h-10 border-2 border-saffron border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-cinzel text-xs tracking-widest text-gold">{location.name}</p>
          <p className="font-mono text-[10px] text-text-muted mt-1">Fetching panoramas…</p>
        </div>
      )}

      {/* Current viewpoint label */}
      {status === 'ready' && currentLabel && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-sm">
            <p className="font-cinzel text-xs text-cream tracking-wide">{currentLabel}</p>
          </div>
        </div>
      )}

      {/* Controls hint */}
      {status === 'ready' && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <p className="font-mono text-[9px] tracking-widest text-white/40">
            Drag to look · Scroll to zoom · Click arrows to walk
          </p>
        </div>
      )}
    </div>
  )
}
