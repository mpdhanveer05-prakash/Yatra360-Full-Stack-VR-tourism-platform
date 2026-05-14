const BASE = 'https://en.wikipedia.org/api/rest_v1'
const HEADERS = { 'User-Agent': 'Yatra360/1.0 (educational; github.com/yatra360)' }

export interface WikiSummary {
  title: string
  extract: string
  thumbnail?: { source: string; width: number; height: number }
  coordinates?: { lat: number; lon: number }
  content_urls: { desktop: { page: string } }
}

export interface WikiSection {
  title: string
  anchor: string
  content: string
}

const summaryCache = new Map<string, WikiSummary>()
const sectionsCache = new Map<string, WikiSection[]>()

export async function fetchSummary(slug: string): Promise<WikiSummary> {
  if (summaryCache.has(slug)) return summaryCache.get(slug)!
  const res = await fetch(`${BASE}/page/summary/${encodeURIComponent(slug)}`, { headers: HEADERS })
  if (!res.ok) throw new Error(`Wikipedia summary fetch failed: ${res.status}`)
  const data: WikiSummary = await res.json()
  summaryCache.set(slug, data)
  return data
}

export async function fetchFullSections(slug: string): Promise<WikiSection[]> {
  if (sectionsCache.has(slug)) return sectionsCache.get(slug)!
  const res = await fetch(`${BASE}/page/mobile-sections/${encodeURIComponent(slug)}`, { headers: HEADERS })
  if (!res.ok) throw new Error(`Wikipedia sections fetch failed: ${res.status}`)
  const data = await res.json()

  const sections: WikiSection[] = (data.remaining?.sections ?? []).map((s: { title: string; anchor: string; text: string }) => ({
    title:   s.title ?? '',
    anchor:  s.anchor ?? '',
    content: stripHtml(s.text ?? ''),
  }))

  sectionsCache.set(slug, sections)
  return sections
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

export function chunkSections(sections: WikiSection[], chunkSize = 500): string[] {
  const chunks: string[] = []
  for (const sec of sections) {
    const text = sec.title ? `${sec.title}: ${sec.content}` : sec.content
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize))
    }
  }
  return chunks
}
