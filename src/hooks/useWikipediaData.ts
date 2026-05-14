import { useState, useEffect, useRef } from 'react'
import { fetchSummary, fetchFullSections } from '../api/wikipedia'
import type { WikiSummary, WikiSection } from '../api/wikipedia'

interface WikiData {
  summary:  WikiSummary | null
  sections: WikiSection[]
  loading:  boolean
  error:    string | null
}

// module-level cache so data survives component unmounts
const cache = new Map<string, { summary: WikiSummary; sections: WikiSection[] }>()

export function useWikipediaData(wikiSlug: string | null): WikiData {
  const [state, setState] = useState<WikiData>({
    summary:  null,
    sections: [],
    loading:  false,
    error:    null,
  })
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!wikiSlug) return

    if (cache.has(wikiSlug)) {
      const cached = cache.get(wikiSlug)!
      setState({ summary: cached.summary, sections: cached.sections, loading: false, error: null })
      return
    }

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setState(s => ({ ...s, loading: true, error: null }))

    Promise.all([fetchSummary(wikiSlug), fetchFullSections(wikiSlug)])
      .then(([summary, sections]) => {
        cache.set(wikiSlug, { summary, sections })
        setState({ summary, sections, loading: false, error: null })
      })
      .catch(err => {
        if (err.name === 'AbortError') return
        setState(s => ({ ...s, loading: false, error: 'Failed to load Wikipedia data.' }))
      })

    return () => abortRef.current?.abort()
  }, [wikiSlug])

  return state
}
