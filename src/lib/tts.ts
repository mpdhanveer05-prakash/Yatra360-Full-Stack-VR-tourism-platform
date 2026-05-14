// Lightweight Web Speech API wrapper for narration.
// Singleton — only one utterance at a time.

export type TTSStatus = 'idle' | 'speaking' | 'paused'

export interface TTSOptions {
  lang?:  string   // e.g. "en-IN", "hi-IN", "ta-IN", "bn-IN"
  rate?:  number   // 0.5–2.0
  pitch?: number   // 0–2
  volume?:number   // 0–1
}

type Listener = (status: TTSStatus) => void

class TTSEngine {
  private listeners = new Set<Listener>()
  private status:    TTSStatus = 'idle'

  get supported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  getStatus(): TTSStatus { return this.status }

  /** Subscribe to status changes. Returns unsubscribe fn. */
  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  /** Get available voices (may be empty until 'voiceschanged' fires). */
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.supported) return []
    return window.speechSynthesis.getVoices()
  }

  /** Pick the best voice for a given BCP-47 lang tag. */
  pickVoice(lang: string): SpeechSynthesisVoice | null {
    const voices = this.getVoices()
    if (voices.length === 0) return null
    // Prefer exact match, then language-only match, then any.
    return (
      voices.find(v => v.lang.toLowerCase() === lang.toLowerCase()) ??
      voices.find(v => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase())) ??
      null
    )
  }

  /** Speak text. Cancels any prior utterance. */
  speak(text: string, opts: TTSOptions = {}): void {
    if (!this.supported || !text.trim()) return
    this.cancel()

    const u = new SpeechSynthesisUtterance(text)
    const lang = opts.lang ?? 'en-IN'
    u.lang   = lang
    u.rate   = opts.rate   ?? 1.0
    u.pitch  = opts.pitch  ?? 1.0
    u.volume = opts.volume ?? 1.0

    const voice = this.pickVoice(lang)
    if (voice) u.voice = voice

    u.onstart = () => this.setStatus('speaking')
    u.onend   = () => this.setStatus('idle')
    u.onerror = () => this.setStatus('idle')

    window.speechSynthesis.speak(u)
  }

  pause(): void {
    if (!this.supported) return
    if (this.status === 'speaking') {
      window.speechSynthesis.pause()
      this.setStatus('paused')
    }
  }

  resume(): void {
    if (!this.supported) return
    if (this.status === 'paused') {
      window.speechSynthesis.resume()
      this.setStatus('speaking')
    }
  }

  cancel(): void {
    if (!this.supported) return
    window.speechSynthesis.cancel()
    this.setStatus('idle')
  }

  private setStatus(s: TTSStatus): void {
    if (this.status === s) return
    this.status = s
    this.listeners.forEach(l => l(s))
  }
}

export const tts = new TTSEngine()

export const NARRATION_LANGS = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'ta-IN', label: 'தமிழ்' },
  { code: 'bn-IN', label: 'বাংলা' },
  { code: 'mr-IN', label: 'मराठी' },
] as const
