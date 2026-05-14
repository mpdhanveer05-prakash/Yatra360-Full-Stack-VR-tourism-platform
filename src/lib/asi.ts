import asiData from '../data/asi_monuments.json'
import type { AsiMonument } from '../types/asi'

const ALL = asiData.monuments as AsiMonument[]

const BY_LOCATION_ID = new Map<string, AsiMonument>()
for (const m of ALL) {
  if (m.yatraLocationId) BY_LOCATION_ID.set(m.yatraLocationId, m)
}

export function asiForLocation(locationId: string): AsiMonument | null {
  return BY_LOCATION_ID.get(locationId) ?? null
}

export function allMonuments(): AsiMonument[] { return ALL }

/** Haversine distance in km. */
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R  = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dL = toRad(lat2 - lat1)
  const dN = toRad(lng2 - lng1)
  const a  = Math.sin(dL / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dN / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export interface NearbyAsi {
  monument: AsiMonument
  distanceKm: number
}

/** ASI monuments within `radiusKm` of (lat,lng), nearest first, excluding the location's own monument. */
export function nearbyAsi(lat: number, lng: number, radiusKm = 25, excludeId?: string): NearbyAsi[] {
  return ALL
    .filter(m => m.asiId !== excludeId)
    .map(m => ({ monument: m, distanceKm: distanceKm(lat, lng, m.lat, m.lng) }))
    .filter(r => r.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 6)
}
