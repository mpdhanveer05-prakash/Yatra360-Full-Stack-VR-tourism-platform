import type { HeatmapData } from '../types/ai'
import type { EngagementEvent } from '../types/tour'
import { computeEngagementScore } from './engagementScore'

interface NodeAggregate {
  totalDwellMs: number
  totalInteractions: number
  visitCount: number
}

export function generateHeatmap(events: EngagementEvent[]): HeatmapData {
  const nodeMap = new Map<string, NodeAggregate>()

  for (const ev of events) {
    if (ev.eventType !== 'node_exit') continue
    const existing = nodeMap.get(ev.nodeId) ?? { totalDwellMs: 0, totalInteractions: 0, visitCount: 0 }
    nodeMap.set(ev.nodeId, {
      totalDwellMs:       existing.totalDwellMs + ev.dwellMs,
      totalInteractions:  existing.totalInteractions + ev.interactionCount,
      visitCount:         existing.visitCount + 1,
    })
  }

  const heatmap: HeatmapData = {}
  for (const [nodeId, agg] of nodeMap) {
    heatmap[nodeId] = computeEngagementScore({
      dwellMs:          agg.totalDwellMs / agg.visitCount,
      interactionCount: agg.totalInteractions / agg.visitCount,
      revisited:        agg.visitCount > 1,
    })
  }
  return heatmap
}

export function normaliseHeatmap(heatmap: HeatmapData): HeatmapData {
  const values = Object.values(heatmap)
  if (values.length === 0) return heatmap
  const max = Math.max(...values)
  if (max === 0) return heatmap
  return Object.fromEntries(Object.entries(heatmap).map(([k, v]) => [k, v / max]))
}
