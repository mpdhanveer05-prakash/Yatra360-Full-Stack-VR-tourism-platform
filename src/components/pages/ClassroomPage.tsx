import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../../store/userStore'
import {
  createClassroom, joinClassroom, listTeacherClassrooms,
  getClassroomHeatmap, patchClassroom,
} from '../../api/classroom'
import type { Classroom, ClassroomHeatmap } from '../../types/classroom'
import locations from '../../data/indiaLocations.json'
import type { IndiaLocation } from '../../types/location'

const allLocations = locations as IndiaLocation[]
const locById = new Map(allLocations.map(l => [l.id, l]))

type Mode = 'pick' | 'teacher' | 'student'

export default function ClassroomPage() {
  const navigate  = useNavigate()
  const userId    = useUserStore(s => s.userId)

  const [mode, setMode] = useState<Mode>('pick')
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [classes, setClasses] = useState<Classroom[]>([])
  const [activeClass, setActiveClass] = useState<Classroom | null>(null)
  const [heatmap, setHeatmap] = useState<ClassroomHeatmap | null>(null)

  const refreshTeacher = useCallback(async () => {
    if (mode !== 'teacher') return
    const cls = await listTeacherClassrooms(userId)
    setClasses(cls)
  }, [mode, userId])

  useEffect(() => { refreshTeacher() }, [refreshTeacher])

  const refreshHeatmap = useCallback(async (code: string) => {
    const data = await getClassroomHeatmap(code)
    setHeatmap(data)
  }, [])

  useEffect(() => {
    if (!activeClass) return
    refreshHeatmap(activeClass.code)
    const id = setInterval(() => refreshHeatmap(activeClass.code), 10000)
    return () => clearInterval(id)
  }, [activeClass, refreshHeatmap])

  async function handleCreate() {
    if (!name.trim()) { setError('Pick a class name'); return }
    const cls = await createClassroom({ name: name.trim(), teacherId: userId, teacherName: 'Teacher' })
    if (!cls) { setError('Backend offline — create class needs the API running'); return }
    setActiveClass(cls)
    setName('')
    refreshTeacher()
  }

  async function handleJoin() {
    if (!joinCode.trim()) { setError('Enter a class code'); return }
    const cls = await joinClassroom(joinCode.trim().toUpperCase(), userId)
    if (!cls) { setError('Invalid code or backend offline'); return }
    if (cls.assignedLocationId) navigate(`/tour/${cls.assignedLocationId}`)
    else setError('Joined — your teacher will assign a location soon.')
  }

  async function setAssignment(locId: string) {
    if (!activeClass) return
    const updated = await patchClassroom(activeClass.code, {
      teacherId: userId, assignedLocationId: locId,
    })
    if (updated) setActiveClass(updated)
  }

  // ── PICK ROLE ─────────────────────────────────────────────────────────────
  if (mode === 'pick') {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-6 py-16">
        <div className="max-w-2xl w-full space-y-10 text-center">
          <div>
            <p className="font-mono text-xs tracking-[0.3em] text-saffron uppercase mb-2">For Classrooms</p>
            <h1 className="font-cinzel text-3xl text-cream">Teach with Yatra360</h1>
            <p className="font-proza text-sm text-text-secondary mt-3 max-w-lg mx-auto">
              Assign a destination to your students, then see real-time engagement
              heatmaps as they explore.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => setMode('teacher')} className="card p-6 space-y-2 hover:shadow-[0_0_22px_rgba(212,160,23,0.18)] transition-all text-left">
              <div className="text-4xl" aria-hidden>📚</div>
              <h2 className="font-cinzel text-lg text-gold">I'm a Teacher</h2>
              <p className="font-proza text-xs text-text-secondary">Create a class, share the code with students, monitor their progress.</p>
            </button>
            <button onClick={() => setMode('student')} className="card p-6 space-y-2 hover:shadow-[0_0_22px_rgba(255,107,26,0.18)] transition-all text-left">
              <div className="text-4xl" aria-hidden>🎒</div>
              <h2 className="font-cinzel text-lg text-saffron">I'm a Student</h2>
              <p className="font-proza text-xs text-text-secondary">Enter the class code from your teacher and start exploring.</p>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STUDENT ───────────────────────────────────────────────────────────────
  if (mode === 'student') {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full space-y-6">
          <button onClick={() => setMode('pick')} className="font-mono text-xs text-text-secondary hover:text-cream">← Back</button>
          <div>
            <p className="font-mono text-xs tracking-[0.3em] text-saffron uppercase mb-2">Student</p>
            <h1 className="font-cinzel text-2xl text-cream">Join a Class</h1>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABCDEF"
              maxLength={6}
              autoComplete="off"
              aria-label="Class code"
              className="w-full bg-bg-card border border-[var(--border)] text-cream font-cinzel text-2xl tracking-[0.5em] text-center px-4 py-3 focus:outline-none focus:border-gold/50"
            />
            <button onClick={handleJoin} disabled={joinCode.length < 6} className="btn-primary w-full disabled:opacity-40">
              Join class →
            </button>
            {error && <p className="font-mono text-xs text-saffron text-center">{error}</p>}
          </div>
        </div>
      </div>
    )
  }

  // ── TEACHER ───────────────────────────────────────────────────────────────
  const assignedLoc = activeClass?.assignedLocationId ? locById.get(activeClass.assignedLocationId) : null

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <button onClick={() => { setMode('pick'); setActiveClass(null) }} className="font-mono text-xs text-text-secondary hover:text-cream">← Back</button>

        <div>
          <p className="font-mono text-xs tracking-[0.3em] text-saffron uppercase mb-1">Teacher</p>
          <h1 className="font-cinzel text-2xl text-cream">Classroom Dashboard</h1>
        </div>

        {!activeClass ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create class */}
            <div className="card p-5 space-y-3">
              <h2 className="font-cinzel text-base text-gold">Create a new class</h2>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Grade 7 History — Section B"
                className="w-full bg-bg-card border border-[var(--border)] text-cream font-proza text-sm px-3 py-2 focus:outline-none focus:border-gold/50"
              />
              <button onClick={handleCreate} className="btn-primary text-xs w-full">Create class</button>
              {error && <p className="font-mono text-xs text-saffron">{error}</p>}
            </div>

            {/* Existing classes */}
            <div className="card p-5 space-y-3">
              <h2 className="font-cinzel text-base text-gold">Your classes</h2>
              {classes.length === 0 ? (
                <p className="font-proza text-xs text-text-muted">No classes yet. Create your first one.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {classes.map(c => (
                    <button
                      key={c._id}
                      onClick={() => setActiveClass(c)}
                      className="w-full flex items-center justify-between text-left p-2 bg-bg-elevated/40 hover:bg-bg-elevated transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-cinzel text-xs text-cream truncate">{c.name}</p>
                        <p className="font-mono text-[9px] text-text-muted">{c.studentIds.length} student{c.studentIds.length === 1 ? '' : 's'}</p>
                      </div>
                      <span className="font-mono text-xs text-gold tracking-[0.2em]">{c.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Class header */}
            <div className="card p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-cinzel text-lg text-cream">{activeClass.name}</h2>
                <p className="font-mono text-[10px] text-text-muted">
                  {activeClass.studentIds.length} students · created {new Date(activeClass.createdAt ?? '').toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase">Class code</p>
                <p className="font-cinzel font-black text-3xl text-gold tracking-[0.3em]">{activeClass.code}</p>
              </div>
              <button onClick={() => setActiveClass(null)} className="font-mono text-xs text-text-secondary hover:text-cream">← Back to classes</button>
            </div>

            {/* Assignment */}
            <div className="card p-5 space-y-3">
              <h3 className="font-cinzel text-sm text-gold">Assigned destination</h3>
              <select
                value={activeClass.assignedLocationId}
                onChange={e => setAssignment(e.target.value)}
                className="w-full bg-bg-card border border-[var(--border)] text-cream font-proza text-sm px-3 py-2 focus:outline-none focus:border-gold/50"
              >
                <option value="">— No assignment yet —</option>
                {allLocations.sort((a, b) => a.name.localeCompare(b.name)).map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.state})</option>
                ))}
              </select>
              {assignedLoc && (
                <button onClick={() => navigate(`/tour/${assignedLoc.id}`)} className="btn-secondary text-xs">
                  Preview the tour →
                </button>
              )}
            </div>

            {/* Heatmap */}
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-cinzel text-sm text-gold">Live engagement heatmap</h3>
                <span className="font-mono text-[10px] text-text-muted">refreshes every 10s</span>
              </div>
              {!heatmap || !assignedLoc ? (
                <p className="font-proza text-xs text-text-muted">Assign a location to start collecting data.</p>
              ) : heatmap.sessions === 0 ? (
                <p className="font-proza text-xs text-text-muted">
                  No student sessions yet for <span className="text-cream">{assignedLoc.name}</span>.
                  Share code <span className="text-gold font-mono">{activeClass.code}</span> with students to begin.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="font-mono text-[10px] text-text-muted">
                    {heatmap.sessions} session{heatmap.sessions === 1 ? '' : 's'} · {heatmap.students} student{heatmap.students === 1 ? '' : 's'}
                  </p>
                  <div className="space-y-1">
                    {assignedLoc.nodes.map(node => {
                      const score = heatmap.heatmap[node.id] ?? 0
                      const pct = Math.round(score * 100)
                      return (
                        <div key={node.id} className="flex items-center gap-3">
                          <p className="font-cinzel text-xs text-cream w-40 truncate flex-none">{node.label}</p>
                          <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-saffron to-gold transition-[width] duration-500" style={{ width: `${Math.max(2, pct)}%` }} />
                          </div>
                          <span className="font-mono text-[10px] text-gold w-10 text-right">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
