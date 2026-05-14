import { describe, it, expect } from 'vitest'
import { detectNavIntent } from '../voiceIntent'
import locationsJson from '../../data/indiaLocations.json'
import type { IndiaLocation } from '../../types/location'

const locations = locationsJson as IndiaLocation[]

describe('voice nav intent', () => {
  it('matches "take me to Taj Mahal"', () => {
    const result = detectNavIntent('take me to Taj Mahal', locations)
    expect(result).not.toBeNull()
    expect(result!.location.id).toBe('taj-mahal-agra')
  })

  it('matches "take me to the Taj Mahal" (with article)', () => {
    const result = detectNavIntent('take me to the Taj Mahal', locations)
    expect(result).not.toBeNull()
    expect(result!.location.id).toBe('taj-mahal-agra')
  })

  it('matches "Take me to the Taj Mahal please."', () => {
    const result = detectNavIntent('Take me to the Taj Mahal please.', locations)
    expect(result).not.toBeNull()
    expect(result!.location.id).toBe('taj-mahal-agra')
  })

  it('matches "go to Hampi"', () => {
    const result = detectNavIntent('go to Hampi', locations)
    expect(result).not.toBeNull()
    expect(result!.location.id).toBe('hampi-karnataka')
  })

  it('matches bare location name "Red Fort"', () => {
    const result = detectNavIntent('Red Fort', locations)
    expect(result).not.toBeNull()
    expect(result!.location.id).toBe('red-fort-delhi')
  })

  it('returns null for a guide question', () => {
    const result = detectNavIntent('who built this monument', locations)
    expect(result).toBeNull()
  })

  it('returns null for a fuzzy bare phrase', () => {
    const result = detectNavIntent('what is the history of india', locations)
    expect(result).toBeNull()
  })
})
