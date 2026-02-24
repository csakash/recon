import { useTabsStore, Tab } from '../stores/tabs'

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabsStore()

  if (tabs.length <= 1) return null // don't show tab bar for single tab

  return (
    <div
      className="flex items-center gap-6 h-[36px] px-4 shrink-0 overflow-x-auto"
      style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg2)' }}
    >
      {tabs.map((tab) => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          onSelect={() => setActiveTab(tab.id)}
          onClose={tab.id !== 'browser' ? () => closeTab(tab.id) : undefined}
        />
      ))}
    </div>
  )
}

function TabItem({
  tab,
  isActive,
  onSelect,
  onClose,
}: {
  tab: Tab
  isActive: boolean
  onSelect: () => void
  onClose?: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className="flex items-center gap-1.5 px-3 py-2 cursor-pointer shrink-0 text-[11px] uppercase tracking-wider transition-all"
      style={{
        background: 'none',
        border: 'none',
        borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
        color: isActive ? 'var(--color-text-primary)' : 'var(--color-dim)',
        fontFamily: 'var(--font-sans)',
        fontWeight: isActive ? 600 : 500,
        letterSpacing: '0.05em',
      }}
    >
      {tab.type === 'browser' ? (
        <span style={{ fontSize: '10px' }}>🌐</span>
      ) : (
        <span style={{ fontSize: '10px' }}>▶</span>
      )}
      <span className="overflow-hidden text-ellipsis whitespace-nowrap">{tab.label}</span>
      {onClose && (
        <span
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="ml-1 opacity-40 hover:opacity-100 text-[10px]"
          style={{ cursor: 'pointer' }}
        >
          ✕
        </span>
      )}
    </button>
  )
}
