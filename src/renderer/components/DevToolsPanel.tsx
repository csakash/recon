import { useThemeStore } from '../stores/theme'
import { useNetworkStore } from '../stores/network'
import { useConsoleStore } from '../stores/console'
import { useInteractionsStore } from '../stores/interactions'

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

type Tab = 'network' | 'console' | 'interactions'

export function DevToolsPanel({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (t: Tab) => void }) {
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'

  const networkData = useNetworkStore((s) => s.entries)
  const consoleData = useConsoleStore((s) => s.entries)
  const interactionData = useInteractionsStore((s) => s.entries)

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'network', label: 'Network', count: networkData.length },
    { id: 'console', label: 'Console', count: consoleData.length },
    { id: 'interactions', label: 'Interactions', count: interactionData.length },
  ]

  return (
    <div
      className="w-[340px] border-l flex flex-col shrink-0"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg2)' }}
    >
      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '1px solid var(--color-border)' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className="flex-1 py-2.5 cursor-pointer text-[11.5px] transition-all"
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === t.id ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeTab === t.id ? 'var(--color-text-primary)' : 'var(--color-dim)',
              fontWeight: activeTab === t.id ? 600 : 400,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1 text-[9px] opacity-50">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto text-[11.5px]">
        {activeTab === 'network' && (
          <div>
            {/* Header */}
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
            {networkData.length === 0 ? (
              <EmptyState message="Navigate to a page to see network activity" />
            ) : (
              networkData.map((log) => (
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
        )}

        {activeTab === 'console' && (
          <div className="p-1">
            {consoleData.length === 0 ? (
              <EmptyState message="Console output will appear here" />
            ) : (
              consoleData.map((log) => (
              <div
                key={log.id}
                className="py-1.5 px-2.5 rounded mb-0.5 font-mono text-[11px] leading-relaxed"
                style={{
                  background:
                    log.type === 'error' ? (isDark ? '#2d151812' : '#fef2f212') : 'transparent',
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
        )}

        {activeTab === 'interactions' && (
          <div>
            {/* Header */}
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
            {interactionData.length === 0 ? (
              <EmptyState message="Interact with the page to see events" />
            ) : (
              interactionData.map((int) => (
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
        )}
      </div>
    </div>
  )
}
