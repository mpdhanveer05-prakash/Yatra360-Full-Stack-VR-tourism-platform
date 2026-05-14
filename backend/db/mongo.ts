import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

let isConnected = false

export async function connectDB(): Promise<void> {
  if (isConnected) return

  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.warn('[MongoDB] MONGODB_URI not set — running without persistence')
    return
  }

  try {
    await mongoose.connect(uri)
    isConnected = true
    console.log('[MongoDB] Connected to Atlas')
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err)
  }
}

export { mongoose }
