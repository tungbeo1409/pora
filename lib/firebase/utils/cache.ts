/**
 * Client-side cache utility to minimize Firebase calls
 * Stores data in memory with TTL (Time To Live)
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class FirebaseCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes default

  /**
   * Get cached data if still valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      // Cache expired
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set cache with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    })
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidate cache by pattern (prefix)
   */
  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys())
    for (const key of keys) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }
}

// Singleton instance
export const firebaseCache = new FirebaseCache()

/**
 * Generate cache key from collection path and filters
 */
export function generateCacheKey(collection: string, filters?: Record<string, any>): string {
  if (!filters || Object.keys(filters).length === 0) {
    return collection
  }
  const filterStr = JSON.stringify(filters)
  return `${collection}:${filterStr}`
}

