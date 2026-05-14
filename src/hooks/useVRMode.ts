import { useState, useEffect, useCallback, useRef } from 'react'
import { useTourStore } from '../store/tourStore'
import { useUIStore } from '../store/uiStore'
import { sessionLogger } from '../lib/sessionLogger'
import { useUserStore } from '../store/userStore'

interface VRMode {
  vrSupported:  boolean
  vrActive:     boolean
  enterVR:      () => Promise<void>
  exitVR:       () => void
}

export function useVRMode(sessionId: string, locationId: string): VRMode {
  const [vrSupported, setVRSupported] = useState(false)
  const sessionRef = useRef<XRSession | null>(null)

  const { vrActive, setVRActive } = useTourStore()
  const { setSidebarOpen, setGuidePanelOpen } = useUIStore()
  const userId = useUserStore(s => s.userId)

  useEffect(() => {
    if ('xr' in navigator) {
      (navigator as Navigator & { xr: XRSystem }).xr
        .isSessionSupported('immersive-vr')
        .then(supported => setVRSupported(supported))
        .catch(() => setVRSupported(false))
    }
  }, [])

  const enterVR = useCallback(async () => {
    if (!('xr' in navigator) || !vrSupported) return
    try {
      const xr = (navigator as Navigator & { xr: XRSystem }).xr
      const session = await xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor'],
      })
      sessionRef.current = session
      setVRActive(true)
      // hide all overlay panels while in VR
      setSidebarOpen(false)
      setGuidePanelOpen(false)

      sessionLogger.log({
        sessionId, userId, locationId,
        nodeId:           '',
        eventType:        'vr_enter',
        dwellMs:          0,
        interactionCount: 0,
        timestamp:        Date.now(),
      })

      session.addEventListener('end', () => {
        setVRActive(false)
        sessionRef.current = null
        sessionLogger.log({
          sessionId, userId, locationId,
          nodeId:           '',
          eventType:        'vr_exit',
          dwellMs:          0,
          interactionCount: 0,
          timestamp:        Date.now(),
        })
      })
    } catch {
      setVRActive(false)
    }
  }, [vrSupported, setVRActive, setSidebarOpen, setGuidePanelOpen, sessionId, userId, locationId])

  const exitVR = useCallback(() => {
    sessionRef.current?.end()
  }, [])

  return { vrSupported, vrActive, enterVR, exitVR }
}

// Minimal XRSystem type to avoid importing @types/webxr
interface XRSystem {
  isSessionSupported(mode: string): Promise<boolean>
  requestSession(mode: string, options?: object): Promise<XRSession>
}
