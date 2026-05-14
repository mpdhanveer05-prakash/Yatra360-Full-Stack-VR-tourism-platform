import { useEffect, useState, useCallback } from 'react'
import { tts, type TTSStatus } from '../lib/tts'
import { useUIStore } from '../store/uiStore'

interface UseNarrationArgs {
  /** Text to speak when narration is triggered. */
  text: string | null
  /** Key that changes when the source scene/node changes — cancels prior speech. */
  sceneKey?: string | number | null
  /** Auto-speak whenever sceneKey changes (if narration is enabled). */
  autoPlay?: boolean
}

interface UseNarrationReturn {
  status:     TTSStatus
  supported:  boolean
  enabled:    boolean
  play:       () => void
  pause:      () => void
  resume:     () => void
  stop:       () => void
  toggle:     () => void
}

/**
 * Narrate arbitrary text via the Web Speech API.
 * Honors `narrationEnabled / lang / rate` from uiStore.
 * Cancels speech when sceneKey changes or component unmounts.
 */
export function useNarration({ text, sceneKey, autoPlay = true }: UseNarrationArgs): UseNarrationReturn {
  const enabled = useUIStore(s => s.narrationEnabled)
  const lang    = useUIStore(s => s.narrationLang)
  const rate    = useUIStore(s => s.narrationRate)

  const [status, setStatus] = useState<TTSStatus>(tts.getStatus())

  useEffect(() => tts.subscribe(setStatus), [])

  const play = useCallback(() => {
    if (!text) return
    tts.speak(text, { lang, rate })
  }, [text, lang, rate])

  const pause  = useCallback(() => tts.pause(),  [])
  const resume = useCallback(() => tts.resume(), [])
  const stop   = useCallback(() => tts.cancel(), [])

  const toggle = useCallback(() => {
    const s = tts.getStatus()
    if (s === 'speaking') tts.pause()
    else if (s === 'paused') tts.resume()
    else play()
  }, [play])

  // Cancel on scene change or unmount.
  useEffect(() => {
    return () => { tts.cancel() }
  }, [sceneKey])

  // Auto-play whenever scene or text changes (if enabled).
  useEffect(() => {
    if (!enabled || !autoPlay || !text) return
    // Small delay so prior cancel settles before new speak.
    const id = setTimeout(() => tts.speak(text, { lang, rate }), 150)
    return () => clearTimeout(id)
  }, [enabled, autoPlay, text, sceneKey, lang, rate])

  return {
    status,
    supported: tts.supported,
    enabled,
    play,
    pause,
    resume,
    stop,
    toggle,
  }
}
