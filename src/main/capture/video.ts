import { WebContents } from 'electron'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export class VideoCapture {
  private webContents: WebContents
  private frames: Buffer[] = []
  private interval: ReturnType<typeof setInterval> | null = null
  private fps: number

  constructor(webContents: WebContents, fps = 10) {
    this.webContents = webContents
    this.fps = fps
  }

  start(): void {
    this.frames = []
    this.interval = setInterval(async () => {
      try {
        const image = await this.webContents.capturePage()
        if (!image.isEmpty()) {
          this.frames.push(image.toPNG())
        }
      } catch {
        // Page might be navigating
      }
    }, 1000 / this.fps)
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  async saveFrames(sessionDir: string): Promise<string> {
    const framesDir = join(sessionDir, 'frames')
    await mkdir(framesDir, { recursive: true })

    // Save individual frames as PNGs (can be encoded to WebM with ffmpeg later)
    for (let i = 0; i < this.frames.length; i++) {
      await writeFile(join(framesDir, `frame-${String(i).padStart(5, '0')}.png`), this.frames[i])
    }

    return framesDir
  }

  getFrameCount(): number {
    return this.frames.length
  }
}
