import { Router } from 'express'
import type { Request, Response } from 'express'
import dotenv from 'dotenv'

dotenv.config()

const router     = Router()
const AI_ENGINE  = process.env.VITE_AI_ENGINE_URL ?? 'http://localhost:8000'

// POST /api/recommend
router.post('/', async (req: Request, res: Response) => {
  try {
    const upstream = await fetch(`${AI_ENGINE}/recommend`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(req.body),
      signal:  AbortSignal.timeout(5000),
    })
    const data = await upstream.json()
    res.json(data)
  } catch {
    // AI engine offline — client will use local cosine engine
    res.json({ recommendations: [] })
  }
})

export default router
