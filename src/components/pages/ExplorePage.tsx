import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import LocationCard from '../ui/LocationCard'
import CategoryFilter from '../ui/CategoryFilter'
import SearchBar from '../ui/SearchBar'
import IndiaMap from '../ui/IndiaMap'
import { fuzzySearch } from '../../lib/fuzzySearch'
import locations from '../../data/indiaLocations.json'
import type { IndiaLocation, LocationCategory } from '../../types/location'

const allLocations = locations as IndiaLocation[]

const STATES = [...new Set(allLocations.map(l => l.state))].sort()

// Top N tags computed once at module load.
const POPULAR_TAGS = (() => {
  const counts = new Map<string, number>()
  for (const l of allLocations) {
    for (const t of l.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([t]) => t)
})()

type SortKey = 'recommended' | 'az' | 'za' | 'unesco' | 'relevance'
type ViewMode = 'grid' | 'map'

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const categoryParam = searchParams.get('category') as LocationCategory | 'all' | null
  const [category, setCategory] = useState<LocationCategory | 'all'>(categoryParam ?? 'all')
  const [state, setState]       = useState('all')
  const [search, setSearch]     = useState('')
  const [sort, setSort]         = useState<SortKey>('recommended')
  const [view, setView]         = useState<ViewMode>('grid')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)

  function handleCategory(val: LocationCategory | 'all') {
    setCategory(val)
    if (val === 'all') searchParams.delete('category')
    else searchParams.set('category', val)
    setSearchParams(searchParams, { replace: true })
  }

  function toggleTag(tag: string) {
    setActiveTags(t => t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag])
  }

  const filtered = useMemo(() => {
    let pool = allLocations
    if (category !== 'all') pool = pool.filter(l => l.category === category)
    if (state !== 'all')    pool = pool.filter(l => l.state === state)
    if (activeTags.length > 0) {
      pool = pool.filter(l => activeTags.every(t => l.tags.includes(t)))
    }

    if (search.trim()) {
      const results = fuzzySearch(pool, search, {
        fields: [
          { get: l => l.name,                       weight: 5 },
          { get: l => l.city,                       weight: 3 },
          { get: l => l.state,                      weight: 3 },
          { get: l => l.category,                   weight: 2 },
          { get: l => l.tags,                       weight: 2 },
          { get: l => l.description,                weight: 1 },
        ],
      })
      // If user is searching, ignore other sort modes and use relevance.
      return results.map(r => r.item)
    }

    const result = [...pool]
    switch (sort) {
      case 'az':     return result.sort((a, b) => a.name.localeCompare(b.name))
      case 'za':     return result.sort((a, b) => b.name.localeCompare(a.name))
      case 'unesco': return result.sort((a, b) => (b.unescoStatus ? 1 : 0) - (a.unescoStatus ? 1 : 0))
      default:
        return result.sort((a, b) => {
          const aS = a.features.historical + a.features.architectural + a.features.cultural
          const bS = b.features.historical + b.features.architectural + b.features.cultural
          return bS - aS
        })
    }
  }, [category, state, search, sort, activeTags])

  const hasActiveFilter = category !== 'all' || state !== 'all' || search || sort !== 'recommended' || activeTags.length > 0

  function clearAll() {
    setCategory('all')
    setState('all')
    setSearch('')
    setSort('recommended')
    setActiveTags([])
    searchParams.delete('category')
    setSearchParams(searchParams, { replace: true })
  }

  const SortSelect = (
    <select
      value={sort}
      onChange={e => setSort(e.target.value as SortKey)}
      disabled={!!search.trim()}
      title={search.trim() ? 'Showing search relevance' : undefined}
      className="bg-bg-card border border-[var(--border)] text-cream font-mono text-xs px-3 py-2 focus:outline-none focus:border-gold/50 cursor-pointer w-full disabled:opacity-50"
    >
      <option value="recommended">Recommended</option>
      <option value="az">A → Z</option>
      <option value="za">Z → A</option>
      <option value="unesco">UNESCO First</option>
    </select>
  )

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* page header */}
      <div className="bg-bg-surface border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-xs tracking-[0.3em] text-saffron uppercase mb-1">25 Destinations</p>
              <h1 className="font-cinzel text-2xl text-cream">Explore India</h1>
            </div>
            {/* view toggle */}
            <div role="tablist" aria-label="View mode" className="flex items-center gap-1">
              <button
                role="tab"
                aria-selected={view === 'grid'}
                onClick={() => setView('grid')}
                className={`
                  px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase rounded-sm
                  ${view === 'grid'
                    ? 'bg-saffron text-cream'
                    : 'bg-bg-elevated text-text-secondary border border-gold/20 hover:border-gold/50 hover:text-cream'}
                `}
              >
                ▦ Grid
              </button>
              <button
                role="tab"
                aria-selected={view === 'map'}
                onClick={() => setView('map')}
                className={`
                  px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase rounded-sm
                  ${view === 'map'
                    ? 'bg-saffron text-cream'
                    : 'bg-bg-elevated text-text-secondary border border-gold/20 hover:border-gold/50 hover:text-cream'}
                `}
              >
                ◎ Map
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-md">
              <SearchBar value={search} onChange={setSearch} placeholder="Search locations, states, tags…" />
            </div>
            <button
              onClick={() => setDrawerOpen(o => !o)}
              className="sm:hidden btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              ⚙ Filters
            </button>
            <div className="hidden sm:block">{SortSelect}</div>
          </div>

          {/* tag chips */}
          {POPULAR_TAGS.length > 0 && (
            <div className="flex flex-wrap gap-1.5" aria-label="Popular tags">
              {POPULAR_TAGS.map(tag => {
                const on = activeTags.includes(tag)
                return (
                  <button
                    key={tag}
                    aria-pressed={on}
                    onClick={() => toggleTag(tag)}
                    className={`
                      font-mono text-[10px] px-2 py-1 rounded-full transition-colors
                      ${on
                        ? 'bg-saffron text-cream'
                        : 'bg-bg-elevated text-text-secondary border border-gold/15 hover:border-gold/45 hover:text-cream'}
                    `}
                  >
                    #{tag}
                  </button>
                )
              })}
              {activeTags.length > 0 && (
                <button
                  onClick={() => setActiveTags([])}
                  className="font-mono text-[10px] px-2 py-1 text-saffron hover:underline"
                >
                  clear tags
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">

        {/* sidebar */}
        <aside className={`${drawerOpen ? 'block' : 'hidden'} sm:block w-full sm:w-56 flex-none space-y-6 sm:sticky sm:top-20 sm:self-start`}>
          <div className="space-y-2">
            <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase">Category</p>
            <CategoryFilter selected={category} onChange={handleCategory} />
          </div>

          <div className="space-y-2">
            <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase">State</p>
            <select
              value={state}
              onChange={e => setState(e.target.value)}
              className="w-full bg-bg-card border border-[var(--border)] text-cream font-mono text-xs px-3 py-2 focus:outline-none focus:border-gold/50 cursor-pointer"
            >
              <option value="all">All States</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-2 sm:hidden">
            <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase">Sort by</p>
            {SortSelect}
          </div>

          {hasActiveFilter && (
            <button onClick={clearAll} className="font-mono text-xs text-saffron hover:text-saffron-light underline">
              Clear all filters
            </button>
          )}
        </aside>

        {/* main */}
        <main className="flex-1 min-w-0 space-y-4">
          <p className="font-mono text-xs text-text-muted">
            {filtered.length}{' '}
            <span className="text-text-secondary">{filtered.length === 1 ? 'location' : 'locations'}</span>
            {search.trim() && <span className="text-saffron"> · relevance-sorted</span>}
          </p>

          {filtered.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <p className="font-cinzel text-2xl text-text-muted">No results</p>
              <p className="font-proza text-sm text-text-muted">Try adjusting your filters or search query.</p>
              <button onClick={clearAll} className="btn-secondary text-xs">Show all destinations</button>
            </div>
          ) : view === 'map' ? (
            <IndiaMap locations={filtered} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(loc => (
                <LocationCard key={loc.id} location={loc} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
