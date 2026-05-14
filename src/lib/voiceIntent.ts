import type { IndiaLocation } from '../types/location'
import { fuzzySearch } from './fuzzySearch'

// Phrases that signal the user wants to navigate to a location.
const NAV_PATTERNS: RegExp[] = [
  /take me to (.+)/i,
  /go to (.+)/i,
  /navigate to (.+)/i,
  /show me (.+)/i,
  /bring me to (.+)/i,
  /let'?s (?:go to|visit|explore) (.+)/i,
  /i want to (?:see|visit|go to|explore) (.+)/i,
  /can (?:you )?(?:take me to|show me|navigate to|open) (.+)/i,
  /open (.+)/i,
  /explore (.+)/i,
  /visit (.+)/i,
]

export interface NavIntent {
  query:    string
  location: IndiaLocation
  score:    number
}

/**
 * Returns a matched location if the transcript contains a navigation command,
 * or null if this looks like a regular guide question.
 */
export function detectNavIntent(
  transcript: string,
  locations: IndiaLocation[],
): NavIntent | null {
  let query: string | null = null

  for (const pattern of NAV_PATTERNS) {
    const m = transcript.match(pattern)
    if (m?.[1]) {
      // Strip trailing punctuation and filler words like "please", "now"
      query = m[1]
        .trim()
        .replace(/[.!?,]+$/, '')
        .replace(/\s+(please|now|for me)$/i, '')
        .trim()
      break
    }
  }

  if (!query || query.length < 2) return null

  const results = fuzzySearch(locations, query, {
    fields: [
      { get: (loc: IndiaLocation) => loc.name,                weight: 4 },
      { get: (loc: IndiaLocation) => loc.city,                weight: 1 },
      { get: (loc: IndiaLocation) => loc.tags,                weight: 1 },
      { get: (loc: IndiaLocation) => [loc.state, loc.region], weight: 0.5 },
    ],
  })

  const top = results[0]
  // Require a reasonably confident match to avoid false positives
  if (!top || top.score < 0.28) return null

  return { query, location: top.item, score: top.score }
}
