import { create } from 'zustand'
import { DevicePreset } from '../constants/devicePresets'

interface BrowserState {
  url: string
  setUrl: (url: string) => void
  selectedDevice: DevicePreset | null
  isRotated: boolean
  setDevice: (preset: DevicePreset | null) => void
  toggleRotation: () => void
}

export const useBrowserStore = create<BrowserState>((set) => ({
  url: '',
  setUrl: (url) => set({ url }),
  selectedDevice: null,
  isRotated: false,
  setDevice: (preset) => set({ selectedDevice: preset, isRotated: false }),
  toggleRotation: () => set((s) => ({ isRotated: !s.isRotated })),
}))
