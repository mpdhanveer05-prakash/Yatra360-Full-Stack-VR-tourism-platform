import { useCallback, useRef } from 'react'
import { useTourStore } from '../store/tourStore'
import { useUserStore } from '../store/userStore'
import { sessionLogger } from '../lib/sessionLogger'
import type { TourNode } from '../types/location'

const AI_BASE = import.meta.env.VITE_AI_ENGINE_URL ?? 'http://localhost:8000'

export function useTourNavigation(sessionId: string) {
  const { activeLocation, currentNode, navigateTo, setTransitioning } = useTourStore()
  const userId = useUserStore(s => s.userId)
  const inProgressRef = useRef(false)

  const goToNode = useCallback(
    async (targetNode: TourNode, triggeredBy: 'hotspot' | 'recommendation' | 'direct' = 'hotspot') => {
      if (!activeLocation || !currentNode || inProgressRef.current) return
      if (targetNode.id === currentNode.id) return

      inProgressRef.current = true
      setTransitioning(true)

      sessionLogger.log({
        sessionId,
        userId,
        locationId: activeLocation.id,
        nodeId:     currentNode.id,
        eventType:  'node_exit',
        dwellMs:    0,
        interactionCount: 0,
        timestamp:  Date.now(),
      })

      navigateTo(targetNode)

      // fire-and-forget RL update — don't block navigation on it
      notifyRLNavigator({
        sessionId,
        locationId: activeLocation.id,
        fromNodeId: currentNode.id,
        toNodeId:   targetNode.id,
        triggeredBy,
      }).catch(() => { /* non-critical */ })

      inProgressRef.current = false
    },
    [activeLocation, currentNode, navigateTo, setTransitioning, sessionId, userId],
  )

  const getSuggestedNextNode = useCallback(async (): Promise<string | null> => {
    if (!activeLocation || !currentNode) return null
    try {
      const res = await fetch(`${AI_BASE}/navigate/next`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ locationId: activeLocation.id, nodeId: currentNode.id }),
      })
      if (!res.ok) return null
      const data = await res.json()
      return data.nodeId ?? null
    } catch {
      return null
    }
  }, [activeLocation, currentNode])

  return { goToNode, getSuggestedNextNode }
}

async function notifyRLNavigator(payload: {
  sessionId:   string
  locationId:  string
  fromNodeId:  string
  toNodeId:    string
  triggeredBy: string
}) {
  const AI_BASE = import.meta.env.VITE_AI_ENGINE_URL ?? 'http://localhost:8000'
  await fetch(`${AI_BASE}/navigate/update`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
}
