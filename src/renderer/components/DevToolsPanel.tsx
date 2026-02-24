import { useRecordingStore } from '../stores/recording'
import { useThemeStore } from '../stores/theme'
import { useNetworkStore } from '../stores/network'
import { useConsoleStore } from '../stores/console'
import { useInteractionsStore } from '../stores/interactions'

// Mock data matching the mockup
const MOCK_NETWORK = [
  { method: 'GET', url: '/api/v1/auth/session', status: 200, time: '42ms' },
  { method: 'POST', url: '/api/v1/cart/update', status: 500, time: '1.8s' },
  { method: 'GET', url: '/api/v1/products?page=2', status: 200, time: '320ms' },
  { method: 'GET', url: '/static/js/main.chunk.js', status: 304, time: '12ms' },
  { method: 'POST', url: '/api/v1/cart/update', status: 500, time: '2.1s' },
  { method: 'GET', url: '/api/v1/user/preferences', status: 200, time: '89ms' },
  { method: 'OPTIONS', url: '/api/v1/cart/update', status: 204, time: '5ms' },
  { method: 'POST', url: '/api/v1/cart/update', status: 500, time: '1.9s' },
]

const MOCK_CONSOLE = [
  { type: 'error', msg: "Uncaught TypeError: Cannot read property 'items' of undefined", src: 'cart.js:142' },
  { type: 'warn', msg: 'React does not recognize the `isActive` prop on a DOM element.', src: 'react-dom.js' },
  { type: 'log', msg: 'Cart state: { items: [], total: 0 }', src: 'store.js:88' },
  { type: 'error', msg: 'POST /api/v1/cart/update 500 (Internal Server Error)', src: 'network' },
  { type: 'log', msg: '[HMR] Waiting for update signal from WDS...', src: 'webpack' },
  { type: 'error', msg: 'Failed to update cart: cartId is null after auth refresh', src: 'cart.js:156' },
  { type: 'warn', msg: 'Each child in a list should have a unique "key" prop.', src: 'ProductList.jsx:34' },
  { type: 'log', msg: 'Session token refreshed successfully', src: 'auth.js:22' },
]

const MOCK_INTERACTIONS = [
  { time: '00:04', action: 'click', target: 'Button — "Add to Cart"' },
  { time: '00:06', action: 'navigate', target: '/cart' },
  { time: '00:11', action: 'click', target: 'Button — "Update Quantity"' },
  { time: '00:12', action: 'wait', target: 'Spinner visible for 2.1s' },
  { time: '00:15', action: 'click', target: 'Button — "Update Quantity" (retry)' },
  { time: '00:18', action: 'scroll', target: 'Page scrolled down 400px' },
  { time: '00:22', action: 'click', target: 'Link — "Back to Products"' },
]

function NetworkStatusBadge({ status }: { status: number }) {
  const color =
    status >= 500
      ? 'var(--color-red)'
      : status >= 400
        ? 'var(--color-orange)'
        : status >= 300
          ? 'var(--color-dim)'
          : 'var(--color-green)'
  return <span style={{ color, fontWeight: status >= 400 ? 700 : 400 }}>{status}</span>
}

type Tab = 'network' | 'console' | 'interactions'

export function DevToolsPanel({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (t: Tab) => void }) {
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'

  // Use live data from stores, fall back to mock when empty
  const liveNetwork = useNetworkStore((s) => s.entries)
  const liveConsole = useConsoleStore((s) => s.entries)
  const liveInteractions = useInteractionsStore((s) => s.entries)

  const networkData = liveNetwork.length > 0 ? liveNetwork : MOCK_NETWORK.map((n, i) => ({ ...n, id: `mock-${i}` }))
  const consoleData = liveConsole.length > 0 ? liveConsole : MOCK_CONSOLE.map((c, i) => ({ ...c, id: `mock-${i}` }))
  const interactionData = liveInteractions.length > 0 ? liveInteractions : MOCK_INTERACTIONS.map((int, i) => ({ ...int, id: `mock-${i}`, selector: '' }))

  const tabs: { id: Tab; label: string }[] = [
    { id: 'network', label: 'Network' },
    { id: 'console', label: 'Console' },
    { id: 'interactions', label: 'Interactions' },
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
            {networkData.map((log) => (
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
            ))}
          </div>
        )}

        {activeTab === 'console' && (
          <div className="p-1">
            {consoleData.map((log) => (
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
            ))}
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
            {interactionData.map((int) => (
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
                          : int.action === 'wait'
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
