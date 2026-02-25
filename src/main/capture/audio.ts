import { ipcMain, BrowserWindow, systemPreferences } from 'electron'
import { writeFile } from 'fs/promises'
import { join } from 'path'

/**
 * Audio capture happens in the renderer process (MediaRecorder).
 * This module handles receiving audio chunks from the renderer and
 * saving them to disk.
 */
export class AudioCapture {
  private chunks: Buffer[] = []
  private mainWindow: BrowserWindow
  private stopResolve: (() => void) | null = null

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
  }

  setup(): void {
    ipcMain.on('audio:chunk', (_event, chunk: ArrayBuffer) => {
      this.chunks.push(Buffer.from(chunk))
    })

    // Renderer signals that MediaRecorder has fully stopped
    ipcMain.on('audio:stopped', () => {
      if (this.stopResolve) {
        this.stopResolve()
        this.stopResolve = null
      }
    })
  }

  async start(): Promise<void> {
    this.chunks = []

    // Request microphone permission on macOS before the renderer tries getUserMedia
    if (process.platform === 'darwin') {
      const status = systemPreferences.getMediaAccessStatus('microphone')
      if (status !== 'granted') {
        await systemPreferences.askForMediaAccess('microphone')
      }
    }

    this.mainWindow.webContents.send('audio:start')
  }

  async stop(): Promise<void> {
    // Wait for the renderer to confirm MediaRecorder has stopped and flushed all chunks
    const stopped = new Promise<void>((resolve) => {
      this.stopResolve = resolve
      // Timeout fallback so we never hang forever
      setTimeout(resolve, 2000)
    })
    this.mainWindow.webContents.send('audio:stop')
    await stopped
  }

  async save(sessionDir: string): Promise<string | null> {
    if (this.chunks.length === 0) return null
    const audioPath = join(sessionDir, 'audio.webm')
    await writeFile(audioPath, Buffer.concat(this.chunks))
    this.chunks = []
    return audioPath
  }

  cleanup(): void {
    ipcMain.removeAllListeners('audio:chunk')
    ipcMain.removeAllListeners('audio:stopped')
  }
}
