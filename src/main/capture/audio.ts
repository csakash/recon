import { ipcMain, BrowserWindow } from 'electron'
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

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
  }

  setup(): void {
    ipcMain.on('audio:chunk', (_event, chunk: ArrayBuffer) => {
      this.chunks.push(Buffer.from(chunk))
    })
  }

  start(): void {
    this.chunks = []
    this.mainWindow.webContents.send('audio:start')
  }

  stop(): void {
    this.mainWindow.webContents.send('audio:stop')
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
  }
}
