// Client-side fallback for the AI guide when the backend isn't reachable
// (e.g. Vercel-only deploy without backend hosting).
//
// Uses the Wikipedia extract + location metadata that's already loaded in
// the page to give a useful answer instead of an error.

export interface FallbackContext {
  locationName:  string
  description:   string
  city?:         string
  state?:        string
  category?:     string
  established?:  string
  unescoStatus?: boolean
  wikiExtract?:  string
}

const QUESTION_WORDS = ['who', 'what', 'where', 'when', 'why', 'how', 'which']

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

/**
 * Pick the most relevant sentences from the Wikipedia extract for the
 * given question. Uses simple keyword overlap — good enough as a fallback.
 */
function findRelevantSentences(question: string, extract: string, max = 3): string[] {
  const qWords = question
    .toLowerCase()
    .replace(/[?.,!]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !QUESTION_WORDS.includes(w))

  if (qWords.length === 0) return splitSentences(extract).slice(0, max)

  const sentences = splitSentences(extract)
  const scored = sentences.map(s => {
    const lower = s.toLowerCase()
    const hits  = qWords.filter(w => lower.includes(w)).length
    return { s, hits }
  })

  scored.sort((a, b) => b.hits - a.hits)
  return scored.slice(0, max).filter(x => x.hits > 0).map(x => x.s)
}

export function buildFallbackAnswer(question: string, ctx: FallbackContext): string {
  const q = question.toLowerCase()
  const name = ctx.locationName

  // "where" question → location info
  if (/\bwhere\b/.test(q)) {
    const parts = [ctx.city, ctx.state].filter(Boolean).join(', ')
    return parts
      ? `${name} is located in ${parts}, India.`
      : `${name} is a heritage site in India.`
  }

  // "when" / "year" / "built" / "old" question → established date
  if (/\b(when|year|built|old|age|founded|constructed)\b/.test(q) && ctx.established) {
    return `${name} was established in ${ctx.established}.`
  }

  // "unesco" question → status
  if (/\bunesco|world heritage\b/.test(q)) {
    return ctx.unescoStatus
      ? `Yes, ${name} is a UNESCO World Heritage Site.`
      : `${name} is not currently a UNESCO World Heritage Site.`
  }

  // "category" / "type" / "kind" question
  if (/\b(category|type|kind of)\b/.test(q) && ctx.category) {
    return `${name} is a ${ctx.category} site.`
  }

  // Default: try Wikipedia extract matching, fall back to description
  if (ctx.wikiExtract) {
    const relevant = findRelevantSentences(question, ctx.wikiExtract)
    if (relevant.length > 0) return relevant.join(' ')
    // No keyword match — return first two sentences of extract
    return splitSentences(ctx.wikiExtract).slice(0, 2).join(' ')
  }

  return `${name}. ${ctx.description}`
}
