import { useState, useEffect, useRef, useCallback } from 'react'
import { useUserStore } from '../../store/userStore'
import { useCoTour } from '../../hooks/useCoTour'
import type { CameraSnapshot } from '../viewer/PannellumTour'

interface Props {
  locationId:   string
  locationName: string
  getSnapshot:  () => CameraSnapshot | null
  onLeaderCamera?: (cam: { scene: string; yaw: number; pitch: number; hfov: number }) => void
}

/**
 * Floating co-tour panel — create/join a room, see participants, chat,
 * and follow the leader's camera.
 */
export default function CoTourPanel({ locationId, locationName, getSnapshot, onLeaderCamera }: Props) {
  const userId = useUserStore(s => s.userId)
  const [open, setOpen] = useState(false)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [name, setName] = useState(() => localStorage.getItem('yatra360-name') ?? 'Explorer')
  const [following, setFollowing] = useState(true)
  const [chatInput, setChatInput] = useState('')

  useEffect(() => { localStorage.setItem('yatra360-name', name) }, [name])

  const co = useCoTour({
    roomId, userId, userName: name, locationId,
    enabled: !!roomId,
  })

  // Broadcast our camera @ 5 Hz
  const lastSentRef = useRef(0)
  useEffect(() => {
    if (!co.connected) return
    const id = setInterval(() => {
      const snap = getSnapshot()
      if (!snap) return
      if (performance.now() - lastSentRef.current < 180) return
      lastSentRef.current = performance.now()
      co.sendCamera({ scene: snap.nodeId, yaw: snap.yaw, pitch: snap.pitch, hfov: snap.hfov })
    }, 200)
    return () => clearInterval(id)
  }, [co, getSnapshot])

  // Follow leader: apply incoming camera updates if following is enabled
  useEffect(() => {
    if (!following || !co.room?.leaderId) return
    if (co.room.leaderId === userId) return  // we ARE the leader
    const cam = co.peerCameras.get(co.room.leaderId)
    if (!cam || !onLeaderCamera) return
    onLeaderCamera(cam)
  }, [co.peerCameras, co.room, following, userId, onLeaderCamera])

  const generateCode = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let out = ''
    for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)]
    return `co-${out}`
  }, [])

  const inviteUrl = roomId
    ? `${window.location.origin}/tour/${locationId}?room=${encodeURIComponent(roomId)}`
    : ''

  function handleStart() {
    const id = generateCode()
    setRoomId(id)
  }

  function handleLeave() {
    setRoomId(null)
  }

  function handleCopy() {
    if (!inviteUrl) return
    navigator.clipboard?.writeText(inviteUrl).catch(() => window.prompt('Copy invite link:', inviteUrl))
  }

  function handleChat(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && chatInput.trim()) {
      e.preventDefault()
      co.sendChat(chatInput)
      setChatInput('')
    }
  }

  const leaderName = co.room?.participants.find(p => p.userId === co.room?.leaderId)?.name ?? '—'
  const youAreLeader = co.room?.leaderId === userId

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close co-tour' : 'Open co-tour'}
        title="Watch together"
        className="
          px-2.5 py-1.5 font-mono text-[11px] tracking-widest uppercase rounded-sm
          border border-gold/20 bg-bg-elevated text-text-secondary
          hover:border-gold/50 hover:text-cream transition-colors
          relative
        "
      >
        <span aria-hidden>👥</span>
        {co.connected && (
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-saffron animate-pulse" />
        )}
        {co.room?.participants.length ? (
          <span className="ml-1 text-gold">{co.room.participants.length}</span>
        ) : null}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Co-tour"
          className="
            absolute top-full mt-1 right-0 z-30
            w-80 max-h-[70vh] flex flex-col
            bg-bg-surface/96 backdrop-blur-md
            border border-gold/30 shadow-2xl rounded-sm
            animate-slide-up overflow-hidden
          "
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-gold/20 bg-bg-elevated/50">
            <div>
              <p className="font-cinzel text-xs tracking-widest text-gold uppercase">Watch Together</p>
              <p className="font-mono text-[10px] text-text-muted truncate">{locationName}</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-text-muted hover:text-cream">✕</button>
          </div>

          {!roomId ? (
            <div className="p-3 space-y-3">
              <div className="space-y-1">
                <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase">Your name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-bg-elevated border border-gold/20 text-cream text-xs font-proza px-2.5 py-1.5 rounded-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <button onClick={handleStart} className="btn-primary w-full text-xs">
                Start a watch party →
              </button>
              <p className="font-proza text-[10px] text-text-muted leading-relaxed">
                A room invite link will be created. Share it with friends — you'll
                all see the same view, in sync.
              </p>
            </div>
          ) : !co.connected ? (
            <div className="p-6 text-center">
              <div className="w-6 h-6 border-2 border-saffron border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="font-mono text-[10px] text-text-muted">Connecting…</p>
              <p className="font-mono text-[9px] text-text-muted mt-2">Needs backend running on port 3001.</p>
              <button onClick={handleLeave} className="mt-4 font-mono text-[10px] text-saffron underline">Cancel</button>
            </div>
          ) : (
            <>
              {/* Room info */}
              <div className="px-3 py-2 border-b border-gold/15 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={inviteUrl}
                    className="flex-1 bg-bg-elevated border border-gold/20 text-cream text-[10px] font-mono px-2 py-1 rounded-sm"
                    onFocus={e => e.currentTarget.select()}
                  />
                  <button onClick={handleCopy} className="font-mono text-[9px] tracking-widest uppercase px-2 py-1 bg-saffron text-cream rounded-sm hover:bg-saffron-light">
                    Copy
                  </button>
                </div>
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-text-muted">
                    Leader: <span className="text-gold">{leaderName}</span>
                    {youAreLeader && <span className="ml-1 text-saffron">(you)</span>}
                  </span>
                  {!youAreLeader && (
                    <button onClick={co.claimLeader} className="text-saffron hover:underline">
                      Take lead
                    </button>
                  )}
                </div>
                <label className="flex items-center gap-2 font-mono text-[10px] text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={following}
                    onChange={e => setFollowing(e.target.checked)}
                    className="accent-saffron"
                    disabled={youAreLeader}
                  />
                  Follow leader's view
                </label>
              </div>

              {/* Participants */}
              <div className="px-3 py-2 border-b border-gold/15">
                <p className="font-mono text-[9px] tracking-widest text-text-muted uppercase mb-1.5">
                  Participants ({co.room?.participants.length ?? 0})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {co.room?.participants.map(p => (
                    <span
                      key={p.userId}
                      className="font-mono text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ background: p.color + '22', color: p.color, border: `1px solid ${p.color}55` }}
                    >
                      {p.name}{p.userId === userId ? ' (you)' : ''}
                    </span>
                  ))}
                </div>
              </div>

              {/* Chat */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
                {co.chat.length === 0 ? (
                  <p className="font-proza text-[11px] text-text-muted text-center py-2">
                    Say hi…
                  </p>
                ) : (
                  co.chat.map((m, i) => (
                    <div key={i} className="font-proza text-[11px] leading-relaxed">
                      <span className="font-cinzel font-bold" style={{ color: m.color }}>{m.name}: </span>
                      <span className="text-cream">{m.text}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-gold/15 p-2.5 flex gap-2">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleChat}
                  placeholder="Say something…"
                  className="flex-1 bg-bg-elevated border border-gold/20 text-cream text-xs font-proza px-2.5 py-1.5 rounded-sm focus:outline-none focus:border-gold/50"
                />
                <button onClick={handleLeave} className="font-mono text-[10px] tracking-widest uppercase px-2 py-1.5 bg-bg-elevated border border-gold/20 text-text-secondary hover:text-saffron hover:border-saffron/50 rounded-sm">
                  Leave
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
