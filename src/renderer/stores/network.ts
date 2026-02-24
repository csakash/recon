import { create } from 'zustand'

export interface NetworkEntry {
  id: string
  method: string
  url: string
  status: number
  time: string
  size: string
  type: string
}

interface NetworkState {
  entries: NetworkEntry[]
  addEntry: (entry: NetworkEntry) => void
  clear: () => void
  setEntries: (entries: NetworkEntry[]) => void
}

export const useNetworkStore = create<NetworkState>((set) => ({
  entries: [],
  addEntry: (entry) => set((s) => ({ entries: [...s.entries, entry] })),
  clear: () => set({ entries: [] }),
  setEntries: (entries) => set({ entries }),
}))
