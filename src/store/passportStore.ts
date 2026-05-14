import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Stamp, Badge, Streak } from '../types/passport'
import { evaluateBadges } from '../lib/badgeRules'
import type { IndiaLocation } from '../types/location'

interface PassportState {
  stamps: Stamp[]
  badges: Badge[]
  streak: Streak

  /** Newly earned badges this session — UI clears after toasting. */
  pendingBadges: Badge[]

  recordVisit:    (location: IndiaLocation) => Badge[]   // returns new badges
  clearPending:   () => void
  resetPassport:  () => void
}

function ymd(t: number): string {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00')
  const db = new Date(b + 'T00:00:00')
  return Math.round((db.getTime() - da.getTime()) / 86400000)
}

export const usePassportStore = create<PassportState>()(
  persist(
    (set, get) => ({
      stamps: [],
      badges: [],
      streak: { current: 0, longest: 0, lastVisitYmd: null },
      pendingBadges: [],

      recordVisit: (location) => {
        const now = Date.now()
        const todayYmd = ymd(now)
        const state = get()

        // 1. Update or add stamp
        const existing = state.stamps.find(s => s.locationId === location.id)
        const newStamps: Stamp[] = existing
          ? state.stamps.map(s =>
              s.locationId === location.id ? { ...s, visits: s.visits + 1 } : s,
            )
          : [
              ...state.stamps,
              {
                locationId:   location.id,
                locationName: location.name,
                category:     location.category,
                state:        location.state,
                visitedAt:    now,
                visits:       1,
              },
            ]

        // 2. Update streak
        const prev = state.streak.lastVisitYmd
        let current = state.streak.current
        if (!prev) {
          current = 1
        } else if (prev === todayYmd) {
          // same day — keep
        } else if (daysBetween(prev, todayYmd) === 1) {
          current = current + 1
        } else {
          current = 1
        }
        const newStreak: Streak = {
          current,
          longest:      Math.max(state.streak.longest, current),
          lastVisitYmd: todayYmd,
        }

        // 3. Evaluate badges
        const earnedIds = new Set(state.badges.map(b => b.id))
        const newlyEarned = evaluateBadges(
          { stamps: newStamps, streak: newStreak },
          earnedIds,
        )

        set({
          stamps: newStamps,
          streak: newStreak,
          badges: [...state.badges, ...newlyEarned],
          pendingBadges: [...state.pendingBadges, ...newlyEarned],
        })

        return newlyEarned
      },

      clearPending: () => set({ pendingBadges: [] }),

      resetPassport: () =>
        set({
          stamps: [],
          badges: [],
          streak: { current: 0, longest: 0, lastVisitYmd: null },
          pendingBadges: [],
        }),
    }),
    { name: 'yatra360-passport' },
  ),
)
