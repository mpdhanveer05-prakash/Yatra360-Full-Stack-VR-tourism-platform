import { Router } from 'express'
import type { Request, Response } from 'express'
import { Annotation } from '../db/models/Annotation.js'

const router = Router()

const HIDE_AFTER_FLAGS = 3

// GET /api/annotations/:locationId
router.get('/:locationId', async (req: Request, res: Response) => {
  try {
    const annotations = await Annotation
      .find({ locationId: req.params.locationId, hidden: false })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
    res.json({ annotations })
  } catch (err) {
    console.error('[annotations] list failed:', err)
    res.json({ annotations: [] })
  }
})

// POST /api/annotations
router.post('/', async (req: Request, res: Response) => {
  try {
    const { locationId, nodeId = '', azimuth, elevation, text, authorId, authorName = 'Anonymous' } = req.body as {
      locationId: string
      nodeId?:    string
      azimuth:    number
      elevation:  number
      text:       string
      authorId:   string
      authorName?:string
    }
    if (!locationId || !text || authorId == null) {
      return res.status(400).json({ ok: false, error: 'missing fields' })
    }
    if (typeof text !== 'string' || text.trim().length < 2 || text.length > 500) {
      return res.status(400).json({ ok: false, error: 'invalid text length' })
    }
    const created = await Annotation.create({
      locationId, nodeId, azimuth, elevation,
      text: text.trim(), authorId, authorName,
    })
    res.json({ ok: true, annotation: created.toObject() })
  } catch (err) {
    console.error('[annotations] create failed:', err)
    res.status(500).json({ ok: false })
  }
})

// POST /api/annotations/:id/flag
router.post('/:id/flag', async (req: Request, res: Response) => {
  try {
    const ann = await Annotation.findById(req.params.id)
    if (!ann) return res.status(404).json({ ok: false })
    ann.flags = (ann.flags ?? 0) + 1
    if (ann.flags >= HIDE_AFTER_FLAGS) ann.hidden = true
    await ann.save()
    res.json({ ok: true, hidden: ann.hidden })
  } catch (err) {
    console.error('[annotations] flag failed:', err)
    res.status(500).json({ ok: false })
  }
})

// DELETE /api/annotations/:id — author-only
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { authorId } = req.query as { authorId?: string }
    if (!authorId) return res.status(400).json({ ok: false })
    const ann = await Annotation.findById(req.params.id)
    if (!ann) return res.status(404).json({ ok: false })
    if (ann.authorId !== authorId) return res.status(403).json({ ok: false })
    await ann.deleteOne()
    res.json({ ok: true })
  } catch (err) {
    console.error('[annotations] delete failed:', err)
    res.status(500).json({ ok: false })
  }
})

export default router
