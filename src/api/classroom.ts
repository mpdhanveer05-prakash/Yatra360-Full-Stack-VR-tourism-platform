import type { Classroom, ClassroomHeatmap } from '../types/classroom'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

async function jsonPost<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    if (!res.ok) return null
    return await res.json() as T
  } catch {
    return null
  }
}

async function jsonGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`)
    if (!res.ok) return null
    return await res.json() as T
  } catch {
    return null
  }
}

export async function createClassroom(payload: {
  name: string
  teacherId: string
  teacherName?: string
  assignedLocationId?: string
  notes?: string
}): Promise<Classroom | null> {
  const data = await jsonPost<{ ok: boolean; classroom: Classroom }>('/api/classroom', payload)
  return data?.classroom ?? null
}

export async function joinClassroom(code: string, studentId: string): Promise<Classroom | null> {
  const data = await jsonPost<{ ok: boolean; classroom: Classroom }>('/api/classroom/join', { code, studentId })
  return data?.classroom ?? null
}

export async function listTeacherClassrooms(teacherId: string): Promise<Classroom[]> {
  const data = await jsonGet<{ classrooms: Classroom[] }>(`/api/classroom/teacher/${encodeURIComponent(teacherId)}`)
  return data?.classrooms ?? []
}

export async function getClassroom(code: string): Promise<Classroom | null> {
  const data = await jsonGet<{ ok: boolean; classroom: Classroom }>(`/api/classroom/${encodeURIComponent(code)}`)
  return data?.classroom ?? null
}

export async function getClassroomHeatmap(code: string): Promise<ClassroomHeatmap | null> {
  return jsonGet<ClassroomHeatmap>(`/api/classroom/${encodeURIComponent(code)}/heatmap`)
}

export async function patchClassroom(code: string, payload: {
  teacherId: string
  assignedLocationId?: string
  notes?: string
  name?: string
}): Promise<Classroom | null> {
  try {
    const res = await fetch(`${BASE}/api/classroom/${encodeURIComponent(code)}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    if (!res.ok) return null
    const data = await res.json() as { ok: boolean; classroom: Classroom }
    return data.classroom
  } catch { return null }
}
