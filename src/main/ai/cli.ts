import { AiProvider, AiStreamCallbacks } from './provider'
import { spawn } from 'child_process'

export class CliAgentProvider implements AiProvider {
  name = 'cli'
  private command: string
  private args: string[]

  constructor(command = 'claude', args: string[] = []) {
    this.command = command
    this.args = args
  }

  async chat(systemPrompt: string, userPrompt: string, callbacks: AiStreamCallbacks): Promise<void> {
    return new Promise((resolve) => {
      const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`

      const proc = spawn(this.command, [...this.args, '-p', fullPrompt], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      })

      let fullText = ''

      proc.stdout?.on('data', (data: Buffer) => {
        const text = data.toString()
        fullText += text
        callbacks.onToken(text)
      })

      proc.stderr?.on('data', (data: Buffer) => {
        // Some CLI agents write progress to stderr — ignore unless it's a real error
      })

      proc.on('close', (code) => {
        if (code === 0) {
          callbacks.onComplete(fullText)
        } else {
          callbacks.onError(`CLI agent exited with code ${code}`)
        }
        resolve()
      })

      proc.on('error', (err) => {
        callbacks.onError(`Failed to spawn CLI agent: ${err.message}`)
        resolve()
      })
    })
  }
}
