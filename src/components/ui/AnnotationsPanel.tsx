import { useState, useEffect, useCallback } from 'react'
import { useUserStore } from '../../store/userStore'
import {
  listAnnotations, createAnnotation, flagAnnotation, deleteAnnotation,
} from '../../api/annotations'
import type { Annotation } from '../../types/annotation'

interface Props {
  locationId:   string
  locationName: string
  /** Optional current Pannellum yaw/pitch so a "Pin to view" mode could capture coords. */
  getCameraView?: () => { yaw: number; pitch: number } | null
}

/**
 * Floating "Notes" panel — community annotations on a location.
 * Best-effort: silently no-ops if the backend isn't running.
 */
export default function AnnotationsPanel({ locationId, locationName, getCameraView }: Props) {
  const userId = useUserStore(s => s.userId)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Annotation[]>([])
  const [text,  setText]  = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const list = await listAnnotations(locationId)
    setItems(list)
    setLoading(false)
  }, [locationId])

  useEffect(() => {
    if (!open) return
    refresh()
  }, [open, refresh])

  async function handleSubmit() {
    const trimmed = text.trim()
    if (trimmed.length < 2 || submitting) return
    setSubmitting(true)
    setError(null)
    const view = getCameraView?.() ?? null
    const created = await createAnnotation({
      locationId,
      nodeId:    '',
      azimuth:   view?.yaw   ?? 0,
      elevation: view?.pitch ?? 0,
      text:      trimmed,
      authorId:  userId,
    })
    if (created) {
      setItems(prev => [created, ...prev])
      setText('')
    } else {
      setError('Could not post — is the backend running?')
    }
    setSubmitting(false)
  }

  async function handleFlag(id: string) {
    if (!confirm('Flag this note as inappropriate?')) return
    const ok = await flagAnnotation(id)
    if (ok) refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this note?')) return
    const ok = await deleteAnnotation(id, userId)
    if (ok) setItems(prev => prev.filter(a => a._id !== id))
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close notes' : 'Open notes'}
        title={open ? 'Close notes' : `Notes about ${locationName}`}
        className="
          px-2.5 py-1.5 font-mono text-[11px] tracking-widest uppercase rounded-sm
          border border-gold/20 bg-bg-elevated text-text-secondary
          hover:border-gold/50 hover:text-cream transition-colors
        "
      >
        <span aria-hidden>📝</span>
        {items.length > 0 && (
          <span className="ml-1 text-gold">{items.length}</span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Community notes"
          className="
            absolute top-full mt-1 right-0 z-30
            w-80 max-h-[70vh] flex flex-col
            bg-bg-surface/96 backdrop-blur-md
            border border-gold/30 shadow-2xl rounded-sm
            animate-slide-up overflow-hidden
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gold/20 bg-bg-elevated/50">
            <div>
              <p className="font-cinzel text-xs tracking-widest text-gold uppercase">Community Notes</p>
              <p className="font-mono text-[10px] text-text-muted">{items.length} note{items.length === 1 ? '' : 's'}</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-text-muted hover:text-cream">✕</button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {loading ? (
              <p className="font-mono text-[10px] text-text-muted text-center py-4">Loading…</p>
            ) : items.length === 0 ? (
              <p className="font-proza text-xs text-text-muted text-center py-4">
                No notes yet. Be the first to share something about {locationName}.
              </p>
            ) : (
              items.map(a => {
                const own = a.authorId === userId
                return (
                  <div key={a._id} className="bg-bg-card border border-gold/15 rounded-sm p-2.5 space-y-1">
                    <p className="font-proza text-xs text-cream leading-relaxed whitespace-pre-wrap">{a.text}</p>
                    <div className="flex items-center justify-between text-[9px] font-mono text-text-muted">
                      <span>
                        {own ? <span className="text-gold">you</span> : a.authorName}
                        {a.createdAt && ` · ${new Date(a.createdAt).toLocaleDateString()}`}
                      </span>
                      <div className="flex items-center gap-2">
                        {own ? (
                          <button onClick={() => a._id && handleDelete(a._id)} className="hover:text-saffron">delete</button>
                        ) : (
                          <button onClick={() => a._id && handleFlag(a._id)} className="hover:text-saffron">⚑ flag</button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gold/20 p-2.5 space-y-2">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Share a fact, observation, or memory…"
              maxLength={500}
              rows={2}
              className="
                w-full bg-bg-elevated border border-gold/20 text-cream text-xs
                font-proza placeholder:text-text-muted
                px-2.5 py-1.5 rounded-sm resize-none
                focus:outline-none focus:border-gold/50
              "
            />
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] text-text-muted">{text.length}/500</span>
              {error && <span className="font-mono text-[9px] text-saffron">{error}</span>}
              <button
                onClick={handleSubmit}
                disabled={text.trim().length < 2 || submitting}
                className="
                  px-2.5 py-1 bg-saffron text-cream font-cinzel text-[10px]
                  tracking-widest uppercase rounded-sm
                  hover:bg-saffron-light transition-colors
                  disabled:opacity-40
                "
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
