import { describe, it, expect } from 'vitest'
import { activeFestivals } from '../festivals'
import type { IndiaLocation } from '../../types/location'

function loc(overrides: Partial<IndiaLocation> = {}): IndiaLocation {
  return {
    id:   'test',
    name: 'Test',
    city: 'Test',
    state: 'TS',
    region: 'north',
    category: 'temple',
    lat: 0, lng: 0,
    description: '',
    unescoStatus: false,
    bestSeason: [],
    tags: [],
    wikiSlug: '',
    wikimediaCategory: '',
    features: {
      historical: 0, architectural: 0, religious: 0, natural: 0,
      cultural: 0, artistic: 0, educational: 0, adventurous: 0,
      ancient: 0, medieval: 0, colonial: 0, modern: 0,
    },
    nodes: [],
    ...overrides,
  }
}

describe('activeFestivals', () => {
  it('returns Diwali for a temple in November', () => {
    const matches = activeFestivals(loc({ region: 'north', category: 'temple' }), new Date(2026, 10, 1))
    const ids = matches.map(m => m.festival.id)
    expect(ids).toContain('diwali')
  })

  it('respects region filtering', () => {
    // Holi is north/central/east only — should not match a south location
    const south = activeFestivals(loc({ region: 'south' }), new Date(2026, 2, 14))
    expect(south.map(m => m.festival.id)).not.toContain('holi')
    // But IS matched for north
    const north = activeFestivals(loc({ region: 'north' }), new Date(2026, 2, 14))
    expect(north.map(m => m.festival.id)).toContain('holi')
  })

  it('marks ongoing vs upcoming correctly', () => {
    // Diwali 2026 starts Nov 1 in our data
    const onDay = activeFestivals(loc({ region: 'north', category: 'temple' }), new Date(2026, 10, 1))
    const diwali = onDay.find(m => m.festival.id === 'diwali')
    expect(diwali?.status).toBe('today')

    const before = activeFestivals(loc({ region: 'north', category: 'temple' }), new Date(2026, 9, 25))
    const upcomingDiwali = before.find(m => m.festival.id === 'diwali')
    expect(upcomingDiwali?.status).toBe('upcoming')
    expect(upcomingDiwali?.daysUntil).toBeGreaterThan(0)
  })

  it('returns empty in off-season', () => {
    const matches = activeFestivals(loc({ region: 'west', category: 'museum' }), new Date(2026, 5, 15))
    expect(matches.length).toBe(0)
  })
})
