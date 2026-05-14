import { Router } from 'express'
import type { Request, Response } from 'express'
import dotenv from 'dotenv'
import { guideLimiter } from '../middleware/rateLimit.js'
import { Conversation } from '../db/models/Conversation.js'

dotenv.config()

const router    = Router()
const AI_ENGINE = process.env.VITE_AI_ENGINE_URL ?? 'http://localhost:8000'

interface WikiSection { title?: string; content?: string }

async function wikiRagFallback(question: string, locationSlug: string, nodeLabel: string): Promise<{ answer: string; sourceSection: string; confidence: number }> {
  const q = question.toLowerCase()
  const nodeCtx = nodeLabel.toLowerCase()

  // Fetch full sections for RAG context
  const sectionsRes = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/mobile-sections/${encodeURIComponent(locationSlug)}`,
    { headers: { 'User-Agent': 'Yatra360/1.0 (educational project)' }, signal: AbortSignal.timeout(6000) }
  )

  if (!sectionsRes.ok) {
    const summaryRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(locationSlug)}`,
      { headers: { 'User-Agent': 'Yatra360/1.0' }, signal: AbortSignal.timeout(4000) }
    )
    const summary = await summaryRes.json() as { extract?: string }
    return {
      answer: summary.extract ?? 'Information about this location is currently unavailable.',
      sourceSection: 'Introduction',
      confidence: 0.5,
    }
  }

  const data = await sectionsRes.json() as { lead?: { sections?: WikiSection[] }; remaining?: { sections?: WikiSection[] } }

  // Collect all text chunks
  const allText: { text: string; title: string }[] = []

  const addSection = (s: WikiSection) => {
    if (s.content) {
      const plain = s.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      // split into ~500-char chunks
      for (let i = 0; i < plain.length; i += 500) {
        allText.push({ text: plain.slice(i, i + 500), title: s.title ?? 'Introduction' })
      }
    }
  }

  data.lead?.sections?.forEach(addSection)
  data.remaining?.sections?.forEach(addSection)

  if (allText.length === 0) {
    return { answer: 'No detailed information available for this location.', sourceSection: '', confidence: 0.2 }
  }

  // Score chunks by keyword overlap
  const keywords = [...q.split(/\s+/), ...nodeCtx.split(/\s+/)].filter(w => w.length > 3)

  const scored = allText.map(chunk => {
    const t = chunk.text.toLowerCase()
    const score = keywords.reduce((acc, kw) => acc + (t.includes(kw) ? 1 : 0), 0)
    return { ...chunk, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, 3)

  const context = top.map(c => c.text).join(' ')
  const sentences = context.match(/[^.!?]+[.!?]+/g) ?? [context]
  const answer = sentences.slice(0, 4).join(' ').trim()

  return {
    answer: answer || 'Detailed information about this topic is currently unavailable.',
    sourceSection: top[0]?.title ?? 'Wikipedia',
    confidence: Math.min(top[0]?.score / Math.max(keywords.length, 1), 1),
  }
}

// GET /api/guide/history/:userId/:locationId — restore prior conversation
router.get('/history/:userId/:locationId', async (req: Request, res: Response) => {
  try {
    const { userId, locationId } = req.params
    const conv = await Conversation.findOne({ userId, locationId }).lean()
    res.json({
      messages: conv?.messages ?? [],
      lang:     conv?.lang ?? 'en',
    })
  } catch (err) {
    console.error('[guide] history failed:', err)
    res.json({ messages: [], lang: 'en' })
  }
})

// DELETE /api/guide/history/:userId/:locationId — clear conversation
router.delete('/history/:userId/:locationId', async (req: Request, res: Response) => {
  try {
    const { userId, locationId } = req.params
    await Conversation.deleteOne({ userId, locationId })
    res.json({ ok: true })
  } catch (err) {
    console.error('[guide] history delete failed:', err)
    res.status(500).json({ ok: false })
  }
})

// POST /api/guide
router.post('/', guideLimiter, async (req: Request, res: Response) => {
  const {
    userId,
    locationId,
    question,
    locationSlug,
    nodeLabel = '',
    lang      = 'en',
    history   = [],
  } = req.body as {
    userId?:      string
    locationId?:  string
    question:     string
    locationSlug: string
    nodeLabel?:   string
    lang?:        string
    history?:     { role: string; content: string }[]
  }

  let result: { answer: string; sourceSection: string; confidence: number; synth?: string }

  // Try AI engine first
  try {
    const upstream = await fetch(`${AI_ENGINE}/guide`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ question, locationSlug, nodeLabel, lang, history }),
      signal:  AbortSignal.timeout(15000),
    })
    result = await upstream.json()
  } catch {
    // Wikipedia RAG fallback
    try {
      result = await wikiRagFallback(question, locationSlug, nodeLabel)
    } catch (err) {
      console.error('[guide] fallback failed:', err)
      result = { answer: 'The guide is temporarily unavailable. Please try again.', sourceSection: '', confidence: 0 }
    }
  }

  // Persist conversation turn (best-effort)
  if (userId && locationId) {
    try {
      await Conversation.updateOne(
        { userId, locationId },
        {
          $set: { lang },
          $push: {
            messages: {
              $each: [
                { role: 'user',  content: question, ts: Date.now() },
                {
                  role: 'guide', content: result.answer, ts: Date.now(),
                  sourceSection: result.sourceSection ?? '',
                  confidence: result.confidence ?? 0,
                  synth: result.synth ?? '',
                },
              ],
              $slice: -50,  // keep last 50 turns
            },
          },
        },
        { upsert: true },
      )
    } catch (err) {
      console.error('[guide] persist failed:', err)
    }
  }

  res.json(result)
})

export default router
