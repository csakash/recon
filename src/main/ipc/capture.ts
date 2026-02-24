import { WebContentsView, BrowserWindow, ipcMain } from 'electron'
import { VideoCapture } from '../capture/video'
import { AudioCapture } from '../capture/audio'

let videoCapture: VideoCapture | null = null
let audioCapture: AudioCapture | null = null

export function setupCaptureIpc(mainWindow: BrowserWindow, embeddedView: WebContentsView): void {
  audioCapture = new AudioCapture(mainWindow)
  audioCapture.setup()

  ipcMain.handle('capture:start-video', async () => {
    try {
      videoCapture = new VideoCapture(embeddedView.webContents)
      videoCapture.start()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('capture:stop-video', async () => {
    try {
      videoCapture?.stop()
      return { success: true, frameCount: videoCapture?.getFrameCount() || 0 }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('capture:save-video', async (_event, sessionDir: string) => {
    try {
      if (videoCapture) {
        const framesDir = await videoCapture.saveFrames(sessionDir)
        return { success: true, framesDir }
      }
      return { success: false, error: 'No video capture' }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('capture:start-audio', async () => {
    try {
      audioCapture?.start()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('capture:stop-audio', async () => {
    try {
      audioCapture?.stop()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('capture:save-audio', async (_event, sessionDir: string) => {
    try {
      const path = await audioCapture?.save(sessionDir)
      return { success: true, path }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}
