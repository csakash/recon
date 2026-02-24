import { create } from 'zustand'

export interface Session {
  id: string
  name: string
  duration: string
  url: string
  status: 'recording' | 'processing' | 'complete'
}

interface SessionsState {
  sessions: Session[]
  activeSessionId: string | null
  setSessions: (sessions: Session[]) => void
  addSession: (session: Session) => void
  setActive: (id: string | null) => void
  updateSession: (id: string, updates: Partial<Session>) => void
}

export const useSessionsStore = create<SessionsState>((set) => ({
  sessions: [
    { id: '1', name: 'Login flow broken', duration: '2m 34s', url: 'app.acme.io/login', status: 'complete' },
    { id: '2', name: 'Cart not updating', duration: '1m 12s', url: 'app.acme.io/cart', status: 'complete' },
    { id: '3', name: 'Dashboard latency', duration: '3m 08s', url: 'localhost:3000/dash', status: 'complete' },
  ],
  activeSessionId: null,
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((s) => ({ sessions: [session, ...s.sessions] })),
  setActive: (id) => set({ activeSessionId: id }),
  updateSession: (id, updates) => set((s) => ({
    sessions: s.sessions.map((sess) => sess.id === id ? { ...sess, ...updates } : sess)
  })),
}))
