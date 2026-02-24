import { create } from 'zustand'

export type RecordingStatus = 'idle' | 'recording' | 'processing' | 'complete'

interface RecordingState {
  status: RecordingStatus
  startTime: number | null
  elapsed: number
  micActive: boolean
  sessionId: string | null
  sessionDir: string | null

  startRecording: (sessionId: string, sessionDir: string) => void
  stopRecording: () => void
  setComplete: () => void
  toggleMic: () => void
  tick: () => void
}

export const useRecordingStore = create<RecordingState>((set) => ({
  status: 'idle',
  startTime: null,
  elapsed: 0,
  micActive: true,
  sessionId: null,
  sessionDir: null,

  startRecording: (sessionId, sessionDir) =>
    set({ status: 'recording', startTime: Date.now(), elapsed: 0, sessionId, sessionDir }),
  stopRecording: () => set({ status: 'processing' }),
  setComplete: () => set({ status: 'idle', startTime: null, sessionId: null, sessionDir: null }),
  toggleMic: () => set((s) => ({ micActive: !s.micActive })),
  tick: () => set((s) => ({
    elapsed: s.startTime ? Math.floor((Date.now() - s.startTime) / 1000) : s.elapsed
  })),
}))
