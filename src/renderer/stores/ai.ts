import { create } from 'zustand'

export interface AiMessage {
  role: 'system' | 'assistant' | 'user'
  text: string
}

interface AiState {
  messages: AiMessage[]
  isAnalyzing: boolean
  input: string
  addMessage: (msg: AiMessage) => void
  setMessages: (msgs: AiMessage[]) => void
  setAnalyzing: (v: boolean) => void
  setInput: (v: string) => void
  clear: () => void
}

export const useAiStore = create<AiState>((set) => ({
  messages: [],
  isAnalyzing: false,
  input: '',
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setMessages: (msgs) => set({ messages: msgs }),
  setAnalyzing: (v) => set({ isAnalyzing: v }),
  setInput: (v) => set({ input: v }),
  clear: () => set({ messages: [], isAnalyzing: false, input: '' }),
}))
