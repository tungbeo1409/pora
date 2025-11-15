/**
 * Example Component: File Upload với Cloudinary
 * Sử dụng để test hoặc làm reference cho các component khác
 */

'use client'

import { useState } from 'react'
import { storageService } from '@/lib/services/storageService'
import { AppleButton } from '@/components/ui/AppleButton'
import { AppleCard } from '@/components/ui/AppleCard'
import { Image, Video, File, Mic, Loader2, CheckCircle, X } from 'lucide-react'

export function FileUploadExample() {
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadType, setUploadType] = useState<'image' | 'video' | 'audio' | 'file'>('image')

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploadResult(null)
    setUploading(true)

    try {
      let result

      switch (uploadType) {
        case 'image':
          result = await storageService.uploadImage(file, {
            folder: 'test',
            maxSizeMB: 10,
          })
          break

        case 'video':
          result = await storageService.uploadVideo(file, {
            folder: 'test',
            maxSizeMB: 100,
          })
          break

        case 'audio':
          result = await storageService.uploadAudio(file, {
            folder: 'test',
            maxSizeMB: 50,
          })
          break

        default:
          result = await storageService.uploadFile(file, {
            folder: 'test',
            maxSizeMB: 10,
          })
      }

      setUploadResult(result)
      console.log('Upload successful:', result)
    } catch (err: any) {
      setError(err.message || 'Upload thất bại')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <AppleCard className="p-6">
      <h2 className="text-2xl font-bold text-apple-primary mb-4">
        File Upload Example
      </h2>

      {/* Upload Type Selector */}
      <div className="flex gap-2 mb-4">
        <AppleButton
          type="button"
          variant={uploadType === 'image' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setUploadType('image')}
        >
          <Image className="w-4 h-4 mr-2" />
          Image
        </AppleButton>
        <AppleButton
          type="button"
          variant={uploadType === 'video' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setUploadType('video')}
        >
          <Video className="w-4 h-4 mr-2" />
          Video
        </AppleButton>
        <AppleButton
          type="button"
          variant={uploadType === 'audio' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setUploadType('audio')}
        >
          <Mic className="w-4 h-4 mr-2" />
          Audio
        </AppleButton>
        <AppleButton
          type="button"
          variant={uploadType === 'file' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setUploadType('file')}
        >
          <File className="w-4 h-4 mr-2" />
          File
        </AppleButton>
      </div>

      {/* File Input */}
      <div className="mb-4">
        <label className="block mb-2">
          <input
            type="file"
            accept={
              uploadType === 'image'
                ? 'image/*'
                : uploadType === 'video'
                ? 'video/*'
                : uploadType === 'audio'
                ? 'audio/*'
                : '*/*'
            }
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="file-upload"
          />
          <AppleButton
            type="button"
            variant="secondary"
            className="w-full"
            disabled={uploading}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang upload...
              </>
            ) : (
              `Chọn ${uploadType === 'image' ? 'ảnh' : uploadType === 'video' ? 'video' : uploadType === 'audio' ? 'audio' : 'file'} để upload`
            )}
          </AppleButton>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-apple bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center">
            <X className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Success Result */}
      {uploadResult && (
        <div className="space-y-4">
          <div className="p-4 rounded-apple bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <p className="font-semibold text-green-600 dark:text-green-400">
                Upload thành công!
              </p>
            </div>
            <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <p>
                <strong>Name:</strong> {uploadResult.name}
              </p>
              <p>
                <strong>Size:</strong> {(uploadResult.size / 1024).toFixed(2)} KB
              </p>
              <p>
                <strong>Type:</strong> {uploadResult.type}
              </p>
              {uploadResult.width && uploadResult.height && (
                <p>
                  <strong>Dimensions:</strong> {uploadResult.width} x{' '}
                  {uploadResult.height}
                </p>
              )}
              {uploadResult.duration && (
                <p>
                  <strong>Duration:</strong> {uploadResult.duration}s
                </p>
              )}
            </div>
          </div>

          {/* Preview */}
          {uploadResult.type === 'image' && (
            <div>
              <img
                src={uploadResult.url}
                alt="Uploaded"
                className="max-w-full h-auto rounded-apple border border-apple-gray-200 dark:border-apple-gray-800"
              />
            </div>
          )}

          {uploadResult.type === 'video' && (
            <div>
              <video
                src={uploadResult.url}
                controls
                className="max-w-full h-auto rounded-apple border border-apple-gray-200 dark:border-apple-gray-800"
              />
              {uploadResult.thumbnailUrl && (
                <p className="text-xs text-apple-tertiary mt-2">
                  Thumbnail: {uploadResult.thumbnailUrl}
                </p>
              )}
            </div>
          )}

          {uploadResult.type === 'audio' && (
            <div>
              <audio src={uploadResult.url} controls className="w-full" />
            </div>
          )}

          {/* URL */}
          <div className="p-3 rounded-apple bg-apple-gray-100 dark:bg-apple-gray-800">
            <p className="text-xs font-mono text-apple-secondary break-all">
              {uploadResult.url}
            </p>
          </div>
        </div>
      )}
    </AppleCard>
  )
}

