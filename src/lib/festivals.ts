import festivalsData from '../data/festivals.json'
import type { Festival } from '../types/festival'
import type { IndiaLocation } from '../types/location'

const FESTIVALS = festivalsData.festivals as Festival[]

const DAY_MS = 86400000
const UPCOMING_WINDOW_DAYS = 14

interface FestivalMatch {
  festival: Festival
  daysUntil: number   // negative = ongoing, 0 = today, positive = upcoming
  status: 'ongoing' | 'today' | 'upcoming'
}

/** Returns active or upcoming festivals for `location` on `now`. */
export function activeFestivals(location: IndiaLocation, now: Date = new Date()): FestivalMatch[] {
  const matches: FestivalMatch[] = []
  const year = now.getFullYear()

  for (const f of FESTIVALS) {
    // Region check
    if (!f.regions.includes('all') && !f.regions.includes(location.region)) continue
    // Category check
    if (!f.categories.includes(location.category)) continue

    // Calculate start/end for this year
    const start = new Date(year, f.month - 1, f.day)
    const end   = new Date(start.getTime() + (f.duration - 1) * DAY_MS)

    const nowMs   = now.getTime()
    const startMs = start.getTime()
    const endMs   = end.getTime()

    if (nowMs >= startMs && nowMs <= endMs) {
      const daysIn = Math.floor((nowMs - startMs) / DAY_MS)
      matches.push({
        festival: f,
        daysUntil: -daysIn,
        status: daysIn === 0 ? 'today' : 'ongoing',
      })
    } else if (nowMs < startMs) {
      const daysUntil = Math.ceil((startMs - nowMs) / DAY_MS)
      if (daysUntil <= UPCOMING_WINDOW_DAYS) {
        matches.push({ festival: f, daysUntil, status: 'upcoming' })
      }
    }
  }

  matches.sort((a, b) => a.daysUntil - b.daysUntil)
  return matches
}
