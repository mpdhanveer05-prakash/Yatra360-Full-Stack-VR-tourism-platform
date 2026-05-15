import { useMemo, useState } from 'react'

interface Props {
  lat:  number
  lng:  number
  name: string
}

/**
 * Embedded Google Street View with proper fallbacks.
 *
 * Two embed modes:
 *  1. Maps Embed API (when VITE_GOOGLE_MAPS_KEY is set) — Google snaps to the
 *     nearest available Street View pano automatically.
 *  2. No-key fallback via `output=svembed` — only works for sites with SV at
 *     the exact coordinates.
 *
 * "Open in Maps" button opens the LOCATION in Google Maps regular view,
 * not Street View — so the user actually lands on the right place.
 */
export default function StreetViewPanel({ lat, lng, name }: Props) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined
  const [iframeKey, setIframeKey] = useState(0)

  const { embedSrc, openInMapsUrl, openInStreetViewUrl } = useMemo(() => {
    // Open the LOCATION on Google Maps (regular map mode, centered + zoomed).
    // Uses the place-search API form so the location name resolves properly.
    const openInMapsUrl =
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`

    // Separately, the user can request Street View directly at the coordinates
    const openInStreetViewUrl =
      `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`

    const embedSrc = key
      ? `https://www.google.com/maps/embed/v1/streetview?key=${key}` +
        `&location=${lat},${lng}&heading=0&pitch=0&fov=100&source=outdoor`
      : `https://www.google.com/maps?q=${lat},${lng}` +
        `&layer=c&cbll=${lat},${lng}&cbp=11,0,0,0,0&output=svembed&z=18`

    return { embedSrc, openInMapsUrl, openInStreetViewUrl }
  }, [lat, lng, name, key])

  return (
    <div className="w-full h-full relative bg-bg-base">
      <iframe
        key={iframeKey}
        title={`Street View — ${name}`}
        src={embedSrc}
        className="w-full h-full border-0 absolute inset-0"
        allow="fullscreen; accelerometer; gyroscope"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        loading="eager"
      />

      {/* Cover Google's bottom-corner chrome (keyboard shortcuts, terms,
          map-data, "Report a problem", Google logo). We can't remove them
          from inside the cross-origin iframe so we mask them with opaque
          rectangles in our app's saffron theme. */}
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

      {/* Help banner — appears only when no key is set */}
      {!key && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 max-w-md w-[92%]">
          <div className="bg-bg-surface/95 backdrop-blur-md border border-gold/30 px-3 py-2 flex items-start gap-2 shadow-lg rounded-sm">
            <span aria-hidden className="text-base flex-none">💡</span>
            <div className="min-w-0 flex-1 text-[10px] font-mono text-text-secondary leading-relaxed">
              No Google Maps API key configured. If you see a map instead of
              Street View, this location may not have Street View coverage —
              try the <strong className="text-gold">Walk Tour</strong> mode in the header,
              or <a href={openInStreetViewUrl} target="_blank" rel="noopener noreferrer" className="text-saffron underline">open in Google Maps</a>{' '}
              and drag the yellow Pegman onto a blue road.
            </div>
          </div>
        </div>
      )}

      {/* Footer toolbar — bottom-center, pinned above viewer chrome */}
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
          title="Reload Street View"
        >
          ↻ Retry
        </button>
        <p className="font-mono text-[9px] tracking-widest text-white/70 bg-black/50 px-2 py-1 rounded-sm pointer-events-none hidden md:inline-block">
          Click arrows to walk · Drag to look
        </p>
      </div>
    </div>
  )
}
