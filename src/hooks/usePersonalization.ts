import { useEffect, useCallback } from 'react'
import { useAIStore } from '../store/aiStore'
import { useUserStore } from '../store/userStore'
import { getRecommendations } from '../api/backend'
import { getRecommendations as localRecommend, getColdStartRecommendations } from '../lib/recommendationEngine'
import locations from '../data/indiaLocations.json'
import type { IndiaLocation } from '../types/location'
import type { Recommendation } from '../types/ai'

const allLocations = locations as IndiaLocation[]

export function usePersonalization(currentLocationId: string | null) {
  const { setRecommendations, setLoadingRecs, setLastRecsLocationId, lastRecsLocationId } = useAIStore()
  const { userId, sessionHistory, preferenceVector } = useUserStore()

  const fetchRecs = useCallback(async (locationId: string) => {
    if (locationId === lastRecsLocationId) return
    setLoadingRecs(true)

    try {
      const history = sessionHistory.map(s => ({ locationId: s.locationId, score: s.engagementScore }))
      const localHistory = sessionHistory.map(s => ({ locationId: s.locationId, engagementScore: s.engagementScore }))

      // try backend first; fall back to client-side engine if backend unavailable
      let recs: Recommendation[]
      try {
        recs = await getRecommendations({ userId, currentLocationId: locationId, history })
      } catch {
        const scored = localHistory.length > 0
          ? localRecommend(localHistory, locationId, allLocations)
          : getColdStartRecommendations(allLocations, undefined)

        recs = scored.map(s => ({
          id:       s.location.id,
          name:     s.location.name,
          score:    Math.round(s.score * 100),
          reason:   s.reason,
          category: s.location.category,
        }))
      }

      setRecommendations(recs)
      setLastRecsLocationId(locationId)
    } finally {
      setLoadingRecs(false)
    }
  }, [userId, sessionHistory, preferenceVector, lastRecsLocationId, setRecommendations, setLoadingRecs, setLastRecsLocationId])

  // fetch whenever the active location changes
  useEffect(() => {
    if (!currentLocationId) return
    fetchRecs(currentLocationId)
  }, [currentLocationId, fetchRecs])

  return { refetch: fetchRecs }
}
