import { useThemeStore } from '../stores/theme'
import { useRecordingStore } from '../stores/recording'

export function TitleBar() {
  const { theme, toggle } = useThemeStore()
  const { status, elapsed, micActive } = useRecordingStore()
  const isDark = theme === 'dark'
  const isRecording = status === 'recording'

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div
      className="h-[42px] flex items-center justify-between px-4 border-b border-border shrink-0 select-none"
      style={{ background: 'var(--color-bg2)', WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left: traffic light spacer + brand */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {/* Traffic light spacer (macOS) */}
        <div className="w-[68px]" />
        <div className="flex items-center gap-1.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
          </svg>
          <span className="font-bold text-sm tracking-tight">
            recon<span style={{ color: 'var(--color-accent)' }}>.</span>
          </span>
        </div>
      </div>

      {/* Right: recording indicator + theme toggle */}
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {isRecording && (
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-md mr-2"
            style={{ background: 'var(--color-accent-bg)', animation: 'pulse 2s ease-in-out infinite' }}
          >
            <span
              className="w-[7px] h-[7px] rounded-full"
              style={{ background: 'var(--color-accent)', animation: 'blink 1s step-end infinite' }}
            />
            <span className="font-mono text-xs font-medium" style={{ color: 'var(--color-accent)' }}>
              REC {formatTime(elapsed)}
            </span>
            {micActive && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--color-accent)" stroke="none">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="var(--color-accent)" strokeWidth="2" />
              </svg>
            )}
          </div>
        )}
        <button
          onClick={toggle}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-md border cursor-pointer"
          style={{
            background: 'none',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {isDark ? '☀' : '☾'} {isDark ? 'Light' : 'Dark'}
        </button>
      </div>
    </div>
  )
}
