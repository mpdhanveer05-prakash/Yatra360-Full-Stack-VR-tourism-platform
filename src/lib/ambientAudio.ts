// Ambient background audio engine. Looped, crossfaded HTMLAudio.
// Drop audio files at the paths in CATEGORY_TRACKS — engine silently no-ops if missing.

import type { LocationCategory } from '../types/location'

export interface AmbientTrack {
  src:   string
  label: string
}

/**
 * Category → looped ambient track.
 * Place CC0 files at these public paths (see public/audio/README.md).
 */
export const CATEGORY_TRACKS: Record<LocationCategory, AmbientTrack> = {
  heritage:      { src: '/audio/ambient-heritage.mp3', label: 'Ancient stone halls' },
  temple:        { src: '/audio/ambient-temple.mp3',   label: 'Temple bells & chants' },
  fort:          { src: '/audio/ambient-fort.mp3',     label: 'Desert wind' },
  museum:        { src: '/audio/ambient-museum.mp3',   label: 'Quiet gallery' },
  nature:        { src: '/audio/ambient-nature.mp3',   label: 'Forest birds' },
  spiritual:     { src: '/audio/ambient-spiritual.mp3',label: 'Meditative drone' },
  'hill-station':{ src: '/audio/ambient-hills.mp3',    label: 'Mountain breeze' },
  modern:        { src: '/audio/ambient-city.mp3',     label: 'City ambience' },
}

const FADE_MS = 1200

type Listener = (state: AmbientState) => void
export interface AmbientState {
  playing: boolean
  muted:   boolean
  volume:  number       // master 0–1
  trackSrc: string | null
}

class AmbientEngine {
  private current:  HTMLAudioElement | null = null
  private state:    AmbientState = {
    playing: false, muted: false, volume: 0.35, trackSrc: null,
  }
  private listeners = new Set<Listener>()

  get supported(): boolean {
    return typeof window !== 'undefined' && typeof Audio !== 'undefined'
  }

  getState(): AmbientState { return { ...this.state } }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit() { this.listeners.forEach(l => l({ ...this.state })) }

  setMuted(muted: boolean) {
    this.state.muted = muted
    if (this.current) this.current.muted = muted
    this.emit()
  }

  setVolume(v: number) {
    const clamped = Math.max(0, Math.min(1, v))
    this.state.volume = clamped
    if (this.current && !this.isFading) this.current.volume = clamped
    this.emit()
  }

  /** Crossfade to a new looped source. Pass null to fade out. */
  play(src: string | null): void {
    if (!this.supported) return
    if (this.state.trackSrc === src) return

    // Fade out current
    const old = this.current
    if (old) this.fadeOut(old)

    if (!src) {
      this.current = null
      this.state.trackSrc = null
      this.state.playing  = false
      this.emit()
      return
    }

    // Start new
    const el = new Audio(src)
    el.loop    = true
    el.muted   = this.state.muted
    el.volume  = 0
    el.preload = 'auto'
    el.crossOrigin = 'anonymous'

    el.play().then(() => {
      this.current = el
      this.state.trackSrc = src
      this.state.playing  = true
      this.fadeIn(el, this.state.volume)
      this.emit()
    }).catch(() => {
      // Autoplay blocked or file missing — silent failure.
      this.state.playing  = false
      this.state.trackSrc = null
      this.emit()
    })
  }

  stop(): void { this.play(null) }

  private isFading = false

  private fadeIn(el: HTMLAudioElement, target: number) {
    this.isFading = true
    const start = performance.now()
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / FADE_MS)
      el.volume = target * k
      if (k < 1) requestAnimationFrame(tick)
      else this.isFading = false
    }
    requestAnimationFrame(tick)
  }

  private fadeOut(el: HTMLAudioElement) {
    const startVol = el.volume
    const start = performance.now()
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / FADE_MS)
      el.volume = startVol * (1 - k)
      if (k < 1) requestAnimationFrame(tick)
      else { el.pause(); el.src = '' }
    }
    requestAnimationFrame(tick)
  }
}

export const ambient = new AmbientEngine()

export function trackForCategory(cat: LocationCategory | undefined | null): AmbientTrack | null {
  if (!cat) return null
  return CATEGORY_TRACKS[cat] ?? null
}
