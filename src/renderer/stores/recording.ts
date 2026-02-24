import { create } from 'zustand'

export type RecordingStatus = 'idle' | 'recording' | 'processing' | 'complete'

interface RecordingState {
  status: RecordingStatus
  startTime: number | null
  elapsed: number
  micActive: boolean

  startRecording: () => void
  stopRecording: () => void
  toggleMic: () => void
  tick: () => void
}

export const useRecordingStore = create<RecordingState>((set) => ({
  status: 'idle',
  startTime: null,
  elapsed: 0,
  micActive: true,

  startRecording: () => set({ status: 'recording', startTime: Date.now(), elapsed: 0 }),
  stopRecording: () => set({ status: 'processing', startTime: null }),
  toggleMic: () => set((s) => ({ micActive: !s.micActive })),
  tick: () => set((s) => ({
    elapsed: s.startTime ? Math.floor((Date.now() - s.startTime) / 1000) : s.elapsed
  })),
}))
