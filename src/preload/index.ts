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
  showBrowserView: () => void
  hideBrowserView: () => void

  // CDP capture
  cdpStart: () => Promise<{ success: boolean; error?: string }>
  cdpStop: () => Promise<{ success: boolean; error?: string }>
  onNetworkEntry: (callback: (entry: any) => void) => () => void
  onConsoleEntry: (callback: (entry: any) => void) => () => void
  onInteractionEntry: (callback: (entry: any) => void) => () => void
  onCdpClear: (callback: () => void) => () => void

  // Session management
  sessionCreate: (meta: any) => Promise<{ success: boolean; dir?: string; id?: string }>
  sessionFinalize: (sessionId: string, data: any) => Promise<{ success: boolean }>
  sessionList: () => Promise<{ success: boolean; sessions: any[] }>
  sessionLoad: (sessionId: string) => Promise<{ success: boolean; data: any }>

  // Capture
  captureStartVideo: () => Promise<{ success: boolean }>
  captureStopVideo: () => Promise<{ success: boolean; frameCount?: number }>
  captureSaveVideo: (sessionDir: string) => Promise<{ success: boolean; framesDir?: string }>
  captureStartAudio: () => Promise<{ success: boolean }>
  captureStopAudio: () => Promise<{ success: boolean }>
  captureSaveAudio: (sessionDir: string) => Promise<{ success: boolean; path?: string }>

  // Audio chunk sending (renderer → main)
  sendAudioChunk: (chunk: ArrayBuffer) => void
  sendAudioStopped: () => void
  onAudioStart: (callback: () => void) => () => void
  onAudioStop: (callback: () => void) => () => void

  // AI
  aiConfigure: (config: { provider: string; apiKey?: string; model?: string; command?: string }) => Promise<{ success: boolean }>
  aiAnalyze: (sessionData: any) => Promise<{ success: boolean; report?: string }>
  aiChat: (message: string, context: string) => Promise<{ success: boolean }>
  onAiMessage: (callback: (msg: { role: string; text: string }) => void) => () => void
  onAiToken: (callback: (token: string) => void) => () => void
  onAiAgentStatus: (callback: (status: { name: string; status: string }) => void) => () => void
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
  showBrowserView: () => ipcRenderer.send('browser-view-show'),
  hideBrowserView: () => ipcRenderer.send('browser-view-hide'),

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
  onCdpClear: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('cdp:clear', handler)
    return () => ipcRenderer.removeListener('cdp:clear', handler)
  },

  // Session management
  sessionCreate: (meta) => ipcRenderer.invoke('session:create', meta),
  sessionFinalize: (sessionId, data) => ipcRenderer.invoke('session:finalize', sessionId, data),
  sessionList: () => ipcRenderer.invoke('session:list'),
  sessionLoad: (sessionId) => ipcRenderer.invoke('session:load', sessionId),

  // Capture
  captureStartVideo: () => ipcRenderer.invoke('capture:start-video'),
  captureStopVideo: () => ipcRenderer.invoke('capture:stop-video'),
  captureSaveVideo: (sessionDir) => ipcRenderer.invoke('capture:save-video', sessionDir),
  captureStartAudio: () => ipcRenderer.invoke('capture:start-audio'),
  captureStopAudio: () => ipcRenderer.invoke('capture:stop-audio'),
  captureSaveAudio: (sessionDir) => ipcRenderer.invoke('capture:save-audio', sessionDir),

  // Audio chunk sending
  sendAudioChunk: (chunk) => ipcRenderer.send('audio:chunk', chunk),
  sendAudioStopped: () => ipcRenderer.send('audio:stopped'),
  onAudioStart: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('audio:start', handler)
    return () => ipcRenderer.removeListener('audio:start', handler)
  },
  onAudioStop: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('audio:stop', handler)
    return () => ipcRenderer.removeListener('audio:stop', handler)
  },

  // AI
  aiConfigure: (config) => ipcRenderer.invoke('ai:configure', config),
  aiAnalyze: (sessionData) => ipcRenderer.invoke('ai:analyze', sessionData),
  aiChat: (message, context) => ipcRenderer.invoke('ai:chat', message, context),
  onAiMessage: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, msg: any) => callback(msg)
    ipcRenderer.on('ai:message', handler)
    return () => ipcRenderer.removeListener('ai:message', handler)
  },
  onAiToken: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, token: string) => callback(token)
    ipcRenderer.on('ai:token', handler)
    return () => ipcRenderer.removeListener('ai:token', handler)
  },
  onAiAgentStatus: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, status: any) => callback(status)
    ipcRenderer.on('ai:agent-status', handler)
    return () => ipcRenderer.removeListener('ai:agent-status', handler)
  },
}

contextBridge.exposeInMainWorld('recon', api)
