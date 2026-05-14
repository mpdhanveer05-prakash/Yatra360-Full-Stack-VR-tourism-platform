import { create } from 'zustand'

interface TimeState {
  /** Era id for the current location, or 'now' if no slider activity. */
  currentEra: string

  setEra: (eraId: string) => void
  reset:  () => void
}

export const useTimeStore = create<TimeState>((set) => ({
  currentEra: 'now',
  setEra:     (eraId) => set({ currentEra: eraId }),
  reset:      () => set({ currentEra: 'now' }),
}))
