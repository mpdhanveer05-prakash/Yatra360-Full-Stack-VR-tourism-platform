import { useCallback, useEffect, useRef, useState } from 'react'
import { tts } from '../lib/tts'
import { askGuide } from '../api/backend'
import { useUIStore } from '../store/uiStore'
import { detectNavIntent } from '../lib/voiceIntent'
import type { IndiaLocation } from '../types/location'

export type VoiceAgentState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

interface Options {
  locationSlug: string
  nodeLabel:    string
  locationId?:  string
  userId?:      string
  locations:    IndiaLocation[]
  onNavigate?:  (locationId: string, locationName: string) => void
}

interface VoiceAgentResult {
  state:        VoiceAgentState
  transcript:   string
  answer:       string
  errorMsg:     string
  supported:    boolean
  /** Start listening — no-op if already active. */
  start:        () => void
  /** Stop listening early and discard. */
  stop:         () => void
  /** Clear transcript + answer, go back to idle. */
  reset:        () => void
}

// SpeechRecognition is not in standard lib.dom — declare it inline.
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
}
interface SpeechRecognitionInstance extends EventTarget {
  lang:            string
  continuous:      boolean
  interimResults:  boolean
  maxAlternatives: number
  start():  void
  stop():   void
  abort():  void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror:  ((e: SpeechRecognitionErrorEvent) => void) | null
  onend:    (() => void) | null
}

function createRecognition(): SpeechRecognitionInstance | null {
  if (typeof window === 'undefined') return null
  const Ctor = (window as unknown as Record<string, unknown>).SpeechRecognition
    ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition
  if (!Ctor) return null
  return new (Ctor as new () => SpeechRecognitionInstance)()
}

export function useVoiceAgent({
  locationSlug, nodeLabel, locationId, userId, locations, onNavigate,
}: Options): VoiceAgentResult {
  const lang = useUIStore((s: { narrationLang: string }) => s.narrationLang)

  const [state, setState]           = useState<VoiceAgentState>('idle')
  const [transcript, setTranscript] = useState('')
  const [answer, setAnswer]         = useState('')
  const [errorMsg, setErrorMsg]     = useState('')

  const recRef      = useRef<SpeechRecognitionInstance | null>(null)
  const abortedRef  = useRef(false)
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const supported = typeof window !== 'undefined'
    && !!(
      (window as unknown as Record<string, unknown>).SpeechRecognition
      ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recRef.current?.abort()
      tts.cancel()
      if (navTimerRef.current) clearTimeout(navTimerRef.current)
    }
  }, [])

  const reset = useCallback(() => {
    recRef.current?.abort()
    tts.cancel()
    if (navTimerRef.current) clearTimeout(navTimerRef.current)
    setTranscript('')
    setAnswer('')
    setErrorMsg('')
    setState('idle')
    abortedRef.current = false
  }, [])

  const stop = useCallback(() => {
    abortedRef.current = true
    recRef.current?.abort()
    tts.cancel()
    if (navTimerRef.current) clearTimeout(navTimerRef.current)
    setState('idle')
  }, [])

  const start = useCallback(() => {
    if (state !== 'idle' && state !== 'error') return
    if (!supported) {
      setErrorMsg('Speech recognition is not supported in this browser.')
      setState('error')
      return
    }

    tts.cancel()
    abortedRef.current = false

    setTranscript('')
    setAnswer('')
    setErrorMsg('')

    const rec = createRecognition()!
    recRef.current = rec

    rec.lang            = lang ?? 'en-IN'
    rec.continuous      = false
    rec.interimResults  = false
    rec.maxAlternatives = 1

    setState('listening')

    rec.onresult = async (e: SpeechRecognitionEvent) => {
      const text = e.results[0]?.[0]?.transcript?.trim() ?? ''
      if (!text || abortedRef.current) return

      setTranscript(text)
      setState('processing')

      // ── Navigation intent check ───────────────────────────────────────────
      const navIntent = detectNavIntent(text, locations)

      if (navIntent && onNavigate) {
        const confirmText = `Taking you to ${navIntent.location.name} now.`
        setAnswer(confirmText)
        setState('speaking')

        tts.speak(confirmText, { lang: lang ?? 'en-IN', rate: 0.95 })

        // Navigate after TTS finishes (or after 2.5s max so it doesn't stall)
        navTimerRef.current = setTimeout(() => {
          if (!abortedRef.current) {
            tts.cancel()
            onNavigate(navIntent.location.id, navIntent.location.name)
          }
        }, 2500)
        return
      }

      // ── Guide question ────────────────────────────────────────────────────
      try {
        const res = await askGuide({
          question:     text,
          locationSlug,
          nodeLabel,
          locationId,
          userId,
          lang: lang ? lang.slice(0, 2) : 'en',
        })

        if (abortedRef.current) return

        setAnswer(res.answer)
        setState('speaking')
        tts.speak(res.answer, { lang: lang ?? 'en-IN', rate: 0.95 })

        const poll = setInterval(() => {
          if (tts.getStatus() === 'idle') {
            clearInterval(poll)
            setState('idle')
          }
        }, 300)
      } catch {
        if (abortedRef.current) return
        setErrorMsg('Could not reach guide. Please try again.')
        setState('error')
      }
    }

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (abortedRef.current) return
      if (e.error === 'no-speech') {
        setErrorMsg('No speech detected. Tap the mic and speak clearly.')
      } else if (e.error === 'not-allowed') {
        setErrorMsg('Microphone access denied. Please allow mic permissions.')
      } else {
        setErrorMsg(`Mic error: ${e.error}`)
      }
      setState('error')
    }

    rec.onend = () => {
      setState(prev => prev === 'listening' ? 'idle' : prev)
    }

    try {
      rec.start()
    } catch {
      setErrorMsg('Could not start microphone.')
      setState('error')
    }
  }, [state, supported, lang, locationSlug, nodeLabel, locationId, userId, locations, onNavigate])

  return { state, transcript, answer, errorMsg, supported, start, stop, reset }
}
