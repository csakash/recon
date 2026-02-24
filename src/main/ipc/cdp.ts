import { WebContentsView, BrowserWindow, ipcMain } from 'electron'
import { NetworkCapture, CdpNetworkEntry } from '../cdp/network'
import { ConsoleCapture, CdpConsoleEntry } from '../cdp/console'
import { InteractionCapture, CdpInteractionEntry } from '../cdp/interactions'

let networkCapture: NetworkCapture | null = null
let consoleCapture: ConsoleCapture | null = null
let interactionCapture: InteractionCapture | null = null
let cdpActive = false

export function setupCdpIpc(mainWindow: BrowserWindow, embeddedView: WebContentsView): void {
  const wc = embeddedView.webContents

  function createCaptures(): void {
    networkCapture = new NetworkCapture(wc, (entry: CdpNetworkEntry) => {
      mainWindow.webContents.send('cdp:network-entry', entry)
    })

    consoleCapture = new ConsoleCapture(wc, (entry: CdpConsoleEntry) => {
      mainWindow.webContents.send('cdp:console-entry', entry)
    })

    interactionCapture = new InteractionCapture(wc, (entry: CdpInteractionEntry) => {
      mainWindow.webContents.send('cdp:interaction-entry', entry)
    })
  }

  async function startCaptures(): Promise<void> {
    if (cdpActive) return
    createCaptures()
    await networkCapture!.start()
    await consoleCapture!.start()
    await interactionCapture!.start()
    cdpActive = true
  }

  async function stopCaptures(): Promise<void> {
    if (!cdpActive) return
    await networkCapture?.stop()
    await consoleCapture?.stop()
    await interactionCapture?.stop()
    if (wc.debugger.isAttached()) {
      wc.debugger.detach()
    }
    networkCapture = null
    consoleCapture = null
    interactionCapture = null
    cdpActive = false
  }

  // Auto-start CDP as soon as the embedded browser is ready
  // Use dom-ready which fires after the initial page's DOM is available
  // but the renderer IPC listeners may not be set up yet for early events.
  // We start capturing immediately so nothing is missed.
  wc.once('dom-ready', () => {
    startCaptures().catch((err) => {
      console.error('Failed to auto-start CDP:', err.message)
    })
  })

  // Also re-inject interaction script on navigation (addScriptToEvaluateOnNewDocument handles new docs)
  // but we need to ensure the debugger stays attached across navigations
  wc.on('did-start-navigation', () => {
    // Debugger stays attached across same-process navigations.
    // If it detached (e.g. crash), re-attach on next load.
  })

  // Explicit start/stop for recording sessions
  ipcMain.handle('cdp:start', async () => {
    try {
      if (cdpActive) {
        // Already running — just clear renderer stores via a signal
        mainWindow.webContents.send('cdp:clear')
        return { success: true }
      }
      await startCaptures()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('cdp:stop', async () => {
    try {
      await stopCaptures()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}
