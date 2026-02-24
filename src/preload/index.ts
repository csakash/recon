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
}

contextBridge.exposeInMainWorld('recon', api)
