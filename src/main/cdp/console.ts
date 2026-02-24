import { WebContents } from 'electron'

export interface CdpConsoleEntry {
  id: string
  type: 'log' | 'warn' | 'error' | 'info'
  msg: string
  src: string
}

export class ConsoleCapture {
  private debugger: Electron.Debugger
  private onEntry: (entry: CdpConsoleEntry) => void
  private entryCount = 0

  constructor(webContents: WebContents, onEntry: (entry: CdpConsoleEntry) => void) {
    this.debugger = webContents.debugger
    this.onEntry = onEntry
  }

  async start(): Promise<void> {
    if (!this.debugger.isAttached()) {
      this.debugger.attach('1.3')
    }
    await this.debugger.sendCommand('Runtime.enable')
    await this.debugger.sendCommand('Log.enable')

    this.debugger.on('message', (_event, method, params) => {
      switch (method) {
        case 'Runtime.consoleAPICalled':
          this.handleConsoleAPI(params)
          break
        case 'Runtime.exceptionThrown':
          this.handleException(params)
          break
        case 'Log.entryAdded':
          this.handleLogEntry(params)
          break
      }
    })
  }

  async stop(): Promise<void> {
    try {
      await this.debugger.sendCommand('Runtime.disable')
      await this.debugger.sendCommand('Log.disable')
    } catch {}
  }

  private handleConsoleAPI(params: any): void {
    const { type, args, stackTrace } = params
    const level = this.mapLevel(type)
    const msg = args?.map((a: any) => a.value ?? a.description ?? '').join(' ') || ''

    let src = ''
    if (stackTrace?.callFrames?.length > 0) {
      const frame = stackTrace.callFrames[0]
      const fileName = frame.url?.split('/').pop() || frame.url || ''
      src = `${fileName}:${frame.lineNumber + 1}`
    }

    this.onEntry({
      id: `con-${++this.entryCount}`,
      type: level,
      msg,
      src,
    })
  }

  private handleException(params: any): void {
    const { exceptionDetails } = params
    const msg = exceptionDetails?.exception?.description ||
      exceptionDetails?.text || 'Unknown error'

    let src = ''
    if (exceptionDetails?.url) {
      const fileName = exceptionDetails.url.split('/').pop() || ''
      src = `${fileName}:${exceptionDetails.lineNumber + 1}`
    }

    this.onEntry({
      id: `con-${++this.entryCount}`,
      type: 'error',
      msg,
      src,
    })
  }

  private handleLogEntry(params: any): void {
    const { entry } = params
    this.onEntry({
      id: `con-${++this.entryCount}`,
      type: this.mapLevel(entry.level),
      msg: entry.text || '',
      src: entry.url ? `${entry.url.split('/').pop()}:${entry.lineNumber}` : '',
    })
  }

  private mapLevel(type: string): CdpConsoleEntry['type'] {
    switch (type) {
      case 'error': return 'error'
      case 'warning':
      case 'warn': return 'warn'
      case 'info': return 'info'
      default: return 'log'
    }
  }
}
