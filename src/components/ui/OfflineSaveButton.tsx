import { useState } from 'react'
import { cacheLocationAssets, offlineCacheSupported } from '../../lib/offlineCache'

interface Props {
  panoramaUrls: string[]
  locationName: string
  compact?:     boolean
}

/** Force-caches a location's panoramas via the active service worker. */
export default function OfflineSaveButton({ panoramaUrls, locationName, compact = false }: Props) {
  const [state, setState] = useState<'idle' | 'caching' | 'done' | 'error'>('idle')
  const [count, setCount] = useState({ cached: 0, total: 0 })

  if (!offlineCacheSupported()) return null

  async function handleClick() {
    if (state === 'caching') return
    setState('caching')
    setCount({ cached: 0, total: panoramaUrls.length })
    const result = await cacheLocationAssets(panoramaUrls.filter(Boolean))
    setCount({ cached: result.cached, total: result.total })
    setState(result.ok ? 'done' : 'error')
    setTimeout(() => setState('idle'), 4000)
  }

  const label =
    state === 'caching' ? `${count.cached}/${count.total}` :
    state === 'done'    ? '✓ Saved offline' :
    state === 'error'   ? '⚠ Partial save' :
                          'Save offline'

  const icon =
    state === 'caching' ? '⬇' :
    state === 'done'    ? '✓' :
    state === 'error'   ? '⚠' :
                          '⬇'

  return (
    <button
      onClick={handleClick}
      disabled={state === 'caching' || panoramaUrls.length === 0}
      aria-label={`Save ${locationName} for offline viewing`}
      title={`Save ${locationName} for offline viewing`}
      className="
        px-2.5 py-1.5 font-mono text-[11px] tracking-widest uppercase rounded-sm
        border border-gold/20 bg-bg-elevated text-text-secondary
        hover:border-gold/50 hover:text-cream transition-colors
        disabled:opacity-50 disabled:cursor-wait
      "
    >
      <span aria-hidden>{icon}</span>
      {!compact && <span className="ml-1.5">{label}</span>}
    </button>
  )
}
