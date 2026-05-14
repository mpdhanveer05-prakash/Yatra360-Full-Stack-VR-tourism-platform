import { nominatimQueue } from '../lib/apiQueue'

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
const OVERPASS_BASE  = 'https://overpass-api.de/api/interpreter'
const USER_AGENT     = 'Yatra360/1.0 (educational; github.com/yatra360)'

export interface GeoResult {
  lat: number
  lng: number
  displayName: string
}

export interface NearbyPOI {
  id: number
  name: string
  type: string
  lat: number
  lng: number
  distanceKm: number
}

export async function geocode(query: string): Promise<GeoResult | null> {
  return nominatimQueue.add(async () => {
    const params = new URLSearchParams({ q: `${query}, India`, format: 'json', limit: '1' })
    const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
    })
    const data = await res.json()
    if (!data.length) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), displayName: data[0].display_name }
  })
}

export async function getNearbyPOIs(lat: number, lng: number, radiusMetres = 5000): Promise<NearbyPOI[]> {
  const query = `
    [out:json][timeout:10];
    (
      node["tourism"~"museum|attraction|monument|artwork"](around:${radiusMetres},${lat},${lng});
      node["historic"~"monument|castle|ruins|archaeological_site"](around:${radiusMetres},${lat},${lng});
    );
    out body 20;
  `
  const res = await fetch(OVERPASS_BASE, { method: 'POST', body: query })
  const data = await res.json()

  return (data.elements ?? [])
    .filter((el: { tags?: { name?: string } }) => el.tags?.name)
    .map((el: { id: number; tags: { name: string; tourism?: string; historic?: string }; lat: number; lon: number }) => ({
      id:          el.id,
      name:        el.tags.name,
      type:        el.tags.tourism ?? el.tags.historic ?? 'landmark',
      lat:         el.lat,
      lng:         el.lon,
      distanceKm:  haversineKm(lat, lng, el.lat, el.lon),
    }))
    .sort((a: NearbyPOI, b: NearbyPOI) => a.distanceKm - b.distanceKm)
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R  = 6371
  const dL = toRad(lat2 - lat1)
  const dN = toRad(lng2 - lng1)
  const a  = Math.sin(dL / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dN / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number) { return deg * (Math.PI / 180) }
