import { useState, useCallback, useRef, useEffect, ReactNode } from 'react'

interface ResizablePanelProps {
  direction: 'horizontal' | 'vertical'
  handlePosition?: 'start' | 'end'
  minSize: number
  maxSize: number
  defaultSize: number
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export function ResizablePanel({
  direction,
  handlePosition = 'start',
  minSize,
  maxSize,
  defaultSize,
  children,
  className,
  style,
}: ResizablePanelProps) {
  const [size, setSize] = useState(defaultSize)
  const isResizing = useRef(false)
  const startPos = useRef(0)
  const startSize = useRef(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isResizing.current = true
      startPos.current = direction === 'vertical' ? e.clientY : e.clientX
      startSize.current = size
    },
    [direction, size]
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      const delta = direction === 'vertical'
        ? startPos.current - e.clientY // Drag up = bigger for bottom panel
        : e.clientX - startPos.current
      const newSize = Math.min(maxSize, Math.max(minSize, startSize.current + delta))
      setSize(newSize)
    }

    const handleMouseUp = () => {
      isResizing.current = false
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [direction, minSize, maxSize])

  const sizeStyle = direction === 'vertical' ? { height: size } : { width: size }

  return (
    <div className={className} style={{ ...style, ...sizeStyle, position: 'relative' }}>
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute z-10"
        style={{
          ...(direction === 'vertical'
            ? { top: 0, left: 0, right: 0, height: 4, cursor: 'ns-resize' }
            : { top: 0, bottom: 0, width: 4, cursor: 'ew-resize', ...(handlePosition === 'end' ? { right: 0 } : { left: 0 }) }),
        }}
      />
      {children}
    </div>
  )
}
