import { useState, useEffect, useCallback } from 'react'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { UrlBar } from './components/UrlBar'
import { MockBrowserContent } from './components/MockBrowserContent'
import { DevToolsPanel } from './components/DevToolsPanel'
import { AiTerminal } from './components/AiTerminal'
import { ResizablePanel } from './components/ui/ResizablePanel'
import { useNetworkStore } from './stores/network'
import { useConsoleStore } from './stores/console'
import { useInteractionsStore } from './stores/interactions'
import { useBrowserStore } from './stores/browser'
import { useRecordingStore } from './stores/recording'

export default function App() {
  const [rightTab, setRightTab] = useState<'network' | 'console' | 'interactions'>('network')
  const addNetworkEntry = useNetworkStore((s) => s.addEntry)
  const addConsoleEntry = useConsoleStore((s) => s.addEntry)
  const addInteractionEntry = useInteractionsStore((s) => s.addEntry)
  const setUrl = useBrowserStore((s) => s.setUrl)
  const { status, startRecording, stopRecording } = useRecordingStore()

  // Listen for CDP events from main process
  useEffect(() => {
    const cleanups: (() => void)[] = []
    if (window.recon) {
      cleanups.push(window.recon.onNetworkEntry(addNetworkEntry))
      cleanups.push(window.recon.onConsoleEntry(addConsoleEntry))
      cleanups.push(window.recon.onInteractionEntry(addInteractionEntry))
      cleanups.push(window.recon.onUrlChanged(setUrl))
    }
    return () => cleanups.forEach((fn) => fn())
  }, [addNetworkEntry, addConsoleEntry, addInteractionEntry, setUrl])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey

      // Cmd+Shift+R: toggle recording
      if (meta && e.shiftKey && e.key === 'r') {
        e.preventDefault()
        if (status === 'recording') stopRecording()
        else if (status === 'idle') startRecording()
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
            {/* Browser area */}
            <div className="flex-1 flex flex-col min-w-0">
              <UrlBar />
              <MockBrowserContent />
            </div>

            <DevToolsPanel activeTab={rightTab} onTabChange={setRightTab} />
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
