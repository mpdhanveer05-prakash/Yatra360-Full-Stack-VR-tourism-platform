import type { AuthUser } from '../store/authStore'

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001'

export interface AuthResponse {
  token: string
  user:  AuthUser
}

export interface ApiError {
  error: string
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as ApiError).error ?? `Request failed (${res.status})`)
  }
  return data as T
}

export function signup(username: string, email: string, password: string): Promise<AuthResponse> {
  return postJson<AuthResponse>('/api/auth/signup', { username, email, password })
}

export function login(username: string, password: string): Promise<AuthResponse> {
  return postJson<AuthResponse>('/api/auth/login', { username, password })
}

export async function fetchMe(token: string): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.user as AuthUser
  } catch {
    return null
  }
}
