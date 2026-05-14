// Tiny fuzzy search — token + substring + initials matching with weighted fields.
// Avoids pulling in fuse.js. Good enough for 50-item dataset.

export interface FuzzyField<T> {
  get:    (item: T) => string | string[] | undefined
  weight: number
}

export interface FuzzyConfig<T> {
  fields: FuzzyField<T>[]
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
}

function tokens(s: string): string[] {
  return normalize(s).split(/[\s,/()-]+/).filter(t => t.length > 0)
}

function scoreField(query: string, value: string): number {
  if (!value) return 0
  const v = normalize(value)
  const q = normalize(query)
  if (!q) return 0
  if (v === q) return 1.0
  if (v.startsWith(q)) return 0.85
  if (v.includes(q)) return 0.7

  // Token-level match
  const qTokens = tokens(q)
  const vTokens = tokens(v)
  if (qTokens.length === 0) return 0

  let matched = 0
  for (const qt of qTokens) {
    if (vTokens.some(vt => vt.startsWith(qt) || vt.includes(qt))) matched++
  }
  if (matched === qTokens.length) return 0.55
  if (matched > 0) return 0.35 * (matched / qTokens.length)

  // Initials match (e.g. "tm" → "Taj Mahal")
  const initials = vTokens.map(t => t[0]).join('')
  if (initials.startsWith(q) && q.length >= 2) return 0.5

  return 0
}

export interface FuzzyResult<T> {
  item:  T
  score: number
}

export function fuzzySearch<T>(items: T[], query: string, config: FuzzyConfig<T>): FuzzyResult<T>[] {
  const trimmed = query.trim()
  if (!trimmed) return items.map(item => ({ item, score: 1 }))

  const results: FuzzyResult<T>[] = []
  for (const item of items) {
    let total = 0
    let maxPossible = 0
    for (const field of config.fields) {
      maxPossible += field.weight
      const raw = field.get(item)
      if (!raw) continue
      const arr = Array.isArray(raw) ? raw : [raw]
      let best = 0
      for (const v of arr) best = Math.max(best, scoreField(trimmed, v))
      total += best * field.weight
    }
    const score = maxPossible > 0 ? total / maxPossible : 0
    if (score > 0.1) results.push({ item, score })
  }

  results.sort((a, b) => b.score - a.score)
  return results
}
