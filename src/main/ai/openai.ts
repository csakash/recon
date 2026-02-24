import { AiProvider, AiStreamCallbacks } from './provider'

export class OpenAIProvider implements AiProvider {
  name = 'openai'
  private apiKey: string
  private model: string

  constructor(apiKey: string, model = 'gpt-4o') {
    this.apiKey = apiKey
    this.model = model
  }

  async chat(systemPrompt: string, userPrompt: string, callbacks: AiStreamCallbacks): Promise<void> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: true,
        }),
      })

      if (!response.ok) {
        const body = await response.text()
        callbacks.onError(`OpenAI API error: ${response.status} - ${body}`)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        callbacks.onError('No response body')
        return
      }

      const decoder = new TextDecoder()
      let fullText = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              const token = parsed.choices?.[0]?.delta?.content
              if (token) {
                fullText += token
                callbacks.onToken(token)
              }
            } catch {}
          }
        }
      }

      callbacks.onComplete(fullText)
    } catch (err: any) {
      callbacks.onError(err.message || 'Unknown error')
    }
  }
}
