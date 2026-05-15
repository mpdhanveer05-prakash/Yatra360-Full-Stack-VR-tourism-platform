import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id:           string
  username:     string
  email:        string
  displayName?: string
}

interface AuthState {
  token: string | null
  user:  AuthUser | null

  setSession: (token: string, user: AuthUser) => void
  clearSession: () => void
  isLoggedIn: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user:  null,

      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null }),
      isLoggedIn: () => !!get().token && !!get().user,
    }),
    { name: 'yatra360-auth' },
  ),
)
