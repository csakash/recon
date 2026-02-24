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

  // Insert into SQLite
  const dbInstance = getDb()
  dbInstance.prepare(`
    INSERT INTO sessions (id, name, url, duration, status, start_time)
    VALUES (?, ?, ?, '', 'recording', ?)
  `).run(meta.id, meta.name, meta.url, meta.startTime)

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

  // Update SQLite
  const dbInstance = getDb()
  dbInstance.prepare(`
    UPDATE sessions SET
      duration = ?, status = ?, end_time = ?,
      network_count = ?, console_count = ?, interaction_count = ?
    WHERE id = ?
  `).run(
    data.duration, data.status, data.endTime,
    data.network.length, data.console.length, data.interactions.length,
    sessionId
  )
}

export function listSessions(): SessionMeta[] {
  const dbInstance = getDb()
  const rows = dbInstance.prepare(`
    SELECT id, name, url, duration, status, start_time as startTime,
           end_time as endTime, network_count as networkCount,
           console_count as consoleCount, interaction_count as interactionCount
    FROM sessions ORDER BY start_time DESC
  `).all() as SessionMeta[]
  return rows
}

export async function loadSessionData(sessionId: string): Promise<{
  network: any[]
  console: any[]
  interactions: any[]
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

  return {
    network: await readJsonSafe('network.json'),
    console: await readJsonSafe('console.json'),
    interactions: await readJsonSafe('interactions.json'),
    report: await readTextSafe('report.md'),
  }
}
