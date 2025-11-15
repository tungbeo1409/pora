/**
 * Local Storage Cache với IndexedDB cho large data
 * - Small data (< 1MB): localStorage
 * - Large data (> 1MB): IndexedDB
 * - Auto clean expired entries
 */

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number // Time to live in milliseconds
  size: number
}

class LocalCache {
  private dbName = 'pora-cache'
  private storeName = 'files'
  private db: IDBDatabase | null = null
  private readonly MAX_LOCALSTORAGE_SIZE = 1024 * 1024 // 1MB
  private initPromise: Promise<void> | null = null

  /**
   * Initialize IndexedDB
   */
  private async init(): Promise<void> {
    if (typeof window === 'undefined') return

    // If already initializing, wait for it
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onerror = () => {
        this.initPromise = null
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        this.initPromise = null
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName)
        }
      }
    })

    return this.initPromise
  }

  /**
   * Set cache entry
   */
  async set(key: string, data: any, ttl: number = 24 * 60 * 60 * 1000): Promise<void> {
    if (typeof window === 'undefined') return

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
      size: JSON.stringify(data).length,
    }

    // Use localStorage for small data
    if (entry.size < this.MAX_LOCALSTORAGE_SIZE) {
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(entry))
        return
      } catch (e) {
        // localStorage full, fallback to IndexedDB
        console.warn('localStorage full, using IndexedDB for:', key)
      }
    }

    // Use IndexedDB for large data
    if (!this.db) {
      await this.init()
    }

    if (!this.db) {
      console.warn('IndexedDB not available')
      return
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(entry, key)

      request.onsuccess = () => resolve()
      request.onerror = () => {
        console.error('IndexedDB set error:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Get cache entry
   */
  async get<T>(key: string): Promise<T | null> {
    if (typeof window === 'undefined') return null

    // Try localStorage first
    try {
      const cached = localStorage.getItem(`cache_${key}`)
      if (cached) {
        const entry: CacheEntry = JSON.parse(cached)
        const now = Date.now()

        if (now - entry.timestamp < entry.ttl) {
          return entry.data as T
        } else {
          // Expired, remove it
          localStorage.removeItem(`cache_${key}`)
        }
      }
    } catch (e) {
      // Not in localStorage or parse error
    }

    // Try IndexedDB
    if (!this.db) {
      await this.init()
    }

    if (!this.db) return null

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)

      request.onsuccess = () => {
        const entry: CacheEntry | undefined = request.result

        if (entry) {
          const now = Date.now()
          if (now - entry.timestamp < entry.ttl) {
            resolve(entry.data as T)
          } else {
            // Expired, delete it
            this.delete(key)
            resolve(null)
          }
        } else {
          resolve(null)
        }
      }

      request.onerror = () => {
        console.error('IndexedDB get error:', request.error)
        resolve(null)
      }
    })
  }

  /**
   * Delete cache entry
   */
  async delete(key: string): Promise<void> {
    if (typeof window === 'undefined') return

    // Delete from localStorage
    try {
      localStorage.removeItem(`cache_${key}`)
    } catch (e) {
      // Ignore
    }

    // Delete from IndexedDB
    if (!this.db) {
      await this.init()
    }

    if (!this.db) return

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => {
        console.error('IndexedDB delete error:', request.error)
        resolve()
      }
    })
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (typeof window === 'undefined') return

    // Clear localStorage cache
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('cache_'))
      keys.forEach((k) => localStorage.removeItem(k))
    } catch (e) {
      // Ignore
    }

    // Clear IndexedDB
    if (!this.db) {
      await this.init()
    }

    if (!this.db) return

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => {
        console.error('IndexedDB clear error:', request.error)
        resolve()
      }
    })
  }

  /**
   * Check if key exists and is valid
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key)
    return data !== null
  }

  /**
   * Get cache size (approximate)
   */
  async getSize(): Promise<{ localStorage: number; indexedDB: number }> {
    if (typeof window === 'undefined') {
      return { localStorage: 0, indexedDB: 0 }
    }

    let localStorageSize = 0
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('cache_'))
      localStorageSize = keys.reduce((size, key) => {
        const item = localStorage.getItem(key)
        return size + (item ? item.length : 0)
      }, 0)
    } catch (e) {
      // Ignore
    }

    // IndexedDB size is harder to calculate, return 0 for now
    return { localStorage: localStorageSize, indexedDB: 0 }
  }
}

export const localCache = new LocalCache()

