import { useState, KeyboardEvent } from 'react'
import { useBrowserStore } from '../stores/browser'

export function UrlBar() {
  const { url, setUrl } = useBrowserStore()
  const [inputValue, setInputValue] = useState(url)

  const handleNavigate = () => {
    setUrl(inputValue)
    window.recon?.navigate(inputValue)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleNavigate()
  }

  return (
    <div
      className="h-[44px] flex items-center gap-2 px-3"
      style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg2)' }}
    >
      {/* Nav buttons */}
      <div className="flex gap-1 mr-1">
        {['◀', '▶', '⟳'].map((icon, i) => (
          <button
            key={i}
            onClick={() => {
              if (i === 0) window.recon?.goBack()
              else if (i === 1) window.recon?.goForward()
              else window.recon?.reload()
            }}
            className="w-[26px] h-[26px] rounded-[5px] border flex items-center justify-center cursor-pointer text-[11px]"
            style={{ background: 'none', borderColor: 'var(--color-border)', color: 'var(--color-dim)' }}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* URL input */}
      <div
        className="flex-1 flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 border"
        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-dim)" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none text-[12.5px] font-mono outline-none"
          style={{ color: 'var(--color-text-primary)' }}
        />
      </div>
    </div>
  )
}
