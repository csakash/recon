import { WebContentsView, BrowserWindow, ipcMain } from 'electron'
import { NetworkCapture, CdpNetworkEntry } from '../cdp/network'
import { ConsoleCapture, CdpConsoleEntry } from '../cdp/console'
import { InteractionCapture, CdpInteractionEntry } from '../cdp/interactions'

let networkCapture: NetworkCapture | null = null
let consoleCapture: ConsoleCapture | null = null
let interactionCapture: InteractionCapture | null = null

export function setupCdpIpc(mainWindow: BrowserWindow, embeddedView: WebContentsView): void {
  const wc = embeddedView.webContents

  ipcMain.handle('cdp:start', async () => {
    try {
      networkCapture = new NetworkCapture(wc, (entry: CdpNetworkEntry) => {
        mainWindow.webContents.send('cdp:network-entry', entry)
      })

      consoleCapture = new ConsoleCapture(wc, (entry: CdpConsoleEntry) => {
        mainWindow.webContents.send('cdp:console-entry', entry)
      })

      interactionCapture = new InteractionCapture(wc, (entry: CdpInteractionEntry) => {
        mainWindow.webContents.send('cdp:interaction-entry', entry)
      })

      await networkCapture.start()
      await consoleCapture.start()
      await interactionCapture.start()

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('cdp:stop', async () => {
    try {
      await networkCapture?.stop()
      await consoleCapture?.stop()
      await interactionCapture?.stop()
      networkCapture = null
      consoleCapture = null
      interactionCapture = null

      // Detach debugger if still attached
      if (wc.debugger.isAttached()) {
        wc.debugger.detach()
      }

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}
