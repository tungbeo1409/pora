/**
 * Base service class for Firestore operations
 * Provides common CRUD operations with caching and optimization
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  DocumentData,
  DocumentReference,
  CollectionReference,
  Timestamp,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../config'
import { firebaseCache, generateCacheKey } from '../utils/cache'
import { batchWriter } from '../utils/batch'

export interface BaseDocument {
  id?: string
  createdAt?: Timestamp | Date
  updatedAt?: Timestamp | Date
}

export class BaseService<T extends BaseDocument> {
  protected collectionPath: string

  constructor(collectionPath: string) {
    this.collectionPath = collectionPath
  }

  /**
   * Get collection reference
   */
  protected getCollectionRef(): CollectionReference<DocumentData> {
    return collection(db, this.collectionPath)
  }

  /**
   * Get document reference
   */
  protected getDocRef(id: string): DocumentReference<DocumentData> {
    return doc(db, this.collectionPath, id)
  }

  /**
   * Get single document by ID
   * Uses cache if available
   */
  async getById(id: string, useCache = true): Promise<T | null> {
    const cacheKey = generateCacheKey(`${this.collectionPath}/${id}`)

    // Check cache first
    if (useCache) {
      const cached = firebaseCache.get<T>(cacheKey)
      if (cached) {
        return cached
      }
    }

    try {
      const docRef = this.getDocRef(id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as T

        // Update cache
        if (useCache) {
          firebaseCache.set(cacheKey, data)
        }

        return data
      }

      return null
    } catch (error) {
      console.error(`Error getting document ${id}:`, error)
      throw error
    }
  }

  /**
   * Get all documents with optional filters
   */
  async getAll(constraints: QueryConstraint[] = [], useCache = true): Promise<T[]> {
    const cacheKey = generateCacheKey(this.collectionPath, { constraints })

    // Check cache first
    if (useCache && constraints.length === 0) {
      const cached = firebaseCache.get<T[]>(cacheKey)
      if (cached) {
        return cached
      }
    }

    try {
      const collectionRef = this.getCollectionRef()
      const q = constraints.length > 0
        ? query(collectionRef, ...constraints)
        : query(collectionRef)

      const querySnapshot = await getDocs(q)
      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[]

      // Update cache (only for simple queries)
      if (useCache && constraints.length === 0) {
        firebaseCache.set(cacheKey, docs)
      }

      return docs
    } catch (error) {
      console.error(`Error getting all documents:`, error)
      throw error
    }
  }

  /**
   * Create or update document
   * Uses batch writer for optimization
   */
  async set(id: string, data: Partial<T>, merge = false, useBatch = true): Promise<void> {
    try {
      const docRef = this.getDocRef(id)
      const now = serverTimestamp()

      const docData: any = {
        ...data,
        updatedAt: now,
      }

      // Add createdAt only if creating new document
      if (!merge) {
        docData.createdAt = now
      }

      if (useBatch) {
        // Use batch writer for optimization
        batchWriter.add(docRef, docData, merge)
      } else {
        // Direct write
        if (merge) {
          await updateDoc(docRef, docData)
        } else {
          await setDoc(docRef, docData)
        }

        // Invalidate cache
        const cacheKey = generateCacheKey(`${this.collectionPath}/${id}`)
        firebaseCache.invalidate(cacheKey)
        firebaseCache.invalidatePattern(this.collectionPath)
      }
    } catch (error) {
      console.error(`Error setting document ${id}:`, error)
      throw error
    }
  }

  /**
   * Update document
   */
  async update(id: string, data: Partial<T>, useBatch = true): Promise<void> {
    return this.set(id, data, true, useBatch)
  }

  /**
   * Create document
   */
  async create(id: string, data: Partial<T>, useBatch = true): Promise<void> {
    return this.set(id, data, false, useBatch)
  }

  /**
   * Delete document
   */
  async delete(id: string, useBatch = false): Promise<void> {
    try {
      const docRef = this.getDocRef(id)

      if (useBatch) {
        // Firestore doesn't support delete in batch through our batch writer
        // So we'll do direct delete
        await deleteDoc(docRef)
      } else {
        await deleteDoc(docRef)
      }

      // Invalidate cache
      const cacheKey = generateCacheKey(`${this.collectionPath}/${id}`)
      firebaseCache.invalidate(cacheKey)
      firebaseCache.invalidatePattern(this.collectionPath)
    } catch (error) {
      console.error(`Error deleting document ${id}:`, error)
      throw error
    }
  }

  /**
   * Query documents with filters
   */
  async query(constraints: QueryConstraint[], useCache = false): Promise<T[]> {
    return this.getAll(constraints, useCache)
  }

  /**
   * Invalidate all cache for this collection
   */
  invalidateCache(): void {
    firebaseCache.invalidatePattern(this.collectionPath)
  }
}

