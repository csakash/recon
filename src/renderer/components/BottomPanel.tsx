import { useEffect, useRef, KeyboardEvent } from 'react'
import { useThemeStore } from '../stores/theme'
import { useNetworkStore, NetworkEntry } from '../stores/network'
import { useConsoleStore, ConsoleEntry } from '../stores/console'
import { useInteractionsStore, InteractionEntry } from '../stores/interactions'
import { useAiStore } from '../stores/ai'
import { useRecordingStore } from '../stores/recording'

type Tab = 'network' | 'console' | 'interactions' | 'ai'

function NetworkStatusBadge({ status }: { status: number }) {
  const color =
    status >= 500
      ? 'var(--color-red)'
      : status >= 400
        ? 'var(--color-orange)'
        : status >= 300
          ? 'var(--color-dim)'
          : status === 0
            ? 'var(--color-red)'
            : 'var(--color-green)'
  return <span style={{ color, fontWeight: status >= 400 || status === 0 ? 700 : 400 }}>{status || '—'}</span>
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-[11px]" style={{ color: 'var(--color-dim)' }}>
      {message}
    </div>
  )
}

interface BottomPanelProps {
  activeTab: Tab
  onTabChange: (t: Tab) => void
  replayMode?: boolean
  replayNetwork?: NetworkEntry[]
  replayConsole?: ConsoleEntry[]
  replayInteractions?: InteractionEntry[]
}

export function BottomPanel({
  activeTab,
  onTabChange,
  replayMode = false,
  replayNetwork = [],
  replayConsole = [],
  replayInteractions = [],
}: BottomPanelProps) {
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'

  const liveNetwork = useNetworkStore((s) => s.entries)
  const liveConsole = useConsoleStore((s) => s.entries)
  const liveInteractions = useInteractionsStore((s) => s.entries)

  const networkData = replayMode ? replayNetwork : liveNetwork
  const consoleData = replayMode ? replayConsole : liveConsole
  const interactionData = replayMode ? replayInteractions : liveInteractions

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'network', label: 'Network', count: networkData.length },
    { id: 'console', label: 'Console', count: consoleData.length },
    { id: 'interactions', label: 'Interactions', count: interactionData.length },
    { id: 'ai', label: 'AI Agent' },
  ]

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-bg2)' }}>
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className="px-3 py-2 cursor-pointer text-[11px] uppercase tracking-wider transition-all"
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === t.id ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeTab === t.id ? 'var(--color-text-primary)' : 'var(--color-dim)',
              fontWeight: activeTab === t.id ? 600 : 500,
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.05em',
            }}
          >
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className="ml-1 text-[9px] opacity-50">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto text-[11.5px] min-h-0">
        {activeTab === 'network' && <NetworkContent data={networkData} />}
        {activeTab === 'console' && <ConsoleContent data={consoleData} isDark={isDark} />}
        {activeTab === 'interactions' && <InteractionsContent data={interactionData} />}
        {activeTab === 'ai' && <AiContent />}
      </div>
    </div>
  )
}

function NetworkContent({ data }: { data: NetworkEntry[] }) {
  return (
    <div>
      <div
        className="grid px-3 py-1.5 sticky top-0 text-[10px] font-semibold uppercase tracking-wide"
        style={{
          gridTemplateColumns: '50px 1fr 38px 50px',
          borderBottom: '1px solid var(--color-border)',
          color: 'var(--color-dim)',
          background: 'var(--color-bg2)',
        }}
      >
        <span>Method</span>
        <span>URL</span>
        <span>Status</span>
        <span>Time</span>
      </div>
      {data.length === 0 ? (
        <EmptyState message="Navigate to a page to see network activity" />
      ) : (
        data.map((log) => (
          <div
            key={log.id}
            className="grid px-3 py-1.5 font-mono text-[11px]"
            style={{
              gridTemplateColumns: '50px 1fr 38px 50px',
              borderBottom: '1px solid var(--color-border)08',
            }}
          >
            <span
              style={{
                color: log.method === 'POST' ? 'var(--color-blue)' : 'var(--color-dim)',
                fontWeight: 500,
              }}
            >
              {log.method}
            </span>
            <span
              className="overflow-hidden text-ellipsis whitespace-nowrap pr-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {log.url}
            </span>
            <NetworkStatusBadge status={log.status} />
            <span
              style={{
                color: log.time.includes('s') && !log.time.includes('ms') ? 'var(--color-orange)' : 'var(--color-dim)',
              }}
            >
              {log.time}
            </span>
          </div>
        ))
      )}
    </div>
  )
}

function ConsoleContent({ data, isDark }: { data: ConsoleEntry[]; isDark: boolean }) {
  return (
    <div className="p-1">
      {data.length === 0 ? (
        <EmptyState message="Console output will appear here" />
      ) : (
        data.map((log) => (
          <div
            key={log.id}
            className="py-1.5 px-2.5 rounded mb-0.5 font-mono text-[11px] leading-relaxed"
            style={{
              background: log.type === 'error' ? (isDark ? '#2d151812' : '#fef2f212') : 'transparent',
              borderLeft: `2px solid ${
                log.type === 'error'
                  ? 'var(--color-red)'
                  : log.type === 'warn'
                    ? 'var(--color-yellow)'
                    : 'var(--color-dim)30'
              }`,
            }}
          >
            <div
              style={{
                color:
                  log.type === 'error'
                    ? 'var(--color-red)'
                    : log.type === 'warn'
                      ? 'var(--color-yellow)'
                      : 'var(--color-text-secondary)',
              }}
            >
              {log.msg}
            </div>
            <div className="mt-0.5 text-[10px]" style={{ color: 'var(--color-dim)' }}>
              {log.src}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function InteractionsContent({ data }: { data: InteractionEntry[] }) {
  return (
    <div>
      <div
        className="grid px-3 py-1.5 sticky top-0 text-[10px] font-semibold uppercase tracking-wide"
        style={{
          gridTemplateColumns: '44px 60px 1fr',
          borderBottom: '1px solid var(--color-border)',
          color: 'var(--color-dim)',
          background: 'var(--color-bg2)',
        }}
      >
        <span>Time</span>
        <span>Action</span>
        <span>Target</span>
      </div>
      {data.length === 0 ? (
        <EmptyState message="Interact with the page to see events" />
      ) : (
        data.map((int) => (
          <div
            key={int.id}
            className="grid px-3 py-1.5 font-mono text-[11px]"
            style={{
              gridTemplateColumns: '44px 60px 1fr',
              borderBottom: '1px solid var(--color-border)08',
            }}
          >
            <span style={{ color: 'var(--color-dim)' }}>{int.time}</span>
            <span
              style={{
                fontWeight: 500,
                color:
                  int.action === 'click'
                    ? 'var(--color-blue)'
                    : int.action === 'navigate'
                      ? 'var(--color-green)'
                      : int.action === 'input'
                        ? 'var(--color-yellow)'
                        : int.action === 'scroll'
                          ? 'var(--color-dim)'
                          : int.action === 'submit'
                            ? 'var(--color-orange)'
                            : 'var(--color-dim)',
              }}
            >
              {int.action}
            </span>
            <span
              className="overflow-hidden text-ellipsis whitespace-nowrap"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {int.target}
            </span>
          </div>
        ))
      )}
    </div>
  )
}

function AiContent() {
  const { messages, isAnalyzing, input, setInput, addMessage } = useAiStore()
  const { status } = useRecordingStore()
  const termRef = useRef<HTMLDivElement>(null)
  const isRecording = status === 'recording'

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    const cleanups: (() => void)[] = []
    if (window.recon) {
      cleanups.push(window.recon.onAiMessage((msg) => {
        addMessage({ role: msg.role as 'system' | 'assistant', text: msg.text })
      }))
    }
    return () => cleanups.forEach((fn) => fn())
  }, [addMessage])

  const handleSend = () => {
    if (!input.trim()) return
    addMessage({ role: 'user', text: input })
    window.recon?.aiChat(input, '')
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend()
  }

  return (
    <div className="flex flex-col h-full">
      {/* AI header */}
      <div
        className="flex items-center justify-between px-3.5 py-1.5 shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
          <span className="text-[11px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            AI Agent
          </span>
          <span
            className="text-[9px] px-1.5 rounded font-semibold"
            style={{ background: 'var(--color-accent-bg)', color: 'var(--color-accent)' }}
          >
            Claude
          </span>
        </div>
        {isAnalyzing && (
          <span className="font-mono text-[10px]" style={{ color: 'var(--color-accent)' }}>
            analyzing<span style={{ animation: 'blink 1s step-end infinite' }}>...</span>
          </span>
        )}
      </div>

      {/* Messages */}
      <div ref={termRef} className="flex-1 overflow-auto px-3.5 py-2 font-mono text-[11.5px] leading-relaxed min-h-0">
        {messages.length === 0 && !isRecording && (
          <div className="py-2" style={{ color: 'var(--color-dim)' }}>
            <span style={{ color: 'var(--color-accent)' }}>●</span> Start a recording session to capture bugs.
            The AI agent will analyze the session and generate a report.
          </div>
        )}
        {isRecording && messages.length === 0 && (
          <div className="py-2" style={{ color: 'var(--color-dim)' }}>
            <span style={{ color: 'var(--color-accent)' }}>●</span> Recording in progress — capturing
            interactions, network activity, console logs, and audio...
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="mb-2">
            {msg.role === 'system' ? (
              <div style={{ color: 'var(--color-dim)' }}>
                <span style={{ color: 'var(--color-accent)' }}>→</span> {msg.text}
              </div>
            ) : (
              <div>
                <div
                  className="font-semibold mb-0.5 text-[10px]"
                  style={{ color: 'var(--color-accent)' }}
                >
                  claude
                </div>
                <div
                  className="whitespace-pre-wrap p-2.5 rounded-md text-[11px] max-h-[120px] overflow-auto"
                  style={{
                    color: 'var(--color-text-secondary)',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-2 px-3.5 py-1.5 shrink-0"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <span className="font-mono text-xs font-bold" style={{ color: 'var(--color-accent)' }}>
          ›
        </span>
        <input
          placeholder="Ask about the session or request a bug report..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none text-xs font-mono outline-none"
          style={{ color: 'var(--color-text-primary)' }}
        />
        <button
          onClick={handleSend}
          className="px-2.5 py-1 text-[10px] font-mono rounded-[5px] border cursor-pointer"
          style={{
            background: 'var(--color-bg4)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-dim)',
          }}
        >
          ⏎
        </button>
      </div>
    </div>
  )
}
