'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '@/components/ui/Avatar'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { X, MessageCircle } from 'lucide-react'

export interface Message {
  id: number
  user: {
    name: string
    username: string
    avatar: string
    online: boolean
  }
  lastMessage: string
  time: string
  unread: number
}

const messages: Message[] = [
  {
    id: 1,
    user: {
      name: 'Nguyễn Văn A',
      username: '@nguyenvana',
      avatar: 'https://i.pravatar.cc/150?img=1',
      online: true,
    },
    lastMessage: 'Cảm ơn bạn đã giúp đỡ!',
    time: '2 phút trước',
    unread: 2,
  },
  {
    id: 2,
    user: {
      name: 'Trần Thị B',
      username: '@tranthib',
      avatar: 'https://i.pravatar.cc/150?img=2',
      online: false,
    },
    lastMessage: 'Hẹn gặp lại vào tuần sau nhé',
    time: '1 giờ trước',
    unread: 0,
  },
  {
    id: 3,
    user: {
      name: 'Lê Văn C',
      username: '@levanc',
      avatar: 'https://i.pravatar.cc/150?img=3',
      online: true,
    },
    lastMessage: 'Dự án đang tiến triển tốt',
    time: '3 giờ trước',
    unread: 1,
  },
]

interface MessageDropdownProps {
  onOpenChat?: (message: Message) => void
}

export function MessageDropdown({ onOpenChat }: MessageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [msgs, setMsgs] = useState(messages)
  const unreadCount = msgs.reduce((sum, msg) => sum + msg.unread, 0)
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
        <MessageCircle className="w-5 h-5 text-apple-secondary" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
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
              <h3 className="font-semibold text-apple-primary">Tin nhắn</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
              >
                <X className="w-4 h-4 text-apple-secondary" />
              </button>
            </div>
            <div className="divide-y divide-apple-gray-200 dark:divide-apple-gray-800">
              {msgs.map((message) => (
                <motion.div
                  key={message.id}
                  className={`p-4 hover:bg-apple-gray-50 dark:hover:bg-apple-gray-900 transition-colors cursor-pointer rounded-apple ${
                    message.unread > 0
                      ? 'bg-blue-50/50 dark:bg-blue-900/10'
                      : ''
                  }`}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => {
                    if (onOpenChat) {
                      onOpenChat(message)
                    } else {
                      window.location.href = `/messages?chat=${message.id}`
                    }
                    setIsOpen(false)
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Avatar
                        src={message.user.avatar}
                        size="md"
                        online={message.user.online}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm text-apple-primary truncate">
                          {message.user.name}
                        </p>
                        <span className="text-xs text-apple-tertiary flex-shrink-0 ml-2">
                          {message.time}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-apple-secondary truncate">
                          {message.lastMessage}
                        </p>
                        {message.unread > 0 && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs font-medium flex-shrink-0">
                            {message.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="p-4 border-t border-apple-gray-200 dark:border-apple-gray-800 text-center">
              <Link
                href="/messages"
                className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Xem tất cả tin nhắn
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
