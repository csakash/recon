import { useState } from 'react'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { UrlBar } from './components/UrlBar'
import { MockBrowserContent } from './components/MockBrowserContent'
import { DevToolsPanel } from './components/DevToolsPanel'
import { AiTerminal } from './components/AiTerminal'

export default function App() {
  const [rightTab, setRightTab] = useState<'network' | 'console' | 'interactions'>('network')

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
