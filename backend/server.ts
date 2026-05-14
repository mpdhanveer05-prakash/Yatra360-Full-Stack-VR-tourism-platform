import { createServer } from 'http'
import express from 'express'
import dotenv from 'dotenv'
import { corsMiddleware } from './middleware/cors.js'
import { apiLimiter } from './middleware/rateLimit.js'
import { connectDB } from './db/mongo.js'
import sessionsRouter from './routes/sessions.js'
import recommendationsRouter from './routes/recommendations.js'
import guideRouter from './routes/guide.js'
import locationsRouter from './routes/locations.js'
import annotationsRouter from './routes/annotations.js'
import classroomRouter from './routes/classroom.js'
import { installCoTour } from './cotour.js'

dotenv.config()

const app   = express()
const PORT  = process.env.PORT ?? 3001

app.use(corsMiddleware)
app.use(express.json({ limit: '1mb' }))
app.use('/api', apiLimiter)

app.use('/api/sessions',    sessionsRouter)
app.use('/api/recommend',   recommendationsRouter)
app.use('/api/guide',       guideRouter)
app.use('/api/locations',   locationsRouter)
app.use('/api/annotations', annotationsRouter)
app.use('/api/classroom',   classroomRouter)

app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() })
})

const httpServer = createServer(app)
installCoTour(httpServer)

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`[Yatra360 API] http://localhost:${PORT}`)
    console.log(`[Yatra360 CoTour] ws://localhost:${PORT}/cotour`)
  })
})
