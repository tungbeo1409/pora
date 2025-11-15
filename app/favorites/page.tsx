'use client'

import { GlobalLayout } from '@/components/layout/GlobalLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppleCard } from '@/components/ui/AppleCard'
import { PostCard } from '@/components/post/PostCard'
import { Heart } from 'lucide-react'

const favoritePosts: any[] = []

export default function FavoritesPage() {
  return (
    <ProtectedRoute>
      <GlobalLayout>
      <div className="max-w-2xl mx-auto">
        <div>
          <AppleCard className="p-6 mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              <h1 className="text-3xl font-bold text-apple-primary">Yêu thích</h1>
            </div>
            <p className="text-apple-secondary">Bạn đã yêu thích {favoritePosts.length} bài viết</p>
          </AppleCard>
        </div>

        {favoritePosts.length > 0 ? (
          <div className="space-y-4">
            {favoritePosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <AppleCard className="p-6 text-center">
            <p className="text-apple-secondary">Chưa có bài viết yêu thích nào</p>
          </AppleCard>
        )}
      </div>
      </GlobalLayout>
    </ProtectedRoute>
  )
}

