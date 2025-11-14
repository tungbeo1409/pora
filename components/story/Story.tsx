'use client'

import { motion } from 'framer-motion'
import { Avatar } from '@/components/ui/Avatar'
import Image from 'next/image'

interface StoryProps {
  user: {
    name: string
    avatar: string
  }
  image?: string
  isOwn?: boolean
}

export function Story({ user, image, isOwn = false }: StoryProps) {
  return (
    <motion.div
      className="flex flex-col items-center space-y-2 cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 p-0.5">
          <div className="rounded-full bg-white dark:bg-black p-0.5">
            <Avatar
              src={isOwn ? undefined : user.avatar}
              alt={user.name}
              size="lg"
              className="border-0"
            />
          </div>
        </div>
        {isOwn && (
          <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-blue-500 border-2 border-white dark:border-black flex items-center justify-center">
            <span className="text-white text-xs font-bold">+</span>
          </div>
        )}
      </div>
      <p className="text-xs text-apple-secondary text-center max-w-[80px] truncate">
        {isOwn ? 'Tạo tin' : user.name}
      </p>
    </motion.div>
  )
}

