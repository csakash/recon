import { useEffect, useRef, KeyboardEvent } from 'react'
import { useAiStore } from '../stores/ai'
import { useRecordingStore } from '../stores/recording'

export function AiTerminal() {
  const { messages, isAnalyzing, input, setInput, addMessage } = useAiStore()
  const { status } = useRecordingStore()
  const termRef = useRef<HTMLDivElement>(null)
  const isRecording = status === 'recording'

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight
  }, [messages])

  // Listen for AI messages from main process
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
    <div
      className="flex flex-col shrink-0 transition-all"
      style={{
        height: messages.length > 2 ? 220 : 160,
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-bg2)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3.5 py-1.5"
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

      {/* Body */}
      <div ref={termRef} className="flex-1 overflow-auto px-3.5 py-2 font-mono text-[11.5px] leading-relaxed">
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
        className="flex items-center gap-2 px-3.5 py-1.5"
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
