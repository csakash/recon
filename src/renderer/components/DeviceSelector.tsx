import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useBrowserStore } from '../stores/browser'
import { DEVICE_PRESETS } from '../constants/devicePresets'

const categories = ['desktop', 'tablet', 'mobile'] as const
const categoryLabels: Record<(typeof categories)[number], string> = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile',
}

export function DeviceSelector() {
  const { selectedDevice, isRotated, setDevice, toggleRotation } = useBrowserStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })

  const updateDropdownPos = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 4, left: rect.left })
    }
  }, [])

  useEffect(() => {
    if (!open) return
    updateDropdownPos()
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        ref.current && !ref.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, updateDropdownPos])

  const displayName = selectedDevice ? selectedDevice.name : 'Responsive'
  const effectiveWidth = selectedDevice
    ? isRotated
      ? selectedDevice.height
      : selectedDevice.width
    : null
  const effectiveHeight = selectedDevice
    ? isRotated
      ? selectedDevice.width
      : selectedDevice.height
    : null

  return (
    <div ref={ref} className="relative flex items-center gap-1">
      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-[5px] border px-2 py-1 cursor-pointer text-[11px]"
        style={{
          background: 'none',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-primary)',
          whiteSpace: 'nowrap',
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-dim)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {selectedDevice?.category === 'mobile' ? (
            <>
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <line x1="12" y1="18" x2="12" y2="18" />
            </>
          ) : selectedDevice?.category === 'tablet' ? (
            <>
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="12" y1="18" x2="12" y2="18" />
            </>
          ) : (
            <>
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </>
          )}
        </svg>
        <span>{displayName}</span>
        {effectiveWidth != null && (
          <span style={{ color: 'var(--color-dim)' }}>
            {effectiveWidth}&times;{effectiveHeight}
          </span>
        )}
      </button>

      {/* Rotation toggle — only for tablet/mobile */}
      {selectedDevice && selectedDevice.category !== 'desktop' && (
        <button
          onClick={toggleRotation}
          className="w-[26px] h-[26px] rounded-[5px] border flex items-center justify-center cursor-pointer text-[11px]"
          style={{
            background: 'none',
            borderColor: 'var(--color-border)',
            color: 'var(--color-dim)',
          }}
          title="Rotate"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 4v6h6" />
            <path d="M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10" />
            <path d="M3.51 15A9 9 0 0 0 18.36 18.36L23 14" />
          </svg>
        </button>
      )}

      {/* Dropdown via portal to avoid overflow clipping */}
      {open && createPortal(
        <div
          ref={dropdownRef}
          className="rounded-lg overflow-hidden"
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            zIndex: 9999,
            background: 'var(--color-bg3)',
            border: '1px solid var(--color-border)',
            minWidth: '240px',
            maxHeight: '400px',
            overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          {/* Responsive option */}
          <button
            onClick={() => {
              setDevice(null)
              setOpen(false)
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[11px] cursor-pointer"
            style={{
              background: !selectedDevice ? 'var(--color-hover)' : 'transparent',
              color: 'var(--color-text-primary)',
              border: 'none',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              if (selectedDevice) e.currentTarget.style.background = 'var(--color-hover)'
            }}
            onMouseLeave={(e) => {
              if (selectedDevice) e.currentTarget.style.background = 'transparent'
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-dim)"
              strokeWidth="2"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <span>Responsive</span>
          </button>

          <div style={{ borderTop: '1px solid var(--color-border)' }} />

          {categories.map((cat) => (
            <div key={cat}>
              <div
                className="text-[10px] uppercase tracking-wider px-3 py-1.5"
                style={{ color: 'var(--color-dim)' }}
              >
                {categoryLabels[cat]}
              </div>
              {DEVICE_PRESETS.filter((p) => p.category === cat).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setDevice(preset)
                    setOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] cursor-pointer"
                  style={{
                    background:
                      selectedDevice?.id === preset.id ? 'var(--color-hover)' : 'transparent',
                    color: 'var(--color-text-primary)',
                    border: 'none',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedDevice?.id !== preset.id)
                      e.currentTarget.style.background = 'var(--color-hover)'
                  }}
                  onMouseLeave={(e) => {
                    if (selectedDevice?.id !== preset.id)
                      e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span>{preset.name}</span>
                  <span style={{ color: 'var(--color-dim)' }}>
                    {preset.width}&times;{preset.height}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}
