import type { EngagementEvent } from '../types/tour'

const BATCH_SIZE = 10
const FLUSH_INTERVAL_MS = 5000

class SessionLogger {
  private buffer: EngagementEvent[] = []
  private timer: ReturnType<typeof setInterval> | null = null
  private apiBase: string

  constructor() {
    this.apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'
  }

  start() {
    if (this.timer) return
    this.timer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS)
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null }
    this.flush()
  }

  log(event: EngagementEvent) {
    this.buffer.push(event)
    if (this.buffer.length >= BATCH_SIZE) this.flush()
  }

  private async flush() {
    if (this.buffer.length === 0) return
    const batch = this.buffer.splice(0, this.buffer.length)
    try {
      await fetch(`${this.apiBase}/api/sessions/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
        keepalive: true,
      })
    } catch {
      // silently re-queue on network failure
      this.buffer.unshift(...batch)
    }
  }
}

export const sessionLogger = new SessionLogger()
