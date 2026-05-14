import { wikimediaQueue } from '../lib/apiQueue'

const BASE = 'https://commons.wikimedia.org/w/api.php'

export interface WikimediaImage {
  title: string
  url: string
  width: number
  height: number
  isPanorama: boolean
}

const imageCache = new Map<string, WikimediaImage[]>()

export async function fetchImages(category: string, limit = 20): Promise<WikimediaImage[]> {
  if (imageCache.has(category)) return imageCache.get(category)!

  return wikimediaQueue.add(async () => {
    // Step 1: list category members
    const listParams = new URLSearchParams({
      action: 'query',
      list: 'categorymembers',
      cmtitle: `Category:${category}`,
      cmtype: 'file',
      cmlimit: String(limit),
      format: 'json',
      origin: '*',
    })
    const listRes = await fetch(`${BASE}?${listParams}`)
    const listData = await listRes.json()
    const members: { title: string }[] = listData.query?.categorymembers ?? []
    if (members.length === 0) return []

    // Step 2: get imageinfo for each file
    const titles = members.map(m => m.title).join('|')
    const infoParams = new URLSearchParams({
      action: 'query',
      titles,
      prop: 'imageinfo',
      iiprop: 'url|dimensions',
      format: 'json',
      origin: '*',
    })
    const infoRes = await fetch(`${BASE}?${infoParams}`)
    const infoData = await infoRes.json()
    const pages = Object.values(infoData.query?.pages ?? {}) as {
      title: string
      imageinfo?: { url: string; width: number; height: number }[]
    }[]

    const images: WikimediaImage[] = pages
      .filter(p => p.imageinfo?.[0])
      .map(p => {
        const info = p.imageinfo![0]
        return {
          title: p.title,
          url: info.url,
          width: info.width,
          height: info.height,
          isPanorama: detectPanorama(info.width, info.height),
        }
      })

    imageCache.set(category, images)
    return images
  })
}

export function detectPanorama(width: number, height: number): boolean {
  if (height === 0) return false
  return width / height >= 1.8
}

export function getBestPanorama(images: WikimediaImage[]): WikimediaImage | null {
  const panoramas = images.filter(img => img.isPanorama)
  if (panoramas.length === 0) return null
  // prefer widest
  return panoramas.reduce((best, img) => img.width > best.width ? img : best)
}

export function getRepresentativeImage(images: WikimediaImage[]): WikimediaImage | null {
  if (images.length === 0) return null
  // prefer landscape images that aren't panoramas
  const landscape = images.filter(img => !img.isPanorama && img.width > img.height)
  return landscape[0] ?? images[0]
}
