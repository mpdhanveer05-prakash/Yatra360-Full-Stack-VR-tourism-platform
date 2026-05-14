import erasData from '../data/eras.json'
import reconstructionsData from '../data/reconstructions.json'
import type { Era } from '../types/era'

const ALL_ERAS = erasData.eras as Era[]

interface Reconstruction {
  locationId: string
  eras:       string[]
  context?:   Record<string, string>
}

const RECONSTRUCTIONS = reconstructionsData.reconstructions as unknown as Reconstruction[]

const RECON_INDEX = new Map<string, Reconstruction>(
  RECONSTRUCTIONS.map(r => [r.locationId, r]),
)

export function allEras(): Era[] {
  return ALL_ERAS
}

export function eraById(id: string): Era | null {
  return ALL_ERAS.find(e => e.id === id) ?? null
}

/** Returns the eras available for a location, oldest → newest. */
export function erasForLocation(locationId: string): Era[] {
  const recon = RECON_INDEX.get(locationId)
  if (!recon) {
    // Default: every location has at least "Now" plus eras matching its time span.
    return ALL_ERAS.filter(e => e.id === 'now')
  }
  // Preserve era order from the canonical list (newest → oldest in source);
  // emit oldest → newest for the slider.
  const ordered = [...ALL_ERAS]
    .filter(e => recon.eras.includes(e.id))
    .sort((a, b) => a.yearStart - b.yearStart)
  return ordered
}

/** Returns location-specific era context, or the generic era tone. */
export function eraContext(locationId: string, eraId: string): string {
  const recon = RECON_INDEX.get(locationId)
  if (recon?.context?.[eraId]) return recon.context[eraId]
  return eraById(eraId)?.tone ?? ''
}

export function hasTimeTravel(locationId: string): boolean {
  return RECON_INDEX.has(locationId)
}
