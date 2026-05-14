import { useState, useEffect, useRef } from 'react'

interface Props {
  value:       string
  onChange:    (v: string) => void
  placeholder?: string
  debounceMs?: number
}

export default function SearchBar({ value, onChange, placeholder = 'Search destinations…', debounceMs = 300 }: Props) {
  const [local, setLocal] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // sync when parent resets value
  useEffect(() => { setLocal(value) }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setLocal(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(v), debounceMs)
  }

  function handleClear() {
    setLocal('')
    onChange('')
  }

  return (
    <div className="relative group">
      {/* search icon */}
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-gold transition-colors select-none pointer-events-none">
        ⌕
      </span>

      <input
        type="search"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        className="
          w-full pl-9 pr-9 py-2.5 rounded-sm
          bg-bg-card border border-gold/20
          text-cream text-sm font-proza placeholder:text-text-muted
          focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/20
          transition-all duration-150
        "
        aria-label={placeholder}
      />

      {/* clear button */}
      {local && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-cream transition-colors"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  )
}
