import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { AuthUser } from '../db/models/AuthUser.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me-in-production'
const TOKEN_TTL  = '7d'

interface SignupBody {
  username:    string
  email:       string
  password:    string
  displayName?: string
}

interface LoginBody {
  username: string
  password: string
}

function signToken(userId: string, username: string): string {
  return jwt.sign({ sub: userId, username }, JWT_SECRET, { expiresIn: TOKEN_TTL })
}

function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1
}

router.post('/signup', async (req: Request, res: Response) => {
  if (!isMongoConnected()) {
    return res.status(503).json({ error: 'Database unavailable' })
  }

  const { username, email, password, displayName }: SignupBody = req.body ?? {}

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email, and password are required' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }
  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' })
  }

  try {
    const exists = await AuthUser.findOne({ $or: [{ username }, { email }] }).lean()
    if (exists) {
      return res.status(409).json({ error: 'Username or email already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await AuthUser.create({
      username:    username.toLowerCase(),
      email:       email.toLowerCase(),
      passwordHash,
      displayName: displayName ?? username,
    })

    const token = signToken(user.id, user.username)
    return res.status(201).json({
      token,
      user: { id: user.id, username: user.username, email: user.email, displayName: user.displayName },
    })
  } catch (err) {
    console.error('[auth/signup]', err)
    return res.status(500).json({ error: 'Signup failed' })
  }
})

router.post('/login', async (req: Request, res: Response) => {
  if (!isMongoConnected()) {
    return res.status(503).json({ error: 'Database unavailable' })
  }

  const { username, password }: LoginBody = req.body ?? {}
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' })
  }

  try {
    const user = await AuthUser.findOne({
      $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
    })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = signToken(user.id, user.username)
    return res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, displayName: user.displayName },
    })
  } catch (err) {
    console.error('[auth/login]', err)
    return res.status(500).json({ error: 'Login failed' })
  }
})

router.get('/me', async (req: Request, res: Response) => {
  const auth = req.headers.authorization ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return res.status(401).json({ error: 'No token' })

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; username: string }
    if (!isMongoConnected()) {
      return res.json({ user: { id: payload.sub, username: payload.username } })
    }
    const user = await AuthUser.findById(payload.sub).lean()
    if (!user) return res.status(404).json({ error: 'User not found' })
    return res.json({
      user: { id: String(user._id), username: user.username, email: user.email, displayName: user.displayName },
    })
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
})

export default router
