// Declarative badge rules. Evaluated after each visit; awards new badges.

import type { Stamp, Badge, Streak } from '../types/passport'

export interface BadgeDef {
  id:          string
  name:        string
  description: string
  icon:        string
  check:       (ctx: BadgeCtx) => boolean
}

export interface BadgeCtx {
  stamps: Stamp[]
  streak: Streak
}

function countBy(stamps: Stamp[], key: keyof Stamp): Record<string, number> {
  const out: Record<string, number> = {}
  for (const s of stamps) {
    const k = String(s[key])
    out[k] = (out[k] ?? 0) + 1
  }
  return out
}

export const BADGE_DEFS: BadgeDef[] = [
  {
    id:   'first-step',
    name: 'First Step',
    description: 'Visit your first destination.',
    icon: '👣',
    check: ({ stamps }) => stamps.length >= 1,
  },
  {
    id:   'curious-traveler',
    name: 'Curious Traveler',
    description: 'Visit 5 different destinations.',
    icon: '🧭',
    check: ({ stamps }) => stamps.length >= 5,
  },
  {
    id:   'seasoned-yatri',
    name: 'Seasoned Yatri',
    description: 'Visit 15 different destinations.',
    icon: '🪔',
    check: ({ stamps }) => stamps.length >= 15,
  },
  {
    id:   'all-india',
    name: 'All-India Explorer',
    description: 'Complete all 25 destinations.',
    icon: '🏆',
    check: ({ stamps }) => stamps.length >= 25,
  },
  {
    id:   'citadel-wanderer',
    name: 'Citadel Wanderer',
    description: 'Visit 3 forts.',
    icon: '🏰',
    check: ({ stamps }) => (countBy(stamps, 'category')['fort'] ?? 0) >= 3,
  },
  {
    id:   'temple-pilgrim',
    name: 'Temple Pilgrim',
    description: 'Visit 5 temples or spiritual sites.',
    icon: '⛩',
    check: ({ stamps }) => {
      const c = countBy(stamps, 'category')
      return (c['temple'] ?? 0) + (c['spiritual'] ?? 0) >= 5
    },
  },
  {
    id:   'nature-lover',
    name: 'Nature Lover',
    description: 'Visit 3 natural landscapes.',
    icon: '🌿',
    check: ({ stamps }) => (countBy(stamps, 'category')['nature'] ?? 0) >= 3,
  },
  {
    id:   'museum-scholar',
    name: 'Museum Scholar',
    description: 'Visit 3 museums.',
    icon: '🎭',
    check: ({ stamps }) => (countBy(stamps, 'category')['museum'] ?? 0) >= 3,
  },
  {
    id:   'state-collector-5',
    name: 'Five States Crossed',
    description: 'Visit destinations in 5 different states.',
    icon: '🗺',
    check: ({ stamps }) => Object.keys(countBy(stamps, 'state')).length >= 5,
  },
  {
    id:   'state-collector-15',
    name: 'Bharat Wanderer',
    description: 'Visit destinations in 15 different states.',
    icon: '🇮🇳',
    check: ({ stamps }) => Object.keys(countBy(stamps, 'state')).length >= 15,
  },
  {
    id:   'streak-3',
    name: '3-Day Streak',
    description: 'Visit on 3 consecutive days.',
    icon: '🔥',
    check: ({ streak }) => streak.current >= 3 || streak.longest >= 3,
  },
  {
    id:   'streak-7',
    name: 'Weekly Yatri',
    description: 'Visit on 7 consecutive days.',
    icon: '⚡',
    check: ({ streak }) => streak.current >= 7 || streak.longest >= 7,
  },
]

/** Returns badges newly earned given current context (excluding already-earned IDs). */
export function evaluateBadges(ctx: BadgeCtx, earnedIds: Set<string>): Badge[] {
  const now = Date.now()
  const earned: Badge[] = []
  for (const def of BADGE_DEFS) {
    if (earnedIds.has(def.id)) continue
    if (def.check(ctx)) {
      earned.push({
        id: def.id, name: def.name, description: def.description,
        icon: def.icon, earnedAt: now,
      })
    }
  }
  return earned
}
