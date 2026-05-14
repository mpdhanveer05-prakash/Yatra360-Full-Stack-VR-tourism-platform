import { describe, it, expect } from 'vitest'
import { asiForLocation, nearbyAsi } from '../asi'

describe('asi lookup', () => {
  it('finds Taj Mahal by location id', () => {
    const m = asiForLocation('taj-mahal-agra')
    expect(m).not.toBeNull()
    expect(m!.asiId).toBe('N-UP-A4')
  })

  it('returns null for unmapped location', () => {
    expect(asiForLocation('does-not-exist')).toBeNull()
  })

  it('finds nearby monuments around Delhi coords', () => {
    // India Gate
    const near = nearbyAsi(28.6129, 77.2295, 25)
    const ids = near.map(n => n.monument.asiId)
    expect(ids).toContain('N-DL-46')   // Qutb Minar
    expect(ids).toContain('N-DL-77')   // Red Fort
  })

  it('excludes the seed monument', () => {
    const near = nearbyAsi(28.6562, 77.241, 25, 'N-DL-77')
    expect(near.map(n => n.monument.asiId)).not.toContain('N-DL-77')
  })

  it('respects radius', () => {
    const near = nearbyAsi(28.6129, 77.2295, 1)
    // Only India Gate itself within 1km — nothing else likely
    expect(near.length).toBeLessThanOrEqual(2)
  })
})
