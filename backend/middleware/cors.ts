import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

// Origins we always allow (localhost dev servers + explicit FRONTEND_URL env)
const STATIC_ALLOW = new Set<string>([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://localhost:3000',
])

// FRONTEND_URL env can be a single URL or a comma-separated list.
const envOrigins = (process.env.FRONTEND_URL ?? '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)
for (const o of envOrigins) STATIC_ALLOW.add(o)

// Any *.vercel.app subdomain (production + preview deployments).
// Useful since Vercel previews use random hashes that change per deploy.
const VERCEL_RE = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i

// Any Render service URL — useful for cross-service testing.
const RENDER_RE = /^https:\/\/[a-z0-9-]+\.onrender\.com$/i

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // No Origin header → server-to-server, curl, etc. — allow.
    if (!origin) return callback(null, true)
    if (STATIC_ALLOW.has(origin)) return callback(null, true)
    if (VERCEL_RE.test(origin))   return callback(null, true)
    if (RENDER_RE.test(origin))   return callback(null, true)
    // Reject everything else.
    callback(new Error(`Not allowed by CORS: ${origin}`))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
})
