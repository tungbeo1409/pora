/**
 * Smart Upload Service
 * - Images: Base64 → Firestore/Realtime DB (if < 500KB)
 * - Videos: Cloudinary → URL vào Firebase
 * - Auto cache vào local storage/IndexedDB
 */

import { storageService } from './storageService'
import { db, rtdb } from '@/lib/firebase/config'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { ref, set, get } from 'firebase/database'
import { localCache } from '@/lib/utils/localCache'

export interface SmartUploadResult {
  url: string // Base64 data URL hoặc Cloudinary URL
  type: 'image' | 'video' | 'audio' | 'file'
  size: number
  cached: boolean // Đã có trong cache chưa
  firebasePath?: string // Path trong Firebase
  thumbnailUrl?: string // For videos
}

class SmartUploadService {
  private readonly MAX_BASE64_SIZE = 500 * 1024 // 500KB
  private readonly IMAGE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days
  private readonly VIDEO_CACHE_TTL = 30 * 24 * 60 * 60 * 1000 // 30 days

  /**
   * Convert file to base64
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Đọc file thất bại'))
      reader.readAsDataURL(file)
    })
  }

  /**
   * Universal upload method - automatically detects file type
   */
  async upload(
    file: File | Blob,
    fileType?: 'image' | 'video' | 'audio' | 'file',
    options?: {
      userId?: string
      conversationId?: string
    }
  ): Promise<SmartUploadResult> {
    // Convert Blob to File if needed
    const uploadFile = file instanceof File 
      ? file 
      : new File([file], `file-${Date.now()}`, { type: file.type || 'application/octet-stream' })
    
    // Auto-detect file type
    let detectedType: 'image' | 'video' | 'audio' | 'file' = fileType || 'file'
    if (!fileType) {
      if (uploadFile.type.startsWith('image/')) {
        detectedType = 'image'
      } else if (uploadFile.type.startsWith('video/')) {
        detectedType = 'video'
      } else if (uploadFile.type.startsWith('audio/')) {
        detectedType = 'audio'
      }
    }

    const userId = options?.userId || 'anonymous'
    const conversationId = options?.conversationId

    // Route to appropriate method
    switch (detectedType) {
      case 'image':
        return this.uploadImage(uploadFile, {
          userId,
          conversationId,
          useRealtimeDB: !!conversationId,
        })
      
      case 'video':
        return this.uploadVideo(uploadFile, {
          userId,
          conversationId,
          saveToFirebase: false, // Don't save to Firebase for chat messages
        })
      
      case 'audio':
        return this.uploadAudio(uploadFile, {
          userId,
          conversationId,
          saveToFirebase: false, // Don't save to Firebase for chat messages
        })
      
      default:
        // For other files, use Cloudinary
        const result = await storageService.uploadFile(uploadFile, {
          folder: `users/${userId}/files`,
          maxSizeMB: 100,
        })
        return {
          url: result.url,
          type: 'file',
          size: uploadFile.size,
          cached: false,
        }
    }
  }

  /**
   * Upload image - Base64 vào Firestore hoặc Realtime DB
   */
  async uploadImage(
    file: File,
    options: {
      userId: string
      collection?: string // Firestore collection (default: 'images')
      useRealtimeDB?: boolean // Use Realtime DB thay vì Firestore
      conversationId?: string // Nếu là chat message
    }
  ): Promise<SmartUploadResult> {
    const { userId, collection = 'images', useRealtimeDB = false, conversationId } = options

    // Check cache first
    const cacheKey = `image_${userId}_${file.name}_${file.size}_${file.lastModified}`
    const cached = await localCache.get<string>(cacheKey)
    if (cached) {
      return {
        url: cached,
        type: 'image',
        size: file.size,
        cached: true,
      }
    }

    // Check size - nếu quá lớn, dùng Cloudinary
    if (file.size > this.MAX_BASE64_SIZE) {
      const result = await storageService.uploadImage(file, {
        folder: `users/${userId}/images`,
        maxSizeMB: 10,
      })

      // Cache Cloudinary URL
      await localCache.set(cacheKey, result.url, this.IMAGE_CACHE_TTL)

      return {
        url: result.url,
        type: 'image',
        size: file.size,
        cached: false,
      }
    }

    // Convert to base64
    const base64 = await this.fileToBase64(file)

    // Save to Firebase
    const timestamp = Date.now()
    const imageId = `img_${timestamp}_${Math.random().toString(36).substr(2, 9)}`

    try {
      if (useRealtimeDB && rtdb) {
        // Lưu vào Realtime DB cho chat messages (real-time sync)
        const dbPath = conversationId
          ? `conversations/${conversationId}/images/${imageId}`
          : `users/${userId}/images/${imageId}`

        const dbRef = ref(rtdb, dbPath)
        await set(dbRef, {
          url: base64,
          name: file.name,
          size: file.size,
          uploadedBy: userId,
          uploadedAt: timestamp,
        })

        // Cache
        await localCache.set(cacheKey, base64, this.IMAGE_CACHE_TTL)

        return {
          url: base64,
          type: 'image',
          size: file.size,
          cached: false,
          firebasePath: dbPath,
        }
      } else {
        // Lưu vào Firestore
        const docRef = doc(db, collection, imageId)
        await setDoc(docRef, {
          url: base64,
          name: file.name,
          size: file.size,
          uploadedBy: userId,
          uploadedAt: timestamp,
        })

        // Cache
        await localCache.set(cacheKey, base64, this.IMAGE_CACHE_TTL)

        return {
          url: base64,
          type: 'image',
          size: file.size,
          cached: false,
          firebasePath: `${collection}/${imageId}`,
        }
      }
    } catch (error) {
      console.error('Error saving image to Firebase:', error)
      throw new Error('Lưu ảnh vào Firebase thất bại')
    }
  }

  /**
   * Upload video - Chỉ dùng Cloudinary
   */
  async uploadVideo(
    file: File,
    options: {
      userId: string
      conversationId?: string
      saveToFirebase?: boolean // Có lưu URL vào Firebase không
    }
  ): Promise<SmartUploadResult> {
    const { userId, conversationId, saveToFirebase = true } = options

    // Check cache
    const cacheKey = `video_${userId}_${file.name}_${file.size}_${file.lastModified}`
    const cached = await localCache.get<string>(cacheKey)
    if (cached) {
      return {
        url: cached,
        type: 'video',
        size: file.size,
        cached: true,
      }
    }

    // Upload to Cloudinary
    const result = await storageService.uploadVideo(file, {
      folder: `users/${userId}/videos`,
      maxSizeMB: 100,
    })

    // Cache URL
    await localCache.set(cacheKey, result.url, this.VIDEO_CACHE_TTL)

    // Save URL to Firebase (optional)
    if (saveToFirebase) {
      const timestamp = Date.now()
      const videoId = `vid_${timestamp}_${Math.random().toString(36).substr(2, 9)}`

      try {
        if (conversationId && rtdb) {
          // Realtime DB cho chat
          const dbPath = `conversations/${conversationId}/videos/${videoId}`
          const dbRef = ref(rtdb, dbPath)
          await set(dbRef, {
            url: result.url,
            thumbnailUrl: result.thumbnailUrl,
            name: file.name,
            size: file.size,
            uploadedBy: userId,
            uploadedAt: timestamp,
          })
        } else {
          // Firestore
          const docRef = doc(db, 'videos', videoId)
          await setDoc(docRef, {
            url: result.url,
            thumbnailUrl: result.thumbnailUrl,
            name: file.name,
            size: file.size,
            uploadedBy: userId,
            uploadedAt: timestamp,
          })
        }
      } catch (error) {
        console.error('Error saving video URL to Firebase:', error)
        // Continue anyway, video is already uploaded to Cloudinary
      }
    }

    return {
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
      type: 'video',
      size: file.size,
      cached: false,
    }
  }

  /**
   * Upload audio - Dùng Cloudinary
   */
  async uploadAudio(
    file: File,
    options: {
      userId: string
      conversationId?: string
      saveToFirebase?: boolean
    }
  ): Promise<SmartUploadResult> {
    const { userId, conversationId, saveToFirebase = true } = options

    // Check cache
    const cacheKey = `audio_${userId}_${file.name}_${file.size}_${file.lastModified}`
    const cached = await localCache.get<string>(cacheKey)
    if (cached) {
      return {
        url: cached,
        type: 'audio',
        size: file.size,
        cached: true,
      }
    }

    // For chat messages (conversationId exists) or small audio files (<500KB), save directly to Realtime Database as Base64
    // This avoids Cloudinary format restrictions (webm is not supported)
    if (conversationId && rtdb && file.size <= this.MAX_BASE64_SIZE) {
      // Convert to base64
      const base64 = await this.fileToBase64(file)
      const timestamp = Date.now()
      const audioId = `aud_${timestamp}_${Math.random().toString(36).substr(2, 9)}`
      const dbPath = `conversations/${conversationId}/audio/${audioId}`
      const dbRef = ref(rtdb, dbPath)
      
      await set(dbRef, {
        url: base64,
        name: file.name,
        size: file.size,
        uploadedBy: userId,
        uploadedAt: timestamp,
      })

      // Cache
      await localCache.set(cacheKey, base64, this.VIDEO_CACHE_TTL)

      return {
        url: base64,
        type: 'audio',
        size: file.size,
        cached: false,
        firebasePath: dbPath,
      }
    }

    // For large audio files or non-chat uploads, check if file format is supported by Cloudinary
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''
    const supportedFormats = ['mp3', 'wav', 'ogg', 'm4a']
    
    if (!supportedFormats.includes(fileExtension)) {
      // If format not supported and no conversationId, try converting to base64 and saving to Realtime DB
      if (rtdb && file.size <= this.MAX_BASE64_SIZE) {
        const base64 = await this.fileToBase64(file)
        const timestamp = Date.now()
        const audioId = `aud_${timestamp}_${Math.random().toString(36).substr(2, 9)}`
        const dbPath = `users/${userId}/audio/${audioId}`
        const dbRef = ref(rtdb, dbPath)
        
        await set(dbRef, {
          url: base64,
          name: file.name,
          size: file.size,
          uploadedBy: userId,
          uploadedAt: timestamp,
        })

        await localCache.set(cacheKey, base64, this.VIDEO_CACHE_TTL)

        return {
          url: base64,
          type: 'audio',
          size: file.size,
          cached: false,
          firebasePath: dbPath,
        }
      }
      // If too large, throw error
      throw new Error(`Định dạng audio không được hỗ trợ: ${fileExtension}. Cho phép: ${supportedFormats.join(', ')} hoặc file <500KB để lưu trực tiếp`)
    }

    // Upload to Cloudinary for supported formats
    const result = await storageService.uploadAudio(file, {
      folder: `users/${userId}/audio`,
      maxSizeMB: 50,
    })

    // Cache URL
    await localCache.set(cacheKey, result.url, this.VIDEO_CACHE_TTL)

    // Save URL to Firebase (optional)
    if (saveToFirebase) {
      const timestamp = Date.now()
      const audioId = `aud_${timestamp}_${Math.random().toString(36).substr(2, 9)}`

      try {
        if (conversationId && rtdb) {
          const dbPath = `conversations/${conversationId}/audio/${audioId}`
          const dbRef = ref(rtdb, dbPath)
          await set(dbRef, {
            url: result.url,
            name: file.name,
            size: file.size,
            uploadedBy: userId,
            uploadedAt: timestamp,
          })
        } else {
          const docRef = doc(db, 'audio', audioId)
          await setDoc(docRef, {
            url: result.url,
            name: file.name,
            size: file.size,
            uploadedBy: userId,
            uploadedAt: timestamp,
          })
        }
      } catch (error) {
        console.error('Error saving audio URL to Firebase:', error)
      }
    }

    return {
      url: result.url,
      type: 'audio',
      size: file.size,
      cached: false,
    }
  }

  /**
   * Get image from Firebase (with cache)
   */
  async getImage(
    imagePath: string,
    useRealtimeDB: boolean = false
  ): Promise<string | null> {
    // Check cache first
    const cacheKey = `firebase_image_${imagePath}`
    const cached = await localCache.get<string>(cacheKey)
    if (cached) return cached

    try {
      let url: string | null = null

      if (useRealtimeDB && rtdb) {
        // Get from Realtime DB
        const dbRef = ref(rtdb, imagePath)
        const snapshot = await get(dbRef)
        if (snapshot.exists()) {
          url = snapshot.val().url
        }
      } else {
        // Get from Firestore
        const [collection, docId] = imagePath.split('/')
        if (collection && docId) {
          const docRef = doc(db, collection, docId)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            url = docSnap.data().url
          }
        }
      }

      if (url) {
        // Cache result
        await localCache.set(cacheKey, url, this.IMAGE_CACHE_TTL)
        return url
      }
    } catch (error) {
      console.error('Error getting image from Firebase:', error)
    }

    return null
  }

  /**
   * Get video from Firebase (just returns URL from cache or Firebase)
   */
  async getVideo(
    videoPath: string,
    useRealtimeDB: boolean = false
  ): Promise<{ url: string; thumbnailUrl?: string } | null> {
    // Check cache first
    const cacheKey = `firebase_video_${videoPath}`
    const cached = await localCache.get<{ url: string; thumbnailUrl?: string }>(cacheKey)
    if (cached) return cached

    try {
      let data: { url: string; thumbnailUrl?: string } | null = null

      if (useRealtimeDB && rtdb) {
        const dbRef = ref(rtdb, videoPath)
        const snapshot = await get(dbRef)
        if (snapshot.exists()) {
          const val = snapshot.val()
          data = {
            url: val.url,
            thumbnailUrl: val.thumbnailUrl,
          }
        }
      } else {
        const [collection, docId] = videoPath.split('/')
        if (collection && docId) {
          const docRef = doc(db, collection, docId)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            const val = docSnap.data()
            data = {
              url: val.url,
              thumbnailUrl: val.thumbnailUrl,
            }
          }
        }
      }

      if (data) {
        await localCache.set(cacheKey, data, this.VIDEO_CACHE_TTL)
        return data
      }
    } catch (error) {
      console.error('Error getting video from Firebase:', error)
    }

    return null
  }
}

export const smartUploadService = new SmartUploadService()

