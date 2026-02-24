import { useThemeStore } from '../stores/theme'
import { useRecordingStore } from '../stores/recording'

/**
 * Placeholder content shown in the BrowserGap area during development.
 * In production, this gap is filled by Electron's BrowserView.
 */
export function MockBrowserContent() {
  const { theme } = useThemeStore()
  const { status } = useRecordingStore()
  const isDark = theme === 'dark'
  const isRecording = status === 'recording'

  return (
    <div className="flex-1 overflow-auto relative" style={{ background: 'var(--color-bg)' }}>
      <div className="p-8 max-w-[680px] mx-auto">
        <div
          className="rounded-[10px] p-6 border"
          style={{ background: 'var(--color-bg3)', borderColor: 'var(--color-border)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <span className="font-bold text-lg">Shopping Cart</span>
            <span className="text-xs" style={{ color: 'var(--color-dim)' }}>
              2 items
            </span>
          </div>

          {/* Items */}
          {[
            { name: 'Wireless Headphones', price: '$79.99', qty: 1 },
            { name: 'USB-C Hub Adapter', price: '$34.99', qty: 2 },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3.5"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              <div>
                <div className="font-medium mb-0.5">{item.name}</div>
                <div className="text-xs" style={{ color: 'var(--color-dim)' }}>
                  {item.price}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="w-7 h-7 rounded-[5px] border flex items-center justify-center cursor-pointer text-sm"
                  style={{
                    background: 'var(--color-bg4)',
                    borderColor: 'var(--color-border2)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  −
                </button>
                <span className="font-mono w-5 text-center">{item.qty}</span>
                <button
                  className="w-7 h-7 rounded-[5px] border flex items-center justify-center cursor-pointer text-sm"
                  style={{
                    background: 'var(--color-bg4)',
                    borderColor: 'var(--color-border2)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  +
                </button>
              </div>
            </div>
          ))}

          {/* Total */}
          <div
            className="mt-4 py-3.5 flex justify-between items-center"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            <span className="font-semibold">Total</span>
            <span className="font-bold text-base">$149.97</span>
          </div>

          {/* Error */}
          <div
            className="mt-3 py-2.5 px-3.5 rounded-[7px] text-xs flex items-center gap-2"
            style={{
              background: isDark ? '#2d1518' : '#fef2f2',
              border: `1px solid ${isDark ? '#5c2328' : '#fecaca'}`,
              color: 'var(--color-red)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Failed to update cart. Please try again.
          </div>

          {/* Checkout button (disabled) */}
          <button
            className="w-full mt-3.5 py-2.5 rounded-lg border-none font-semibold text-[13px] cursor-not-allowed opacity-50"
            style={{
              background: 'var(--color-dim)',
              color: isDark ? '#333' : '#fff',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Checkout
          </button>
        </div>
      </div>

      {/* Recording overlay */}
      {isRecording && (
        <div
          className="absolute top-2.5 right-2.5 px-2.5 py-1.5 rounded-md text-white text-[10px] font-semibold flex items-center gap-1.5"
          style={{
            background: 'var(--color-accent)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          <span
            className="w-[5px] h-[5px] rounded-full bg-white"
            style={{ animation: 'blink 1s step-end infinite' }}
          />
          RECORDING
        </div>
      )}
    </div>
  )
}
