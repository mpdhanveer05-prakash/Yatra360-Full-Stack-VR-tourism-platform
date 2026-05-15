import { useMemo, useState } from 'react'

interface Props {
  lat:  number
  lng:  number
  name: string
}

type ViewMode = 'map' | 'streetview'

/**
 * Map-first immersive viewer.
 *
 * Default mode = a Google Maps PLACE embed of the location (always loads,
 * so no destination ever shows a blank iframe).
 *
 * Users can toggle to Street View mode for sites with walkable coverage.
 * If Street View has no imagery at the coordinates the toolbar's "Back to
 * Map" button takes them back to the always-working map view.
 *
 * Both modes use the keyed Embed API when VITE_GOOGLE_MAPS_KEY is set,
 * with a no-key fallback for the map view.
 */
export default function StreetViewPanel({ lat, lng, name }: Props) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined
  const [mode, setMode]       = useState<ViewMode>('map')
  const [iframeKey, setIframeKey] = useState(0)

  const { mapEmbed, svEmbed, openInMapsUrl, openInStreetViewUrl } = useMemo(() => {
    const openInMapsUrl =
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`
    const openInStreetViewUrl =
      `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`

    // Place embed — pins the location on a regular satellite/road map.
    // Works for ANY coordinates so this is our default and our fallback.
    const mapEmbed = key
      ? `https://www.google.com/maps/embed/v1/place?key=${key}` +
        `&q=${encodeURIComponent(name)}&zoom=17&maptype=satellite`
      : `https://maps.google.com/maps?q=${encodeURIComponent(name)}&t=k&z=17&output=embed`

    // Street View embed — may show "no imagery" for sites without coverage.
    const svEmbed = key
      ? `https://www.google.com/maps/embed/v1/streetview?key=${key}` +
        `&location=${lat},${lng}&heading=0&pitch=0&fov=100`
      : `https://www.google.com/maps?q=${lat},${lng}` +
        `&layer=c&cbll=${lat},${lng}&cbp=11,0,0,0,0&output=svembed&z=18`

    return { mapEmbed, svEmbed, openInMapsUrl, openInStreetViewUrl }
  }, [lat, lng, name, key])

  const embedSrc = mode === 'map' ? mapEmbed : svEmbed
  const modeLabel = mode === 'map' ? 'Map View' : 'Street View'

  return (
    <div className="w-full h-full relative bg-bg-base">
      <iframe
        key={`${mode}-${iframeKey}`}
        title={`${modeLabel} — ${name}`}
        src={embedSrc}
        className="w-full h-full border-0 absolute inset-0"
        allow="fullscreen; accelerometer; gyroscope"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        loading="eager"
      />

      {/* Cover Google's bottom-corner chrome (keyboard shortcuts, terms,
          "Report a problem", Google logo). We can't reach inside the iframe
          so we mask the corners with opaque rectangles in our app theme. */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 z-[5] bg-bg-base pointer-events-none"
        style={{ width: '230px', height: '34px' }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 z-[5] bg-bg-base pointer-events-none"
        style={{ width: '180px', height: '34px' }}
      />

      {/* Mode banner — top-center, shows what's currently being viewed */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 max-w-md w-[92%]">
        <div className="bg-bg-surface/95 backdrop-blur-md border border-gold/30 px-3 py-2 flex items-center justify-between gap-2 shadow-lg rounded-sm">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9px] tracking-widest text-text-muted uppercase">
              Viewing
            </p>
            <p className="font-cinzel text-sm text-gold truncate">
              {modeLabel} · {name}
            </p>
          </div>
          {mode === 'map' ? (
            <button
              onClick={() => { setMode('streetview'); setIframeKey(k => k + 1) }}
              className="flex-none font-mono text-[10px] tracking-widest uppercase px-2.5 py-1.5 bg-saffron text-cream hover:bg-saffron-light transition-colors rounded-sm"
              title="Try Google Street View at this location"
            >
              🚶 Try Street View →
            </button>
          ) : (
            <button
              onClick={() => { setMode('map'); setIframeKey(k => k + 1) }}
              className="flex-none font-mono text-[10px] tracking-widest uppercase px-2.5 py-1.5 bg-bg-elevated border border-gold/40 text-cream hover:border-gold transition-colors rounded-sm"
              title="Switch back to map view"
            >
              ← Back to Map
            </button>
          )}
        </div>
      </div>

      {/* Footer toolbar — pinned above masked corners */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex flex-wrap items-center justify-center gap-2 max-w-[90%]">
        <a
          href={openInMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Open ${name} on Google Maps`}
          className="font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 bg-bg-surface/90 border border-gold/30 text-cream hover:bg-saffron hover:border-saffron transition-colors rounded-sm"
        >
          ↗ Open in Maps
        </a>
        <a
          href={openInStreetViewUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Open Street View at exact coordinates"
          className="font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 bg-bg-surface/90 border border-gold/30 text-cream hover:bg-saffron hover:border-saffron transition-colors rounded-sm"
        >
          🚶 Street View
        </a>
        <button
          onClick={() => setIframeKey(k => k + 1)}
          className="font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 bg-bg-surface/90 border border-gold/30 text-cream hover:bg-saffron hover:border-saffron transition-colors rounded-sm"
          title="Reload current view"
        >
          ↻ Reload
        </button>
      </div>
    </div>
  )
}
