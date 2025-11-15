'use client'

import { GlobalLayout } from '@/components/layout/GlobalLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppleCard } from '@/components/ui/AppleCard'
import { PostCard } from '@/components/post/PostCard'
import { TrendingUp, Hash } from 'lucide-react'
import { motion } from 'framer-motion'

const trendingTopics: any[] = []

const trendingPosts: any[] = []

export default function TrendingPage() {
  return (
    <ProtectedRoute>
      <GlobalLayout>
      <div className="max-w-4xl mx-auto">
        <div>
          <AppleCard className="p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-apple-secondary" />
              <h1 className="text-3xl font-bold text-apple-primary">Xu hướng</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTopics.map((topic) => (
                <div
                  key={topic.tag}
                  className="flex items-center space-x-2 px-4 py-2 rounded-apple-lg bg-apple-gray-100 dark:bg-apple-gray-800 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700 cursor-pointer transition-colors"
                >
                  <Hash className="w-4 h-4 text-apple-secondary" />
                  <span className="font-medium text-apple-primary">{topic.tag}</span>
                  <span className="text-sm text-apple-tertiary">{topic.posts}</span>
                </div>
              ))}
            </div>
          </AppleCard>
        </div>

        {trendingPosts.length > 0 ? (
          <div className="space-y-4">
            {trendingPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <AppleCard className="p-6 text-center">
            <p className="text-apple-secondary">Chưa có bài viết xu hướng nào</p>
          </AppleCard>
        )}
      </div>
      </GlobalLayout>
    </ProtectedRoute>
  )
}

