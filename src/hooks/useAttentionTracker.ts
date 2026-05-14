import { useEffect, useRef } from 'react'

/**
 * Tracks "active attention" via Page Visibility API + cursor activity.
 *
 * Buckets time into windows; a window counts as "attentive" if either:
 *   - the cursor moved at least once during it, AND
 *   - the document was visible
 *
 * Exposes a `getAttentionRatio()` ref-callback so the engagement tracker can
 * pull the current ratio at any time without re-rendering.
 */
export function useAttentionTracker(): {
  getAttentionRatio: () => number
  reset:             () => void
} {
  // Total time the page has been visible + active in this hook lifetime
  const visibleMsRef    = useRef(0)
  // Of that, time that was also "attentive" (recent cursor movement)
  const attentiveMsRef  = useRef(0)
  // Last activity timestamp
  const lastActivityRef = useRef(performance.now())
  // Last tick timestamp
  const lastTickRef     = useRef(performance.now())

  useEffect(() => {
    const ACTIVITY_TIMEOUT_MS = 8000  // cursor must move within 8s to count as attentive

    function onMove()  { lastActivityRef.current = performance.now() }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('touchstart', onMove, { passive: true })
    window.addEventListener('keydown', onMove, { passive: true })

    const id = window.setInterval(() => {
      const now = performance.now()
      const delta = now - lastTickRef.current
      lastTickRef.current = now

      if (document.hidden) return
      visibleMsRef.current += delta
      if (now - lastActivityRef.current < ACTIVITY_TIMEOUT_MS) {
        attentiveMsRef.current += delta
      }
    }, 500)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchstart', onMove)
      window.removeEventListener('keydown', onMove)
      window.clearInterval(id)
    }
  }, [])

  function getAttentionRatio(): number {
    if (visibleMsRef.current < 1000) return 1   // not enough data yet — full credit
    return Math.max(0, Math.min(1, attentiveMsRef.current / visibleMsRef.current))
  }

  function reset() {
    visibleMsRef.current   = 0
    attentiveMsRef.current = 0
    lastActivityRef.current = performance.now()
    lastTickRef.current     = performance.now()
  }

  return { getAttentionRatio, reset }
}
