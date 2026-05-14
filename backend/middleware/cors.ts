import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

export const corsMiddleware = cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173',
    process.env.FRONTEND_URL ?? '',
  ].filter(Boolean),
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
})
