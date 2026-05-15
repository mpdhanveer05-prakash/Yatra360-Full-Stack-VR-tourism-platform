import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTourStore } from '../../store/tourStore'
import { useEngagementTracker } from '../../hooks/useEngagementTracker'
import { usePersonalization } from '../../hooks/usePersonalization'
import { useWikipediaData } from '../../hooks/useWikipediaData'
import { useNodeImages } from '../../hooks/useNodeImages'
import { usePanoramaPrefetch } from '../../hooks/usePanoramaPrefetch'
import PannellumTour from '../viewer/PannellumTour'
import type { CameraSnapshot } from '../viewer/PannellumTour'
import StreetViewPanel from '../viewer/StreetViewPanel'
import ShareButton from '../ui/ShareButton'
import OfflineSaveButton from '../ui/OfflineSaveButton'
import AnnotationsPanel from '../ui/AnnotationsPanel'
import CoTourPanel from '../ui/CoTourPanel'
import TourCanvas from '../viewer/TourCanvas'
import HeatmapOverlay from '../ui/HeatmapOverlay'
import RecommendationRail from '../ui/RecommendationRail'
import SessionStats from '../ui/SessionStats'
import GuideChat from '../ui/GuideChat'
import NarrationControls from '../ui/NarrationControls'
import { useNarration } from '../../hooks/useNarration'
import { useAmbientAudio } from '../../hooks/useAmbientAudio'
import { usePassportStore } from '../../store/passportStore'
import FestivalBanner from '../ui/FestivalBanner'
import { activeFestivals } from '../../lib/festivals'
import { asiForLocation, nearbyAsi } from '../../lib/asi'
import { useVoiceAgent } from '../../hooks/useVoiceAgent'
import VoiceAgentButton from '../ui/VoiceAgentButton'
import { useUserStore } from '../../store/userStore'
import locations from '../../data/indiaLocations.json'
import type { IndiaLocation } from '../../types/location'

const allLocations = locations as IndiaLocation[]

type ViewMode = 'streetview' | 'tour' | '3d'

function useSessionId() {
  const ref = useRef(`sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`)
  return ref.current
}

function numOrNull(s: string | null): number | null {
  if (s == null) return null
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : null
}

function buildShareUrl(
  locationId: string,
  snap: { nodeId: string; yaw: number; pitch: number; hfov: number } | null,
): string {
  const base = `${window.location.origin}/tour/${locationId}`
  if (!snap) return base
  const qp = new URLSearchParams({
    node:  snap.nodeId,
    yaw:   snap.yaw.toFixed(1),
    pitch: snap.pitch.toFixed(1),
    hfov:  snap.hfov.toFixed(1),
  })
  return `${base}?${qp.toString()}`
}

// ── 3D-mode overlays ──────────────────────────────────────────────────────────
function TourOverlays({ sessionId, sessionStart }: { sessionId: string; sessionStart: number }) {
  const activeLocation = useTourStore(s => s.activeLocation)
  const currentNode    = useTourStore(s => s.currentNode)
  const vrActive       = useTourStore(s => s.vrActive)
  const [engScore, setEngScore] = useState(0)

  usePersonalization(activeLocation?.id ?? null)
  useWikipediaData(activeLocation?.wikiSlug ?? null)
  useEngagementTracker({
    nodeId:     currentNode?.id    ?? '',
    locationId: activeLocation?.id ?? '',
    sessionId,
    onNodeExit: (score) => setEngScore(score),
  })

  if (!activeLocation || vrActive) return null

  return (
    <>
      <div className="absolute top-20 left-4 z-20">
        <HeatmapOverlay />
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 max-w-xs w-full px-2">
        <RecommendationRail />
      </div>
      <div className="absolute top-20 right-4 z-20" style={{ pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <SessionStats sessionStartMs={sessionStart} engagementScore={engScore} />
        </div>
      </div>
    </>
  )
}

// ── Info sidebar ──────────────────────────────────────────────────────────────
function InfoPanel({ location }: { location: IndiaLocation }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const asi = asiForLocation(location.id)
  const nearby = useMemo(
    () => nearbyAsi(location.lat, location.lng, 25, asi?.asiId),
    [location.lat, location.lng, asi?.asiId],
  )

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="
          px-3 py-2 bg-bg-surface/90 backdrop-blur-sm
          border border-gold/30 hover:border-gold/60
          text-gold font-cinzel text-xs tracking-widest uppercase
          transition-all duration-200 whitespace-nowrap
        "
      >
        {open ? '✕ Close' : 'ℹ Info'}
      </button>

      {open && (
        <div className="
          absolute top-full mt-1 right-0 z-30
          w-72 max-h-[70vh] overflow-y-auto
          bg-bg-surface/96 backdrop-blur-md
          border border-gold/30 p-4 space-y-4
          animate-slide-up shadow-2xl
        ">
          <div>
            <h2 className="font-cinzel text-sm text-gold">{location.name}</h2>
            <p className="font-mono text-[10px] text-text-muted mt-0.5">{location.city} · {location.state}</p>
          </div>
          <div className="gold-divider" />
          <p className="font-proza text-xs text-text-secondary leading-relaxed">{location.description}</p>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {location.established && (
              <div>
                <span className="font-mono text-text-muted uppercase tracking-wider">Est.</span>
                <p className="stat-value">{location.established}</p>
              </div>
            )}
            <div>
              <span className="font-mono text-text-muted uppercase tracking-wider">UNESCO</span>
              <p className={`font-cinzel text-xs ${location.unescoStatus ? 'text-gold' : 'text-text-muted'}`}>
                {location.unescoStatus ? '✓ Yes' : '—'}
              </p>
            </div>
            <div>
              <span className="font-mono text-text-muted uppercase tracking-wider">Best Season</span>
              <p className="font-proza text-[10px] text-cream">{location.bestSeason.slice(0, 3).join(', ')}</p>
            </div>
            <div>
              <span className="font-mono text-text-muted uppercase tracking-wider">Region</span>
              <p className="font-proza text-[10px] text-cream capitalize">{location.region}</p>
            </div>
          </div>
          {location.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {location.tags.slice(0, 6).map(t => (
                <span key={t} className="font-mono text-[9px] text-text-muted bg-bg-elevated px-1.5 py-0.5 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* ASI section */}
          <div className="border-t border-gold/15 pt-3 space-y-2">
            <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase">
              ASI Protected
            </p>
            {asi ? (
              <div className="space-y-1">
                <p className="font-cinzel text-xs text-gold">✓ Centrally Protected</p>
                <p className="font-mono text-[10px] text-text-secondary">
                  Monument No. <span className="text-gold">{asi.asiId}</span>
                </p>
                <p className="font-mono text-[10px] text-text-muted">
                  {asi.category} · {asi.circle} Circle · {asi.district}
                </p>
              </div>
            ) : (
              <p className="font-mono text-[10px] text-text-muted">Not in ASI centrally-protected list.</p>
            )}
          </div>

          {/* Nearby ASI monuments */}
          {nearby.length > 0 && (
            <div className="border-t border-gold/15 pt-3 space-y-2">
              <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase">
                Nearby ASI Monuments
              </p>
              <div className="space-y-1.5">
                {nearby.map(({ monument, distanceKm }) => (
                  <button
                    key={monument.asiId}
                    onClick={() => monument.yatraLocationId && navigate(`/tour/${monument.yatraLocationId}`)}
                    disabled={!monument.yatraLocationId}
                    className={`
                      w-full text-left p-2 bg-bg-elevated/40 transition-colors group
                      ${monument.yatraLocationId ? 'hover:bg-bg-elevated cursor-pointer' : 'cursor-default opacity-70'}
                    `}
                  >
                    <p className="font-cinzel text-[11px] text-cream group-hover:text-gold truncate">
                      {monument.name}
                    </p>
                    <p className="font-mono text-[9px] text-text-muted">
                      {distanceKm.toFixed(1)} km · {monument.asiId}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TourPage() {
  const { locationId } = useParams<{ locationId: string }>()
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId      = useSessionId()
  const sessionStart   = useRef(Date.now()).current

  // Deep-link query params — frozen on initial mount only.
  const initialDeepLink = useRef({
    node:  searchParams.get('node')  || null,
    yaw:   numOrNull(searchParams.get('yaw')),
    pitch: numOrNull(searchParams.get('pitch')),
    hfov:  numOrNull(searchParams.get('hfov')),
  }).current

  // Snapshot getter exposed by PannellumTour
  const snapshotRef = useRef<(() => CameraSnapshot | null) | null>(null)

  const setActiveLocation = useTourStore(s => s.setActiveLocation)
  const resetTour         = useTourStore(s => s.resetTour)
  const activeLocation    = useTourStore(s => s.activeLocation)
  const navigateTo        = useTourStore(s => s.navigateTo)

  const [viewMode, setViewMode] = useState<ViewMode>('streetview')

  // Per-node images from Wikimedia
  const { nodeImages, loading: imagesLoading } = useNodeImages(activeLocation)

  // Wikipedia data for narration (also used elsewhere via separate hooks; cache shared)
  const { summary } = useWikipediaData(activeLocation?.wikiSlug ?? null)
  const currentNode = useTourStore(s => s.currentNode)

  // Build narration text per node: prefer node.wikiContext, else Wikipedia extract, else description.
  const narrationText = useMemo(() => {
    if (!activeLocation) return null
    const intro = currentNode?.label
      ? `${currentNode.label}, ${activeLocation.name}. `
      : `${activeLocation.name}. `
    const body =
      currentNode?.wikiContext?.trim() ||
      summary?.extract?.trim() ||
      activeLocation.description
    return intro + body
  }, [activeLocation, currentNode, summary])

  // Narrate on every node change
  useNarration({
    text:     narrationText,
    sceneKey: currentNode?.id ?? activeLocation?.id ?? null,
    autoPlay: true,
  })

  // Ambient background audio for this location's category
  useAmbientAudio(activeLocation?.category ?? null)

  // Predictively prefetch panoramas for likely-next nodes
  usePanoramaPrefetch(currentNode, activeLocation?.nodes, nodeImages)

  // First matching festival (if any) for the active location
  const festivalMatch = useMemo(() => {
    if (!activeLocation) return null
    return activeFestivals(activeLocation)[0] ?? null
  }, [activeLocation])

  const recordVisit = usePassportStore(s => s.recordVisit)
  const userId      = useUserStore(s => s.userId)

  // Voice agent — STT → intent detection → navigation or guide answer
  const voice = useVoiceAgent({
    locationSlug: activeLocation?.wikiSlug ?? '',
    nodeLabel:    currentNode?.label       ?? activeLocation?.name ?? '',
    locationId:   activeLocation?.id,
    userId,
    locations:    allLocations,
    onNavigate:   (locId) => navigate(`/tour/${locId}`),
    // Client-side fallback used when the backend isn't reachable (e.g. Vercel deploy)
    getFallbackContext: () => activeLocation
      ? {
          locationName:  activeLocation.name,
          description:   activeLocation.description,
          city:          activeLocation.city,
          state:         activeLocation.state,
          category:      activeLocation.category,
          established:   activeLocation.established,
          unescoStatus:  activeLocation.unescoStatus,
          wikiExtract:   summary?.extract,
        }
      : null,
  })

  useEffect(() => {
    const loc = allLocations.find(l => l.id === locationId)
    if (!loc) { navigate('/', { replace: true }); return }
    setActiveLocation(loc)
    recordVisit(loc)
    return () => resetTour()
  }, [locationId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep tourStore in sync when user walks between nodes in Pannellum
  const handleSceneChange = useCallback((nodeId: string) => {
    if (!activeLocation) return
    const node = activeLocation.nodes.find(n => n.id === nodeId)
    if (node) navigateTo(node)
  }, [activeLocation, navigateTo])

  if (!activeLocation) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-base">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-saffron border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-cinzel text-gold text-sm tracking-widest">Loading tour…</p>
        </div>
      </div>
    )
  }

  const deepLinkNode = initialDeepLink.node
    && activeLocation.nodes.some(n => n.id === initialDeepLink.node)
    ? initialDeepLink.node!
    : null

  const firstNodeId = deepLinkNode ?? activeLocation.nodes[0]?.id ?? ''
  const nodeCount   = activeLocation.nodes.length

  const initialView = (initialDeepLink.yaw != null || initialDeepLink.pitch != null || initialDeepLink.hfov != null)
    ? {
        yaw:   initialDeepLink.yaw   ?? undefined,
        pitch: initialDeepLink.pitch ?? undefined,
        hfov:  initialDeepLink.hfov  ?? undefined,
      }
    : undefined

  return (
    <div className="fixed inset-0 bg-bg-base flex flex-col" role="region" aria-label={`${activeLocation.name} virtual tour`}>
      <h1 className="sr-only">{activeLocation.name} — virtual tour</h1>

      {/* ── Header ── */}
      <div className="relative z-40 flex items-center justify-between px-4 h-14 bg-bg-surface/95 backdrop-blur-md border-b border-gold/20 flex-none gap-4">

        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/explore')}
            className="font-mono text-xs text-text-secondary hover:text-cream transition-colors flex-none"
          >
            ← Back
          </button>
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.3em] text-saffron uppercase">{activeLocation.category}</p>
            <p className="font-cinzel text-sm text-cream truncate">{activeLocation.name}</p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 flex-none">
          <button
            onClick={() => setViewMode('streetview')}
            title="Google Street View — walk along actual paths at the site"
            className={`
              px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase transition-all rounded-sm
              ${viewMode === 'streetview'
                ? 'bg-saffron text-cream shadow-[0_0_12px_rgba(255,107,26,0.4)]'
                : 'bg-bg-elevated text-text-secondary border border-gold/20 hover:border-gold/50 hover:text-cream'}
            `}
          >
            🗺 Street View
          </button>
          <button
            onClick={() => setViewMode('tour')}
            title="Curated 360° viewpoints — click arrows to jump between hotspots"
            className={`
              px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase transition-all rounded-sm
              ${viewMode === 'tour'
                ? 'bg-saffron text-cream shadow-[0_0_12px_rgba(255,107,26,0.4)]'
                : 'bg-bg-elevated text-text-secondary border border-gold/20 hover:border-gold/50 hover:text-cream'}
            `}
          >
            🚶 Walk Tour
          </button>
          <button
            onClick={() => setViewMode('3d')}
            title="3D scene with navigation hotspots"
            className={`
              px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase transition-all rounded-sm
              ${viewMode === '3d'
                ? 'bg-saffron text-cream shadow-[0_0_12px_rgba(255,107,26,0.4)]'
                : 'bg-bg-elevated text-text-secondary border border-gold/20 hover:border-gold/50 hover:text-cream'}
            `}
          >
            🌐 3D Scene
          </button>
        </div>

        {/* Narration + share + node count */}
        <div className="flex items-center gap-2 flex-none">
          <NarrationControls text={narrationText} compact />
          <ShareButton
            compact
            getUrl={() => buildShareUrl(activeLocation.id, snapshotRef.current?.() ?? null)}
            label="Copy link to this view"
          />
          <OfflineSaveButton
            compact
            panoramaUrls={Array.from(nodeImages.values())}
            locationName={activeLocation.name}
          />
          <span className="hidden sm:inline-block font-mono text-[9px] text-text-muted bg-bg-elevated border border-gold/10 px-2 py-0.5 rounded-sm">
            {nodeCount} viewpoint{nodeCount !== 1 ? 's' : ''}
            {imagesLoading && viewMode === 'tour' ? ' · loading images…' : ''}
          </span>
        </div>
      </div>

      {/* ── Viewer ── */}
      <div className="relative flex-1 min-h-0">

        {/* Google Street View — walk along real paths */}
        {viewMode === 'streetview' && (
          <StreetViewPanel
            lat={activeLocation.lat}
            lng={activeLocation.lng}
            name={activeLocation.name}
          />
        )}

        {/* Walk Tour — Pannellum multi-scene */}
        {viewMode === 'tour' && (
          nodeImages.size > 0 ? (
            <PannellumTour
              key={activeLocation.id}
              location={activeLocation}
              nodeImages={nodeImages}
              firstNodeId={firstNodeId}
              initialView={initialView}
              onSceneChange={handleSceneChange}
              onReady={(get) => { snapshotRef.current = get }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-bg-base">
              <div className="w-10 h-10 border-2 border-saffron border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-cinzel text-xs tracking-widest text-gold">Fetching location images…</p>
              <p className="font-mono text-[10px] text-text-muted mt-2">{activeLocation.name}</p>
              <button onClick={() => setViewMode('3d')} className="mt-6 btn-secondary text-xs py-1.5">
                Switch to 3D Scene →
              </button>
            </div>
          )
        )}

        {/* 3D Three.js scene */}
        {viewMode === '3d' && (
          <>
            <TourCanvas sessionId={sessionId} />
            <TourOverlays sessionId={sessionId} sessionStart={sessionStart} />
          </>
        )}

        {/* ── Right-side control strip (info, notes, co-tour) ── */}
        <div className="absolute top-4 right-4 z-30 flex flex-col gap-2 items-end">
          <InfoPanel location={activeLocation} />
          <AnnotationsPanel
            locationId={activeLocation.id}
            locationName={activeLocation.name}
            getCameraView={() => {
              const s = snapshotRef.current?.()
              return s ? { yaw: s.yaw, pitch: s.pitch } : null
            }}
          />
          <CoTourPanel
            locationId={activeLocation.id}
            locationName={activeLocation.name}
            getSnapshot={() => snapshotRef.current?.() ?? null}
          />
        </div>

        {/* Festival overlay (if a matching festival is active or upcoming) */}
        {festivalMatch && (
          <FestivalBanner
            festival={festivalMatch.festival}
            status={festivalMatch.status}
            daysUntil={festivalMatch.daysUntil}
          />
        )}

        {/* Guide chat available in both viewer modes */}
        <GuideChat />

        {/* Voice agent — floating mic, bottom-LEFT above guide chat toggle
            (left side keeps clear of Google Street View's bottom-right controls) */}
        <div className="absolute bottom-24 left-4 z-30">
          <VoiceAgentButton
            state={voice.state}
            transcript={voice.transcript}
            answer={voice.answer}
            errorMsg={voice.errorMsg}
            supported={voice.supported}
            onStart={voice.start}
            onStop={voice.stop}
            onReset={voice.reset}
          />
        </div>
      </div>
    </div>
  )
}
