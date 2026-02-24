import { create } from 'zustand'

interface BrowserState {
  url: string
  setUrl: (url: string) => void
}

export const useBrowserStore = create<BrowserState>((set) => ({
  url: '',
  setUrl: (url) => set({ url }),
}))
