'use client'

import { GlobalLayout } from '@/components/layout/GlobalLayout'
import { PostCard } from '@/components/post/PostCard'
import { Story } from '@/components/story/Story'
import { AppleCard } from '@/components/ui/AppleCard'
import { AppleButton } from '@/components/ui/AppleButton'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Plus, Image as ImageIcon, Video, Smile, X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const stories: any[] = []

const posts: any[] = []

export default function HomePage() {
  const [createPostOpen, setCreatePostOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <GlobalLayout>
        <div className="max-w-4xl mx-auto w-full" />
      </GlobalLayout>
    )
  }

  return (
    <ProtectedRoute>
      <GlobalLayout>
        <div className="max-w-4xl mx-auto w-full">
        {/* Stories */}
        {stories.length > 0 && (
          <div className="mb-6">
            <AppleCard className="p-4">
              <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
                {stories.map((story) => (
                  <Story key={story.id} {...story} />
                ))}
              </div>
            </AppleCard>
          </div>
        )}

        {/* Create Post */}
        <div className="mb-6">
          <AppleCard className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-apple-gray-200 dark:bg-apple-gray-800 flex items-center justify-center">
                <span className="text-apple-tertiary font-medium">A</span>
              </div>
              <button
                onClick={() => setCreatePostOpen(true)}
                className="flex-1 text-left px-4 py-2 rounded-apple-lg bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-tertiary hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700 transition-colors"
              >
                Bạn đang nghĩ gì?
              </button>
            </div>
            <div className="flex items-center justify-around pt-3 border-t border-apple-gray-200 dark:border-apple-gray-800">
              <button
                className="flex items-center space-x-2 text-apple-secondary hover:text-green-500 transition-colors"
              >
                <ImageIcon className="w-5 h-5" />
                <span className="text-sm">Ảnh</span>
              </button>
              <button
                className="flex items-center space-x-2 text-apple-secondary hover:text-red-500 transition-colors"
              >
                <Video className="w-5 h-5" />
                <span className="text-sm">Video</span>
              </button>
              <button
                className="flex items-center space-x-2 text-apple-secondary hover:text-yellow-500 transition-colors"
              >
                <Smile className="w-5 h-5" />
                <span className="text-sm">Cảm xúc</span>
              </button>
            </div>
          </AppleCard>
        </div>

        {/* Posts */}
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post, index) => {
              // Đánh dấu post đầu tiên có image là priority để tối ưu LCP
              const isPriority = index === 0 && !!post.image
              return (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  priority={isPriority}
                />
              )
            })}
          </div>
        ) : (
          <AppleCard className="p-6 text-center">
            <p className="text-apple-secondary">Chưa có bài viết nào. Hãy tạo bài viết đầu tiên của bạn!</p>
          </AppleCard>
        )}
      </div>

      {/* Create Post Modal */}
      {createPostOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setCreatePostOpen(false)}
        >
          <motion.div
            className="glass-strong rounded-apple-lg shadow-apple-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-apple-primary">Tạo bài viết</h2>
              <button
                onClick={() => setCreatePostOpen(false)}
                className="p-2 rounded-apple hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-apple-secondary" />
              </button>
            </div>
            
            <div className="flex items-center space-x-3 mb-4">
              <Avatar src="" size="md" />
              <div>
                <p className="font-semibold text-apple-primary">Bạn</p>
                <p className="text-sm text-apple-tertiary">@ban</p>
              </div>
            </div>

            <textarea
              className="w-full h-40 px-4 py-3 rounded-apple bg-apple-gray-50 dark:bg-apple-gray-900 border border-apple-gray-200 dark:border-apple-gray-800 text-apple-primary placeholder:text-apple-tertiary focus:outline-none focus:ring-2 focus:ring-apple-gray-400 dark:focus:ring-apple-gray-600 resize-none"
              placeholder="Bạn đang nghĩ gì?"
            />

            <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-apple-gray-200 dark:border-apple-gray-800">
              <motion.button
                className="flex items-center space-x-2 text-apple-secondary hover:text-green-500 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ImageIcon className="w-5 h-5" />
                <span className="text-sm">Ảnh</span>
              </motion.button>
              <motion.button
                className="flex items-center space-x-2 text-apple-secondary hover:text-red-500 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Video className="w-5 h-5" />
                <span className="text-sm">Video</span>
              </motion.button>
              <motion.button
                className="flex items-center space-x-2 text-apple-secondary hover:text-yellow-500 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Smile className="w-5 h-5" />
                <span className="text-sm">Cảm xúc</span>
              </motion.button>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <AppleButton variant="ghost" onClick={() => setCreatePostOpen(false)}>
                Hủy
              </AppleButton>
              <AppleButton onClick={() => setCreatePostOpen(false)}>
                Đăng
              </AppleButton>
            </div>
          </motion.div>
        </motion.div>
      )}
      </GlobalLayout>
    </ProtectedRoute>
  )
}

