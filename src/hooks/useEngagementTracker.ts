import { useEffect, useRef, useCallback } from 'react'
import { computeEngagementScore } from '../lib/engagementScore'
import { sessionLogger } from '../lib/sessionLogger'
import { useTourStore } from '../store/tourStore'
import { useUserStore } from '../store/userStore'
import { useAttentionTracker } from './useAttentionTracker'

interface Options {
  nodeId:     string
  locationId: string
  sessionId:  string
  onNodeExit?: (score: number, dwellMs: number) => void
}

export function useEngagementTracker({ nodeId, locationId, sessionId, onNodeExit }: Options) {
  const entryTimeRef       = useRef(Date.now())
  const interactionRef     = useRef(0)
  const userId             = useUserStore(s => s.userId)
  const navigationHistory  = useTourStore(s => s.navigationHistory)
  const attention          = useAttentionTracker()

  // reset counters on every node change; fire exit event on cleanup
  useEffect(() => {
    entryTimeRef.current   = Date.now()
    interactionRef.current = 0
    attention.reset()

    sessionLogger.log({
      sessionId, userId, locationId, nodeId,
      eventType:        'node_enter',
      dwellMs:          0,
      interactionCount: 0,
      timestamp:        Date.now(),
    })

    return () => {
      const dwellMs  = Date.now() - entryTimeRef.current
      const revisited = navigationHistory.filter(id => id === nodeId).length > 1
      const attentionRatio = attention.getAttentionRatio()
      const score    = computeEngagementScore({
        dwellMs,
        interactionCount: interactionRef.current,
        revisited,
        attentionRatio,
      })

      onNodeExit?.(score, dwellMs)

      sessionLogger.log({
        sessionId, userId, locationId, nodeId,
        eventType:        'node_exit',
        dwellMs,
        interactionCount: interactionRef.current,
        timestamp:        Date.now(),
      })
    }
    // intentionally only re-run when nodeId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId])

  const incrementInteraction = useCallback(() => {
    interactionRef.current += 1
    sessionLogger.log({
      sessionId, userId, locationId, nodeId,
      eventType:        'hotspot_click',
      dwellMs:          Date.now() - entryTimeRef.current,
      interactionCount: interactionRef.current,
      timestamp:        Date.now(),
    })
  }, [nodeId, locationId, sessionId, userId])

  return { incrementInteraction }
}
