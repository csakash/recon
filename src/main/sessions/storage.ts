import { app } from 'electron'
import { mkdir, writeFile, readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import Database from 'better-sqlite3'

export interface SessionMeta {
  id: string
  name: string
  url: string
  duration: string
  status: 'recording' | 'processing' | 'complete'
  startTime: number
  endTime?: number
  networkCount?: number
  consoleCount?: number
  interactionCount?: number
}

const RECON_DIR = join(app.getPath('home'), '.recon')
const SESSIONS_DIR = join(RECON_DIR, 'sessions')
const DB_PATH = join(RECON_DIR, 'recon.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    if (!existsSync(RECON_DIR)) {
      require('fs').mkdirSync(RECON_DIR, { recursive: true })
    }
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL DEFAULT '',
        duration TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'recording',
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        network_count INTEGER DEFAULT 0,
        console_count INTEGER DEFAULT 0,
        interaction_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `)
  }
  return db
}

export function getSessionDir(sessionId: string): string {
  return join(SESSIONS_DIR, sessionId)
}

export async function createSession(meta: SessionMeta): Promise<string> {
  const sessionDir = getSessionDir(meta.id)
  await mkdir(sessionDir, { recursive: true })

  // Save meta.json
  await writeFile(join(sessionDir, 'meta.json'), JSON.stringify(meta, null, 2))

  // Insert into SQLite (non-critical — session dir is the source of truth)
  try {
    const dbInstance = getDb()
    dbInstance.prepare(`
      INSERT OR REPLACE INTO sessions (id, name, url, duration, status, start_time)
      VALUES (?, ?, ?, '', 'recording', ?)
    `).run(meta.id, meta.name, meta.url || '', meta.startTime)
  } catch (err) {
    console.error('SQLite insert failed (non-critical):', err)
  }

  return sessionDir
}

export async function finalizeSession(
  sessionId: string,
  data: {
    duration: string
    status: string
    endTime: number
    network: any[]
    console: any[]
    interactions: any[]
  }
): Promise<void> {
  const sessionDir = getSessionDir(sessionId)

  // Save data files
  await writeFile(join(sessionDir, 'network.json'), JSON.stringify(data.network, null, 2))
  await writeFile(join(sessionDir, 'console.json'), JSON.stringify(data.console, null, 2))
  await writeFile(join(sessionDir, 'interactions.json'), JSON.stringify(data.interactions, null, 2))

  // Update meta.json
  const metaPath = join(sessionDir, 'meta.json')
  const meta = JSON.parse(await readFile(metaPath, 'utf-8'))
  Object.assign(meta, {
    duration: data.duration,
    status: data.status,
    endTime: data.endTime,
    networkCount: data.network.length,
    consoleCount: data.console.length,
    interactionCount: data.interactions.length,
  })
  await writeFile(metaPath, JSON.stringify(meta, null, 2))

  // Update SQLite (non-critical)
  try {
    const dbInstance = getDb()
    dbInstance.prepare(`
      INSERT OR REPLACE INTO sessions (id, name, url, duration, status, start_time, end_time, network_count, console_count, interaction_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sessionId, meta.name, meta.url || '', data.duration, data.status,
      meta.startTime, data.endTime,
      data.network.length, data.console.length, data.interactions.length
    )
  } catch (err) {
    console.error('SQLite update failed (non-critical):', err)
  }
}

export function listSessions(): SessionMeta[] {
  try {
    const dbInstance = getDb()
    const rows = dbInstance.prepare(`
      SELECT id, name, url, duration, status, start_time as startTime,
             end_time as endTime, network_count as networkCount,
             console_count as consoleCount, interaction_count as interactionCount
      FROM sessions ORDER BY start_time DESC
    `).all() as SessionMeta[]
    return rows
  } catch (err) {
    console.error('SQLite list failed, falling back to filesystem:', err)
    return listSessionsFromFilesystem()
  }
}

function listSessionsFromFilesystem(): SessionMeta[] {
  try {
    if (!existsSync(SESSIONS_DIR)) return []
    const dirs = require('fs').readdirSync(SESSIONS_DIR) as string[]
    const sessions: SessionMeta[] = []
    for (const dir of dirs) {
      const metaPath = join(SESSIONS_DIR, dir, 'meta.json')
      if (existsSync(metaPath)) {
        try {
          const meta = JSON.parse(require('fs').readFileSync(metaPath, 'utf-8'))
          sessions.push(meta)
        } catch { /* skip corrupted */ }
      }
    }
    return sessions.sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
  } catch {
    return []
  }
}

export async function loadSessionData(sessionId: string): Promise<{
  meta: SessionMeta | null
  network: any[]
  console: any[]
  interactions: any[]
  frameCount: number
  report?: string
} | null> {
  const sessionDir = getSessionDir(sessionId)
  if (!existsSync(sessionDir)) return null

  const readJsonSafe = async (file: string) => {
    try {
      return JSON.parse(await readFile(join(sessionDir, file), 'utf-8'))
    } catch {
      return []
    }
  }

  const readTextSafe = async (file: string) => {
    try {
      return await readFile(join(sessionDir, file), 'utf-8')
    } catch {
      return undefined
    }
  }

  // Count frames
  let frameCount = 0
  const framesDir = join(sessionDir, 'frames')
  if (existsSync(framesDir)) {
    const files = await readdir(framesDir)
    frameCount = files.filter((f) => f.endsWith('.png')).length
  }

  return {
    meta: await readJsonSafe('meta.json').catch(() => null),
    network: await readJsonSafe('network.json'),
    console: await readJsonSafe('console.json'),
    interactions: await readJsonSafe('interactions.json'),
    frameCount,
    report: await readTextSafe('report.md'),
  }
}

export function getSessionsDir(): string {
  return SESSIONS_DIR
}
