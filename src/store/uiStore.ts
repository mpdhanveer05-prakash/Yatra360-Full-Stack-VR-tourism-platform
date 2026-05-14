import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarOpen:   boolean
  guidePanelOpen: boolean
  heatmapVisible: boolean
  statsVisible:   boolean
  searchQuery:    string

  // Narration prefs (persisted)
  narrationEnabled: boolean
  narrationLang:    string   // BCP-47, e.g. "en-IN"
  narrationRate:    number   // 0.5–2.0

  // Ambient audio prefs (persisted)
  ambientEnabled: boolean
  ambientVolume:  number   // 0–1

  // Accessibility prefs (persisted)
  highContrast:  boolean
  reduceMotion:  boolean

  toggleSidebar:    () => void
  toggleGuidePanel: () => void
  toggleHeatmap:    () => void
  setSearchQuery:   (q: string) => void
  setSidebarOpen:   (v: boolean) => void
  setGuidePanelOpen:(v: boolean) => void

  setNarrationEnabled: (v: boolean) => void
  setNarrationLang:    (lang: string) => void
  setNarrationRate:    (rate: number) => void

  setAmbientEnabled: (v: boolean) => void
  setAmbientVolume:  (v: number) => void

  setHighContrast: (v: boolean) => void
  setReduceMotion: (v: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen:    false,
      guidePanelOpen: false,
      heatmapVisible: true,
      statsVisible:   true,
      searchQuery:    '',

      narrationEnabled: false,
      narrationLang:    'en-IN',
      narrationRate:    1.0,

      ambientEnabled: false,
      ambientVolume:  0.35,

      highContrast: false,
      reduceMotion: false,

      toggleSidebar:    () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
      toggleGuidePanel: () => set(s => ({ guidePanelOpen: !s.guidePanelOpen })),
      toggleHeatmap:    () => set(s => ({ heatmapVisible: !s.heatmapVisible })),
      setSearchQuery:   (q) => set({ searchQuery: q }),
      setSidebarOpen:   (v) => set({ sidebarOpen: v }),
      setGuidePanelOpen:(v) => set({ guidePanelOpen: v }),

      setNarrationEnabled: (v) => set({ narrationEnabled: v }),
      setNarrationLang:    (lang) => set({ narrationLang: lang }),
      setNarrationRate:    (rate) => set({ narrationRate: rate }),

      setAmbientEnabled: (v) => set({ ambientEnabled: v }),
      setAmbientVolume:  (v) => set({ ambientVolume:  v }),

      setHighContrast: (v) => set({ highContrast: v }),
      setReduceMotion: (v) => set({ reduceMotion: v }),
    }),
    {
      name: 'yatra360-ui',
      partialize: (s) => ({
        narrationEnabled: s.narrationEnabled,
        narrationLang:    s.narrationLang,
        narrationRate:    s.narrationRate,
        ambientEnabled:   s.ambientEnabled,
        ambientVolume:    s.ambientVolume,
        highContrast:     s.highContrast,
        reduceMotion:     s.reduceMotion,
      }),
    },
  ),
)
