import { create } from 'zustand'
import type { Recommendation, HeatmapData } from '../types/ai'

interface Message {
  role:    'user' | 'assistant'
  content: string
  ts:      number
}

interface AIState {
  recommendations:     Recommendation[]
  heatmap:             HeatmapData
  guideMessages:       Message[]
  isLoadingRecs:       boolean
  isLoadingGuide:      boolean
  lastRecsLocationId:  string | null

  setRecommendations:     (recs: Recommendation[]) => void
  setHeatmap:             (hm: HeatmapData) => void
  addGuideMessage:        (msg: Omit<Message, 'ts'>) => void
  setGuideMessages:       (msgs: Message[]) => void
  clearGuideMessages:     () => void
  setLoadingRecs:         (v: boolean) => void
  setLoadingGuide:        (v: boolean) => void
  setLastRecsLocationId:  (id: string) => void
}

export const useAIStore = create<AIState>((set) => ({
  recommendations:    [],
  heatmap:            {},
  guideMessages:      [],
  isLoadingRecs:      false,
  isLoadingGuide:     false,
  lastRecsLocationId: null,

  setRecommendations:    (recs) => set({ recommendations: recs }),
  setHeatmap:            (hm)   => set({ heatmap: hm }),
  addGuideMessage:       (msg)  => set(s => ({ guideMessages: [...s.guideMessages, { ...msg, ts: Date.now() }] })),
  setGuideMessages:      (msgs) => set({ guideMessages: msgs }),
  clearGuideMessages:    ()     => set({ guideMessages: [] }),
  setLoadingRecs:        (v)    => set({ isLoadingRecs: v }),
  setLoadingGuide:       (v)    => set({ isLoadingGuide: v }),
  setLastRecsLocationId: (id)   => set({ lastRecsLocationId: id }),
}))
