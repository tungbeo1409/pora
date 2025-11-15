'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, UserPlus, Share2, X, Bell, Reply, Smartphone, UserCheck } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/firebase/hooks/useAuth'
import { useNotifications, formatNotificationTime, getNotificationIconInfo } from '@/lib/firebase/hooks/useNotifications'
import { notificationService } from '@/lib/firebase/services/notificationService'
import { useRouter } from 'next/navigation'

const iconMap: Record<string, any> = {
  Heart,
  MessageCircle,
  Reply,
  UserPlus,
  Share2,
  Smartphone,
  UserCheck,
  Bell,
}

export function NotificationDropdown() {
  const { user } = useAuth()
  const router = useRouter()
  const { notifications, unreadCount, loading } = useNotifications(user?.uid || null, {
    limitCount: 10,
    realtime: true,
  })
  const [isOpen, setIsOpen] = useState(false)
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
          <motion.span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-black"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full right-0 mt-2 w-80 max-w-[90vw] sm:max-w-none max-h-96 overflow-y-auto scrollbar-hide z-[9999] glass-strong rounded-apple-lg shadow-apple-lg border border-apple-gray-200 dark:border-apple-gray-800 pr-2"
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
              {loading ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-apple-secondary">Đang tải...</p>
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => {
                  const iconInfo = getNotificationIconInfo(notification.type)
                  const Icon = iconMap[iconInfo.iconName] || Bell
                  const handleClick = async () => {
                    // Mark as read
                    if (!notification.read && notification.id) {
                      try {
                        await notificationService.markAsRead(notification.id, false)
                      } catch (error) {
                        console.error('Error marking notification as read:', error)
                      }
                    }

                    // Navigate based on targetType
                    if (notification.targetType === 'post' && notification.targetId) {
                      router.push(`/?post=${notification.targetId}`)
                    } else if (notification.targetType === 'comment' && notification.targetId) {
                      router.push(`/?comment=${notification.targetId}`)
                    } else if (notification.targetType === 'user' && notification.targetId) {
                      router.push(`/profile?user=${notification.targetId}`)
                    }

                    setIsOpen(false)
                  }

                  return (
                    <motion.div
                      key={notification.id}
                      className={`p-4 hover:bg-apple-gray-50 dark:hover:bg-apple-gray-900 transition-colors cursor-pointer rounded-apple ${
                        !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                      }`}
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={handleClick}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative flex-shrink-0">
                          <Avatar src={notification.actorAvatar || ''} size="sm" />
                          <div
                            className={`absolute -bottom-1 -right-1 p-1 rounded-full bg-white dark:bg-black ${iconInfo.color}`}
                          >
                            <Icon className="w-3 h-3" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-apple-primary leading-relaxed">
                            <span className="font-semibold">{notification.actorName}</span>{' '}
                            <span className="text-apple-secondary">{notification.message}</span>
                          </p>
                          <p className="text-xs text-apple-tertiary mt-1">
                            {formatNotificationTime(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        )}
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-apple-secondary">Chưa có thông báo nào</p>
                </div>
              )}
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
