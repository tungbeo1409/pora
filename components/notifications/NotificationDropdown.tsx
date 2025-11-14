'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, UserPlus, Share2, X, Bell } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Notification {
  id: number
  type: 'like' | 'comment' | 'follow' | 'share'
  userId: number
  user: {
    name: string
    avatar: string
  }
  action: string
  message?: string
  time: string
  read: boolean
  icon: any
  color: string
}

const notifications: Notification[] = [
  {
    id: 1,
    type: 'like',
    userId: 1,
    user: {
      name: 'Nguyễn Văn A',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    action: 'thích bài viết của bạn',
    time: '5 phút trước',
    read: false,
    icon: Heart,
    color: 'text-red-500',
  },
  {
    id: 2,
    type: 'comment',
    userId: 2,
    user: {
      name: 'Trần Thị B',
      avatar: 'https://i.pravatar.cc/150?img=2',
    },
    action: 'đã bình luận bài viết của bạn',
    time: '15 phút trước',
    read: false,
    icon: MessageCircle,
    color: 'text-blue-500',
  },
  {
    id: 3,
    type: 'follow',
    userId: 3,
    user: {
      name: 'Lê Văn C',
      avatar: 'https://i.pravatar.cc/150?img=3',
    },
    action: 'đã theo dõi bạn',
    time: '1 giờ trước',
    read: true,
    icon: UserPlus,
    color: 'text-green-500',
  },
  {
    id: 4,
    type: 'share',
    userId: 4,
    user: {
      name: 'Phạm Thị D',
      avatar: 'https://i.pravatar.cc/150?img=4',
    },
    action: 'đã chia sẻ bài viết của bạn',
    time: '2 giờ trước',
    read: true,
    icon: Share2,
    color: 'text-purple-500',
  },
]

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifs, setNotifs] = useState(notifications)
  const unreadCount = notifs.filter((n) => !n.read).length
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        className="p-2 rounded-apple hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors relative"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5 text-apple-secondary" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full right-0 mt-2 w-80 max-w-[90vw] sm:max-w-none max-h-96 overflow-y-auto scrollbar-hide z-[9999] glass-strong rounded-apple-lg shadow-apple-lg border border-apple-gray-200 dark:border-apple-gray-800"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="p-4 border-b border-apple-gray-200 dark:border-apple-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-apple-primary">Thông báo</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
              >
                <X className="w-4 h-4 text-apple-secondary" />
              </button>
            </div>
            <div className="divide-y divide-apple-gray-200 dark:divide-apple-gray-800">
              {notifs.map((notification) => {
                const Icon = notification.icon
                return (
                  <motion.div
                    key={notification.id}
                    className={`p-4 hover:bg-apple-gray-50 dark:hover:bg-apple-gray-900 transition-colors cursor-pointer rounded-apple ${
                      !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                    whileHover={{ x: 4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={() => {
                      setNotifs(
                        notifs.map((n) =>
                          n.id === notification.id ? { ...n, read: true } : n
                        )
                      )
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative flex-shrink-0">
                        <Avatar src={notification.user.avatar} size="sm" />
                        <div
                          className={`absolute -bottom-1 -right-1 p-1 rounded-full bg-white dark:bg-black ${notification.color}`}
                        >
                          <Icon className="w-3 h-3" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-apple-primary leading-relaxed">
                          <span className="font-semibold">{notification.user.name}</span>{' '}
                          <span className="text-apple-secondary">{notification.action}</span>
                        </p>
                        <p className="text-xs text-apple-tertiary mt-1">{notification.time}</p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
            <div className="p-4 border-t border-apple-gray-200 dark:border-apple-gray-800 text-center">
              <Link
                href="/notifications"
                className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Xem tất cả thông báo
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
