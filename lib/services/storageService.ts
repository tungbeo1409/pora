/**
 * Unified Storage Service
 * Abstraction layer for file storage
 * Currently supports: Cloudinary, ImgBB, Base64 (limited)
 */

import { cloudinaryService, UploadResult } from './cloudinaryService'

export type StorageProvider = 'cloudinary' | 'imgbb' | 'base64'

export interface FileUploadResult {
  url: string
  thumbnailUrl?: string
  publicId?: string
  name: string
  size: number
  type: string
  format: string
  width?: number
  height?: number
  duration?: number
}

export interface UploadConfig {
  provider?: StorageProvider
  folder?: string
  maxSizeMB?: number
  allowedFormats?: string[]
}

class StorageService {
  private defaultProvider: StorageProvider = 'cloudinary'

  /**
   * Upload image
   */
  async uploadImage(
    file: File,
    config: UploadConfig = {}
  ): Promise<FileUploadResult> {
    const provider = config.provider || this.defaultProvider

    switch (provider) {
      case 'cloudinary':
        const result = await cloudinaryService.uploadImage(
          file,
          config.folder,
          config.maxSizeMB
        )
        return {
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          publicId: result.publicId,
          name: file.name,
          size: result.bytes,
          type: 'image',
          format: result.format,
          width: result.width,
          height: result.height,
        }

      case 'base64':
        return this.uploadAsBase64(file)

      default:
        throw new Error(`Provider ${provider} chưa được hỗ trợ`)
    }
  }

  /**
   * Upload video
   */
  async uploadVideo(
    file: File,
    config: UploadConfig = {}
  ): Promise<FileUploadResult> {
    const provider = config.provider || this.defaultProvider

    switch (provider) {
      case 'cloudinary':
        const result = await cloudinaryService.uploadVideo(
          file,
          config.folder,
          config.maxSizeMB
        )
        return {
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          publicId: result.publicId,
          name: file.name,
          size: result.bytes,
          type: 'video',
          format: result.format,
          width: result.width,
          height: result.height,
          duration: result.duration,
        }

      default:
        throw new Error(`Provider ${provider} chưa được hỗ trợ cho video`)
    }
  }

  /**
   * Upload audio
   */
  async uploadAudio(
    file: File,
    config: UploadConfig = {}
  ): Promise<FileUploadResult> {
    const provider = config.provider || this.defaultProvider

    switch (provider) {
      case 'cloudinary':
        const result = await cloudinaryService.uploadAudio(
          file,
          config.folder,
          config.maxSizeMB
        )
        return {
          url: result.url,
          publicId: result.publicId,
          name: file.name,
          size: result.bytes,
          type: 'audio',
          format: result.format,
          duration: result.duration,
        }

      default:
        throw new Error(`Provider ${provider} chưa được hỗ trợ cho audio`)
    }
  }

  /**
   * Upload any file
   */
  async uploadFile(
    file: File,
    config: UploadConfig = {}
  ): Promise<FileUploadResult> {
    // Auto-detect type
    if (file.type.startsWith('image/')) {
      return this.uploadImage(file, config)
    } else if (file.type.startsWith('video/')) {
      return this.uploadVideo(file, config)
    } else if (file.type.startsWith('audio/')) {
      return this.uploadAudio(file, config)
    } else {
      // Generic file
      const provider = config.provider || this.defaultProvider
      if (provider === 'cloudinary') {
        const result = await cloudinaryService.uploadFileGeneric(
          file,
          config.folder,
          config.maxSizeMB
        )
        return {
          url: result.url,
          publicId: result.publicId,
          name: file.name,
          size: result.bytes,
          type: 'file',
          format: result.format,
        }
      }
      throw new Error(`Provider ${provider} chưa được hỗ trợ cho file type này`)
    }
  }

  /**
   * Upload as Base64 (for small files < 1MB)
   * WARNING: Only use for very small files, inefficient
   */
  private async uploadAsBase64(file: File): Promise<FileUploadResult> {
    // Check size limit (Firestore document limit is 1MB)
    const maxSize = 900 * 1024 // ~900KB to be safe
    if (file.size > maxSize) {
      throw new Error('File quá lớn cho Base64. Vui lòng sử dụng Cloudinary.')
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        const base64 = reader.result as string
        resolve({
          url: base64, // Data URL
          name: file.name,
          size: file.size,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          format: file.name.split('.').pop() || '',
        })
      }

      reader.onerror = () => {
        reject(new Error('Đọc file thất bại'))
      }

      reader.readAsDataURL(file)
    })
  }

  /**
   * Delete file
   */
  async deleteFile(publicId: string, provider?: StorageProvider): Promise<void> {
    const storageProvider = provider || this.defaultProvider

    switch (storageProvider) {
      case 'cloudinary':
        await cloudinaryService.deleteFile(publicId)
        break

      default:
        console.warn(`Delete not supported for ${storageProvider}`)
    }
  }
}

export const storageService = new StorageService()

