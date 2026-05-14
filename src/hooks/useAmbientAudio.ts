import { useEffect } from 'react'
import { ambient, trackForCategory } from '../lib/ambientAudio'
import { useUIStore } from '../store/uiStore'
import type { LocationCategory } from '../types/location'

/**
 * Plays category-appropriate ambient audio while a location is active.
 * Respects the user's enabled/volume prefs in uiStore. Stops on unmount.
 */
export function useAmbientAudio(category: LocationCategory | null | undefined): void {
  const enabled = useUIStore(s => s.ambientEnabled)
  const volume  = useUIStore(s => s.ambientVolume)

  // Push volume changes to engine
  useEffect(() => {
    ambient.setVolume(volume)
  }, [volume])

  // Start / stop based on enabled + category
  useEffect(() => {
    if (!enabled || !category) {
      ambient.stop()
      return
    }
    const track = trackForCategory(category)
    if (!track) { ambient.stop(); return }
    ambient.play(track.src)
  }, [enabled, category])

  // Always stop on unmount
  useEffect(() => () => ambient.stop(), [])
}
