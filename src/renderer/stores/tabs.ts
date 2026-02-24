import { create } from 'zustand'

export interface BrowserTab {
  type: 'browser'
  id: 'browser'
  label: string
}

export interface SessionTab {
  type: 'session'
  id: string
  label: string
  sessionId: string
}

export type Tab = BrowserTab | SessionTab

interface TabsState {
  tabs: Tab[]
  activeTabId: string
  setActiveTab: (id: string) => void
  openSessionTab: (sessionId: string, label: string) => void
  closeTab: (id: string) => void
  /** Replace active browser tab with a session replay tab */
  convertBrowserToSession: (sessionId: string, label: string) => void
  /** Ensure there's a browser tab and switch to it */
  ensureBrowserTab: () => void
}

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: [{ type: 'browser', id: 'browser', label: 'Browser' }],
  activeTabId: 'browser',

  setActiveTab: (id) => set({ activeTabId: id }),

  openSessionTab: (sessionId, label) => {
    const { tabs } = get()
    const existing = tabs.find((t) => t.type === 'session' && t.sessionId === sessionId) as SessionTab | undefined
    if (existing) {
      set({ activeTabId: existing.id })
      return
    }
    const tab: SessionTab = { type: 'session', id: `session-${sessionId}`, label, sessionId }
    set({ tabs: [...tabs, tab], activeTabId: tab.id })
  },

  closeTab: (id) => {
    const { tabs, activeTabId } = get()
    if (id === 'browser') return // can't close the browser tab
    const newTabs = tabs.filter((t) => t.id !== id)
    const newActive = activeTabId === id ? (newTabs[newTabs.length - 1]?.id || 'browser') : activeTabId
    set({ tabs: newTabs, activeTabId: newActive })
  },

  convertBrowserToSession: (sessionId, label) => {
    const { tabs } = get()
    const sessionTab: SessionTab = { type: 'session', id: `session-${sessionId}`, label, sessionId }
    // Replace the browser tab with this session, keep the rest
    const newTabs = tabs.map((t) => (t.id === 'browser' ? sessionTab : t))
    set({ tabs: newTabs, activeTabId: sessionTab.id })
  },

  ensureBrowserTab: () => {
    const { tabs } = get()
    if (tabs.find((t) => t.id === 'browser')) {
      set({ activeTabId: 'browser' })
      return
    }
    const browserTab: BrowserTab = { type: 'browser', id: 'browser', label: 'Browser' }
    set({ tabs: [browserTab, ...tabs], activeTabId: 'browser' })
  },
}))
