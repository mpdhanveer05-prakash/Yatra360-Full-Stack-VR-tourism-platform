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

// Strip leading articles/prepositions and trailing filler words to get the
// raw location name out of the captured group.
function cleanQuery(raw: string): string {
  return raw
    .trim()
    .replace(/[.!?,]+$/, '')                                     // trailing punctuation
    .replace(/\s+(please|now|for me|right now|today)$/i, '')     // trailing filler
    .replace(/^(the|a|an|to|in|at)\s+/i, '')                     // leading article/prep
    .trim()
}

export interface NavIntent {
  query:    string
  location: IndiaLocation
  score:    number
}

/**
 * Returns a matched location if the transcript contains a navigation command
 * (or is just a bare location name like "Taj Mahal"), or null otherwise.
 */
export function detectNavIntent(
  transcript: string,
  locations: IndiaLocation[],
): NavIntent | null {
  let query: string | null = null
  let isCommand = false

  for (const pattern of NAV_PATTERNS) {
    const m = transcript.match(pattern)
    if (m?.[1]) {
      query = cleanQuery(m[1])
      isCommand = true
      break
    }
  }

  // No navigation phrase — but if the entire transcript is short, try matching
  // it as a bare location name (e.g. user just says "Taj Mahal").
  if (!query) {
    const bare = cleanQuery(transcript)
    if (bare.length < 2 || bare.split(/\s+/).length > 5) return null
    query = bare
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
  if (!top) return null

  // Bare-name matches need a higher score (to avoid hijacking guide questions);
  // explicit commands can match with a lower confidence.
  const threshold = isCommand ? 0.18 : 0.45
  if (top.score < threshold) return null

  return { query, location: top.item, score: top.score }
}
