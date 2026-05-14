import { useEffect } from 'react'
import type { TourNode } from '../types/location'

const PREFETCHED = new Set<string>()

/**
 * Predictive prefetch of likely-next panoramas.
 *
 * Picks targets by:
 *   1. `targetNodeId` on hotspots (navigation hotspots)
 *   2. fallback: `connectedNodes` IDs
 *
 * For each, injects a <link rel="prefetch"> so the browser warms its HTTP cache
 * ahead of the user clicking the navigation arrow. Idempotent — each URL is
 * prefetched at most once per page lifetime.
 */
export function usePanoramaPrefetch(
  currentNode:    TourNode | null | undefined,
  allNodes:       TourNode[] | undefined,
  nodeImages:     Map<string, string>,
): void {
  useEffect(() => {
    if (!currentNode || !allNodes || nodeImages.size === 0) return

    // Pull candidate next node IDs (hotspot targets + connectedNodes).
    const candidateIds = new Set<string>()
    for (const hs of currentNode.hotspots) {
      if (hs.type === 'navigation' && hs.targetNodeId) candidateIds.add(hs.targetNodeId)
    }
    for (const id of currentNode.connectedNodes) candidateIds.add(id)
    candidateIds.delete(currentNode.id)

    // Inject prefetch links (idempotent)
    const created: HTMLLinkElement[] = []
    for (const id of candidateIds) {
      const url = nodeImages.get(id)
      if (!url || PREFETCHED.has(url)) continue
      PREFETCHED.add(url)
      const link = document.createElement('link')
      link.rel  = 'prefetch'
      link.as   = 'image'
      link.href = url
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
      created.push(link)
    }

    // Created links stay in <head> — leaving them is harmless and lets the
    // browser cache survive node-to-node React re-renders.
    return () => {
      // No cleanup — prefetch hints are write-once.
      void created
    }
  }, [currentNode, allNodes, nodeImages])
}
