import { describe, it, expect } from 'vitest'
import { evaluateBadges } from '../badgeRules'
import type { Stamp, Streak } from '../../types/passport'

function stamp(id: string, category = 'fort', state = 'Rajasthan'): Stamp {
  return {
    locationId:   id,
    locationName: id,
    category,
    state,
    visitedAt:    Date.now(),
    visits:       1,
  }
}

const emptyStreak: Streak = { current: 0, longest: 0, lastVisitYmd: null }

describe('evaluateBadges', () => {
  it('awards First Step on first visit', () => {
    const earned = evaluateBadges(
      { stamps: [stamp('a')], streak: emptyStreak },
      new Set(),
    )
    expect(earned.map(b => b.id)).toContain('first-step')
  })

  it('does not re-award already-earned badges', () => {
    const earned = evaluateBadges(
      { stamps: [stamp('a')], streak: emptyStreak },
      new Set(['first-step']),
    )
    expect(earned.map(b => b.id)).not.toContain('first-step')
  })

  it('awards Citadel Wanderer for 3 forts', () => {
    const earned = evaluateBadges(
      { stamps: [stamp('a','fort'), stamp('b','fort'), stamp('c','fort')], streak: emptyStreak },
      new Set(),
    )
    expect(earned.map(b => b.id)).toContain('citadel-wanderer')
  })

  it('does NOT award Citadel Wanderer for 2 forts', () => {
    const earned = evaluateBadges(
      { stamps: [stamp('a','fort'), stamp('b','fort')], streak: emptyStreak },
      new Set(),
    )
    expect(earned.map(b => b.id)).not.toContain('citadel-wanderer')
  })

  it('awards 5-state collector', () => {
    const stamps = ['RJ','UP','MP','OR','TN'].map((s, i) => stamp(`s${i}`, 'fort', s))
    const earned = evaluateBadges(
      { stamps, streak: emptyStreak },
      new Set(),
    )
    expect(earned.map(b => b.id)).toContain('state-collector-5')
  })

  it('awards streak badges', () => {
    const earned = evaluateBadges(
      { stamps: [stamp('a')], streak: { current: 7, longest: 7, lastVisitYmd: '2026-01-07' } },
      new Set(),
    )
    expect(earned.map(b => b.id)).toContain('streak-3')
    expect(earned.map(b => b.id)).toContain('streak-7')
  })
})
