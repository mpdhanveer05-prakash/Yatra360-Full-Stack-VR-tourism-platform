// source.unsplash.com was deprecated in 2022.
// picsum.photos is CORS-friendly, reliable, and seeds consistently per name.
const PICSUM = 'https://picsum.photos'

function seedFromString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0
  }
  return Math.abs(h) % 1000
}

export function getPanoramaFallback(keywords: string): string {
  const seed = seedFromString(keywords)
  return `${PICSUM}/seed/${seed}/3840/1920`
}

export function getWideImage(keywords: string): string {
  const seed = seedFromString(keywords)
  return `${PICSUM}/seed/${seed}/1920/960`
}

export function getCardImage(keywords: string): string {
  const seed = seedFromString(keywords)
  return `${PICSUM}/seed/${seed}/800/600`
}

export function buildKeywords(name: string, category: string, tags: string[]): string {
  const categoryKeywords: Record<string, string> = {
    heritage:       'heritage monument ancient',
    temple:         'temple architecture spiritual',
    fort:           'fort palace rajasthan',
    museum:         'museum culture art',
    nature:         'nature landscape wildlife',
    spiritual:      'pilgrimage shrine sacred',
    'hill-station': 'hill station nature green',
  }
  const extra = categoryKeywords[category] ?? 'india travel'
  return `${name} ${extra} ${tags.slice(0, 2).join(' ')}`
}
