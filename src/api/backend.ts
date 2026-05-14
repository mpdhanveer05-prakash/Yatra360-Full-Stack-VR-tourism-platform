import type { EngagementEvent } from '../types/tour'
import type { Recommendation, GuideAnswer, GuideMessage } from '../types/ai'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`)
  return res.json()
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json()
}

export async function logEvent(event: EngagementEvent): Promise<void> {
  await post('/api/sessions/events', event)
}

export interface RecommendPayload {
  userId: string
  currentLocationId: string
  history: { locationId: string; score: number }[]
}

export async function getRecommendations(payload: RecommendPayload): Promise<Recommendation[]> {
  const data = await post<{ recommendations: Recommendation[] }>('/api/recommend', payload)
  return data.recommendations
}

export interface GuidePayload {
  userId?:      string
  locationId?:  string
  question:     string
  locationSlug: string
  nodeLabel:    string
  lang?:        string
  history?:     { role: 'user' | 'guide'; content: string }[]
}

export async function askGuide(payload: GuidePayload): Promise<GuideAnswer> {
  return post<GuideAnswer>('/api/guide', payload)
}

export async function getGuideHistory(
  userId: string,
  locationId: string,
): Promise<{ messages: GuideMessage[]; lang: string }> {
  try {
    return await get<{ messages: GuideMessage[]; lang: string }>(
      `/api/guide/history/${encodeURIComponent(userId)}/${encodeURIComponent(locationId)}`,
    )
  } catch {
    return { messages: [], lang: 'en' }
  }
}

export async function clearGuideHistory(userId: string, locationId: string): Promise<void> {
  try {
    await fetch(`${BASE}/api/guide/history/${encodeURIComponent(userId)}/${encodeURIComponent(locationId)}`, {
      method: 'DELETE',
    })
  } catch { /* best-effort */ }
}

export async function getSessionHistory(userId: string) {
  return get<{ sessions: unknown[] }>(`/api/sessions/${userId}`)
}

export async function getHeatmap(locationId: string): Promise<Record<string, number>> {
  const data = await get<{ heatmap: Record<string, number> }>(`/api/heatmap/${locationId}`)
  return data.heatmap
}
