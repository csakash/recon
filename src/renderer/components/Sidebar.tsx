import { useEffect } from 'react'
import { useRecordingStore } from '../stores/recording'
import { useSessionsStore } from '../stores/sessions'
import { useAiStore } from '../stores/ai'
import { StatusDot } from './ui/StatusDot'

const MOCK_AI_MESSAGES = [
  { role: 'system' as const, text: 'Session recording analyzed. Processing 2m 34s of interaction data...' },
  { role: 'assistant' as const, text: 'Found 3 critical issues in this session. Generating report...' },
  {
    role: 'assistant' as const,
    text: `## Bug Report: Cart Update Failure

**Severity:** High · **Component:** Cart Service

**Summary:** Cart quantity update fails silently with 500 errors. The root cause appears to be a null cartId after auth token refresh — the session state loses cart association.

**Steps to Reproduce:**
1. Add item to cart
2. Navigate to /cart
3. Click "Update Quantity"
4. Observe: spinner hangs, 500 on POST /api/v1/cart/update

**Root Cause (probable):** cart.js:142 throws because \`items\` is undefined — the cart object loses its reference after the auth middleware refreshes the session token (auth.js:22 logs success, but cart.js:156 shows cartId is null).

**Suggested Fix:** Persist cartId independently of session token, or re-hydrate cart state after token refresh.`,
  },
]

export function Sidebar() {
  const { status, elapsed, micActive, startRecording, stopRecording, toggleMic, tick } = useRecordingStore()
  const { sessions, activeSessionId, setActive } = useSessionsStore()
  const { setMessages, setAnalyzing, addMessage } = useAiStore()
  const isRecording = status === 'recording'

  // Timer tick
  useEffect(() => {
    if (!isRecording) return
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [isRecording, tick])

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const handleStart = () => {
    startRecording()
    setMessages([])
  }

  const handleStop = () => {
    stopRecording()
    setAnalyzing(true)
    addMessage(MOCK_AI_MESSAGES[0])
    setTimeout(() => {
      addMessage(MOCK_AI_MESSAGES[1])
      setTimeout(() => {
        addMessage(MOCK_AI_MESSAGES[2])
        setAnalyzing(false)
      }, 1800)
    }, 1200)
  }

  return (
    <div
      className="w-[240px] border-r flex flex-col shrink-0"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg2)' }}
    >
      {/* Record Button */}
      <div className="p-3.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
        {!isRecording ? (
          <button
            onClick={handleStart}
            className="w-full py-2.5 rounded-lg text-white border-none cursor-pointer font-semibold text-[13px] flex items-center justify-center gap-1.5"
            style={{
              background: 'var(--color-accent)',
              fontFamily: 'var(--font-sans)',
              boxShadow: '0 2px 12px var(--color-accent)40',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
              <circle cx="12" cy="12" r="8" />
            </svg>
            Start Recording
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleStop}
              className="flex-1 py-2.5 rounded-lg border cursor-pointer font-semibold text-[13px] flex items-center justify-center gap-1.5"
              style={{
                background: 'var(--color-bg4)',
                borderColor: 'var(--color-border2)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-accent)">
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
              Stop
            </button>
            <button
              onClick={toggleMic}
              className="w-10 rounded-lg border cursor-pointer flex items-center justify-center"
              style={{
                background: micActive ? 'var(--color-accent-bg)' : 'var(--color-bg4)',
                borderColor: micActive ? 'var(--color-accent)' : 'var(--color-border2)',
                color: micActive ? 'var(--color-accent)' : 'var(--color-dim)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Sessions Header */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-dim)' }}>
          Sessions
        </span>
        <span
          className="text-[10px] px-1.5 rounded"
          style={{ background: 'var(--color-bg4)', color: 'var(--color-dim)' }}
        >
          {sessions.length}
        </span>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-auto px-2">
        {/* Active recording entry */}
        {isRecording && (
          <div
            className="py-2.5 px-2.5 rounded-[7px] mb-0.5"
            style={{ background: 'var(--color-accent-bg)', border: '1px solid var(--color-accent)30' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="w-[7px] h-[7px] rounded-full"
                style={{ background: 'var(--color-accent)', animation: 'blink 1s step-end infinite' }}
              />
              <span className="font-medium text-[12.5px]" style={{ color: 'var(--color-accent)' }}>
                Recording...
              </span>
            </div>
            <div className="pl-3.5">
              <span className="font-mono text-[11px] opacity-70" style={{ color: 'var(--color-accent)' }}>
                {formatTime(elapsed)}
              </span>
            </div>
          </div>
        )}

        {sessions.map((s) => (
          <div
            key={s.id}
            onClick={() => setActive(s.id)}
            className="py-2.5 px-2.5 rounded-[7px] mb-0.5 cursor-pointer transition-all"
            style={{
              background: activeSessionId === s.id ? 'var(--color-bg4)' : 'transparent',
              border: `1px solid ${activeSessionId === s.id ? 'var(--color-border2)' : 'transparent'}`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <StatusDot color="var(--color-green)" />
              <span className="font-medium text-[12.5px]">{s.name}</span>
            </div>
            <div className="flex items-center gap-2 pl-3.5">
              <span className="font-mono text-[11px]" style={{ color: 'var(--color-dim)' }}>
                {s.duration}
              </span>
              <span className="text-[10px] opacity-60" style={{ color: 'var(--color-text-secondary)' }}>
                {s.url}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Status */}
      <div
        className="flex items-center gap-1.5 px-3.5 py-2.5 text-[10px]"
        style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-dim)' }}
      >
        <StatusDot color="var(--color-green)" />
        <span>Local · Chromium 122</span>
      </div>
    </div>
  )
}
