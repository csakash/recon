import { ipcMain } from 'electron'
import { createSession, finalizeSession, listSessions, loadSessionData } from '../sessions/storage'

export function setupSessionIpc(): void {
  ipcMain.handle('session:create', async (_event, meta) => {
    try {
      const dir = await createSession(meta)
      return { success: true, dir, id: meta.id }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('session:finalize', async (_event, sessionId, data) => {
    try {
      await finalizeSession(sessionId, data)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('session:list', async () => {
    try {
      return { success: true, sessions: listSessions() }
    } catch (err: any) {
      return { success: false, error: err.message, sessions: [] }
    }
  })

  ipcMain.handle('session:load', async (_event, sessionId) => {
    try {
      const data = await loadSessionData(sessionId)
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}
