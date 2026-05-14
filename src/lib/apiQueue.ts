class RequestQueue {
  private queue: (() => Promise<unknown>)[] = []
  private running = false
  private delayMs: number

  constructor(delayMs = 1100) {
    this.delayMs = delayMs
  }

  add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try { resolve(await fn()) } catch (e) { reject(e) }
      })
      if (!this.running) this.flush()
    })
  }

  private async flush() {
    this.running = true
    while (this.queue.length) {
      await this.queue.shift()!()
      if (this.queue.length) {
        await new Promise(r => setTimeout(r, this.delayMs))
      }
    }
    this.running = false
  }
}

export const nominatimQueue  = new RequestQueue(1100)
export const wikimediaQueue  = new RequestQueue(300)
