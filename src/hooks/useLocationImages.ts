import { useState, useEffect } from 'react'
import { fetchImages, getBestPanorama, getRepresentativeImage } from '../api/wikimediaImages'
import { getCardImage, buildKeywords } from '../api/unsplash'
import type { IndiaLocation } from '../types/location'

export interface LocationImages {
  panoramaUrl:   string
  cardImageUrl:  string
  galleryImages: string[]
  tier:          'wikimedia' | 'unsplash'
  loading:       boolean
}

const cache = new Map<string, LocationImages>()

// Extra Wikimedia categories that specifically contain 360° panoramas
function panoramaCategories(location: IndiaLocation): string[] {
  const name = location.wikimediaCategory
  return [
    `360-degree panoramas of ${name}`,
    `Panoramic photographs of ${name}`,
    `Panoramas of ${name}`,
    name,  // primary category last as broadest fallback
  ]
}

export function useLocationImages(location: IndiaLocation | null): LocationImages {
  const [state, setState] = useState<LocationImages>({
    panoramaUrl:   '',
    cardImageUrl:  '',
    galleryImages: [],
    tier:          'unsplash',
    loading:       true,
  })

  useEffect(() => {
    if (!location) return

    if (cache.has(location.id)) {
      setState(cache.get(location.id)!)
      return
    }

    const keywords = buildKeywords(location.name, location.category, location.tags)
    const picsumCard = getCardImage(keywords)

    // Set a meaningful placeholder immediately — never blank
    setState({
      panoramaUrl:   '',
      cardImageUrl:  picsumCard,
      galleryImages: [],
      tier:          'unsplash',
      loading:       true,
    })

    // Try Wikimedia categories from most specific to broadest
    const cats = panoramaCategories(location)
    let settled = false

    async function tryCategories() {
      let bestPanorama = null
      let bestCard = null
      let gallery: string[] = []

      for (const cat of cats) {
        try {
          const images = await fetchImages(cat, 20)
          if (images.length === 0) continue

          const pano = getBestPanorama(images)
          if (pano && !bestPanorama) bestPanorama = pano

          const card = getRepresentativeImage(images)
          if (card && !bestCard) bestCard = card

          if (gallery.length === 0) {
            gallery = images.slice(0, 8).map(i => i.url)
          }

          // Got a real panorama — stop searching
          if (bestPanorama) break
        } catch {
          // category doesn't exist or network issue — try next
        }
      }

      if (settled || !location) return

      const result: LocationImages = {
        panoramaUrl:   bestPanorama?.url ?? '',
        cardImageUrl:  bestCard?.url     ?? picsumCard,
        galleryImages: gallery,
        tier:          bestPanorama ? 'wikimedia' : 'unsplash',
        loading:       false,
      }
      cache.set(location.id, result)
      setState(result)
    }

    tryCategories()
    return () => { settled = true }
  }, [location?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return state
}
