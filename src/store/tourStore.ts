import { create } from 'zustand'
import type { IndiaLocation, TourNode } from '../types/location'

interface TourState {
  activeLocation:    IndiaLocation | null
  currentNode:       TourNode | null
  navigationHistory: string[]   // node IDs visited this session
  isTransitioning:   boolean
  vrActive:          boolean

  setActiveLocation: (loc: IndiaLocation) => void
  setCurrentNode:    (node: TourNode) => void
  navigateTo:        (node: TourNode) => void
  setTransitioning:  (v: boolean) => void
  setVRActive:       (v: boolean) => void
  resetTour:         () => void
}

export const useTourStore = create<TourState>((set, get) => ({
  activeLocation:    null,
  currentNode:       null,
  navigationHistory: [],
  isTransitioning:   false,
  vrActive:          false,

  setActiveLocation: (loc) =>
    set({ activeLocation: loc, currentNode: loc.nodes[0] ?? null, navigationHistory: [] }),

  setCurrentNode: (node) =>
    set({ currentNode: node }),

  navigateTo: (node) => {
    const history = get().navigationHistory
    set({
      currentNode:       node,
      navigationHistory: [...history, node.id],
      isTransitioning:   true,
    })
  },

  setTransitioning: (v) => set({ isTransitioning: v }),
  setVRActive:      (v) => set({ vrActive: v }),

  resetTour: () =>
    set({ activeLocation: null, currentNode: null, navigationHistory: [], vrActive: false }),
}))
