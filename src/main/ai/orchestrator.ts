import { BrowserWindow } from 'electron'
import { AiProvider } from './provider'
import {
  VOICE_ANALYZER_SYSTEM, VOICE_ANALYZER_PROMPT,
  NETWORK_ANALYZER_SYSTEM, NETWORK_ANALYZER_PROMPT,
  CONSOLE_ANALYZER_SYSTEM, CONSOLE_ANALYZER_PROMPT,
  INTERACTION_ANALYZER_SYSTEM, INTERACTION_ANALYZER_PROMPT,
  SYNTHESIZER_SYSTEM, SYNTHESIZER_PROMPT,
} from './agents/prompts'

export interface AgentStatus {
  name: string
  status: 'pending' | 'running' | 'complete' | 'error'
  result?: string
  error?: string
}

export class AgentOrchestrator {
  private provider: AiProvider
  private mainWindow: BrowserWindow

  constructor(provider: AiProvider, mainWindow: BrowserWindow) {
    this.provider = provider
    this.mainWindow = mainWindow
  }

  async analyze(data: {
    transcript?: string
    network: any[]
    console: any[]
    interactions: any[]
  }): Promise<string> {
    const sendStatus = (name: string, status: string) => {
      this.mainWindow.webContents.send('ai:agent-status', { name, status })
    }
    const sendToken = (token: string) => {
      this.mainWindow.webContents.send('ai:token', token)
    }
    const sendMessage = (role: string, text: string) => {
      this.mainWindow.webContents.send('ai:message', { role, text })
    }

    sendMessage('system', 'Session recording analyzed. Starting parallel agent analysis...')

    // Run the 5 agents in parallel
    const agents: Promise<{ name: string; result: string }>[] = []

    // Voice agent (only if transcript available)
    if (data.transcript) {
      agents.push(this.runAgent('Voice Transcript', VOICE_ANALYZER_SYSTEM, VOICE_ANALYZER_PROMPT(data.transcript), sendStatus))
    }

    // Network agent
    agents.push(this.runAgent('Network', NETWORK_ANALYZER_SYSTEM, NETWORK_ANALYZER_PROMPT(JSON.stringify(data.network.slice(0, 50), null, 2)), sendStatus))

    // Console agent
    agents.push(this.runAgent('Console', CONSOLE_ANALYZER_SYSTEM, CONSOLE_ANALYZER_PROMPT(JSON.stringify(data.console.slice(0, 50), null, 2)), sendStatus))

    // Interaction agent
    agents.push(this.runAgent('Interactions', INTERACTION_ANALYZER_SYSTEM, INTERACTION_ANALYZER_PROMPT(JSON.stringify(data.interactions.slice(0, 50), null, 2)), sendStatus))

    const results = await Promise.allSettled(agents)
    const analyses: Record<string, string> = {}

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { name, result: text } = result.value
        analyses[name.toLowerCase().replace(' ', '_')] = text
      }
    }

    sendMessage('system', 'All agents complete. Synthesizing final report...')

    // Run synthesizer
    let finalReport = ''
    await this.provider.chat(
      SYNTHESIZER_SYSTEM,
      SYNTHESIZER_PROMPT({
        voice: analyses['voice_transcript'],
        network: analyses['network'] || 'No analysis available',
        console: analyses['console'] || 'No analysis available',
        interactions: analyses['interactions'] || 'No analysis available',
      }),
      {
        onToken: (token) => {
          finalReport += token
          sendToken(token)
        },
        onComplete: (text) => {
          finalReport = text
          sendMessage('assistant', text)
        },
        onError: (err) => {
          sendMessage('system', `Synthesizer error: ${err}`)
        },
      }
    )

    return finalReport
  }

  private async runAgent(
    name: string,
    systemPrompt: string,
    userPrompt: string,
    sendStatus: (name: string, status: string) => void
  ): Promise<{ name: string; result: string }> {
    sendStatus(name, 'running')

    return new Promise((resolve, reject) => {
      this.provider.chat(systemPrompt, userPrompt, {
        onToken: () => {},
        onComplete: (text) => {
          sendStatus(name, 'complete')
          resolve({ name, result: text })
        },
        onError: (err) => {
          sendStatus(name, 'error')
          reject(new Error(`${name} agent failed: ${err}`))
        },
      })
    })
  }
}
