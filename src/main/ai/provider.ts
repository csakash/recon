export interface AiStreamCallbacks {
  onToken: (token: string) => void
  onComplete: (fullText: string) => void
  onError: (error: string) => void
}

export interface AiProvider {
  name: string
  chat(systemPrompt: string, userPrompt: string, callbacks: AiStreamCallbacks): Promise<void>
}
