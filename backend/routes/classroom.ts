import { Router } from 'express'
import type { Request, Response } from 'express'
import { Classroom } from '../db/models/Classroom.js'
import { Session } from '../db/models/Session.js'

const router = Router()

function genCode(): string {
  // 6-char alphanumeric (avoid 0/O/1/I for clarity)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

// POST /api/classroom — create
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, teacherId, teacherName, assignedLocationId, notes } = req.body as {
      name: string; teacherId: string; teacherName?: string
      assignedLocationId?: string; notes?: string
    }
    if (!name || !teacherId) return res.status(400).json({ ok: false, error: 'missing fields' })

    // Generate unique code (collision-retry up to 5x)
    let code = ''
    for (let i = 0; i < 5; i++) {
      code = genCode()
      const exists = await Classroom.exists({ code })
      if (!exists) break
    }
    const cls = await Classroom.create({
      code, name, teacherId, teacherName: teacherName ?? 'Teacher',
      assignedLocationId: assignedLocationId ?? '', notes: notes ?? '',
    })
    res.json({ ok: true, classroom: cls.toObject() })
  } catch (err) {
    console.error('[classroom] create failed:', err)
    res.status(500).json({ ok: false })
  }
})

// POST /api/classroom/join — student joins by code
router.post('/join', async (req: Request, res: Response) => {
  try {
    const { code, studentId } = req.body as { code: string; studentId: string }
    if (!code || !studentId) return res.status(400).json({ ok: false })
    const cls = await Classroom.findOneAndUpdate(
      { code: code.toUpperCase() },
      { $addToSet: { studentIds: studentId } },
      { new: true },
    ).lean()
    if (!cls) return res.status(404).json({ ok: false, error: 'invalid code' })
    res.json({ ok: true, classroom: cls })
  } catch (err) {
    console.error('[classroom] join failed:', err)
    res.status(500).json({ ok: false })
  }
})

// GET /api/classroom/teacher/:teacherId — list a teacher's classes
router.get('/teacher/:teacherId', async (req: Request, res: Response) => {
  try {
    const classes = await Classroom.find({ teacherId: req.params.teacherId })
      .sort({ updatedAt: -1 }).lean()
    res.json({ classrooms: classes })
  } catch (err) {
    console.error('[classroom] list failed:', err)
    res.json({ classrooms: [] })
  }
})

// GET /api/classroom/:code — fetch one classroom
router.get('/:code', async (req: Request, res: Response) => {
  try {
    const cls = await Classroom.findOne({ code: req.params.code.toUpperCase() }).lean()
    if (!cls) return res.status(404).json({ ok: false })
    res.json({ ok: true, classroom: cls })
  } catch (err) {
    console.error('[classroom] fetch failed:', err)
    res.status(500).json({ ok: false })
  }
})

// GET /api/classroom/:code/heatmap — aggregated engagement for assigned location
router.get('/:code/heatmap', async (req: Request, res: Response) => {
  try {
    const cls = await Classroom.findOne({ code: req.params.code.toUpperCase() }).lean()
    if (!cls || !cls.assignedLocationId) {
      return res.json({ heatmap: {}, students: 0, sessions: 0 })
    }
    const sessions = await Session.find({
      userId:     { $in: cls.studentIds },
      locationId: cls.assignedLocationId,
    }).lean()

    const heatmap: Record<string, number> = {}
    let visitCount: Record<string, number> = {}
    for (const s of sessions) {
      for (const nodeId of s.nodesVisited ?? []) {
        heatmap[nodeId]    = (heatmap[nodeId] ?? 0) + (s.engagementScore ?? 0)
        visitCount[nodeId] = (visitCount[nodeId] ?? 0) + 1
      }
    }
    // Normalize
    for (const k of Object.keys(heatmap)) {
      heatmap[k] = heatmap[k] / Math.max(visitCount[k], 1)
    }

    res.json({
      heatmap,
      students: cls.studentIds.length,
      sessions: sessions.length,
      assignedLocationId: cls.assignedLocationId,
    })
  } catch (err) {
    console.error('[classroom] heatmap failed:', err)
    res.status(500).json({ heatmap: {}, students: 0, sessions: 0 })
  }
})

// PATCH /api/classroom/:code — teacher updates assignment
router.patch('/:code', async (req: Request, res: Response) => {
  try {
    const { teacherId, assignedLocationId, notes, name } = req.body as {
      teacherId: string
      assignedLocationId?: string
      notes?: string
      name?: string
    }
    const cls = await Classroom.findOne({ code: req.params.code.toUpperCase() })
    if (!cls) return res.status(404).json({ ok: false })
    if (cls.teacherId !== teacherId) return res.status(403).json({ ok: false })

    if (assignedLocationId !== undefined) cls.assignedLocationId = assignedLocationId
    if (notes !== undefined)              cls.notes = notes
    if (name !== undefined)               cls.name = name
    await cls.save()
    res.json({ ok: true, classroom: cls.toObject() })
  } catch (err) {
    console.error('[classroom] patch failed:', err)
    res.status(500).json({ ok: false })
  }
})

export default router
