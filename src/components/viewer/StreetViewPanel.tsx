import { useMemo, useState } from 'react'

interface Props {
  lat:  number
  lng:  number
  name: string
}

/**
 * Embedded Google Street View.
 *
 * Two embed modes:
 *  1. Maps Embed API (when VITE_GOOGLE_MAPS_KEY is set) — Google snaps to
 *     the nearest available Street View pano automatically. Best UX.
 *  2. No-key fallback via `output=svembed` — works for sites with SV at the
 *     exact coordinates; otherwise lands on a zoomed map.
 *
 * For locations without Street View at all, we surface a link to open in
 * full Google Maps where the user can drag Pegman onto a blue path.
 */
export default function StreetViewPanel({ lat, lng, name }: Props) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined
  const [iframeKey, setIframeKey] = useState(0)

  const { embedSrc, externalUrl } = useMemo(() => {
    const externalUrl = `https://www.google.com/maps/@${lat},${lng},3a,75y,90h,90t/data=!3m4!1e1`
    const embedSrc = key
      ? `https://www.google.com/maps/embed/v1/streetview?key=${key}&location=${lat},${lng}&heading=0&pitch=0&fov=100&source=outdoor`
      : `https://www.google.com/maps?q=${lat},${lng}&layer=c&cbll=${lat},${lng}&cbp=11,0,0,0,0&output=svembed&z=18`
    return { embedSrc, externalUrl }
  }, [lat, lng, key])

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

      {/* Help banner — appears top-center, dismissible-but-honest about limitations */}
      {!key && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 max-w-md w-[92%]">
          <div className="bg-bg-surface/95 backdrop-blur-md border border-gold/30 px-3 py-2 flex items-start gap-2 shadow-lg rounded-sm">
            <span aria-hidden className="text-base flex-none">💡</span>
            <div className="min-w-0 flex-1 text-[10px] font-mono text-text-secondary leading-relaxed">
              If you see a map instead of Street View, the exact coordinates have no
              Pegman drop point.{' '}
              <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="text-saffron underline">
                Open in Google Maps
              </a>{' '}
              and drag the yellow Pegman onto a blue line — or set{' '}
              <code className="text-gold">VITE_GOOGLE_MAPS_KEY</code> in your <code className="text-gold">.env</code> for auto-snapping.
            </div>
          </div>
        </div>
      )}

      {/* Footer toolbar */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[10px] tracking-widest uppercase px-2 py-1 bg-bg-surface/90 border border-gold/30 text-cream hover:bg-saffron hover:border-saffron transition-colors rounded-sm"
        >
          ↗ Open in Maps
        </a>
        <button
          onClick={() => setIframeKey(k => k + 1)}
          className="font-mono text-[10px] tracking-widest uppercase px-2 py-1 bg-bg-surface/90 border border-gold/30 text-cream hover:bg-saffron hover:border-saffron transition-colors rounded-sm"
          title="Reload Street View"
        >
          ↻ Retry
        </button>
        <p className="font-mono text-[9px] tracking-widest text-white/60 bg-black/40 px-2 py-1 rounded-sm pointer-events-none">
          Click arrows to walk · Drag to look
        </p>
      </div>
    </div>
  )
}
