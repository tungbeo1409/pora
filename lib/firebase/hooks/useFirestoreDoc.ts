/**
 * Optimized Firestore document hook
 * Uses caching and realtime listeners efficiently
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  doc,
  onSnapshot,
  DocumentReference,
  DocumentSnapshot,
  DocumentData,
  getDoc,
  Unsubscribe,
} from 'firebase/firestore'
import { firebaseCache, generateCacheKey } from '../utils/cache'

interface UseFirestoreDocOptions {
  /** Cache TTL in milliseconds (default: 5 minutes) */
  cacheTTL?: number
  /** Enable realtime updates (default: true) */
  realtime?: boolean
  /** Disable cache (default: false) */
  noCache?: boolean
}

interface UseFirestoreDocResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  exists: boolean
  snapshot: DocumentSnapshot<DocumentData> | null
}

/**
 * Hook to fetch and subscribe to a single Firestore document
 * Automatically uses cache and realtime listeners
 */
export function useFirestoreDoc<T = DocumentData>(
  docRef: DocumentReference<DocumentData> | null,
  options: UseFirestoreDocOptions = {}
): UseFirestoreDocResult<T> {
  const { cacheTTL, realtime = true, noCache = false } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [exists, setExists] = useState(false)
  const [snapshot, setSnapshot] = useState<DocumentSnapshot<DocumentData> | null>(null)
  const unsubscribeRef = useRef<Unsubscribe | null>(null)

  // Generate cache key from document path
  const cacheKey = useMemo(() => {
    if (!docRef || noCache) return null
    return generateCacheKey(docRef.path)
  }, [docRef, noCache])

  useEffect(() => {
    if (!docRef) {
      setLoading(false)
      setData(null)
      setExists(false)
      return
    }

    // Check cache first
    if (cacheKey && !noCache) {
      const cached = firebaseCache.get<T>(cacheKey)
      if (cached) {
        setData(cached)
        setExists(true)
        setLoading(false)
        // Still subscribe for realtime updates
        if (!realtime) return
      }
    }

    setLoading(true)
    setError(null)

    // Cleanup previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    if (realtime) {
      // Realtime listener
      unsubscribeRef.current = onSnapshot(
        docRef,
        (snapshot) => {
          const exists = snapshot.exists()
          const docData = exists
            ? ({ id: snapshot.id, ...snapshot.data() } as T)
            : null

          setData(docData)
          setExists(exists)
          setSnapshot(snapshot)
          setLoading(false)
          setError(null)

          // Update cache only if document exists
          if (cacheKey && !noCache && exists && docData) {
            firebaseCache.set(cacheKey, docData, cacheTTL)
          }
        },
        (err) => {
          console.error('Firestore document error:', err)
          setError(err as Error)
          setLoading(false)

          // On error, try to use cache if available
          if (cacheKey && !noCache) {
            const cached = firebaseCache.get<T>(cacheKey)
            if (cached) {
              setData(cached)
              setExists(true)
            }
          }
        }
      )
    } else {
      // One-time fetch
      getDoc(docRef)
        .then((snapshot) => {
          const exists = snapshot.exists()
          const docData = exists
            ? ({ id: snapshot.id, ...snapshot.data() } as T)
            : null

          setData(docData)
          setExists(exists)
          setSnapshot(snapshot)
          setLoading(false)

          // Update cache only if document exists
          if (cacheKey && !noCache && exists && docData) {
            firebaseCache.set(cacheKey, docData, cacheTTL)
          }
        })
        .catch((err) => {
          console.error('Firestore document error:', err)
          setError(err as Error)
          setLoading(false)

          // On error, try to use cache if available
          if (cacheKey && !noCache) {
            const cached = firebaseCache.get<T>(cacheKey)
            if (cached) {
              setData(cached)
              setExists(true)
            }
          }
        })
    }

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [docRef, cacheKey, cacheTTL, realtime, noCache])

  return { data, loading, error, exists, snapshot }
}

