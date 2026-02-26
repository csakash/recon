import { useEffect, useRef } from 'react'
import { useBrowserStore } from '../stores/browser'

export function BrowserGap() {
  const ref = useRef<HTMLDivElement>(null)
  const selectedDevice = useBrowserStore((s) => s.selectedDevice)
  const isRotated = useBrowserStore((s) => s.isRotated)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const report = () => {
      const rect = el.getBoundingClientRect()

      if (!selectedDevice) {
        window.recon?.setBrowserGapBounds({
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        })
        return
      }

      const deviceW = isRotated ? selectedDevice.height : selectedDevice.width
      const deviceH = isRotated ? selectedDevice.width : selectedDevice.height
      const availW = rect.width
      const availH = rect.height

      let viewW = deviceW
      let viewH = deviceH

      if (viewW > availW || viewH > availH) {
        const scale = Math.min(availW / viewW, availH / viewH)
        viewW = Math.floor(viewW * scale)
        viewH = Math.floor(viewH * scale)
      }

      const offsetX = Math.round((availW - viewW) / 2)
      const offsetY = Math.round((availH - viewH) / 2)

      window.recon?.setBrowserGapBounds({
        x: Math.round(rect.x) + offsetX,
        y: Math.round(rect.y) + offsetY,
        width: viewW,
        height: viewH,
      })
    }

    report()
    const observer = new ResizeObserver(report)
    observer.observe(el)
    window.addEventListener('resize', report)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', report)
    }
  }, [selectedDevice, isRotated])

  return (
    <div
      ref={ref}
      className="flex-1 relative"
      style={{
        background: selectedDevice
          ? 'color-mix(in srgb, var(--color-bg) 90%, black)'
          : 'var(--color-bg)',
        minHeight: 0,
      }}
    >
      {selectedDevice && (
        <div
          className="absolute bottom-2 right-3 text-[10px] font-mono z-10 px-2 py-0.5 rounded"
          style={{
            color: 'var(--color-dim)',
            background: 'var(--color-bg2)',
            border: '1px solid var(--color-border)',
          }}
        >
          {isRotated ? selectedDevice.height : selectedDevice.width} &times;{' '}
          {isRotated ? selectedDevice.width : selectedDevice.height}
        </div>
      )}
    </div>
  )
}
