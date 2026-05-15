import { useEffect, useRef } from 'react'
import type { VoiceAgentState } from '../../hooks/useVoiceAgent'

interface Props {
  state:      VoiceAgentState
  transcript: string
  answer:     string
  errorMsg:   string
  supported:  boolean
  onStart:    () => void
  onStop:     () => void
  onReset:    () => void
  /** Which side the popup bubble extends from. Default 'right' (button on screen-LEFT). */
  bubbleSide?: 'left' | 'right'
}

// Sound-wave bars — animated when speaking, static otherwise
function WaveBars({ active, color }: { active: boolean; color: string }) {
  const heights = [40, 65, 85, 100, 85, 65, 40]
  return (
    <div className="flex items-center justify-center gap-[2px] h-6 w-8">
      {heights.map((h, i) => (
        <span
          key={i}
          style={{
            height:           `${h}%`,
            backgroundColor:  color,
            animationDelay:   `${i * 0.07}s`,
          }}
          className={`
            w-[3px] rounded-full
            ${active ? 'animate-voice-bar' : ''}
          `}
        />
      ))}
    </div>
  )
}

// Mic SVG icon
function MicIcon({ muted = false }: { muted?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
      {muted && <line x1="4" y1="4" x2="20" y2="20" className="text-red-400" />}
    </svg>
  )
}

// Spinner
function Spinner() {
  return (
    <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
  )
}

const STATE_STYLES: Record<VoiceAgentState, { ring: string; bg: string; label: string }> = {
  idle:       { ring: 'ring-gold/40 hover:ring-gold/70',          bg: 'bg-bg-elevated',   label: 'Ask the guide' },
  listening:  { ring: 'ring-red-400/80 animate-pulse',            bg: 'bg-red-900/40',    label: 'Listening…' },
  processing: { ring: 'ring-saffron/60',                          bg: 'bg-bg-elevated',   label: 'Thinking…' },
  speaking:   { ring: 'ring-gold/70',                             bg: 'bg-bg-elevated',   label: 'Speaking…' },
  error:      { ring: 'ring-red-500/60 hover:ring-red-400/80',   bg: 'bg-red-900/30',    label: 'Error — tap to retry' },
}

export default function VoiceAgentButton({
  state, transcript, answer, errorMsg, supported, onStart, onStop, onReset,
  bubbleSide = 'right',
}: Props) {
  const bubbleRef = useRef<HTMLDivElement>(null)

  // Auto-dismiss error after 6s
  useEffect(() => {
    if (state !== 'error') return
    const t = setTimeout(onReset, 6000)
    return () => clearTimeout(t)
  }, [state, onReset])

  // Auto-dismiss answer bubble 8s after speaking ends
  useEffect(() => {
    if (state !== 'idle' || !answer) return
    const t = setTimeout(onReset, 8000)
    return () => clearTimeout(t)
  }, [state, answer, onReset])

  const s = STATE_STYLES[state]

  function handleClick() {
    if (!supported) return
    if (state === 'listening') { onStop(); return }
    if (state === 'error')     { onReset(); return }
    if (state === 'idle')      { onStart(); return }
    if (state === 'speaking')  { onStop(); return }
  }

  const showBubble = !!(transcript || answer || errorMsg)

  return (
    <div className="relative flex flex-col items-center gap-2 select-none">

      {/* Conversation bubble */}
      {showBubble && (
        <div
          ref={bubbleRef}
          className={`
            absolute bottom-[calc(100%+12px)] ${bubbleSide === 'right' ? 'left-0' : 'right-0'}
            w-72 max-h-64 overflow-y-auto
            bg-bg-surface/97 backdrop-blur-md
            border border-gold/30 rounded-sm shadow-2xl
            p-3 space-y-2
            animate-slide-up
          `}
        >
          {/* User question */}
          {transcript && (
            <div className="space-y-0.5">
              <p className="font-mono text-[9px] tracking-widest text-text-muted uppercase">You said</p>
              <p className="font-proza text-xs text-cream leading-relaxed">"{transcript}"</p>
            </div>
          )}

          {/* Processing indicator */}
          {state === 'processing' && (
            <div className="flex items-center gap-2 pt-1">
              <div className="w-3 h-3 border border-saffron border-t-transparent rounded-full animate-spin flex-none" />
              <p className="font-mono text-[10px] text-saffron">Consulting the guide…</p>
            </div>
          )}

          {/* Answer */}
          {answer && (
            <div className="space-y-0.5 border-t border-gold/15 pt-2">
              <div className="flex items-center gap-1.5">
                <p className="font-mono text-[9px] tracking-widest text-gold uppercase">Guide</p>
                {state === 'speaking' && <WaveBars active color="#D4A017" />}
              </div>
              <p className="font-proza text-xs text-text-secondary leading-relaxed">{answer}</p>
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div className="flex items-start gap-2 text-red-400">
              <span className="text-sm flex-none">⚠</span>
              <p className="font-proza text-[11px] leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {/* Triangle pointer — anchored to the side opposite the bubble extension */}
          <div className={`absolute -bottom-[6px] ${bubbleSide === 'right' ? 'left-5' : 'right-5'} w-3 h-3 bg-bg-surface/97 border-r border-b border-gold/30 rotate-45`} />
        </div>
      )}

      {/* Main button */}
      <button
        onClick={handleClick}
        disabled={!supported || state === 'processing'}
        aria-label={supported ? s.label : 'Voice agent not supported in this browser'}
        title={supported ? s.label : 'Microphone / speech recognition not available'}
        className={`
          relative w-11 h-11 rounded-full flex items-center justify-center
          ring-2 transition-all duration-200
          ${s.ring} ${s.bg}
          ${!supported ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          ${state === 'processing' ? 'cursor-not-allowed' : ''}
        `}
      >
        {/* Listening pulse rings */}
        {state === 'listening' && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-400/20 animate-ping" />
            <span className="absolute inset-[-6px] rounded-full ring-1 ring-red-400/30 animate-pulse" />
          </>
        )}

        {/* Icon by state */}
        {state === 'idle'       && <span className="text-gold"><MicIcon /></span>}
        {state === 'listening'  && <span className="text-red-300"><MicIcon /></span>}
        {state === 'processing' && <Spinner />}
        {state === 'speaking'   && <WaveBars active color="#D4A017" />}
        {state === 'error'      && <span className="text-red-400 font-bold text-sm">✕</span>}
      </button>

      {/* State label */}
      <p className="font-mono text-[9px] tracking-widest text-text-muted uppercase whitespace-nowrap">
        {supported ? s.label : 'No mic support'}
      </p>
    </div>
  )
}
