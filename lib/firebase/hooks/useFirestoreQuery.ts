/**
 * Optimized Firestore query hook
 * Uses caching and realtime listeners efficiently
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  query,
  onSnapshot,
  Query,
  QuerySnapshot,
  DocumentData,
  getDocs,
  QueryDocumentSnapshot,
  Unsubscribe,
} from 'firebase/firestore'
import { firebaseCache, generateCacheKey } from '../utils/cache'

interface UseFirestoreQueryOptions {
  /** Cache TTL in milliseconds (default: 5 minutes) */
  cacheTTL?: number
  /** Enable realtime updates (default: true) */
  realtime?: boolean
  /** Disable cache (default: false) */
  noCache?: boolean
}

interface UseFirestoreQueryResult<T> {
  data: T[] | null
  loading: boolean
  error: Error | null
  snapshot: QuerySnapshot<DocumentData> | null
}

/**
 * Hook to fetch and subscribe to Firestore queries
 * Automatically uses cache and realtime listeners
 */
export function useFirestoreQuery<T = DocumentData>(
  firestoreQuery: Query<DocumentData> | null,
  options: UseFirestoreQueryOptions = {}
): UseFirestoreQueryResult<T> {
  const { cacheTTL, realtime = true, noCache = false } = options
  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [snapshot, setSnapshot] = useState<QuerySnapshot<DocumentData> | null>(null)
  const unsubscribeRef = useRef<Unsubscribe | null>(null)
  const queryKeyRef = useRef<string | null>(null)

  // Generate cache key from query
  const cacheKey = useMemo(() => {
    if (!firestoreQuery || noCache) return null
    // Simple cache key generation - use query string representation
    // Note: Query.toString() provides a unique representation of the query
    try {
      const queryStr = firestoreQuery.toString()
      return generateCacheKey('query', { query: queryStr })
    } catch {
      // Fallback: use a simple hash based on query object identity
      return generateCacheKey('query', { query: JSON.stringify(firestoreQuery) })
    }
  }, [firestoreQuery, noCache])

  useEffect(() => {
    if (!firestoreQuery) {
      setLoading(false)
      setData(null)
      return
    }

    // Check cache first
    if (cacheKey && !noCache) {
      const cached = firebaseCache.get<T[]>(cacheKey)
      if (cached) {
        setData(cached)
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
        firestoreQuery,
        (snapshot) => {
          const docs: T[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[]

          setData(docs)
          setSnapshot(snapshot)
          setLoading(false)
          setError(null)

          // Update cache
          if (cacheKey && !noCache) {
            firebaseCache.set(cacheKey, docs, cacheTTL)
          }
        },
        (err) => {
          console.error('Firestore query error:', err)
          setError(err as Error)
          setLoading(false)

          // On error, try to use cache if available
          if (cacheKey && !noCache) {
            const cached = firebaseCache.get<T[]>(cacheKey)
            if (cached) {
              setData(cached)
            }
          }
        }
      )
    } else {
      // One-time fetch
      getDocs(firestoreQuery)
        .then((snapshot) => {
          const docs: T[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[]

          setData(docs)
          setSnapshot(snapshot)
          setLoading(false)

          // Update cache
          if (cacheKey && !noCache) {
            firebaseCache.set(cacheKey, docs, cacheTTL)
          }
        })
        .catch((err) => {
          console.error('Firestore query error:', err)
          setError(err as Error)
          setLoading(false)

          // On error, try to use cache if available
          if (cacheKey && !noCache) {
            const cached = firebaseCache.get<T[]>(cacheKey)
            if (cached) {
              setData(cached)
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
  }, [firestoreQuery, cacheKey, cacheTTL, realtime, noCache])

  return { data, loading, error, snapshot }
}

