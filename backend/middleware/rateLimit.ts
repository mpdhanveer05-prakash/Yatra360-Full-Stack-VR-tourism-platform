import rateLimit from 'express-rate-limit'

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      500,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests — please try again later.' },
})

export const guideLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      30,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Guide rate limit exceeded.' },
})
