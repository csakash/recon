import { useState, useEffect } from 'react'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { UrlBar } from './components/UrlBar'
import { MockBrowserContent } from './components/MockBrowserContent'
import { DevToolsPanel } from './components/DevToolsPanel'
import { AiTerminal } from './components/AiTerminal'
import { useNetworkStore } from './stores/network'
import { useConsoleStore } from './stores/console'
import { useInteractionsStore } from './stores/interactions'
import { useBrowserStore } from './stores/browser'

export default function App() {
  const [rightTab, setRightTab] = useState<'network' | 'console' | 'interactions'>('network')
  const addNetworkEntry = useNetworkStore((s) => s.addEntry)
  const addConsoleEntry = useConsoleStore((s) => s.addEntry)
  const addInteractionEntry = useInteractionsStore((s) => s.addEntry)
  const setUrl = useBrowserStore((s) => s.setUrl)

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

          <AiTerminal />
        </div>
      </div>
    </div>
  )
}
