import { useEffect, useRef } from 'react'

export function BrowserGap() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const report = () => {
      const rect = el.getBoundingClientRect()
      window.recon?.setBrowserGapBounds({
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
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
  }, [])

  return (
    <div
      ref={ref}
      className="flex-1"
      style={{ background: 'var(--color-bg)', minHeight: 0 }}
    />
  )
}
