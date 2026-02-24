import { useState, useEffect, useCallback } from 'react'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { UrlBar } from './components/UrlBar'
import { BrowserGap } from './components/BrowserGap'
import { TabBar } from './components/TabBar'
import { SessionReplay } from './components/SessionReplay'
import { DevToolsPanel } from './components/DevToolsPanel'
import { AiTerminal } from './components/AiTerminal'
import { ResizablePanel } from './components/ui/ResizablePanel'
import { useNetworkStore, NetworkEntry } from './stores/network'
import { useConsoleStore, ConsoleEntry } from './stores/console'
import { useInteractionsStore, InteractionEntry } from './stores/interactions'
import { useBrowserStore } from './stores/browser'
import { useRecordingStore } from './stores/recording'
import { useTabsStore } from './stores/tabs'

interface SessionData {
  network: NetworkEntry[]
  console: ConsoleEntry[]
  interactions: InteractionEntry[]
  frameCount: number
  duration: number
}

export default function App() {
  const [rightTab, setRightTab] = useState<'network' | 'console' | 'interactions'>('network')
  const addNetworkEntry = useNetworkStore((s) => s.addEntry)
  const clearNetwork = useNetworkStore((s) => s.clear)
  const addConsoleEntry = useConsoleStore((s) => s.addEntry)
  const clearConsole = useConsoleStore((s) => s.clear)
  const addInteractionEntry = useInteractionsStore((s) => s.addEntry)
  const clearInteractions = useInteractionsStore((s) => s.clear)
  const setUrl = useBrowserStore((s) => s.setUrl)
  const { status, startRecording, stopRecording } = useRecordingStore()
  const { tabs, activeTabId } = useTabsStore()

  const activeTab = tabs.find((t) => t.id === activeTabId)
  const isBrowserActive = activeTab?.type === 'browser'
  const activeSessionId = activeTab?.type === 'session' ? activeTab.sessionId : null

  // Session replay data
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [replayTime, setReplayTime] = useState(0)

  // Show/hide the native BrowserView based on which tab is active
  useEffect(() => {
    if (isBrowserActive) {
      window.recon?.showBrowserView()
    } else {
      window.recon?.hideBrowserView()
    }
  }, [isBrowserActive])

  // Load session data when a session tab becomes active
  useEffect(() => {
    if (!activeSessionId) {
      setSessionData(null)
      return
    }
    let cancelled = false
    ;(async () => {
      const result = await window.recon?.sessionLoad(activeSessionId)
      if (cancelled || !result?.success) return
      const data = result.data
      // Parse duration string like "2m 34s" into milliseconds
      let durationMs = 0
      if (data.meta?.startTime && data.meta?.endTime) {
        durationMs = data.meta.endTime - data.meta.startTime
      } else {
        const match = (data.meta?.duration || '').match(/(\d+)m\s*(\d+)s/)
        if (match) durationMs = (parseInt(match[1]) * 60 + parseInt(match[2])) * 1000
      }
      setSessionData({
        network: data.network || [],
        console: data.console || [],
        interactions: data.interactions || [],
        frameCount: data.frameCount || 0,
        duration: durationMs,
      })
      setReplayTime(0)
    })()
    return () => { cancelled = true }
  }, [activeSessionId])

  // Compute visible entries based on replay time
  const replayNetwork = sessionData?.network.filter((e) => e.ts <= replayTime) || []
  const replayConsole = sessionData?.console.filter((e) => e.ts <= replayTime) || []
  const replayInteractions = sessionData?.interactions.filter((e) => e.ts <= replayTime) || []

  const handleReplayTimeUpdate = useCallback((timeMs: number) => {
    setReplayTime(timeMs)
  }, [])

  // Listen for CDP events from main process
  useEffect(() => {
    const cleanups: (() => void)[] = []
    if (window.recon) {
      cleanups.push(window.recon.onNetworkEntry(addNetworkEntry))
      cleanups.push(window.recon.onConsoleEntry(addConsoleEntry))
      cleanups.push(window.recon.onInteractionEntry(addInteractionEntry))
      cleanups.push(window.recon.onUrlChanged(setUrl))
      cleanups.push(window.recon.onCdpClear(() => {
        clearNetwork()
        clearConsole()
        clearInteractions()
      }))
    }
    return () => cleanups.forEach((fn) => fn())
  }, [addNetworkEntry, addConsoleEntry, addInteractionEntry, setUrl, clearNetwork, clearConsole, clearInteractions])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey

      // Cmd+Shift+R: toggle recording
      if (meta && e.shiftKey && e.key === 'r') {
        e.preventDefault()
        if (status === 'recording') stopRecording()
        else if (status === 'idle') startRecording('', '')
      }
      // Cmd+L: focus URL bar
      if (meta && e.key === 'l') {
        e.preventDefault()
        const urlInput = document.querySelector<HTMLInputElement>('[data-url-input]')
        urlInput?.focus()
        urlInput?.select()
      }
      // Cmd+1/2/3: switch right panel tabs
      if (meta && e.key === '1') { e.preventDefault(); setRightTab('network') }
      if (meta && e.key === '2') { e.preventDefault(); setRightTab('console') }
      if (meta && e.key === '3') { e.preventDefault(); setRightTab('interactions') }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [status, startRecording, stopRecording])

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <TitleBar />

      <div className="flex-1 flex overflow-hidden min-h-0">
        <Sidebar />

        {/* Center + Right */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Browser + DevTools */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Browser / Replay area */}
            <div className="flex-1 flex flex-col min-w-0">
              <TabBar />
              {isBrowserActive ? (
                <>
                  <UrlBar />
                  <BrowserGap />
                </>
              ) : activeSessionId && sessionData ? (
                <SessionReplay
                  sessionId={activeSessionId}
                  frameCount={sessionData.frameCount}
                  duration={sessionData.duration}
                  onTimeUpdate={handleReplayTimeUpdate}
                />
              ) : (
                <div
                  className="flex-1 flex items-center justify-center text-[12px]"
                  style={{ background: 'var(--color-bg)', color: 'var(--color-dim)' }}
                >
                  Loading session...
                </div>
              )}
            </div>

            <DevToolsPanel
              activeTab={rightTab}
              onTabChange={setRightTab}
              replayMode={!isBrowserActive && !!sessionData}
              replayNetwork={replayNetwork}
              replayConsole={replayConsole}
              replayInteractions={replayInteractions}
            />
          </div>

          <ResizablePanel
            direction="vertical"
            minSize={120}
            maxSize={400}
            defaultSize={200}
            className="shrink-0"
            style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-bg2)' }}
          >
            <AiTerminal />
          </ResizablePanel>
        </div>
      </div>
    </div>
  )
}
