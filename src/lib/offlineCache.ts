// Helpers for forcing a location's assets into the SW's cache so it
// remains available offline.

export interface OfflineCacheResult {
  ok:       boolean
  cached:   number
  failed:   number
  total:    number
}

/** Prefetch every panorama URL passed in. Returns counts. */
export async function cacheLocationAssets(panoramaUrls: string[]): Promise<OfflineCacheResult> {
  let cached = 0, failed = 0
  await Promise.all(
    panoramaUrls.map(async (url) => {
      try {
        const res = await fetch(url, { mode: 'cors', credentials: 'omit' })
        if (res.ok) cached++; else failed++
      } catch {
        failed++
      }
    }),
  )
  return { ok: failed === 0, cached, failed, total: panoramaUrls.length }
}

/** Does the browser support offline caching via service worker? */
export function offlineCacheSupported(): boolean {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'caches' in window
}
