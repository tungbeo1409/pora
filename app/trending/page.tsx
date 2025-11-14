'use client'

import { GlobalLayout } from '@/components/layout/GlobalLayout'
import { AppleCard } from '@/components/ui/AppleCard'
import { PostCard } from '@/components/post/PostCard'
import { TrendingUp, Hash } from 'lucide-react'
import { motion } from 'framer-motion'

const trendingTopics = [
  { tag: '#TechNews', posts: '12.5K', trend: 'up' },
  { tag: '#Design', posts: '8.2K', trend: 'up' },
  { tag: '#Photography', posts: '6.7K', trend: 'down' },
  { tag: '#Travel', posts: '5.1K', trend: 'up' },
  { tag: '#Food', posts: '4.8K', trend: 'up' },
]

const trendingPosts = [
  {
    id: 1,
    author: {
      id: 1,
      name: 'Nguyễn Văn A',
      username: '@nguyenvana',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    content: 'Xu hướng công nghệ mới nhất trong năm 2024! #TechNews',
    image: 'https://picsum.photos/600/400?random=3',
    likes: 1245,
    comments: 132,
    shares: 45,
    timeAgo: '1 giờ trước',
    liked: false,
    saved: false,
  },
  {
    id: 2,
    author: {
      id: 2,
      name: 'Trần Thị B',
      username: '@tranthib',
      avatar: 'https://i.pravatar.cc/150?img=2',
    },
    content: 'Thiết kế UI/UX đẹp nhất năm! #Design',
    likes: 989,
    comments: 78,
    shares: 28,
    timeAgo: '3 giờ trước',
    liked: true,
    saved: false,
  },
]

export default function TrendingPage() {
  return (
    <GlobalLayout>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <AppleCard className="p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-apple-secondary" />
              <h1 className="text-3xl font-bold text-apple-primary">Xu hướng</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTopics.map((topic) => (
                <motion.div
                  key={topic.tag}
                  className="flex items-center space-x-2 px-4 py-2 rounded-apple-lg bg-apple-gray-100 dark:bg-apple-gray-800 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700 cursor-pointer transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Hash className="w-4 h-4 text-apple-secondary" />
                  <span className="font-medium text-apple-primary">{topic.tag}</span>
                  <span className="text-sm text-apple-tertiary">{topic.posts}</span>
                </motion.div>
              ))}
            </div>
          </AppleCard>
        </motion.div>

        <div className="space-y-4">
          {trendingPosts.map((post, index) => (
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

