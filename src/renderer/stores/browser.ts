import { create } from 'zustand'

interface BrowserState {
  url: string
  setUrl: (url: string) => void
}

export const useBrowserStore = create<BrowserState>((set) => ({
  url: 'https://app.acme.io/cart',
  setUrl: (url) => set({ url }),
}))
