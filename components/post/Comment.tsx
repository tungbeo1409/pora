'use client'

import { motion } from 'framer-motion'
import { Heart, Reply } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useState } from 'react'

interface CommentProps {
  author: {
    name: string
    username: string
    avatar: string
  }
  content: string
  timeAgo: string
  likes: number
  replies?: CommentProps[]
}

export function Comment({ author, content, timeAgo, likes, replies = [] }: CommentProps) {
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(likes)

  return (
    <motion.div
      className="py-4 border-b border-apple-gray-100 dark:border-apple-gray-900 last:border-0"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex space-x-3">
        <Avatar src={author.avatar} size="sm" />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-semibold text-sm text-apple-primary">{author.name}</span>
            <span className="text-xs text-apple-tertiary">{author.username} · {timeAgo}</span>
          </div>
          <p className="text-sm text-apple-primary mb-2 leading-relaxed">{content}</p>
          <div className="flex items-center space-x-4">
            <motion.button
              className="flex items-center space-x-1 text-apple-tertiary hover:text-red-500 transition-colors"
              onClick={() => {
                setLiked(!liked)
                setLikesCount(liked ? likesCount - 1 : likesCount + 1)
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="text-xs">{likesCount}</span>
            </motion.button>
            <motion.button
              className="flex items-center space-x-1 text-apple-tertiary hover:text-blue-500 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Reply className="w-4 h-4" />
              <span className="text-xs">Phản hồi</span>
            </motion.button>
          </div>
          {replies.length > 0 && (
            <div className="mt-3 ml-4 space-y-3 pl-4 border-l-2 border-apple-gray-200 dark:border-apple-gray-800">
              {replies.map((reply, index) => (
                <Comment key={index} {...reply} />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

