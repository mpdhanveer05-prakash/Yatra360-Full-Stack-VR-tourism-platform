import { describe, it, expect } from 'vitest'
import { fuzzySearch } from '../fuzzySearch'

interface Place { id: string; name: string; tags: string[] }

const data: Place[] = [
  { id: '1', name: 'Taj Mahal',        tags: ['mughal', 'mausoleum'] },
  { id: '2', name: 'Red Fort',         tags: ['mughal', 'fort']      },
  { id: '3', name: 'Konark Sun Temple', tags: ['hindu', 'temple']    },
  { id: '4', name: 'Mehrangarh Fort',  tags: ['rajput', 'fort']      },
]

const config = {
  fields: [
    { get: (p: Place) => p.name, weight: 5 },
    { get: (p: Place) => p.tags, weight: 2 },
  ],
}

describe('fuzzySearch', () => {
  it('returns all items for empty query', () => {
    const out = fuzzySearch(data, '', config)
    expect(out.length).toBe(data.length)
  })

  it('exact name match scores highest', () => {
    const out = fuzzySearch(data, 'Taj Mahal', config)
    expect(out[0].item.id).toBe('1')
  })

  it('tag match returns relevant items', () => {
    const out = fuzzySearch(data, 'mughal', config)
    const ids = out.map(r => r.item.id)
    expect(ids).toContain('1')
    expect(ids).toContain('2')
  })

  it('partial / prefix match works', () => {
    const out = fuzzySearch(data, 'Tem', config)
    expect(out[0].item.id).toBe('3')
  })

  it('filters out non-matches below threshold', () => {
    const out = fuzzySearch(data, 'xyzzy', config)
    expect(out.length).toBe(0)
  })
})
