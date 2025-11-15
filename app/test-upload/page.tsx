'use client'

import { FileUploadExample } from '@/components/examples/FileUploadExample'

export default function TestUploadPage() {
  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-apple-gray-50 to-apple-gray-100 dark:from-black dark:to-apple-gray-900">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-apple-primary mb-4 text-center">
          Test Upload Cloudinary
        </h1>
        <p className="text-apple-secondary text-center mb-8">
          Chọn ảnh/video/file để test upload
        </p>
        <FileUploadExample />
      </div>
    </div>
  )
}

