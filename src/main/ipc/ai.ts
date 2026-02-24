import { BrowserWindow, ipcMain } from 'electron'
import { AnthropicProvider } from '../ai/anthropic'
import { OpenAIProvider } from '../ai/openai'
import { CliAgentProvider } from '../ai/cli'
import { AgentOrchestrator } from '../ai/orchestrator'
import { AiProvider } from '../ai/provider'

let currentProvider: AiProvider | null = null

function getProvider(config: { provider: string; apiKey?: string; model?: string; command?: string }): AiProvider {
  switch (config.provider) {
    case 'anthropic':
      return new AnthropicProvider(config.apiKey || '', config.model)
    case 'openai':
      return new OpenAIProvider(config.apiKey || '', config.model)
    case 'cli':
      return new CliAgentProvider(config.command || 'claude')
    default:
      return new AnthropicProvider(config.apiKey || '')
  }
}

export function setupAiIpc(mainWindow: BrowserWindow): void {
  ipcMain.handle('ai:configure', async (_event, config) => {
    try {
      currentProvider = getProvider(config)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('ai:analyze', async (_event, sessionData) => {
    if (!currentProvider) {
      mainWindow.webContents.send('ai:message', {
        role: 'system',
        text: 'No AI provider configured. Go to Settings to add your API key.',
      })
      return { success: false, error: 'No AI provider configured' }
    }

    try {
      const orchestrator = new AgentOrchestrator(currentProvider, mainWindow)
      const report = await orchestrator.analyze(sessionData)
      return { success: true, report }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Simple chat for follow-up questions
  ipcMain.handle('ai:chat', async (_event, message, context) => {
    if (!currentProvider) {
      return { success: false, error: 'No AI provider configured' }
    }

    try {
      let fullText = ''
      await currentProvider.chat(
        'You are a helpful QA assistant. The user is asking about a testing session. Use the provided context to answer.',
        `Context:\n${context}\n\nQuestion: ${message}`,
        {
          onToken: (token) => {
            fullText += token
            mainWindow.webContents.send('ai:token', token)
          },
          onComplete: (text) => {
            mainWindow.webContents.send('ai:message', { role: 'assistant', text })
          },
          onError: (err) => {
            mainWindow.webContents.send('ai:message', { role: 'system', text: `Error: ${err}` })
          },
        }
      )
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}
