import type { IndiaLocation, FeatureVector } from '../types/location'

export interface ScoredLocation {
  location: IndiaLocation
  score: number
  reason: string
}

type VisitRecord = { locationId: string; engagementScore: number }

function toVector(f: FeatureVector): number[] {
  return [
    f.historical, f.architectural, f.religious, f.natural,
    f.cultural, f.artistic, f.educational, f.adventurous,
    f.ancient, f.medieval, f.colonial, f.modern,
  ]
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot  = a.reduce((sum, v, i) => sum + v * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0))
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0))
  if (magA === 0 || magB === 0) return 0
  return dot / (magA * magB)
}

function buildUserVector(history: VisitRecord[], allLocations: IndiaLocation[]): number[] {
  if (history.length === 0) return new Array(12).fill(0)

  const locationMap = new Map(allLocations.map(l => [l.id, l]))
  let totalWeight = 0
  const vec = new Array(12).fill(0)

  for (const { locationId, engagementScore } of history) {
    const loc = locationMap.get(locationId)
    if (!loc) continue
    const w = Math.max(engagementScore, 0.01)
    toVector(loc.features).forEach((v, i) => { vec[i] += v * w })
    totalWeight += w
  }

  return totalWeight > 0 ? vec.map(v => v / totalWeight) : vec
}

function reasonForMatch(userVec: number[], locVec: number[]): string {
  const dims = [
    'historical significance', 'architectural beauty', 'religious importance',
    'natural scenery', 'cultural depth', 'artistic richness',
    'educational value', 'adventurous spirit', 'ancient heritage',
    'medieval history', 'colonial history', 'modern relevance',
  ]
  let best = 0
  let bestIdx = 0
  userVec.forEach((u, i) => {
    const score = u * locVec[i]
    if (score > best) { best = score; bestIdx = i }
  })
  return `Matches your interest in ${dims[bestIdx]}`
}

export function getRecommendations(
  history: VisitRecord[],
  currentLocationId: string,
  allLocations: IndiaLocation[],
  topN = 3,
): ScoredLocation[] {
  const userVec = buildUserVector(history, allLocations)
  const visitedIds = new Set(history.map(h => h.locationId))
  visitedIds.add(currentLocationId)

  const currentLoc = allLocations.find(l => l.id === currentLocationId)

  const scored = allLocations
    .filter(l => !visitedIds.has(l.id))
    .map(l => ({
      location: l,
      score: cosineSimilarity(userVec, toVector(l.features)),
      reason: reasonForMatch(userVec, toVector(l.features)),
    }))
    .sort((a, b) => b.score - a.score)

  // diversity penalty: ensure at least 1 result from a different category
  if (currentLoc && scored.length > 1) {
    const sameCategory = scored.filter(s => s.location.category === currentLoc.category)
    const diffCategory = scored.filter(s => s.location.category !== currentLoc.category)
    if (diffCategory.length > 0 && sameCategory.length >= topN) {
      const top = sameCategory.slice(0, topN - 1)
      top.push(diffCategory[0])
      return top
    }
  }

  return scored.slice(0, topN)
}

// Cold-start: UNESCO sites sorted by region proximity
export function getColdStartRecommendations(
  allLocations: IndiaLocation[],
  userRegion?: string,
  topN = 3,
): ScoredLocation[] {
  const unesco = allLocations.filter(l => l.unescoStatus)
  const prioritised = userRegion
    ? [...unesco.filter(l => l.region === userRegion), ...unesco.filter(l => l.region !== userRegion)]
    : unesco
  return prioritised.slice(0, topN).map(location => ({
    location,
    score: 1,
    reason: 'UNESCO World Heritage Site',
  }))
}
