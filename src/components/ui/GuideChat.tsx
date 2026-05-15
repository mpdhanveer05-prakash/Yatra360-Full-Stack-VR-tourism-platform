import { useState, useRef, useEffect } from 'react'
import { useAIStore } from '../../store/aiStore'
import { useUIStore } from '../../store/uiStore'
import { useTourStore } from '../../store/tourStore'
import { useUserStore } from '../../store/userStore'
import { askGuide, getGuideHistory, clearGuideHistory } from '../../api/backend'
import { guideStrings, toLangCode } from '../../i18n/strings'

export default function GuideChat() {
  const { guidePanelOpen, setGuidePanelOpen, narrationLang } = useUIStore()
  const {
    guideMessages, addGuideMessage, setGuideMessages,
    isLoadingGuide, setLoadingGuide,
  } = useAIStore()

  const activeLocation = useTourStore(s => s.activeLocation)
  const currentNode    = useTourStore(s => s.currentNode)
  const userId         = useUserStore(s => s.userId)

  const lang = toLangCode(narrationLang)
  const strings = guideStrings(lang)

  const [input, setInput] = useState('')
  const [lastSource, setLastSource] = useState<string>('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef<string | null>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [guideMessages, guidePanelOpen])

  // Load persisted conversation when the active location changes.
  useEffect(() => {
    if (!activeLocation) return
    const key = `${userId}:${activeLocation.id}`
    if (loadedRef.current === key) return
    loadedRef.current = key
    getGuideHistory(userId, activeLocation.id).then(({ messages }) => {
      if (messages.length === 0) {
        setGuideMessages([])
        return
      }
      setGuideMessages(messages.map(m => ({
        role:    m.role === 'guide' ? 'assistant' as const : 'user' as const,
        content: m.content,
        ts:      m.ts,
      })))
    })
  }, [activeLocation, userId, setGuideMessages])

  async function handleSend() {
    const question = input.trim()
    if (!question || isLoadingGuide || !activeLocation) return

    setInput('')
    addGuideMessage({ role: 'user', content: question })
    setLoadingGuide(true)

    // Build history payload (last 6 turns)
    const history = guideMessages.slice(-6).map(m => ({
      role:    (m.role === 'assistant' ? 'guide' : 'user') as 'user' | 'guide',
      content: m.content,
    }))

    try {
      const reply = await askGuide({
        userId,
        locationId:   activeLocation.id,
        question,
        locationSlug: activeLocation.wikiSlug,
        nodeLabel:    currentNode?.label ?? '',
        lang,
        history,
      })
      addGuideMessage({ role: 'assistant', content: reply.answer })
      setLastSource(reply.sourceSection ?? '')
    } catch {
      addGuideMessage({
        role:    'assistant',
        content: `${activeLocation.name} — ${activeLocation.city}, ${activeLocation.state}. ${activeLocation.description}`,
      })
    } finally {
      setLoadingGuide(false)
    }
  }

  async function handleClear() {
    if (!activeLocation) return
    if (!confirm('Clear this conversation?')) return
    setGuideMessages([])
    setLastSource('')
    await clearGuideHistory(userId, activeLocation.id)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const ToggleBtn = (
    <button
      onClick={() => setGuidePanelOpen(!guidePanelOpen)}
      className="
        flex items-center gap-2 px-3 py-2
        bg-bg-surface/80 backdrop-blur-sm
        border border-gold/30 hover:border-gold/70
        text-gold font-cinzel text-xs tracking-widest uppercase
        transition-all duration-200
        hover:shadow-[0_0_12px_rgba(212,160,23,0.25)]
      "
      aria-label={guidePanelOpen ? 'Close Guide' : 'Ask Guide'}
    >
      <span className="text-base leading-none">{guidePanelOpen ? '✕' : '✦'}</span>
      {guidePanelOpen ? 'Close' : 'Guide'}
    </button>
  )

  return (
    <>
      <div className="absolute bottom-4 left-4 z-30">{ToggleBtn}</div>

      {guidePanelOpen && (
        <div className="
          absolute bottom-16 left-4 z-30
          w-80 sm:w-96 max-h-[28rem] flex flex-col
          bg-bg-surface/95 backdrop-blur-md
          border border-gold/30
          shadow-[0_0_30px_rgba(0,0,0,0.6)]
          rounded-sm overflow-hidden
          animate-slide-up
        ">
          {/* header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gold/20 bg-bg-elevated/50">
            <div className="min-w-0">
              <p className="font-cinzel text-xs tracking-widest text-gold uppercase">{strings.title}</p>
              {activeLocation && (
                <p className="font-proza text-[10px] text-text-muted truncate">
                  {activeLocation.name} · {lang.toUpperCase()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-none">
              {guideMessages.length > 0 && (
                <button
                  onClick={handleClear}
                  aria-label={strings.clear}
                  title={strings.clear}
                  className="text-text-muted hover:text-saffron text-xs"
                >
                  ⟲
                </button>
              )}
              <div className="w-2 h-2 rounded-full bg-saffron animate-pulse" />
            </div>
          </div>

          {/* messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {guideMessages.length === 0 && (
              <p className="font-proza text-xs text-text-muted text-center py-4">
                {strings.emptyPrompt(activeLocation?.name ?? 'this location')}
              </p>
            )}
            {guideMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  max-w-[85%] px-2.5 py-2 rounded-sm text-xs font-proza leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-saffron/20 border border-saffron/30 text-cream ml-auto'
                    : 'bg-bg-card border border-gold/20 text-cream'
                  }
                `}>
                  {msg.role === 'assistant' && (
                    <span className="text-gold font-cinzel text-[9px] tracking-widest block mb-1">Guide ✦</span>
                  )}
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoadingGuide && (
              <div className="flex justify-start">
                <div className="bg-bg-card border border-gold/20 px-3 py-2 rounded-sm">
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* source attribution */}
          {lastSource && !isLoadingGuide && (
            <div className="px-3 py-1.5 border-t border-gold/15 bg-bg-elevated/30">
              <p className="font-mono text-[9px] text-text-muted">
                {strings.source}: <span className="text-gold">{lastSource}</span> · Wikipedia
              </p>
            </div>
          )}

          {/* input */}
          <div className="border-t border-gold/20 p-2.5 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={strings.inputHint}
              disabled={isLoadingGuide}
              aria-label={strings.inputHint}
              className="
                flex-1 bg-bg-elevated border border-gold/20 text-cream text-xs
                font-proza placeholder:text-text-muted
                px-2.5 py-1.5 rounded-sm
                focus:outline-none focus:border-gold/50
                disabled:opacity-50
              "
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoadingGuide}
              aria-label={strings.send}
              className="
                px-3 py-1.5 bg-saffron text-cream font-cinzel text-xs
                tracking-widest uppercase rounded-sm
                hover:bg-saffron-light transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  )
}
