import { Router } from 'express'
import { Session } from '../db/models/Session.js'
import { LocationStats } from '../db/models/LocationStats.js'

const router = Router()

// POST /api/sessions/events
router.post('/events', async (req, res) => {
  try {
    const {
      sessionId, userId, locationId, nodeId,
      eventType, dwellMs, interactionCount,
      timestamp, engagementScore,
    } = req.body as Record<string, unknown>

    await Session.findOneAndUpdate(
      { sessionId },
      {
        $setOnInsert: { userId, locationId, startedAt: timestamp ?? new Date() },
        $push: {
          events: { nodeId, eventType, dwellMs, interactionCount, timestamp: timestamp ?? new Date() },
        },
        $addToSet: { nodesVisited: nodeId },
        $max: { engagementScore: (engagementScore as number) ?? 0 },
      },
      { upsert: true, new: true }
    )

    if (typeof dwellMs === 'number' && nodeId) {
      await LocationStats.findOneAndUpdate(
        { locationId, nodeId },
        { $inc: { totalDwell: dwellMs, visits: 1 } },
        { upsert: true }
      )
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('[sessions/events]', err)
    res.json({ ok: true })
  }
})

// GET /api/sessions/:userId
router.get('/:userId', async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.params.userId })
      .sort({ startedAt: -1 })
      .limit(50)
      .select('locationId startedAt durationMs engagementScore nodesVisited -_id')
    res.json({ sessions })
  } catch {
    res.json({ sessions: [] })
  }
})

export default router
