'use client'

import { GlobalLayout } from '@/components/layout/GlobalLayout'
import { AppleCard } from '@/components/ui/AppleCard'
import { PostCard } from '@/components/post/PostCard'
import { Bookmark } from 'lucide-react'
import { motion } from 'framer-motion'

const savedPosts = [
  {
    id: 1,
    author: {
      name: 'Nguyễn Văn A',
      username: '@nguyenvana',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    content: 'Bài viết đã lưu đầu tiên. Cần đọc lại sau!',
    image: 'https://picsum.photos/600/400?random=2',
    likes: 245,
    comments: 32,
    shares: 12,
    timeAgo: '1 tuần trước',
    liked: false,
    saved: true,
  },
  {
    id: 2,
    author: {
      name: 'Trần Thị B',
      username: '@tranthib',
      avatar: 'https://i.pravatar.cc/150?img=2',
    },
    content: 'Một bài viết khác đã được lưu để tham khảo sau.',
    likes: 189,
    comments: 28,
    shares: 8,
    timeAgo: '2 tuần trước',
    liked: false,
    saved: true,
  },
]

export default function SavedPage() {
  return (
    <GlobalLayout>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <AppleCard className="p-6 mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <Bookmark className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <h1 className="text-3xl font-bold text-apple-primary">Đã lưu</h1>
            </div>
            <p className="text-apple-secondary">Bạn đã lưu {savedPosts.length} bài viết</p>
          </AppleCard>
        </motion.div>

        <div className="space-y-4">
          {savedPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30, delay: index * 0.1 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </div>
      </div>
    </GlobalLayout>
  )
}

