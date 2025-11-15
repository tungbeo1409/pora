'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '@/components/ui/Avatar'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { X, MessageCircle } from 'lucide-react'
import { useConversations } from '@/lib/firebase/hooks/useChat'
import { useAuth } from '@/lib/firebase/hooks/useAuth'
import { userService } from '@/lib/firebase/services/userService'
import { chatService } from '@/lib/firebase/services/chatService'
import type { Conversation } from '@/lib/firebase/services/chatService'
import type { Message as MessageContextType } from '@/contexts/MessageContext'

export interface Message {
  id: number
  conversationId?: string // Firebase conversationId for unique key
  userId?: string // Firebase userId for chat
  user: {
    id: number
    name: string
    username: string
    avatar: string
    online: boolean
  }
  lastMessage: string
  time: string
  unread: number
}

interface ConversationWithUser extends Conversation {
  userData?: {
    id: string
    name: string
    username: string
    avatar: string
  }
}

interface MessageDropdownProps {
  onOpenChat?: (message: MessageContextType) => void
}

export function MessageDropdown({ onOpenChat }: MessageDropdownProps) {
  const { user } = useAuth()
  const { conversations, loading } = useConversations()
  const [conversationsWithUser, setConversationsWithUser] = useState<ConversationWithUser[]>([])
  const [onlineStatuses, setOnlineStatuses] = useState<{ [userId: string]: boolean }>({})
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const onlineStatusUnsubscribes = useRef<Map<string, () => void>>(new Map())

  // Fetch user data for conversations
  useEffect(() => {
    if (!conversations.length) {
      setConversationsWithUser([])
      return
    }

    const fetchUsers = async () => {
      const userIds = conversations.map((c) => c.userId)
      const users = await userService.getByIds(userIds)
      
      const conversationsWithUsers = conversations.map((conv) => {
        const userData = users.find((u) => u.id === conv.userId)
        return {
          ...conv,
          userData: userData ? {
            id: userData.id || '',
            name: userData.name,
            username: userData.username,
            avatar: userData.avatar,
          } : undefined,
        }
      })
      
      setConversationsWithUser(conversationsWithUsers)

      // Listen to online status for each user
      userIds.forEach((userId) => {
        if (onlineStatusUnsubscribes.current.has(userId)) return
        
        const unsubscribe = chatService.listenToOnlineStatus(userId, (isOnline) => {
          setOnlineStatuses((prev) => ({ ...prev, [userId]: isOnline }))
        })
        
        onlineStatusUnsubscribes.current.set(userId, unsubscribe)
      })
    }

    fetchUsers()

    // Cleanup online status listeners
    return () => {
      onlineStatusUnsubscribes.current.forEach((unsub) => unsub())
      onlineStatusUnsubscribes.current.clear()
    }
  }, [conversations])

  // Convert conversations to Message format
  const msgs: Message[] = conversationsWithUser.map((conv) => {
    const isOnline = onlineStatuses[conv.userId] ?? false
    
    // Format last message preview
    let lastMessageText = 'Chưa có tin nhắn'
    if (conv.lastMessage) {
      const lastMsg = conv.lastMessage
      if (lastMsg.imageUrl) {
        lastMessageText = '📷 Ảnh'
      } else if (lastMsg.voiceUrl) {
        lastMessageText = '🎤 Tin nhắn thoại'
      } else if (lastMsg.fileUrl) {
        lastMessageText = `📎 ${lastMsg.fileName || 'File'}`
      } else if (lastMsg.text) {
        lastMessageText = lastMsg.text
      }
    }
    
    const lastMessageTime = conv.lastMessageTime 
      ? new Date(conv.lastMessageTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : ''

    const messageId = parseInt(conv.id.replace(/\D/g, '')) || Date.now()
    return {
      id: messageId,
      conversationId: conv.id, // Keep original conversationId for unique key
      userId: conv.userId,
      user: {
        id: messageId, // Add id to user to match MessageUser interface
        name: conv.userData?.name || 'Người dùng',
        username: conv.userData?.username || '',
        avatar: conv.userData?.avatar || '',
        online: isOnline,
      },
      lastMessage: lastMessageText,
      time: lastMessageTime,
      unread: conv.unreadCount || 0,
    }
  })

  const unreadCount = msgs.reduce((sum, msg) => sum + msg.unread, 0)

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
              <h3 className="font-semibold text-apple-primary">Tin nhắn</h3>
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
                  <p className="text-apple-secondary text-sm">Đang tải...</p>
                </div>
              ) : msgs.length > 0 ? (
                msgs
                  .sort((a, b) => {
                    // Sort by unread count first, then by time
                    if (b.unread !== a.unread) {
                      return b.unread - a.unread
                    }
                    // Sort by time (newest first)
                    const timeA = a.time ? new Date(`1970-01-01 ${a.time}`).getTime() : 0
                    const timeB = b.time ? new Date(`1970-01-01 ${b.time}`).getTime() : 0
                    return timeB - timeA
                  })
                  .slice(0, 5) // Limit to 5 most recent conversations
                  .map((message) => (
                <motion.div
                  key={(message as any).conversationId || message.userId || `msg-${message.id}`}
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
                  ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-apple-secondary">Chưa có tin nhắn nào</p>
                </div>
              )}
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
