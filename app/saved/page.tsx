'use client'

import { GlobalLayout } from '@/components/layout/GlobalLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppleCard } from '@/components/ui/AppleCard'
import { PostCard } from '@/components/post/PostCard'
import { Bookmark } from 'lucide-react'

const savedPosts: any[] = []

export default function SavedPage() {
  return (
    <ProtectedRoute>
      <GlobalLayout>
      <div className="max-w-2xl mx-auto">
        <div>
          <AppleCard className="p-6 mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <Bookmark className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <h1 className="text-3xl font-bold text-apple-primary">Đã lưu</h1>
            </div>
            <p className="text-apple-secondary">Bạn đã lưu {savedPosts.length} bài viết</p>
          </AppleCard>
        </div>

        {savedPosts.length > 0 ? (
          <div className="space-y-4">
            {savedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <AppleCard className="p-6 text-center">
            <p className="text-apple-secondary">Chưa có bài viết đã lưu nào</p>
          </AppleCard>
        )}
      </div>
      </GlobalLayout>
    </ProtectedRoute>
  )
}

