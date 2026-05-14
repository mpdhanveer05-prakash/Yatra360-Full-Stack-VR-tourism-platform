import { useState, useEffect } from 'react'
import { fetchImages } from '../api/wikimediaImages'
import type { IndiaLocation } from '../types/location'

const cache = new Map<string, Map<string, string>>()

function seedHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0
  return Math.abs(h) % 900 + 50   // keep away from edge seeds
}

function picsumFor(id: string): string {
  return `https://picsum.photos/seed/${seedHash(id)}/3840/1920`
}

export function useNodeImages(location: IndiaLocation | null): {
  nodeImages: Map<string, string>
  loading: boolean
} {
  const [nodeImages, setNodeImages] = useState(new Map<string, string>())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!location) return

    if (cache.has(location.id)) {
      setNodeImages(cache.get(location.id)!)
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchAll() {
      const cats = [
        `360-degree panoramas of ${location!.wikimediaCategory}`,
        `Panoramic photographs of ${location!.wikimediaCategory}`,
        location!.wikimediaCategory,
      ]

      const collected: string[] = []

      for (const cat of cats) {
        if (cancelled) return
        try {
          const imgs = await fetchImages(cat, 20)
          for (const img of imgs) {
            if (!collected.includes(img.url)) collected.push(img.url)
          }
        } catch { /* category doesn't exist — try next */ }
        if (collected.length >= location!.nodes.length * 2) break
      }

      if (cancelled) return

      const map = new Map<string, string>()
      location!.nodes.forEach((node, i) => {
        if (collected.length > 0) {
          // Each node gets a distinct image; wrap around if needed
          map.set(node.id, collected[i % collected.length])
        } else {
          map.set(node.id, picsumFor(node.id))
        }
      })

      cache.set(location!.id, map)
      setNodeImages(map)
      setLoading(false)
    }

    fetchAll()
    return () => { cancelled = true }
  }, [location?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return { nodeImages, loading }
}
