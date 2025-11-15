'use client'

import { motion } from 'framer-motion'
import { UserPlus, TrendingUp } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { AppleButton } from '@/components/ui/AppleButton'

const suggestedUsers: any[] = []

const trendingTopics: any[] = []

export function RightSidebar() {
  return (
    <motion.aside
      className="hidden xl:block fixed right-4 top-20 w-80 space-y-4"
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
    >
      {/* Suggested Users */}
      <motion.div
        className="glass rounded-apple-lg shadow-apple-lg p-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center space-x-2 mb-4">
          <UserPlus className="w-5 h-5 text-apple-secondary" />
          <h3 className="font-semibold text-apple-primary">Gợi ý kết bạn</h3>
        </div>
        <div className="space-y-3">
          {suggestedUsers.length > 0 ? suggestedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between transition-colors duration-200 hover:bg-apple-gray-50 dark:hover:bg-apple-gray-900 rounded-apple p-2 -m-2"
            >
              <div className="flex items-center space-x-3">
                <Avatar src={user.avatar} size="sm" />
                <div>
                  <p className="text-sm font-medium text-apple-primary">{user.name}</p>
                  <p className="text-xs text-apple-tertiary">{user.username}</p>
                </div>
              </div>
              <AppleButton size="sm" variant="secondary">
                Theo dõi
              </AppleButton>
            </div>
          )) : (
            <p className="text-sm text-apple-secondary text-center py-4">Chưa có gợi ý</p>
          )}
        </div>
      </motion.div>

      {/* Trending Topics */}
      <motion.div
        className="glass rounded-apple-lg shadow-apple-lg p-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-apple-secondary" />
          <h3 className="font-semibold text-apple-primary">Xu hướng</h3>
        </div>
        <div className="space-y-3">
          {trendingTopics.length > 0 ? trendingTopics.map((topic, index) => (
            <div
              key={topic.tag}
              className="flex items-center justify-between cursor-pointer group transition-colors duration-200 hover:bg-apple-gray-50 dark:hover:bg-apple-gray-900 rounded-apple p-2 -m-2"
            >
              <div>
                <p className="text-sm font-medium text-apple-primary group-hover:text-apple-gray-900 dark:group-hover:text-white transition-colors duration-200">
                  {topic.tag}
                </p>
                <p className="text-xs text-apple-tertiary">{topic.posts} bài viết</p>
              </div>
            </div>
          )) : (
            <p className="text-sm text-apple-secondary text-center py-4">Chưa có xu hướng</p>
          )}
        </div>
      </motion.div>
    </motion.aside>
  )
}

