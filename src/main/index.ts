import { app, BrowserWindow, WebContentsView, ipcMain, shell, protocol, net } from 'electron'
import { join } from 'path'
import { readFileSync, existsSync } from 'fs'
import { setupCdpIpc } from './ipc/cdp'
import { setupSessionIpc } from './ipc/sessions'
import { setupCaptureIpc } from './ipc/capture'
import { setupAiIpc } from './ipc/ai'
import { getSessionsDir } from './sessions/storage'

let mainWindow: BrowserWindow | null = null
let embeddedView: WebContentsView | null = null

// Register custom protocol scheme before app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'recon-session', privileges: { bypassCSP: true, supportFetchAPI: true, standard: true } }
])

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 22 },
    backgroundColor: '#0c0c0e',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Create WebContentsView for the embedded browser
  embeddedView = new WebContentsView({
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  mainWindow.contentView.addChildView(embeddedView)

  // Handle embedded browser bounds from renderer
  ipcMain.on('browser-gap-bounds', (_event, bounds: { x: number; y: number; width: number; height: number }) => {
    if (embeddedView) {
      embeddedView.setBounds(bounds)
    }
  })

  // Show/hide embedded browser (for switching between live browser and session replay)
  ipcMain.on('browser-view-show', () => {
    if (embeddedView && mainWindow) {
      mainWindow.contentView.addChildView(embeddedView)
    }
  })
  ipcMain.on('browser-view-hide', () => {
    if (embeddedView && mainWindow) {
      mainWindow.contentView.removeChildView(embeddedView)
    }
  })

  // Navigation controls
  ipcMain.on('browser-navigate', (_event, url: string) => {
    if (embeddedView) {
      let fullUrl = url
      if (url !== 'about:blank' && !url.startsWith('http://') && !url.startsWith('https://')) {
        fullUrl = `https://${url}`
      }
      embeddedView.webContents.loadURL(fullUrl).catch((err) => {
        console.error('Failed to load URL:', err.message)
      })
    }
  })

  ipcMain.on('browser-go-back', () => {
    if (embeddedView?.webContents.canGoBack()) embeddedView.webContents.goBack()
  })

  ipcMain.on('browser-go-forward', () => {
    if (embeddedView?.webContents.canGoForward()) embeddedView.webContents.goForward()
  })

  ipcMain.on('browser-reload', () => {
    embeddedView?.webContents.reload()
  })

  // Sync URL changes from embedded browser back to renderer
  embeddedView.webContents.on('did-navigate', (_event, url) => {
    mainWindow?.webContents.send('browser-url-changed', url)
  })
  embeddedView.webContents.on('did-navigate-in-page', (_event, url) => {
    mainWindow?.webContents.send('browser-url-changed', url)
  })

  // Sync page title
  embeddedView.webContents.on('page-title-updated', (_event, title) => {
    mainWindow?.webContents.send('browser-title-changed', title)
  })

  // Handle loading states
  embeddedView.webContents.on('did-start-loading', () => {
    mainWindow?.webContents.send('browser-loading', true)
  })
  embeddedView.webContents.on('did-stop-loading', () => {
    mainWindow?.webContents.send('browser-loading', false)
  })

  // Open new windows (target=_blank etc) inside the same view
  embeddedView.webContents.setWindowOpenHandler(({ url }) => {
    // Load in the same embedded browser instead of opening externally
    embeddedView?.webContents.loadURL(url)
    return { action: 'deny' }
  })

  // Wire up CDP IPC (pass the WebContentsView)
  setupCdpIpc(mainWindow, embeddedView)

  // Wire up session and capture IPC
  setupSessionIpc()
  setupCaptureIpc(mainWindow, embeddedView)

  // Wire up AI IPC
  setupAiIpc(mainWindow)

  // Load renderer UI
  if (process.env.NODE_ENV === 'development' && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Load a default page in the embedded browser
  embeddedView.webContents.loadURL('https://google.com')

  mainWindow.on('closed', () => {
    mainWindow = null
    embeddedView = null
  })
}

app.whenReady().then(() => {
  // Register custom protocol to serve session frame files
  protocol.handle('recon-session', (request) => {
    try {
      const url = new URL(request.url)
      // URL format: recon-session://sessionId/frames/frame-00000.png
      const sessionId = url.hostname
      const filePath = join(getSessionsDir(), sessionId, url.pathname)

      if (!existsSync(filePath)) {
        return new Response('Not found', { status: 404 })
      }

      const data = readFileSync(filePath)
      const ext = filePath.split('.').pop()?.toLowerCase()
      const mimeTypes: Record<string, string> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        webm: 'video/webm',
        json: 'application/json',
      }
      return new Response(data, {
        headers: { 'Content-Type': mimeTypes[ext || ''] || 'application/octet-stream' }
      })
    } catch (err) {
      console.error('Protocol handler error:', err)
      return new Response('Error', { status: 500 })
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
