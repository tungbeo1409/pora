'use client'

import { GlobalLayout } from '@/components/layout/GlobalLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppleCard } from '@/components/ui/AppleCard'
import { Avatar } from '@/components/ui/Avatar'
import { AppleInput } from '@/components/ui/AppleInput'
import { Send, Plus, Image as ImageIcon, File as FileIcon, Mic, X as XIcon, Edit2, Trash2, Reply, Smile, MoreVertical, Phone, Video, Download, Play, Pause, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect, Suspense } from 'react'
import { Dropdown } from '@/components/ui/Dropdown'
import { CallModal } from '@/components/call/CallModal'
import { VideoCallModal } from '@/components/call/VideoCallModal'
import { useChat, useConversations } from '@/lib/firebase/hooks/useChat'
import { useAuth } from '@/lib/firebase/hooks/useAuth'
import { userService } from '@/lib/firebase/services/userService'
import { useSearchParams } from 'next/navigation'
import { chatService } from '@/lib/firebase/services/chatService'
import type { ChatMessage, Conversation } from '@/lib/firebase/services/chatService'

// Format last seen time
function formatLastSeen(lastSeen?: number): string {
  if (!lastSeen) return 'Offline'
  
  const now = Date.now()
  const diff = now - lastSeen
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (seconds < 60) return 'Hoạt động vừa xong'
  if (minutes < 60) return `Hoạt động ${minutes} phút trước`
  if (hours < 24) return `Hoạt động ${hours} giờ trước`
  if (days < 7) return `Hoạt động ${days} ngày trước`
  
  return `Hoạt động ${Math.floor(days / 7)} tuần trước`
}

interface PreviewFile {
  type: 'image' | 'file'
  file: File
  preview?: string
}

interface ConversationWithUser extends Conversation {
  userData?: {
    id: string
    name: string
    username: string
    avatar: string
  }
  isOnline?: boolean
}

function MessagesContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const userIdParam = searchParams.get('user')
  
  // Get conversations list
  const { conversations, loading: conversationsLoading } = useConversations()
  const [conversationsWithUser, setConversationsWithUser] = useState<ConversationWithUser[]>([])
  const [onlineStatuses, setOnlineStatuses] = useState<{ [userId: string]: boolean }>({})
  
  // Calculate total unread count
  const totalUnreadCount = conversationsWithUser.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
  
  // Get selected conversation
  const selectedConversationId = searchParams.get('conversation')
  const selectedUserId = userIdParam || (selectedConversationId 
    ? conversations.find((c) => c.id === selectedConversationId)?.userId 
    : null)
  
  // Get messages for selected conversation
  const { 
    messages: chatMessages, 
    loading: messagesLoading, 
    sendMessage: sendChatMessage,
    editMessage: editChatMessage,
    deleteMessage: deleteChatMessage,
    addReaction: addChatReaction,
    markAsRead,
    typing: isTyping,
    isOnline,
    lastSeen,
    setTyping: updateTypingStatus,
  } = useChat(selectedUserId || null, { limitCount: 50, realtime: true })
  
  const [message, setMessage] = useState('')
  const [selectedChat, setSelectedChat] = useState<string | null>(selectedConversationId || selectedUserId || null)
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([])
  const [attachDropdownOpen, setAttachDropdownOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; duration: number } | null>(null)
  const recordingStreamRef = useRef<MediaStream | null>(null)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [messageMenuOpen, setMessageMenuOpen] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [reactionPickerOpen, setReactionPickerOpen] = useState<string | null>(null)
  const [timeTooltip, setTimeTooltip] = useState<{ msgId: string; x: number; y: number; time: string } | null>(null)
  const [callState, setCallState] = useState<{ type: 'audio' | 'video'; user: { id: string; name: string; username: string; avatar: string; online: boolean } } | null>(null)
  const menuCloseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const timeTooltipTimerRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const reactionPickerRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const onlineStatusUnsubscribes = useRef<Map<string, () => void>>(new Map())
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map())
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const [voiceProgress, setVoiceProgress] = useState<Map<string, { current: number; duration: number }>>(new Map())

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏']

  // Fetch user data for conversations
  useEffect(() => {
    if (!conversations.length) return

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

  // Mark as read when viewing conversation
  useEffect(() => {
    if (selectedUserId && user?.uid) {
      markAsRead().catch(console.error)
    }
  }, [selectedUserId, user?.uid, markAsRead])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isTyping])

  // Update typing indicator when user types
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingTimeRef = useRef<number>(0)
  
  useEffect(() => {
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    if (message.trim() && selectedUserId) {
      // Set typing to true immediately when user starts typing
      const now = Date.now()
      // Only update if at least 500ms has passed since last update to avoid too many writes
      if (now - lastTypingTimeRef.current > 500) {
        updateTypingStatus(true).catch(console.error)
        lastTypingTimeRef.current = now
      }
      
      // Set typing to false after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingStatus(false).catch(console.error)
        typingTimeoutRef.current = null
      }, 2000)
    } else {
      // Clear typing immediately when message is empty
      updateTypingStatus(false).catch(console.error)
      lastTypingTimeRef.current = 0
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
    }
  }, [message, updateTypingStatus, selectedUserId])

  // Handle click outside for menu and reaction picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Check menu
      if (messageMenuOpen !== null) {
        const menuRef = menuRefs.current.get(messageMenuOpen)
        if (menuRef && !menuRef.contains(target)) {
          // Kiểm tra xem có phải click vào reaction picker không
          if (reactionPickerOpen !== null) {
            const reactionPickerRef = reactionPickerRefs.current.get(reactionPickerOpen)
            if (reactionPickerRef && reactionPickerRef.contains(target)) {
              return // Don't close menu if clicking on reaction picker
            }
          }
          setMessageMenuOpen(null)
        }
      }
      
      // Check reaction picker
      if (reactionPickerOpen !== null) {
        const reactionPickerRef = reactionPickerRefs.current.get(reactionPickerOpen)
        if (reactionPickerRef && !reactionPickerRef.contains(target)) {
          // Kiểm tra xem có phải click vào menu không
          if (messageMenuOpen !== null) {
            const menuRef = menuRefs.current.get(messageMenuOpen)
            if (menuRef && menuRef.contains(target)) {
              return // Don't close reaction picker if clicking on menu
            }
          }
          setReactionPickerOpen(null)
        }
      }
    }

    if (messageMenuOpen !== null || reactionPickerOpen !== null) {
      // Dùng setTimeout để tránh conflict với onClick handlers
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [messageMenuOpen, reactionPickerOpen])

  return (
    <ProtectedRoute>
      <GlobalLayout>
        <div className="max-w-6xl mx-auto">
        <AppleCard className="p-0 overflow-hidden">
          <div className="flex h-[calc(100vh-12rem)]">
            {/* Conversations List */}
            <div className="w-full md:w-80 border-r border-apple-gray-200 dark:border-apple-gray-800 overflow-y-auto">
              <div className="p-4 border-b border-apple-gray-200 dark:border-apple-gray-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-apple-primary">Tin nhắn</h2>
                  {totalUnreadCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500 text-white text-xs font-medium">
                      {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </span>
                  )}
                </div>
              </div>
              <div className="divide-y divide-apple-gray-200 dark:divide-apple-gray-800">
                {conversationsLoading ? (
                  <div className="p-8 text-center">
                    <p className="text-apple-secondary">Đang tải...</p>
                  </div>
                ) : conversationsWithUser.length > 0 ? (
                  conversationsWithUser
                    .sort((a, b) => {
                      // Sort by lastMessageTime (newest first), then by unreadCount
                      const timeA = a.lastMessageTime || 0
                      const timeB = b.lastMessageTime || 0
                      if (timeB !== timeA) {
                        return timeB - timeA
                      }
                      // If same time, prioritize unread messages
                      return (b.unreadCount || 0) - (a.unreadCount || 0)
                    })
                    .map((conversation) => {
                  const isOnline = onlineStatuses[conversation.userId] ?? false
                  
                  // Format last message preview
                  let lastMessageText = 'Chưa có tin nhắn'
                  if (conversation.lastMessage) {
                    const lastMsg = conversation.lastMessage
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
                  
                  const lastMessageTime = conversation.lastMessageTime 
                    ? new Date(conversation.lastMessageTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                    : ''
                  
                  return (
                    <motion.div
                      key={conversation.id}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedChat === conversation.id
                          ? 'bg-apple-gray-100 dark:bg-apple-gray-800'
                          : 'hover:bg-apple-gray-50 dark:hover:bg-apple-gray-900'
                      }`}
                      onClick={() => {
                        setSelectedChat(conversation.id)
                        window.history.pushState({}, '', `/messages?conversation=${conversation.id}`)
                      }}
                      whileHover={{ x: 2 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar 
                          src={conversation.userData?.avatar || ''} 
                          size="md" 
                          online={isOnline} 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`font-semibold text-sm truncate ${conversation.unreadCount > 0 ? 'text-apple-primary font-bold' : 'text-apple-primary'}`}>
                              {conversation.userData?.name || 'Người dùng'}
                            </p>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {conversation.unreadCount > 0 && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              )}
                              <span className={`text-xs ${conversation.unreadCount > 0 ? 'text-apple-primary font-semibold' : 'text-apple-tertiary'}`}>
                                {lastMessageTime}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'text-apple-primary font-medium' : 'text-apple-secondary'}`}>
                              {lastMessageText}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs font-semibold flex-shrink-0 min-w-[20px] text-center">
                                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                    })
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-apple-secondary">Chưa có cuộc trò chuyện nào</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-apple-gray-200 dark:border-apple-gray-800">
                <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const selectedConv = conversationsWithUser.find((c) => c.id === selectedChat || c.userId === selectedUserId)
                    const isOnline = selectedConv?.userId ? onlineStatuses[selectedConv.userId] ?? false : false
                    return (
                      <>
                        <Avatar
                          src={selectedConv?.userData?.avatar || ''}
                          size="md"
                          online={isOnline}
                        />
                        <div>
                          <p className="font-semibold text-apple-primary">
                            {selectedConv?.userData?.name || 'Người dùng'}
                          </p>
                          <p className="text-sm text-apple-tertiary">
                            {isTyping ? 'Đang nhập...' : (isOnline ? 'Đang hoạt động' : formatLastSeen(lastSeen))}
                          </p>
                        </div>
                      </>
                    )
                  })()}
                  </div>
                  {(selectedChat || selectedUserId) && (() => {
                    const selectedConv = conversationsWithUser.find((c) => c.id === selectedChat || c.userId === selectedUserId)
                    const currentUser = selectedConv?.userData
                    if (!currentUser) return null
                    
                    return (
                      <div className="flex items-center space-x-2">
                        <motion.button
                          className="p-2 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            if (currentUser) {
                              setCallState({ 
                                type: 'audio', 
                                user: {
                                  id: currentUser.id,
                                  name: currentUser.name,
                                  username: currentUser.username,
                                  avatar: currentUser.avatar,
                                  online: onlineStatuses[selectedConv?.userId || ''] ?? false,
                                }
                              })
                            }
                          }}
                          title="Gọi điện"
                        >
                          <Phone className="w-5 h-5 text-apple-secondary" />
                        </motion.button>
                        <motion.button
                          className="p-2 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            if (currentUser) {
                              setCallState({ 
                                type: 'video', 
                                user: {
                                  id: currentUser.id,
                                  name: currentUser.name,
                                  username: currentUser.username,
                                  avatar: currentUser.avatar,
                                  online: onlineStatuses[selectedConv?.userId || ''] ?? false,
                                }
                              })
                            }
                          }}
                          title="Gọi video"
                        >
                          <Video className="w-5 h-5 text-apple-secondary" />
                        </motion.button>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto overflow-x-visible p-4 space-y-4 bg-apple-gray-50 dark:bg-apple-gray-900 relative"
              >
                {selectedChat || selectedUserId ? (
                  messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-apple-secondary">Đang tải tin nhắn...</p>
                    </div>
                  ) : chatMessages.length > 0 ? (
                    [...chatMessages]
                      .sort((a, b) => {
                        // Sort by createdAt (oldest first) for display
                        const timeA = typeof a.createdAt === 'number' ? a.createdAt : parseInt(String(a.createdAt)) || 0
                        const timeB = typeof b.createdAt === 'number' ? b.createdAt : parseInt(String(b.createdAt)) || 0
                        return timeA - timeB
                      })
                      .map((msg: ChatMessage) => {
                  const isHovered = hoveredMessageId === msg.id
                  const isMenuOpen = messageMenuOpen === msg.id
                  const isEditing = editingMessageId === msg.id
                  const isReactionPickerOpen = reactionPickerOpen === msg.id
                  const isMe = msg.senderId === user?.uid
                  const messageTime = typeof msg.createdAt === 'number' 
                    ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                    : ''

                  return (
                  <motion.div
                    key={`msg-${msg.id}-${msg.createdAt || Date.now()}`}
                    ref={(el) => {
                      if (el) {
                        messageRefs.current.set(msg.id, el)
                      } else {
                        messageRefs.current.delete(msg.id)
                      }
                    }}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      onMouseEnter={(e) => {
                        // Luôn cho phép hover, không chặn khi menu/reaction picker đang mở
                        setHoveredMessageId(msg.id)
                        
                        // Delay 0.5s trước khi hiện time tooltip
                        if (timeTooltipTimerRef.current) {
                          clearTimeout(timeTooltipTimerRef.current)
                        }
                        timeTooltipTimerRef.current = setTimeout(() => {
                          if (!msg.isDeleted) {
                            setTimeTooltip({
                              msgId: msg.id,
                              x: e.clientX,
                              y: e.clientY,
                              time: messageTime,
                            })
                          }
                        }, 500)
                      }}
                      onMouseMove={(e) => {
                        // Cập nhật vị trí tooltip khi di chuột
                        if (timeTooltip && timeTooltip.msgId === msg.id) {
                          setTimeTooltip({
                            ...timeTooltip,
                            x: e.clientX,
                            y: e.clientY,
                          })
                        }
                      }}
                      onMouseLeave={() => {
                        // Chỉ đóng hover nếu menu và reaction picker của tin nhắn này không mở
                        // Không đóng menu/reaction picker ở đây, chỉ đóng hover state
                        if (messageMenuOpen !== msg.id && reactionPickerOpen !== msg.id) {
                          setHoveredMessageId(null)
                        }
                        // Hủy timer và đóng time tooltip
                        if (timeTooltipTimerRef.current) {
                          clearTimeout(timeTooltipTimerRef.current)
                          timeTooltipTimerRef.current = null
                        }
                        if (timeTooltip && timeTooltip.msgId === msg.id) {
                          setTimeTooltip(null)
                        }
                      }}
                    >
                      {/* Reply Preview */}
                      {msg.replyToText && msg.replyToId && (
                        <div className={`max-w-[50%] px-3 py-1.5 mb-1 rounded-apple text-xs ${
                          isMe
                            ? 'bg-blue-400/20 text-blue-100 border-l-2 border-blue-300'
                            : 'bg-apple-gray-200 dark:bg-apple-gray-700 text-apple-tertiary border-l-2 border-apple-gray-400'
                        }`}>
                          <p className="font-medium truncate">{isMe ? 'Bạn' : 'Người khác'}</p>
                          <p className="truncate opacity-75 line-clamp-2">{msg.replyToText}</p>
                        </div>
                      )}

                      <div className={`relative flex items-center w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {/* Message Bubble - tối đa 70% chiều rộng */}
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-apple-lg relative ${
                        isMe
                          ? 'bg-blue-500 text-white rounded-br-sm'
                          : 'bg-white dark:bg-apple-gray-800 text-apple-primary rounded-bl-sm'
                          } ${msg.isDeleted ? 'opacity-50' : ''} ${
                            (msg.imageUrl || msg.voiceUrl || msg.fileUrl) ? '!p-0 !bg-transparent dark:!bg-transparent !border-0' : ''
                      }`}
                    >
                          {!msg.isDeleted && msg.imageUrl && (
                            <img
                              src={msg.imageUrl}
                              alt="Attachment"
                              className="w-full rounded-apple max-h-64 object-cover"
                            />
                          )}
                          {!msg.isDeleted && msg.fileUrl && (
                            <div className={`flex items-center space-x-2 p-2 bg-black/10 dark:bg-white/10 rounded-apple ${msg.imageUrl || msg.voiceUrl ? '' : 'mb-2'}`}>
                              <FileIcon className="w-4 h-4 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{msg.fileName || 'File'}</p>
                                {msg.fileSize && (
                                  <p className="text-xs opacity-75">
                                    {msg.fileSize < 1024 * 1024 
                                      ? `${(msg.fileSize / 1024).toFixed(1)} KB`
                                      : `${(msg.fileSize / (1024 * 1024)).toFixed(2)} MB`}
                                  </p>
                                )}
                              </div>
                              <a
                                href={msg.fileUrl}
                                download={msg.fileName || 'file'}
                                className="p-1.5 hover:bg-black/20 dark:hover:bg-white/20 rounded-apple transition-colors flex-shrink-0"
                                title="Tải xuống"
                                onClick={(e) => {
                                  e.preventDefault()
                                  // Extract file extension from URL if needed
                                  let fileName = msg.fileName || 'File'
                                  if (!fileName || fileName === 'File') {
                                    // Try to extract from URL
                                    const url = msg.fileUrl
                                    if (url && url.startsWith('data:')) {
                                      const matches = url.match(/data:([^;]+);base64/)
                                      if (matches) {
                                        const mimeType = matches[1]
                                        const ext = mimeType.split('/')[1] || 'bin'
                                        fileName = `file.${ext}`
                                      }
                                    } else if (url) {
                                      // Cloudinary URL - try to extract original filename
                                      const urlParts = url.split('/')
                                      fileName = urlParts[urlParts.length - 1] || 'file'
                                      // Remove query params if any
                                      fileName = fileName.split('?')[0]
                                    }
                                  }
                                  
                                  // If it's a base64 data URL, convert to blob and download
                                  if (msg.fileUrl && msg.fileUrl.startsWith('data:')) {
                                    const link = document.createElement('a')
                                    link.href = msg.fileUrl
                                    link.download = fileName
                                    document.body.appendChild(link)
                                    link.click()
                                    document.body.removeChild(link)
                                  } else if (msg.fileUrl) {
                                    // Cloudinary URL - download directly
                                    const link = document.createElement('a')
                                    link.href = msg.fileUrl
                                    link.download = fileName
                                    link.target = '_blank'
                                    document.body.appendChild(link)
                                    link.click()
                                    document.body.removeChild(link)
                                  }
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          )}
                          {!msg.isDeleted && msg.voiceUrl && (() => {
                            const isPlaying = playingVoiceId === msg.id
                            const progress = voiceProgress.get(msg.id) || { current: 0, duration: msg.voiceDuration || 0 }
                            
                            return (
                              <div className="flex items-center space-x-3 p-3 bg-black/10 dark:bg-white/10 rounded-apple-lg min-w-[200px] max-w-[280px]">
                                {/* Play/Pause Button */}
                                <button
                                  className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors"
                                  onClick={() => {
                                    let audio = audioRefs.current.get(msg.id)
                                    
                                    if (!audio) {
                                      audio = new Audio(msg.voiceUrl!)
                                      audioRefs.current.set(msg.id, audio)
                                      
                                      audio.addEventListener('loadedmetadata', () => {
                                        setVoiceProgress(prev => {
                                          const newMap = new Map(prev)
                                          newMap.set(msg.id, { current: 0, duration: audio!.duration })
                                          return newMap
                                        })
                                      })
                                      
                                      audio.addEventListener('timeupdate', () => {
                                        setVoiceProgress(prev => {
                                          const newMap = new Map(prev)
                                          newMap.set(msg.id, { current: audio!.currentTime, duration: audio!.duration || msg.voiceDuration || 0 })
                                          return newMap
                                        })
                                      })
                                      
                                      audio.addEventListener('ended', () => {
                                        setPlayingVoiceId(null)
                                        setVoiceProgress(prev => {
                                          const newMap = new Map(prev)
                                          newMap.set(msg.id, { current: 0, duration: audio!.duration || msg.voiceDuration || 0 })
                                          return newMap
                                        })
                                      })
                                    }
                                    
                                    if (isPlaying) {
                                      audio.pause()
                                      setPlayingVoiceId(null)
                                    } else {
                                      // Pause other audio if playing
                                      if (playingVoiceId !== null) {
                                        const otherAudio = audioRefs.current.get(playingVoiceId)
                                        if (otherAudio) {
                                          otherAudio.pause()
                                          otherAudio.currentTime = 0
                                        }
                                      }
                                      audio.play()
                                      setPlayingVoiceId(msg.id)
                                    }
                                  }}
                                >
                                  {isPlaying ? (
                                    <Pause className="w-5 h-5" fill="currentColor" />
                                  ) : (
                                    <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                                  )}
                                </button>
                                
                                {/* Progress Bar & Time */}
                                <div className="flex-1 min-w-0 space-y-1">
                                  {/* Progress Bar */}
                                  <div className="relative">
                                    <div className="h-1.5 bg-black/20 dark:bg-white/20 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-blue-500 rounded-full transition-all"
                                        style={{ width: `${progress.duration > 0 ? (progress.current / progress.duration) * 100 : 0}%` }}
                                      />
                                    </div>
                                    <input
                                      type="range"
                                      min="0"
                                      max={progress.duration || msg.voiceDuration || 0}
                                      value={progress.current}
                                      step="0.1"
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                      onChange={(e) => {
                                        const audio = audioRefs.current.get(msg.id)
                                        if (audio) {
                                          const newTime = parseFloat(e.target.value)
                                          audio.currentTime = newTime
                                          setVoiceProgress(prev => {
                                            const newMap = new Map(prev)
                                            newMap.set(msg.id, { current: newTime, duration: progress.duration })
                                            return newMap
                                          })
                                        }
                                      }}
                                    />
                                  </div>
                                  
                                  {/* Time Display */}
                                  <div className="flex items-center justify-between text-xs text-apple-tertiary">
                                    <span>{Math.floor(progress.current)}s</span>
                                    <span>{Math.floor(progress.duration || msg.voiceDuration || 0)}s</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })()}
                          {msg.isDeleted ? (
                            <p className="text-sm italic opacity-75">Tin nhắn đã được thu hồi</p>
                          ) : isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyPress={async (e) => {
                                  if (e.key === 'Enter' && editText.trim()) {
                                    try {
                                      await editChatMessage(msg.id, editText)
                                      setEditingMessageId(null)
                                      setEditText('')
                                    } catch (error) {
                                      console.error('Error editing message:', error)
                                    }
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingMessageId(null)
                                    setEditText('')
                                  }
                                }}
                                className="w-full px-2 py-1 text-sm bg-black/20 dark:bg-white/20 rounded-apple border border-white/30 focus:outline-none focus:ring-1 focus:ring-white/50 text-white"
                                autoFocus
                              />
                              <div className="flex items-center space-x-2 text-xs opacity-75">
                                <span>Nhấn Enter để lưu, Esc để hủy</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              {msg.text && (
                                <p className="text-sm leading-relaxed">{msg.text}</p>
                              )}
                            </>
                          )}

                          {/* Reactions */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Object.entries(msg.reactions).map(([emoji, userIds], idx) => (
                                <motion.button
                                  key={`${msg.id}-${emoji}-${idx}`}
                                  initial={{ scale: 0, rotate: -180, y: -20 }}
                                  animate={{ scale: 1, rotate: 0, y: 0 }}
                                  transition={{ 
                                    type: 'spring', 
                                    stiffness: 500, 
                                    damping: 15,
                                    delay: idx * 0.03
                                  }}
                                  whileHover={{ scale: 1.1, rotate: 5 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={async () => {
                                    await addChatReaction(msg.id, emoji)
                                  }}
                                  className="px-2 py-0.5 bg-black/20 dark:bg-white/20 rounded-full text-xs flex items-center space-x-1 hover:bg-black/30 dark:hover:bg-white/30 transition-colors"
                                >
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: [0, 1.3, 1] }}
                                    transition={{ 
                                      duration: 0.4,
                                      times: [0, 0.5, 1],
                                      delay: idx * 0.03
                                    }}
                                  >
                                    {emoji}
                                  </motion.span>
                                  <span className="opacity-75">{userIds.length}</span>
                                </motion.button>
                              ))}
                            </div>
                          )}

                          {/* Icon bút nhỏ ở góc dưới khi đã chỉnh sửa */}
                          {msg.isEdited && !msg.isDeleted && (
                            <Edit2 
                              className={`absolute w-3 h-3 opacity-60 pointer-events-none ${
                                isMe 
                                  ? 'bottom-1 right-1 text-white' 
                                  : 'bottom-1 left-1 text-apple-tertiary'
                              }`}
                            />
                          )}
                        </div>

                        {/* Menu - hiển thị bên cạnh message bubble */}
                        {isHovered && !msg.isDeleted && (
                          <div className={`flex items-center flex-shrink-0 z-20 ${
                            isMe ? 'order-first mr-5' : 'ml-5'
                          }`}>
                            <div
                              className="relative"
                              ref={(el) => {
                                if (el) {
                                  menuRefs.current.set(msg.id, el)
                                } else {
                                  menuRefs.current.delete(msg.id)
                                }
                              }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setMessageMenuOpen(isMenuOpen ? null : msg.id)
                                }}
                                className="p-1.5 rounded-apple glass-strong hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors shadow-apple"
                              >
                                <MoreVertical className={`w-4 h-4 ${isMe ? 'text-blue-100' : 'text-apple-secondary'}`} />
                              </button>

                              {/* Menu Dropdown */}
                              {isMenuOpen && (() => {
                                // Tính toán vị trí dropdown dựa trên vị trí của message trong container
                                const messageEl = messageRefs.current.get(msg.id)
                                const containerEl = messagesContainerRef.current
                                let verticalPos = 'bottom' // 'top' hoặc 'bottom'
                                let horizontalPos = isMe ? 'left' : 'right'
                                
                                if (messageEl && containerEl) {
                                  const messageRect = messageEl.getBoundingClientRect()
                                  const containerRect = containerEl.getBoundingClientRect()
                                  
                                  // Tính toán vị trí dọc: nếu message ở gần dưới (dưới 60% container) → dropdown hiện trên
                                  const messagePositionY = ((messageRect.top - containerRect.top) / containerRect.height) * 100
                                  verticalPos = messagePositionY > 60 ? 'top' : 'bottom'
                                  
                                  // Tính toán vị trí ngang: dựa trên vị trí của message button
                                  const menuButtonEl = menuRefs.current.get(msg.id)?.querySelector('button')
                                  if (menuButtonEl) {
                                    const buttonRect = menuButtonEl.getBoundingClientRect()
                                    const containerRight = containerRect.right
                                    const containerLeft = containerRect.left
                                    const buttonRight = buttonRect.right
                                    const buttonLeft = buttonRect.left
                                    
                                    // Nếu button ở gần phải (từ 70% trở đi) → dropdown hiện trái
                                    // Nếu button ở gần trái (dưới 30%) → dropdown hiện phải
                                    const buttonPositionX = ((buttonLeft - containerLeft) / containerRect.width) * 100
                                    if (isMe) {
                                      // Tin nhắn của mình: button ở bên phải message
                                      horizontalPos = buttonPositionX > 70 ? 'right' : 'left'
                                    } else {
                                      // Tin nhắn người khác: button ở bên trái message
                                      horizontalPos = buttonPositionX < 30 ? 'left' : 'right'
                                    }
                                  }
                                }
                                
                                return (
                                  <motion.div
                                    key={`menu-${msg.id}`}
                                    initial={{ opacity: 0, y: verticalPos === 'top' ? -10 : 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: verticalPos === 'top' ? -10 : 10 }}
                                    className={`absolute glass-strong rounded-apple-lg shadow-apple-lg border border-apple-gray-200 dark:border-apple-gray-800 py-1 pr-2 z-[100] min-w-[160px] ${
                                      horizontalPos === 'left' ? 'left-0' : 'right-0'
                        }`}
                                    style={{
                                      [verticalPos === 'top' ? 'bottom' : 'top']: '100%',
                                      [verticalPos === 'top' ? 'marginBottom' : 'marginTop']: '8px',
                                    }}
                      >
                                  {isMe && msg.text && (
                                    <button
                                      onClick={() => {
                                        setEditingMessageId(msg.id)
                                        setEditText(msg.text || '')
                                        setMessageMenuOpen(null)
                                      }}
                                      className="w-full px-4 py-2.5 text-left text-sm text-apple-primary hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 flex items-center space-x-2 transition-colors rounded-apple mx-1"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                      <span>Sửa</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setReplyingTo(msg)
                                      setMessageMenuOpen(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-apple-primary hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 flex items-center space-x-2 transition-colors rounded-apple mx-1"
                                  >
                                    <Reply className="w-4 h-4" />
                                    <span>Trả lời</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReactionPickerOpen(isReactionPickerOpen ? null : msg.id)
                                      setMessageMenuOpen(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-apple-primary hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 flex items-center space-x-2 transition-colors rounded-apple mx-1"
                                  >
                                    <Smile className="w-4 h-4" />
                                    <span>Thả cảm xúc</span>
                                  </button>
                                  {isMe && (
                                    <>
                                      <div className="h-px bg-apple-gray-200 dark:bg-apple-gray-800 my-1" />
                                      <button
                                        onClick={async () => {
                                          try {
                                            await deleteChatMessage(msg.id)
                                            setMessageMenuOpen(null)
                                          } catch (error) {
                                            console.error('Error deleting message:', error)
                                          }
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2 transition-colors rounded-apple mx-1"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Thu hồi</span>
                                      </button>
                                    </>
                                  )}
                                  </motion.div>
                                )
                              })()}
                            </div>
                          </div>
                        )}

                        {/* Reaction Picker */}
                        {isReactionPickerOpen && (() => {
                          // Tính toán vị trí reaction picker dựa trên vị trí của message trong container
                          const messageEl = messageRefs.current.get(msg.id)
                          const containerEl = messagesContainerRef.current
                          let verticalPos = 'top' // 'top' hoặc 'bottom' - reaction picker thường hiện trên message
                          let horizontalPos = isMe ? 'right' : 'left'
                          
                          if (messageEl && containerEl) {
                            const messageRect = messageEl.getBoundingClientRect()
                            const containerRect = containerEl.getBoundingClientRect()
                            
                            // Tính toán vị trí dọc: nếu message ở gần trên (trên 40% container) → picker hiện dưới
                            // Nếu message ở gần dưới (dưới 40% container) → picker hiện trên
                            const messagePositionY = ((messageRect.top - containerRect.top) / containerRect.height) * 100
                            verticalPos = messagePositionY > 40 ? 'top' : 'bottom'
                            
                            // Tính toán vị trí ngang: dựa trên vị trí của message bubble
                            const messageBubbleEl = messageEl.querySelector('[class*="max-w-[70%]"]')
                            if (messageBubbleEl) {
                              const bubbleRect = messageBubbleEl.getBoundingClientRect()
                              const containerWidth = containerRect.width
                              const bubbleLeft = bubbleRect.left
                              const bubbleRight = bubbleRect.right
                              const containerLeft = containerRect.left
                              
                              // Nếu bubble ở gần phải (từ 70% trở đi) → picker hiện trái
                              // Nếu bubble ở gần trái (dưới 30%) → picker hiện phải
                              const bubblePositionX = ((bubbleLeft - containerLeft) / containerWidth) * 100
                              if (isMe) {
                                // Tin nhắn của mình: bubble ở bên phải
                                horizontalPos = bubblePositionX > 70 ? 'right' : 'left'
                              } else {
                                // Tin nhắn người khác: bubble ở bên trái
                                horizontalPos = bubblePositionX < 30 ? 'left' : 'right'
                              }
                            }
                          }
                          
                          return (
                            <motion.div
                              ref={(el) => {
                                if (el) {
                                  reactionPickerRefs.current.set(msg.id, el)
                                } else {
                                  reactionPickerRefs.current.delete(msg.id)
                                }
                              }}
                              initial={{ opacity: 0, scale: 0.8, y: verticalPos === 'top' ? -10 : 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className={`absolute glass-strong rounded-apple-lg shadow-apple-lg border border-apple-gray-200 dark:border-apple-gray-800 p-2 z-[150] flex items-center space-x-1 overflow-hidden ${
                                horizontalPos === 'left' ? 'left-0' : 'right-0'
                              }`}
                              style={{
                                [verticalPos === 'top' ? 'bottom' : 'top']: '100%',
                                [verticalPos === 'top' ? 'marginBottom' : 'marginTop']: '8px',
                                maxWidth: 'calc(70% + 100px)',
                                width: 'max-content',
                              }}
                            >
                            {emojis.map((emoji, idx) => (
                              <motion.button
                                key={emoji}
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ 
                                  delay: idx * 0.05, 
                                  type: 'spring', 
                                  stiffness: 500, 
                                  damping: 15 
                                }}
                                onClick={async (e) => {
                                  e.stopPropagation() // Ngăn event bubble lên để không trigger click outside
                                  await addChatReaction(msg.id, emoji)
                                  setReactionPickerOpen(null)
                                }}
                                className="p-2 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 rounded-apple transition-colors text-lg relative"
                                whileHover={{ scale: 1.2, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <motion.span
                                  key={`${msg.id}-${emoji}`}
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                                >
                                  {emoji}
                              </motion.span>
                            </motion.button>
                          ))}
                            </motion.div>
                          )
                        })()}
                      </div>
                    </motion.div>
                  )
                })) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-apple-secondary">Chưa có tin nhắn nào</p>
                  </div>
                )) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-apple-secondary">Chọn một cuộc trò chuyện để bắt đầu</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Time Tooltip - hiển thị tại vị trí chuột, fixed positioning */}
              {timeTooltip && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="fixed px-2 py-1 glass-strong rounded-apple text-xs whitespace-nowrap pointer-events-none z-[200]"
                  style={{
                    left: `${timeTooltip.x + 10}px`,
                    top: `${timeTooltip.y - 30}px`,
                    transform: 'translateX(0)',
                  }}
                >
                  {timeTooltip.time}
                </motion.div>
              )}

              {/* Reply Preview */}
              {replyingTo && (
                <div className="px-4 pt-2 pb-2 border-t border-apple-gray-200 dark:border-apple-gray-800 bg-white dark:bg-black">
                  <div className="flex items-center justify-between px-3 py-2 bg-apple-gray-100 dark:bg-apple-gray-800 rounded-apple border-l-2 border-blue-500">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Reply className="w-3 h-3 text-blue-500 flex-shrink-0" />
                        <p className="text-xs font-medium text-blue-500 truncate">
                          {replyingTo.senderId === user?.uid 
                            ? 'Bạn' 
                            : (conversationsWithUser.find((c) => c.id === selectedChat || c.userId === selectedUserId)?.userData?.name || 'Người khác')}
                        </p>
                      </div>
                      <p className="text-xs text-apple-tertiary truncate">
                        {replyingTo.text || 
                          (replyingTo.fileUrl ? `📎 ${replyingTo.fileName || 'File'}` :
                           replyingTo.imageUrl ? '📷 Ảnh' :
                           replyingTo.voiceUrl ? `🎤 Tin nhắn thoại ${replyingTo.voiceDuration || 0}s` :
                           'Tin nhắn')}
                      </p>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="p-1 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700 rounded-full transition-colors flex-shrink-0 ml-2"
                    >
                      <XIcon className="w-3 h-3 text-apple-secondary" />
                    </button>
                  </div>
                </div>
              )}

              {/* Preview Files */}
              <AnimatePresence>
                {previewFiles.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pt-2 pb-2 border-t border-apple-gray-200 dark:border-apple-gray-800 bg-white dark:bg-black">
                      <div className="flex flex-wrap gap-2">
                        {previewFiles.map((preview, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                            className="relative group"
                          >
                            {preview.type === 'image' && preview.preview ? (
                              <div className="relative w-24 h-24 rounded-apple overflow-hidden border border-apple-gray-200 dark:border-apple-gray-800">
                                <img src={preview.preview} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                  onClick={() => setPreviewFiles((prev) => prev.filter((_, i) => i !== index))}
                                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <XIcon className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="relative px-3 py-2 rounded-apple bg-apple-gray-100 dark:bg-apple-gray-800 flex items-center space-x-2">
                                <FileIcon className="w-4 h-4 text-apple-secondary flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-apple-primary truncate max-w-[120px]">
                                    {preview.file.name}
                                  </p>
                                  <p className="text-xs text-apple-tertiary">
                                    {preview.file.size < 1024 * 1024 
                                      ? `${(preview.file.size / 1024).toFixed(1)} KB`
                                      : `${(preview.file.size / (1024 * 1024)).toFixed(2)} MB`}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setPreviewFiles((prev) => prev.filter((_, i) => i !== index))}
                                  className="p-1 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700 rounded-full transition-colors flex-shrink-0"
                                >
                                  <XIcon className="w-3 h-3 text-apple-secondary" />
                                </button>
                              </div>
                            )}
                  </motion.div>
                ))}
              </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message Input */}
              <div className="p-4 border-t border-apple-gray-200 dark:border-apple-gray-800 bg-white dark:bg-black">
                {isRecording ? (
                  <div className="flex items-center justify-between px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-apple-lg border-2 border-red-500">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        className="w-3 h-3 bg-red-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        Đang ghi âm... {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (mediaRecorderRef.current && isRecording) {
                          mediaRecorderRef.current.stop()
                          setIsRecording(false)
                          if (recordingTimerRef.current) {
                            clearInterval(recordingTimerRef.current)
                            recordingTimerRef.current = null
                          }
                        }
                      }}
                      className="px-4 py-1.5 bg-red-500 text-white rounded-apple text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                      Dừng
                    </button>
                  </div>
                ) : recordedAudio ? (
                  <div className="flex items-center justify-between px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-apple-lg border-2 border-blue-500">
                    <div className="flex items-center space-x-3">
                      <Mic className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {Math.floor(recordedAudio.duration / 60)}:{String(recordedAudio.duration % 60).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <motion.button
                        onClick={() => {
                          if (recordingStreamRef.current) {
                            recordingStreamRef.current.getTracks().forEach((track) => track.stop())
                            recordingStreamRef.current = null
                          }
                          setRecordedAudio(null)
                          setRecordingTime(0)
                        }}
                        className="p-2 rounded-apple bg-red-500 text-white hover:bg-red-600 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Hủy"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        onClick={async () => {
                          setRecordedAudio(null)
                          setRecordingTime(0)
                          // Clear previous recording
                          try {
                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                            recordingStreamRef.current = stream
                            const mediaRecorder = new MediaRecorder(stream)
                            mediaRecorderRef.current = mediaRecorder
                            audioChunksRef.current = []

                            mediaRecorder.ondataavailable = (event) => {
                              audioChunksRef.current.push(event.data)
                            }

                            mediaRecorder.onstop = async () => {
                              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                              
                              if (recordingStreamRef.current) {
                                recordingStreamRef.current.getTracks().forEach((track) => track.stop())
                                recordingStreamRef.current = null
                              }
                              
                              const audioUrl = URL.createObjectURL(audioBlob)
                              const audio = new Audio(audioUrl)
                              audio.onloadedmetadata = () => {
                                const duration = Math.round(audio.duration)
                                setRecordedAudio({ blob: audioBlob, duration })
                                URL.revokeObjectURL(audioUrl)
                              }
                            }

                            mediaRecorder.start()
                            setIsRecording(true)
                            setRecordingTime(0)

                            // Clear any existing timer first
                            if (recordingTimerRef.current) {
                              clearInterval(recordingTimerRef.current)
                              recordingTimerRef.current = null
                            }
                            
                            recordingTimerRef.current = setInterval(() => {
                              setRecordingTime((prev) => prev + 1)
                            }, 1000) as ReturnType<typeof setInterval>
                          } catch (error) {
                            console.error('Error starting recording:', error)
                            alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.')
                          }
                        }}
                        className="p-2 rounded-apple bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Ghi lại"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        onClick={async () => {
                          if (!recordedAudio || !selectedUserId || !user?.uid) return

                          try {
                            const voiceFile = new File([recordedAudio.blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
                            const { smartUploadService } = await import('@/lib/services/smartUploadService')
                            const conversationId = chatService.getConversationId(user.uid, selectedUserId)
                            const uploadResult = await smartUploadService.upload(voiceFile, 'audio', {
                              userId: user.uid,
                              conversationId,
                            })
                            
                            await sendChatMessage('', {
                              type: 'voice',
                              voiceUrl: uploadResult.url,
                              voiceDuration: recordedAudio.duration,
                            })
                            
                            setRecordedAudio(null)
                            setRecordingTime(0)
                          } catch (error) {
                            console.error('Error sending voice message:', error)
                            alert('Có lỗi khi gửi tin nhắn thoại')
                          }
                        }}
                        className="p-2 rounded-apple bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Gửi"
                      >
                        <Send className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-end space-x-2">
                    {/* Attach Button */}
                    <Dropdown
                      items={[
                        {
                          label: 'Chọn ảnh',
                          icon: <ImageIcon className="w-4 h-4" />,
                          onClick: () => imageInputRef.current?.click(),
                        },
                        {
                          label: 'Chọn file',
                          icon: <FileIcon className="w-4 h-4" />,
                          onClick: () => fileInputRef.current?.click(),
                        },
                      ]}
                      isOpen={attachDropdownOpen}
                      onClose={() => setAttachDropdownOpen(false)}
                      position="top"
                    >
                      <motion.button
                        className="p-2 rounded-apple-lg bg-apple-gray-100 dark:bg-apple-gray-800 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700 transition-colors flex-shrink-0"
                        onClick={() => setAttachDropdownOpen(!attachDropdownOpen)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Plus className="w-5 h-5 text-apple-secondary" />
                      </motion.button>
                    </Dropdown>

                    {/* Hidden file inputs */}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        files.forEach((file) => {
                          if (file.type.startsWith('image/')) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              setPreviewFiles((prev) => [...prev, { type: 'image', file, preview: reader.result as string }])
                            }
                            reader.readAsDataURL(file)
                          }
                        })
                        if (e.target) e.target.value = ''
                      }}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
                        
                        files.forEach((file) => {
                          // Validate file size (max 5MB)
                          if (file.size > MAX_FILE_SIZE) {
                            alert(`File "${file.name}" quá lớn. Kích thước tối đa: 5MB`)
                            return
                          }
                          
                          if (!file.type.startsWith('image/')) {
                            setPreviewFiles((prev) => [...prev, { type: 'file', file }])
                          }
                        })
                        if (e.target) e.target.value = ''
                      }}
                    />

                    {/* Text Input */}
                    <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={message}
                          onChange={(e) => {
                            setMessage(e.target.value)
                          }}
                        onKeyPress={async (e) => {
                          if (e.key === 'Enter' && !e.shiftKey && (message.trim() || previewFiles.length > 0) && selectedUserId) {
                            try {
                              // Upload files if any
                              let imageUrl: string | undefined
                              let fileUrl: string | undefined
                              let fileName: string | undefined
                              let fileSize: number | undefined

                              if (previewFiles[0] && user?.uid && selectedUserId) {
                                const { smartUploadService } = await import('@/lib/services/smartUploadService')
                                const conversationId = chatService.getConversationId(user.uid, selectedUserId)
                                const uploadResult = await smartUploadService.upload(
                                  previewFiles[0].file,
                                  previewFiles[0].type === 'image' ? 'image' : 'file',
                                  { userId: user.uid, conversationId }
                                )
                                
                                if (uploadResult.type === 'image') {
                                  imageUrl = uploadResult.url
                                } else {
                                  fileUrl = uploadResult.url
                                  fileName = previewFiles[0].file.name
                                  fileSize = previewFiles[0].file.size
                                }
                              }

                              await sendChatMessage(message.trim(), {
                                type: imageUrl ? 'image' : fileUrl ? 'file' : 'text',
                                imageUrl,
                                fileUrl,
                                fileName,
                                fileSize,
                                replyToId: replyingTo?.id,
                                replyToText: replyingTo?.text || 
                                  (replyingTo?.fileUrl ? `📎 ${replyingTo.fileName || 'File'}` :
                                   replyingTo?.imageUrl ? '📷 Ảnh' :
                                   replyingTo?.voiceUrl ? `🎤 Tin nhắn thoại ${replyingTo.voiceDuration || 0}s` :
                                   undefined),
                              })
                              
                              setMessage('')
                              setPreviewFiles([])
                              updateTypingStatus(false).catch(console.error)
                              setReplyingTo(null)
                            } catch (error) {
                              console.error('Error sending message:', error)
                              alert('Có lỗi khi gửi tin nhắn')
                            }
                          }
                        }}
                        className="w-full px-4 py-2 rounded-apple-lg bg-apple-gray-100 dark:bg-apple-gray-800 border border-apple-gray-200 dark:border-apple-gray-700 text-apple-primary placeholder:text-apple-tertiary focus:outline-none focus:ring-2 focus:ring-apple-gray-400 dark:focus:ring-apple-gray-600"
                  />
                    </div>

                    {/* Voice Button or Send Button */}
                    {message.trim() || previewFiles.length > 0 ? (
                  <motion.button
                        className="p-2 rounded-apple-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex-shrink-0"
                        onClick={async () => {
                          if (!selectedUserId) return
                          
                          try {
                            // Upload files if any
                            let imageUrl: string | undefined
                            let fileUrl: string | undefined
                            let fileName: string | undefined
                            let fileSize: number | undefined

                            if (previewFiles[0] && user?.uid) {
                              const { smartUploadService } = await import('@/lib/services/smartUploadService')
                              const conversationId = selectedUserId ? chatService.getConversationId(user.uid, selectedUserId) : undefined
                              const uploadResult = await smartUploadService.upload(
                                previewFiles[0].file,
                                previewFiles[0].type === 'image' ? 'image' : 'file',
                                { userId: user.uid, conversationId }
                              )
                              
                              if (uploadResult.type === 'image') {
                                imageUrl = uploadResult.url
                              } else {
                                fileUrl = uploadResult.url
                                fileName = previewFiles[0].file.name
                                fileSize = previewFiles[0].file.size
                              }
                            }

                            await sendChatMessage(message.trim(), {
                              type: imageUrl ? 'image' : fileUrl ? 'file' : 'text',
                              imageUrl,
                              fileUrl,
                              fileName,
                              fileSize,
                              replyToId: replyingTo?.id,
                              replyToText: replyingTo?.text || 
                                (replyingTo?.fileUrl ? `📎 ${replyingTo.fileName || 'File'}` :
                                 replyingTo?.imageUrl ? '📷 Ảnh' :
                                 replyingTo?.voiceUrl ? `🎤 Tin nhắn thoại ${replyingTo.voiceDuration || 0}s` :
                                 undefined),
                            })
                            
                            setMessage('')
                            setPreviewFiles([])
                            updateTypingStatus(false).catch(console.error)
                            setReplyingTo(null)
                          } catch (error) {
                            console.error('Error sending message:', error)
                            alert('Có lỗi khi gửi tin nhắn')
                          }
                        }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                    ) : (
                      <motion.button
                        className="p-2 rounded-apple-lg bg-apple-gray-100 dark:bg-apple-gray-800 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700 transition-colors flex-shrink-0"
                        onClick={async () => {
                          // Clear previous recording
                          setRecordedAudio(null)
                          
                          try {
                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                            recordingStreamRef.current = stream
                            const mediaRecorder = new MediaRecorder(stream)
                            mediaRecorderRef.current = mediaRecorder
                            audioChunksRef.current = []

                            mediaRecorder.ondataavailable = (event) => {
                              audioChunksRef.current.push(event.data)
                            }

                            mediaRecorder.onstop = async () => {
                              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                              
                              // Stop all tracks
                              if (recordingStreamRef.current) {
                                recordingStreamRef.current.getTracks().forEach((track) => track.stop())
                                recordingStreamRef.current = null
                              }
                              
                              // Get duration
                              const audioUrl = URL.createObjectURL(audioBlob)
                              const audio = new Audio(audioUrl)
                              audio.onloadedmetadata = () => {
                                const duration = Math.round(audio.duration)
                                // Save recorded audio for review
                                setRecordedAudio({ blob: audioBlob, duration })
                                URL.revokeObjectURL(audioUrl)
                              }
                            }

                            mediaRecorder.start()
                            setIsRecording(true)
                            setRecordingTime(0)

                            // Clear any existing timer first
                            if (recordingTimerRef.current) {
                              clearInterval(recordingTimerRef.current)
                              recordingTimerRef.current = null
                            }
                            
                            recordingTimerRef.current = setInterval(() => {
                              setRecordingTime((prev) => prev + 1)
                            }, 1000) as ReturnType<typeof setInterval>
                          } catch (error) {
                            console.error('Error starting recording:', error)
                            alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.')
                          }
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Ghi âm"
                      >
                        <Mic className="w-5 h-5 text-apple-secondary" />
                      </motion.button>
                    )}
                </div>
                )}
              </div>
            </div>
          </div>
        </AppleCard>
      </div>

      {/* Call Modals */}
      <AnimatePresence mode="wait">
        {callState && callState.type === 'audio' && (
          <CallModal
            key="audio-call"
            user={callState.user}
            type="audio"
            onClose={() => setCallState(null)}
            incoming={false}
          />
        )}

        {callState && callState.type === 'video' && (
          <VideoCallModal
            key="video-call"
            user={callState.user}
            onClose={() => setCallState(null)}
            incoming={false}
          />
        )}
      </AnimatePresence>
      </GlobalLayout>
    </ProtectedRoute>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <GlobalLayout>
          <div className="max-w-6xl mx-auto">
            <AppleCard className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-16 bg-apple-gray-200 dark:bg-apple-gray-800 rounded-lg" />
              </div>
            </AppleCard>
          </div>
        </GlobalLayout>
      </ProtectedRoute>
    }>
      <MessagesContent />
    </Suspense>
  )
}

