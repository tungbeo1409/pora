/**
 * Cloudinary Upload Service
 * Handles file uploads to Cloudinary
 * Free tier: 25GB storage, 25GB bandwidth/month
 */

export interface UploadResult {
  url: string
  publicId: string
  width?: number
  height?: number
  format: string
  bytes: number
  duration?: number // For video/audio
  thumbnailUrl?: string // For video
}

export interface UploadOptions {
  folder?: string // e.g., 'posts', 'avatars', 'messages'
  resourceType?: 'image' | 'video' | 'raw' | 'auto'
  maxSizeMB?: number
  allowedFormats?: string[] // e.g., ['jpg', 'png', 'gif']
}

class CloudinaryService {
  private cloudName: string
  private uploadPreset: string
  private apiKey?: string

  constructor() {
    // Get from environment variables or hardcode (not recommended for production)
    this.cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ''
    this.uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ''
    this.apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY

    if (!this.cloudName || !this.uploadPreset) {
      console.warn('Cloudinary not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET')
    }
  }

  /**
   * Upload file to Cloudinary
   * @param file - File object to upload
   * @param options - Upload options
   */
  async uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
    if (!this.cloudName || !this.uploadPreset) {
      throw new Error('Cloudinary chưa được cấu hình. Vui lòng cài đặt environment variables.')
    }

    // Validate file size
    const maxSizeMB = options.maxSizeMB || 10 // Default 10MB
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      throw new Error(`File quá lớn. Kích thước tối đa: ${maxSizeMB}MB`)
    }

    // Validate file format
    if (options.allowedFormats && options.allowedFormats.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      if (!fileExtension || !options.allowedFormats.includes(fileExtension)) {
        throw new Error(`Định dạng file không được hỗ trợ. Cho phép: ${options.allowedFormats.join(', ')}`)
      }
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', this.uploadPreset)
    formData.append('cloud_name', this.cloudName)

    // Add folder if specified
    if (options.folder) {
      formData.append('folder', options.folder)
    }

    // Add resource type
    if (options.resourceType) {
      formData.append('resource_type', options.resourceType)
    }

    // Optimize images automatically
    formData.append('fetch_format', 'auto')
    formData.append('quality', 'auto')

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Upload thất bại')
      }

      const data = await response.json()

      // For videos, generate thumbnail
      let thumbnailUrl: string | undefined
      if (options.resourceType === 'video' || data.resource_type === 'video') {
        thumbnailUrl = data.secure_url.replace(`.${data.format}`, '.jpg')
      }

      return {
        url: data.secure_url,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
        format: data.format,
        bytes: data.bytes,
        duration: data.duration,
        thumbnailUrl,
      }
    } catch (error: any) {
      console.error('Cloudinary upload error:', error)
      throw new Error(error.message || 'Upload file thất bại')
    }
  }

  /**
   * Upload image
   */
  async uploadImage(
    file: File,
    folder?: string,
    maxSizeMB = 10
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: folder || 'images',
      resourceType: 'image',
      maxSizeMB,
      allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    })
  }

  /**
   * Upload video
   */
  async uploadVideo(
    file: File,
    folder?: string,
    maxSizeMB = 100
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: folder || 'videos',
      resourceType: 'video',
      maxSizeMB,
      allowedFormats: ['mp4', 'webm', 'mov'],
    })
  }

  /**
   * Upload audio
   */
  async uploadAudio(
    file: File,
    folder?: string,
    maxSizeMB = 50
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: folder || 'audio',
      resourceType: 'raw', // Cloudinary treats audio as raw
      maxSizeMB,
      allowedFormats: ['mp3', 'wav', 'ogg', 'm4a'],
    })
  }

  /**
   * Upload any file
   */
  async uploadFileGeneric(
    file: File,
    folder?: string,
    maxSizeMB = 10
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: folder || 'files',
      resourceType: 'raw',
      maxSizeMB,
    })
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<void> {
    if (!this.cloudName || !this.apiKey) {
      throw new Error('Cloudinary chưa được cấu hình')
    }

    try {
      // Note: This requires server-side implementation with secret key
      // For now, we'll just log it
      console.warn('Delete file requires server-side implementation:', publicId)
      // In production, you'd call a Next.js API route that uses the secret key
    } catch (error) {
      console.error('Delete file error:', error)
      throw new Error('Xóa file thất bại')
    }
  }

  /**
   * Get optimized image URL
   */
  getOptimizedImageUrl(publicId: string, width?: number, height?: number): string {
    if (!this.cloudName) return ''
    
    let url = `https://res.cloudinary.com/${this.cloudName}/image/upload`
    
    if (width || height) {
      const transformations = []
      if (width) transformations.push(`w_${width}`)
      if (height) transformations.push(`h_${height}`)
      transformations.push('c_limit', 'q_auto', 'f_auto')
      url += `/${transformations.join(',')}`
    }
    
    url += `/${publicId}`
    return url
  }
}

export const cloudinaryService = new CloudinaryService()

