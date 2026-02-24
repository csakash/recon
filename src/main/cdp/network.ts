import { WebContents } from 'electron'

export interface CdpNetworkEntry {
  id: string
  method: string
  url: string
  status: number
  time: string
  size: string
  type: string
  requestHeaders?: Record<string, string>
  responseHeaders?: Record<string, string>
  timing?: Record<string, number>
}

interface PendingRequest {
  requestId: string
  method: string
  url: string
  type: string
  timestamp: number
  wallTime: number
}

export class NetworkCapture {
  private debugger: Electron.Debugger
  private pending = new Map<string, PendingRequest>()
  private onEntry: (entry: CdpNetworkEntry) => void
  private entryCount = 0

  constructor(webContents: WebContents, onEntry: (entry: CdpNetworkEntry) => void) {
    this.debugger = webContents.debugger
    this.onEntry = onEntry
  }

  async start(): Promise<void> {
    if (!this.debugger.isAttached()) {
      this.debugger.attach('1.3')
    }
    await this.debugger.sendCommand('Network.enable')

    this.debugger.on('message', (_event, method, params) => {
      switch (method) {
        case 'Network.requestWillBeSent':
          this.handleRequest(params)
          break
        case 'Network.responseReceived':
          this.handleResponse(params)
          break
        case 'Network.loadingFailed':
          this.handleFailed(params)
          break
      }
    })
  }

  async stop(): Promise<void> {
    try {
      await this.debugger.sendCommand('Network.disable')
    } catch {}
    this.pending.clear()
  }

  private handleRequest(params: any): void {
    const { requestId, request, type, timestamp, wallTime } = params
    this.pending.set(requestId, {
      requestId,
      method: request.method,
      url: request.url,
      type: (type || 'other').toLowerCase(),
      timestamp,
      wallTime,
    })
  }

  private handleResponse(params: any): void {
    const { requestId, response } = params
    const req = this.pending.get(requestId)
    if (!req) return
    this.pending.delete(requestId)

    const elapsed = params.timestamp - req.timestamp
    const timeStr = elapsed > 1 ? `${elapsed.toFixed(1)}s` : `${Math.round(elapsed * 1000)}ms`

    const contentLength = response.headers?.['content-length'] || response.headers?.['Content-Length']
    const sizeStr = contentLength
      ? Number(contentLength) > 1024
        ? `${(Number(contentLength) / 1024).toFixed(1)} KB`
        : `${contentLength} B`
      : '—'

    // Extract path from URL for display
    let displayUrl: string
    try {
      const u = new URL(req.url)
      displayUrl = u.pathname + u.search
    } catch {
      displayUrl = req.url
    }

    this.onEntry({
      id: `net-${++this.entryCount}`,
      method: req.method,
      url: displayUrl,
      status: response.status,
      time: timeStr,
      size: sizeStr,
      type: req.type,
    })
  }

  private handleFailed(params: any): void {
    const { requestId, errorText } = params
    const req = this.pending.get(requestId)
    if (!req) return
    this.pending.delete(requestId)

    let displayUrl: string
    try {
      const u = new URL(req.url)
      displayUrl = u.pathname + u.search
    } catch {
      displayUrl = req.url
    }

    this.onEntry({
      id: `net-${++this.entryCount}`,
      method: req.method,
      url: displayUrl,
      status: 0,
      time: errorText || 'failed',
      size: '—',
      type: req.type,
    })
  }
}
