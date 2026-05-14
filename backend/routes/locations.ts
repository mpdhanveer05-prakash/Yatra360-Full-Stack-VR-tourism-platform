import { Router } from 'express'
import { createRequire } from 'module'

const require   = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const locations = require('../../src/data/indiaLocations.json') as any[]

const router    = Router()

// GET /api/locations
router.get('/', (_req, res) => {
  res.json({ locations })
})

// GET /api/locations/:id
router.get('/:id', async (req, res) => {
  const loc = locations.find((l: { id: string }) => l.id === req.params.id)
  if (!loc) return res.status(404).json({ error: 'Location not found' })

  // Inject live Wikipedia summary
  try {
    const wikiRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(loc.wikiSlug as string)}`,
      { headers: { 'User-Agent': 'Yatra360/1.0' }, signal: AbortSignal.timeout(3000) }
    )
    const wiki = await wikiRes.json() as { extract?: string; thumbnail?: { source?: string } }
    return res.json({ ...loc, wikiSummary: wiki.extract, thumbnail: wiki.thumbnail?.source })
  } catch {
    return res.json(loc)
  }
})

// GET /api/heatmap/:locationId
router.get('/:locationId/heatmap', async (_req, res) => {
  // Placeholder — real data comes from LocationStats model
  res.json({ heatmap: {} })
})

export default router
