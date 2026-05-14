import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FeatureVector } from '../types/location'

export interface SessionRecord {
  locationId:      string
  locationName:    string
  startedAt:       number
  durationMs:      number
  engagementScore: number
  nodesVisited:    string[]
}

interface UserState {
  userId:          string
  preferenceVector: FeatureVector
  sessionHistory:  SessionRecord[]
  detectedRegion:  string | null

  addSession:          (record: SessionRecord) => void
  updatePreferences:   (vector: FeatureVector) => void
  setDetectedRegion:   (region: string) => void
}

function defaultVector(): FeatureVector {
  return {
    historical: 0, architectural: 0, religious: 0, natural: 0,
    cultural: 0, artistic: 0, educational: 0, adventurous: 0,
    ancient: 0, medieval: 0, colonial: 0, modern: 0,
  }
}

function generateUserId(): string {
  return `user_${Math.random().toString(36).slice(2, 10)}`
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId:           generateUserId(),
      preferenceVector: defaultVector(),
      sessionHistory:   [],
      detectedRegion:   null,

      addSession: (record) =>
        set(s => ({ sessionHistory: [record, ...s.sessionHistory].slice(0, 50) })),

      updatePreferences: (vector) =>
        set({ preferenceVector: vector }),

      setDetectedRegion: (region) =>
        set({ detectedRegion: region }),
    }),
    { name: 'yatra360-user' },
  ),
)
