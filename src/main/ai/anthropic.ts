import { AiProvider, AiStreamCallbacks } from './provider'

export class AnthropicProvider implements AiProvider {
  name = 'anthropic'
  private apiKey: string
  private model: string

  constructor(apiKey: string, model = 'claude-sonnet-4-20250514') {
    this.apiKey = apiKey
    this.model = model
  }

  async chat(systemPrompt: string, userPrompt: string, callbacks: AiStreamCallbacks): Promise<void> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
          stream: true,
        }),
      })

      if (!response.ok) {
        const body = await response.text()
        callbacks.onError(`Anthropic API error: ${response.status} - ${body}`)
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
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                const token = parsed.delta.text
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
