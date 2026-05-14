import { useState } from 'react'

interface Props {
  /** Builds the share URL on click (so it reads current camera state lazily). */
  getUrl:  () => string
  label?:  string
  compact?: boolean
}

/** Copy-current-view button. Falls back to manual prompt if clipboard unavailable. */
export default function ShareButton({ getUrl, label = 'Share view', compact = false }: Props) {
  const [copied, setCopied] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function handleClick() {
    setError(null)
    const url = getUrl()
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Yatra360', url })
        setCopied(true)
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        setCopied(true)
      } else {
        window.prompt('Copy this link:', url)
      }
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // user-cancelled navigator.share() throws — silent.
      if ((err as Error).name !== 'AbortError') {
        setError('Could not copy')
        setTimeout(() => setError(null), 2000)
      }
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label={label}
      className="
        px-2.5 py-1.5 font-mono text-[11px] tracking-widest uppercase rounded-sm
        border border-gold/20 bg-bg-elevated text-text-secondary
        hover:border-gold/50 hover:text-cream transition-colors
      "
      title={label}
    >
      <span aria-hidden>{copied ? '✓' : error ? '✕' : '🔗'}</span>
      {!compact && (
        <span className="ml-1.5">
          {copied ? 'Copied' : error ?? 'Share'}
        </span>
      )}
    </button>
  )
}
