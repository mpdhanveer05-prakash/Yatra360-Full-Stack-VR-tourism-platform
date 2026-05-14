import { describe, it, expect } from 'vitest'
import { computeEngagementScore } from '../engagementScore'

describe('computeEngagementScore', () => {
  it('returns 0 for zero inputs', () => {
    expect(computeEngagementScore({ dwellMs: 0, interactionCount: 0, revisited: false })).toBe(0)
  })

  it('saturates dwellScore at 2 minutes', () => {
    const a = computeEngagementScore({ dwellMs: 120_000, interactionCount: 0, revisited: false })
    const b = computeEngagementScore({ dwellMs: 600_000, interactionCount: 0, revisited: false })
    expect(a).toBeCloseTo(b, 6)
    expect(a).toBeCloseTo(0.5, 6)
  })

  it('saturates interactionScore at 5 clicks', () => {
    const a = computeEngagementScore({ dwellMs: 0, interactionCount: 5,  revisited: false })
    const b = computeEngagementScore({ dwellMs: 0, interactionCount: 50, revisited: false })
    expect(a).toBeCloseTo(b, 6)
    expect(a).toBeCloseTo(0.3, 6)
  })

  it('adds revisit bonus', () => {
    const noRevisit = computeEngagementScore({ dwellMs: 120_000, interactionCount: 5, revisited: false })
    const withRevisit = computeEngagementScore({ dwellMs: 120_000, interactionCount: 5, revisited: true })
    expect(withRevisit - noRevisit).toBeCloseTo(0.2, 6)
  })

  it('full saturation reaches 1.0', () => {
    const max = computeEngagementScore({
      dwellMs: 120_000, interactionCount: 5, revisited: true,
    })
    expect(max).toBeCloseTo(1.0, 6)
  })

  it('attention ratio scales the score', () => {
    const full = computeEngagementScore({ dwellMs: 120_000, interactionCount: 5, revisited: true, attentionRatio: 1.0 })
    const half = computeEngagementScore({ dwellMs: 120_000, interactionCount: 5, revisited: true, attentionRatio: 0.5 })
    const zero = computeEngagementScore({ dwellMs: 120_000, interactionCount: 5, revisited: true, attentionRatio: 0.0 })
    // full = base * 1, half = base * 0.75, zero = base * 0.5
    expect(full).toBeCloseTo(1.0, 6)
    expect(half).toBeCloseTo(0.75, 6)
    expect(zero).toBeCloseTo(0.5, 6)
  })

  it('clamps attentionRatio outside [0,1]', () => {
    const over    = computeEngagementScore({ dwellMs: 120_000, interactionCount: 5, revisited: true, attentionRatio: 5 })
    const under   = computeEngagementScore({ dwellMs: 120_000, interactionCount: 5, revisited: true, attentionRatio: -2 })
    const ceiling = computeEngagementScore({ dwellMs: 120_000, interactionCount: 5, revisited: true, attentionRatio: 1 })
    const floor_  = computeEngagementScore({ dwellMs: 120_000, interactionCount: 5, revisited: true, attentionRatio: 0 })
    expect(over).toBeCloseTo(ceiling, 6)
    expect(under).toBeCloseTo(floor_, 6)
  })
})
