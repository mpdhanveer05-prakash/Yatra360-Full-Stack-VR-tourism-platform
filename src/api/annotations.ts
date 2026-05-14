import type { Annotation } from '../types/annotation'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

export async function listAnnotations(locationId: string): Promise<Annotation[]> {
  try {
    const res = await fetch(`${BASE}/api/annotations/${encodeURIComponent(locationId)}`)
    if (!res.ok) return []
    const data = await res.json() as { annotations: Annotation[] }
    return data.annotations ?? []
  } catch {
    return []
  }
}

export interface CreateAnnotationPayload {
  locationId: string
  nodeId?:    string
  azimuth:    number
  elevation:  number
  text:       string
  authorId:   string
  authorName?:string
}

export async function createAnnotation(payload: CreateAnnotationPayload): Promise<Annotation | null> {
  try {
    const res = await fetch(`${BASE}/api/annotations`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    if (!res.ok) return null
    const data = await res.json() as { annotation: Annotation }
    return data.annotation
  } catch {
    return null
  }
}

export async function flagAnnotation(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/annotations/${id}/flag`, { method: 'POST' })
    return res.ok
  } catch { return false }
}

export async function deleteAnnotation(id: string, authorId: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/annotations/${id}?authorId=${encodeURIComponent(authorId)}`, {
      method: 'DELETE',
    })
    return res.ok
  } catch { return false }
}
