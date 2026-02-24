import { contextBridge, ipcRenderer } from 'electron'

export type ReconAPI = {
  // Browser navigation
  navigate: (url: string) => void
  goBack: () => void
  goForward: () => void
  reload: () => void
  onUrlChanged: (callback: (url: string) => void) => () => void

  // BrowserView positioning
  setBrowserGapBounds: (bounds: { x: number; y: number; width: number; height: number }) => void

  // CDP capture
  cdpStart: () => Promise<{ success: boolean; error?: string }>
  cdpStop: () => Promise<{ success: boolean; error?: string }>
  onNetworkEntry: (callback: (entry: any) => void) => () => void
  onConsoleEntry: (callback: (entry: any) => void) => () => void
  onInteractionEntry: (callback: (entry: any) => void) => () => void
}

const api: ReconAPI = {
  navigate: (url) => ipcRenderer.send('browser-navigate', url),
  goBack: () => ipcRenderer.send('browser-go-back'),
  goForward: () => ipcRenderer.send('browser-go-forward'),
  reload: () => ipcRenderer.send('browser-reload'),
  onUrlChanged: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, url: string) => callback(url)
    ipcRenderer.on('browser-url-changed', handler)
    return () => ipcRenderer.removeListener('browser-url-changed', handler)
  },

  setBrowserGapBounds: (bounds) => ipcRenderer.send('browser-gap-bounds', bounds),

  // CDP capture
  cdpStart: () => ipcRenderer.invoke('cdp:start'),
  cdpStop: () => ipcRenderer.invoke('cdp:stop'),
  onNetworkEntry: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, entry: any) => callback(entry)
    ipcRenderer.on('cdp:network-entry', handler)
    return () => ipcRenderer.removeListener('cdp:network-entry', handler)
  },
  onConsoleEntry: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, entry: any) => callback(entry)
    ipcRenderer.on('cdp:console-entry', handler)
    return () => ipcRenderer.removeListener('cdp:console-entry', handler)
  },
  onInteractionEntry: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, entry: any) => callback(entry)
    ipcRenderer.on('cdp:interaction-entry', handler)
    return () => ipcRenderer.removeListener('cdp:interaction-entry', handler)
  },
}

contextBridge.exposeInMainWorld('recon', api)
