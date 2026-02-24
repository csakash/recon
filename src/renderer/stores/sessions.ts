import { create } from 'zustand'

export interface Session {
  id: string
  name: string
  duration: string
  url: string
  status: 'recording' | 'processing' | 'complete'
  startTime?: number
}

interface SessionsState {
  sessions: Session[]
  activeSessionId: string | null
  setSessions: (sessions: Session[]) => void
  addSession: (session: Session) => void
  setActive: (id: string | null) => void
  updateSession: (id: string, updates: Partial<Session>) => void
  loadSessions: () => Promise<void>
}

export const useSessionsStore = create<SessionsState>((set) => ({
  sessions: [],
  activeSessionId: null,
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((s) => ({ sessions: [session, ...s.sessions] })),
  setActive: (id) => set({ activeSessionId: id }),
  updateSession: (id, updates) => set((s) => ({
    sessions: s.sessions.map((sess) => sess.id === id ? { ...sess, ...updates } : sess)
  })),
  loadSessions: async () => {
    if (!window.recon) return
    const result = await window.recon.sessionList()
    if (result.success && result.sessions) {
      set({
        sessions: result.sessions.map((s: any) => ({
          id: s.id,
          name: s.name,
          duration: s.duration || '',
          url: s.url || '',
          status: s.status || 'complete',
          startTime: s.startTime,
        }))
      })
    }
  },
}))
