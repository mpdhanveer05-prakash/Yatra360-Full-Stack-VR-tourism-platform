import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { IndiaLocation } from '../../types/location'
import { buildKeywords, getCardImage } from '../../api/unsplash'

interface Props {
  location:      IndiaLocation
  aiMatchScore?: number
  imageUrl?:     string
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  heritage:      { bg: 'bg-gold/15',        text: 'text-gold-light',  label: 'Heritage'     },
  fort:          { bg: 'bg-saffron/15',     text: 'text-saffron',     label: 'Fort'         },
  temple:        { bg: 'bg-terracotta/15',  text: 'text-terracotta',  label: 'Temple'       },
  spiritual:     { bg: 'bg-purple-900/40',  text: 'text-purple-300',  label: 'Spiritual'    },
  nature:        { bg: 'bg-emerald-900/40', text: 'text-emerald-400', label: 'Nature'       },
  museum:        { bg: 'bg-blue-900/40',    text: 'text-blue-300',    label: 'Museum'       },
  'hill-station':{ bg: 'bg-cyan-900/40',   text: 'text-cyan-300',    label: 'Hill Station' },
}

// Module-level cache: wikiSlug → thumbnail URL
const thumbCache = new Map<string, string>()

function useWikiThumbnail(wikiSlug: string, fallback: string): string {
  const cached = thumbCache.get(wikiSlug)
  const [url, setUrl] = useState<string>(cached ?? fallback)

  useEffect(() => {
    if (cached) return
    let cancelled = false

    fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiSlug)}`,
      { headers: { 'User-Agent': 'Yatra360/1.0' } },
    )
      .then(r => r.json())
      .then((data: { thumbnail?: { source?: string } }) => {
        if (cancelled) return
        const src = data.thumbnail?.source
        if (src) {
          // Ask for a larger thumbnail version
          const hd = src.replace(/\/\d+px-/, '/600px-')
          thumbCache.set(wikiSlug, hd)
          setUrl(hd)
        }
      })
      .catch(() => { /* keep fallback */ })

    return () => { cancelled = true }
  }, [wikiSlug, cached, fallback])

  return url
}

export default function LocationCard({ location, aiMatchScore, imageUrl }: Props) {
  const navigate  = useNavigate()
  const [loaded, setLoaded]   = useState(false)
  const [errored, setErrored] = useState(false)

  const style    = CATEGORY_STYLES[location.category] ?? CATEGORY_STYLES.heritage
  const picsum   = getCardImage(buildKeywords(location.name, location.category, location.tags))
  const wikiThumb = useWikiThumbnail(location.wikiSlug, picsum)

  const src = errored ? picsum : (imageUrl ?? wikiThumb)

  return (
    <div
      className="card rounded-sm overflow-hidden flex flex-col group cursor-pointer"
      onClick={() => navigate(`/tour/${location.id}`)}
      role="article"
      aria-label={location.name}
    >
      {/* image */}
      <div className="relative h-44 overflow-hidden bg-bg-elevated">
        {!loaded && <div className="absolute inset-0 skeleton" />}
        <img
          src={src}
          alt={location.name}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => { setErrored(true); setLoaded(true) }}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
        {location.unescoStatus && (
          <span className="absolute top-2 right-2 bg-gold/90 text-bg-base font-mono text-[9px] px-1.5 py-0.5 tracking-widest uppercase">
            UNESCO
          </span>
        )}
      </div>

      {/* content */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-cinzel tracking-widest uppercase px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
            {style.label}
          </span>
          <span className="text-[10px] font-mono text-text-muted">{location.state}</span>
        </div>

        <h3 className="font-cinzel text-base text-cream leading-snug group-hover:text-gold transition-colors">
          {location.name}
        </h3>

        <p className="font-proza text-xs text-text-secondary leading-relaxed line-clamp-2 flex-1">
          {location.description}
        </p>

        {aiMatchScore !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">AI Match</span>
              <span className="font-mono text-[10px] text-saffron">{aiMatchScore}%</span>
            </div>
            <div className="h-1 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-saffron to-gold-light rounded-full transition-all duration-700"
                style={{ width: `${aiMatchScore}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={e => { e.stopPropagation(); navigate(`/tour/${location.id}`) }}
          className="mt-1 btn-primary text-xs py-2 w-fit"
        >
          Explore →
        </button>
      </div>
    </div>
  )
}
