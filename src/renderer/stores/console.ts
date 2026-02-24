import { create } from 'zustand'

export interface ConsoleEntry {
  id: string
  type: 'log' | 'warn' | 'error' | 'info'
  msg: string
  src: string
  ts: number
}

interface ConsoleState {
  entries: ConsoleEntry[]
  addEntry: (entry: ConsoleEntry) => void
  clear: () => void
  setEntries: (entries: ConsoleEntry[]) => void
}

export const useConsoleStore = create<ConsoleState>((set) => ({
  entries: [],
  addEntry: (entry) => set((s) => ({ entries: [...s.entries, entry] })),
  clear: () => set({ entries: [] }),
  setEntries: (entries) => set({ entries }),
}))
