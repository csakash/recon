import { app, BrowserWindow, BrowserView, ipcMain, shell } from 'electron'
import { join } from 'path'

let mainWindow: BrowserWindow | null = null
let browserView: BrowserView | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 14 },
    backgroundColor: '#0c0c0e',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Create BrowserView for embedded browser
  browserView = new BrowserView({
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  mainWindow.addBrowserView(browserView)

  // Handle BrowserView bounds from renderer
  ipcMain.on('browser-gap-bounds', (_event, bounds: { x: number; y: number; width: number; height: number }) => {
    if (browserView && mainWindow) {
      browserView.setBounds(bounds)
      browserView.setAutoResize({ width: false, height: false })
    }
  })

  // Navigation controls
  ipcMain.on('browser-navigate', (_event, url: string) => {
    if (browserView) {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`
      browserView.webContents.loadURL(fullUrl).catch(() => {})
    }
  })

  ipcMain.on('browser-go-back', () => {
    if (browserView?.webContents.canGoBack()) browserView.webContents.goBack()
  })

  ipcMain.on('browser-go-forward', () => {
    if (browserView?.webContents.canGoForward()) browserView.webContents.goForward()
  })

  ipcMain.on('browser-reload', () => {
    browserView?.webContents.reload()
  })

  // Sync URL changes from BrowserView back to renderer
  browserView.webContents.on('did-navigate', (_event, url) => {
    mainWindow?.webContents.send('browser-url-changed', url)
  })
  browserView.webContents.on('did-navigate-in-page', (_event, url) => {
    mainWindow?.webContents.send('browser-url-changed', url)
  })

  // Open external links in default browser
  browserView.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Load renderer
  if (process.env.NODE_ENV === 'development' && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
    browserView = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
