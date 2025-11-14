'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '@/components/ui/Avatar'
import { X, Minimize2, Send, MoreVertical, Phone, Video, User } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Dropdown } from '@/components/ui/Dropdown'
import Link from 'next/link'

interface Message {
  id: number
  text: string
  sender: 'me' | 'other'
  time: string
}

interface MessagePopupProps {
  user: {
    id: number
    name: string
    username: string
    avatar: string
    online: boolean
  }
  onClose: () => void
  onMinimize: () => void
  onCall?: (type: 'audio' | 'video') => void
  position?: { x: number; y: number }
}

const initialMessages: Message[] = [
  { id: 1, text: 'Xin chào! Bạn có khỏe không?', sender: 'other', time: '10:30' },
  { id: 2, text: 'Chào bạn! Mình khỏe, cảm ơn bạn đã hỏi thăm.', sender: 'me', time: '10:32' },
  { id: 3, text: 'Tuyệt vời! Bạn có rảnh để thảo luận về dự án không?', sender: 'other', time: '10:33' },
  { id: 4, text: 'Có chứ! Mình đang rảnh. Bạn muốn bắt đầu từ đâu?', sender: 'me', time: '10:35' },
  { id: 5, text: 'Cảm ơn bạn đã giúp đỡ!', sender: 'other', time: '10:40' },
]

export function MessagePopup({ user, onClose, onMinimize, onCall, position }: MessagePopupProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [popupPosition, setPopupPosition] = useState(
    position || (typeof window !== 'undefined' ? { x: window.innerWidth - 380, y: window.innerHeight - 600 } : { x: 0, y: 0 })
  )
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (position) {
      setPopupPosition(position)
    }
  }, [position])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now(),
      text: newMessage,
      sender: 'me',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages([...messages, message])
    setNewMessage('')
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!popupRef.current) return
    e.preventDefault()
    const rect = popupRef.current.getBoundingClientRect()
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, (typeof window !== 'undefined' ? window.innerWidth : 0) - 320))
      const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, (typeof window !== 'undefined' ? window.innerHeight : 0) - 500))
      setPopupPosition({
        x: newX,
        y: newY,
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  const handleCall = () => {
    if (onCall) {
      onCall('audio')
    }
  }

  const handleVideoCall = () => {
    if (onCall) {
      onCall('video')
    }
  }

  const dropdownItems = [
    {
      label: 'Xem hồ sơ',
      icon: <User className="w-4 h-4" />,
      onClick: () => {
        window.location.href = `/profile?user=${user.id}`
      },
    },
    {
      label: 'Tắt thông báo',
      onClick: () => console.log('Mute notifications'),
    },
    {
      label: 'Xóa cuộc trò chuyện',
      onClick: () => console.log('Delete conversation'),
      danger: true,
    },
  ]

  return (
    <motion.div
      ref={popupRef}
      className="fixed w-80 h-[500px] z-50 glass-strong rounded-apple-lg shadow-apple-lg border border-apple-gray-200 dark:border-apple-gray-800 flex flex-col overflow-hidden"
      style={{
        left: `${popupPosition.x}px`,
        top: `${popupPosition.y}px`,
        cursor: isDragging ? 'grabbing' : 'default',
        pointerEvents: 'auto',
      }}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 border-b border-apple-gray-200 dark:border-apple-gray-800 flex items-center justify-between cursor-grab active:cursor-grabbing bg-apple-gray-50 dark:bg-apple-gray-900 rounded-t-apple-lg"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <Avatar src={user.avatar} size="sm" online={user.online} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs text-apple-primary truncate leading-tight">{user.name}</p>
            <p className="text-xs text-apple-tertiary truncate leading-tight mt-0.5">
              {user.online ? 'Đang hoạt động' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          <motion.button
            className="p-1.5 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation()
              handleCall()
            }}
            title="Gọi điện"
          >
            <Phone className="w-3.5 h-3.5 text-apple-secondary" />
          </motion.button>
          <motion.button
            className="p-1.5 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation()
              handleVideoCall()
            }}
            title="Gọi video"
          >
            <Video className="w-3.5 h-3.5 text-apple-secondary" />
          </motion.button>
          <Dropdown
            items={dropdownItems}
            isOpen={dropdownOpen}
            onClose={() => setDropdownOpen(false)}
            position="auto"
          >
            <motion.button
              className="p-1.5 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation()
                setDropdownOpen(!dropdownOpen)
              }}
            >
              <MoreVertical className="w-3.5 h-3.5 text-apple-secondary" />
            </motion.button>
          </Dropdown>
          <motion.button
            className="p-1.5 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onMinimize}
          >
            <Minimize2 className="w-3.5 h-3.5 text-apple-secondary" />
          </motion.button>
          <motion.button
            className="p-1.5 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
          >
            <X className="w-3.5 h-3.5 text-apple-secondary" />
          </motion.button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-apple-gray-50 dark:bg-apple-gray-900 scrollbar-hide">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-apple-lg ${
                msg.sender === 'me'
                  ? 'bg-blue-500 text-white rounded-br-sm'
                  : 'bg-white dark:bg-apple-gray-800 text-apple-primary rounded-bl-sm'
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.text}</p>
              <p
                className={`text-xs mt-1 ${
                  msg.sender === 'me' ? 'text-blue-100' : 'text-apple-tertiary'
                }`}
              >
                {msg.time}
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-apple-gray-200 dark:border-apple-gray-800 bg-white dark:bg-black">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 px-4 py-2 rounded-apple-lg bg-apple-gray-100 dark:bg-apple-gray-800 border border-apple-gray-200 dark:border-apple-gray-700 text-apple-primary placeholder:text-apple-tertiary focus:outline-none focus:ring-2 focus:ring-apple-gray-400 dark:focus:ring-apple-gray-600 text-sm"
          />
          <motion.button
            className="p-2 rounded-apple-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            onClick={handleSendMessage}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
