import { useEffect } from 'react'
import { useRecordingStore } from '../stores/recording'
import { useSessionsStore } from '../stores/sessions'
import { useAiStore } from '../stores/ai'
import { useNetworkStore } from '../stores/network'
import { useConsoleStore } from '../stores/console'
import { useInteractionsStore } from '../stores/interactions'
import { useTabsStore } from '../stores/tabs'
import { useBrowserStore } from '../stores/browser'
import { StatusDot } from './ui/StatusDot'

export function Sidebar() {
  const { status, elapsed, micActive, startRecording, stopRecording, setComplete, toggleMic, tick } = useRecordingStore()
  const { sessions, loadSessions } = useSessionsStore()
  const { setMessages } = useAiStore()
  const networkEntries = useNetworkStore((s) => s.entries)
  const consoleEntries = useConsoleStore((s) => s.entries)
  const interactionEntries = useInteractionsStore((s) => s.entries)
  const clearNetwork = useNetworkStore((s) => s.clear)
  const clearConsole = useConsoleStore((s) => s.clear)
  const clearInteractions = useInteractionsStore((s) => s.clear)
  const { openSessionTab, ensureBrowserTab, convertBrowserToSession } = useTabsStore()
  const currentUrl = useBrowserStore((s) => s.url)
  const setUrl = useBrowserStore((s) => s.setUrl)
  const isRecording = status === 'recording'

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Timer tick
  useEffect(() => {
    if (!isRecording) return
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [isRecording, tick])

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${String(s).padStart(2, '0')}s`
  }

  const handleStart = async () => {
    try {
      // Ensure we're on the browser tab
      ensureBrowserTab()

      // Navigate to blank page for a fresh start
      window.recon?.navigate('about:blank')
      setUrl('')

      const sessionId = crypto.randomUUID()
      const name = `Session ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`

      // Clear stores first
      clearNetwork()
      clearConsole()
      clearInteractions()
      setMessages([])

      // Restart CDP to get a clean slate for this recording
      await window.recon?.cdpStart()

      // Create a session on disk
      let dir = ''
      try {
        const result = await window.recon?.sessionCreate({
          id: sessionId,
          name,
          url: currentUrl || '',
          startTime: Date.now(),
        })
        dir = result?.dir || ''
      } catch (err) {
        console.error('Session creation failed:', err)
      }

      // Start recording state (do this even if session dir failed)
      startRecording(sessionId, dir)

      // Start video capture
      try {
        await window.recon?.captureStartVideo()
      } catch (err) {
        console.error('Video capture failed to start:', err)
      }
    } catch (err) {
      console.error('Failed to start recording:', err)
    }
  }

  const handleStop = async () => {
    try {
      const recState = useRecordingStore.getState()
      const sessionId = recState.sessionId
      let sessionDir = recState.sessionDir
      const recStartTime = recState.startTime || Date.now()

      stopRecording()

      // Stop video capture
      await window.recon?.captureStopVideo()

      // If we don't have a session dir, try creating one now
      if (!sessionDir && sessionId) {
        try {
          const result = await window.recon?.sessionCreate({
            id: sessionId,
            name: `Session ${new Date(recStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            url: currentUrl || '',
            startTime: recStartTime,
          })
          sessionDir = result?.dir || ''
        } catch (err) {
          console.error('Late session creation failed:', err)
        }
      }

      // Save video frames
      if (sessionDir) {
        await window.recon?.captureSaveVideo(sessionDir)
      }

      // Normalize timestamps to relative (ms from session start)
      const relNetwork = networkEntries.map((e) => ({ ...e, ts: e.ts - recStartTime }))
      const relConsole = consoleEntries.map((e) => ({ ...e, ts: e.ts - recStartTime }))
      const relInteractions = interactionEntries.map((e) => ({ ...e, ts: e.ts - recStartTime }))

      const durationSec = Math.floor((Date.now() - recStartTime) / 1000)

      // Finalize session
      if (sessionId && sessionDir) {
        await window.recon?.sessionFinalize(sessionId, {
          duration: formatDuration(durationSec),
          status: 'complete',
          endTime: Date.now(),
          network: relNetwork,
          console: relConsole,
          interactions: relInteractions,
        })

        // Convert the current browser tab to a session replay tab
        const name = `Session ${new Date(recStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        convertBrowserToSession(sessionId, name)

        // Reload sessions list
        await loadSessions()
      }

      setComplete()
    } catch (err) {
      console.error('Failed to stop recording:', err)
      setComplete()
    }
  }

  const handleSessionClick = (id: string) => {
    const session = sessions.find((s) => s.id === id)
    if (!session) return
    openSessionTab(session.id, session.name)
  }

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: 'var(--color-bg2)' }}
    >
      {/* Record Button */}
      <div className="p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
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
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
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
      <div className="flex-1 overflow-auto px-3">
        {/* Active recording entry */}
        {isRecording && (
          <div
            className="py-3 px-3.5 rounded-[7px] mb-1.5"
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
            onClick={() => handleSessionClick(s.id)}
            className="py-3 px-3.5 rounded-[7px] mb-1.5 cursor-pointer transition-all hover:opacity-90"
            style={{
              background: 'transparent',
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg4)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <StatusDot color="var(--color-green)" />
              <span className="font-medium text-[12.5px]">{s.name}</span>
            </div>
            <div className="flex items-center gap-2 pl-3.5">
              <span className="font-mono text-[11px]" style={{ color: 'var(--color-dim)' }}>
                {s.duration}
              </span>
              <span
                className="text-[10px] opacity-60 overflow-hidden text-ellipsis whitespace-nowrap min-w-0 flex-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {s.url}
              </span>
            </div>
          </div>
        ))}

        {sessions.length === 0 && !isRecording && (
          <div className="py-8 text-center text-[11px]" style={{ color: 'var(--color-dim)' }}>
            No sessions yet.
            <br />
            Start recording to capture a session.
          </div>
        )}
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
