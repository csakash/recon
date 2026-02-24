import { useState, useEffect, useRef, useCallback } from 'react'

interface SessionReplayProps {
  sessionId: string
  frameCount: number
  duration: number // total duration in ms
  onTimeUpdate: (timeMs: number) => void
}

export function SessionReplay({ sessionId, frameCount, duration, onTimeUpdate }: SessionReplayProps) {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fps = 10
  const frameDuration = 1000 / fps
  const totalFrames = frameCount

  const getFrameSrc = useCallback(
    (frameIdx: number) => {
      const padded = String(frameIdx).padStart(5, '0')
      return `recon-session://${sessionId}/frames/frame-${padded}.png`
    },
    [sessionId]
  )

  useEffect(() => {
    if (isPlaying && totalFrames > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame((prev) => {
          const next = prev + 1
          if (next >= totalFrames) {
            setIsPlaying(false)
            return prev
          }
          return next
        })
      }, frameDuration)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, totalFrames, frameDuration])

  // Sync playback time with current frame
  useEffect(() => {
    const timeMs = duration > 0 ? (currentFrame / Math.max(totalFrames - 1, 1)) * duration : currentFrame * frameDuration
    setPlaybackTime(timeMs)
    onTimeUpdate(timeMs)
  }, [currentFrame, duration, totalFrames, frameDuration, onTimeUpdate])

  const togglePlay = () => {
    if (currentFrame >= totalFrames - 1) {
      setCurrentFrame(0)
    }
    setIsPlaying(!isPlaying)
  }

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const frame = parseInt(e.target.value, 10)
    setCurrentFrame(frame)
    setIsPlaying(false)
  }

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  if (totalFrames === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center text-[12px]"
        style={{ background: 'var(--color-bg)', color: 'var(--color-dim)' }}
      >
        No video frames recorded for this session
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: '#000' }}>
      {/* Frame display */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <img
          src={getFrameSrc(currentFrame)}
          alt={`Frame ${currentFrame + 1}`}
          className="max-w-full max-h-full object-contain"
          draggable={false}
        />
      </div>

      {/* Playback controls */}
      <div
        className="flex items-center gap-3 px-4 py-2 shrink-0"
        style={{ background: 'var(--color-bg2)', borderTop: '1px solid var(--color-border)' }}
      >
        <button
          onClick={togglePlay}
          className="w-[28px] h-[28px] flex items-center justify-center rounded cursor-pointer"
          style={{
            background: 'var(--color-accent)',
            color: '#fff',
            border: 'none',
            fontSize: '12px',
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <span className="text-[11px] font-mono shrink-0" style={{ color: 'var(--color-dim)', width: '42px' }}>
          {formatTime(playbackTime)}
        </span>

        <input
          type="range"
          min={0}
          max={Math.max(totalFrames - 1, 0)}
          value={currentFrame}
          onChange={handleScrub}
          className="flex-1 h-[4px]"
          style={{ accentColor: 'var(--color-accent)' }}
        />

        <span className="text-[11px] font-mono shrink-0" style={{ color: 'var(--color-dim)', width: '42px' }}>
          {formatTime(duration)}
        </span>
      </div>
    </div>
  )
}
