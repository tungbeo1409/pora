/**
 * Batch operations utility to minimize Firebase writes
 * Collects multiple operations and executes them in batches
 */

import { writeBatch, doc, Firestore } from 'firebase/firestore'
import { db } from '../config'

interface PendingWrite {
  ref: any // DocumentReference
  data: any
  merge?: boolean
}

class BatchWriter {
  private pendingWrites: PendingWrite[] = []
  private batchSize = 500 // Firestore batch limit
  private flushTimer: NodeJS.Timeout | null = null
  private flushDelay = 1000 // 1 second delay to collect writes

  /**
   * Add a write operation to the batch
   */
  add(ref: any, data: any, merge = false): void {
    this.pendingWrites.push({ ref, data, merge })

    // Auto-flush if batch is full
    if (this.pendingWrites.length >= this.batchSize) {
      this.flush()
      return
    }

    // Schedule flush after delay (debounce)
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
    }

    this.flushTimer = setTimeout(() => {
      this.flush()
    }, this.flushDelay)
  }

  /**
   * Flush all pending writes
   */
  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }

    if (this.pendingWrites.length === 0) return

    const writes = [...this.pendingWrites]
    this.pendingWrites = []

    // Split into batches of 500 (Firestore limit)
    for (let i = 0; i < writes.length; i += this.batchSize) {
      const batch = writeBatch(db)
      const batchWrites = writes.slice(i, i + this.batchSize)

      for (const write of batchWrites) {
        if (write.merge) {
          batch.set(write.ref, write.data, { merge: true })
        } else {
          batch.set(write.ref, write.data)
        }
      }

      try {
        await batch.commit()
      } catch (error) {
        console.error('Batch write error:', error)
        // Re-queue failed writes
        this.pendingWrites.unshift(...batchWrites)
        throw error
      }
    }
  }

  /**
   * Get pending writes count
   */
  getPendingCount(): number {
    return this.pendingWrites.length
  }
}

// Singleton instance
export const batchWriter = new BatchWriter()

/**
 * Flush batch writer on page unload
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    batchWriter.flush()
  })
}

