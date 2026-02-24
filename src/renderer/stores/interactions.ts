import { create } from 'zustand'

export interface InteractionEntry {
  id: string
  time: string
  action: string
  target: string
  selector: string
}

interface InteractionsState {
  entries: InteractionEntry[]
  addEntry: (entry: InteractionEntry) => void
  clear: () => void
  setEntries: (entries: InteractionEntry[]) => void
}

export const useInteractionsStore = create<InteractionsState>((set) => ({
  entries: [],
  addEntry: (entry) => set((s) => ({ entries: [...s.entries, entry] })),
  clear: () => set({ entries: [] }),
  setEntries: (entries) => set({ entries }),
}))
