'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '@/components/ui/Avatar'
import { X, Minimize2, Send, MoreVertical, Phone, Video, User, Plus, Image as ImageIcon, File as FileIcon, Mic, X as XIcon, Edit2, Trash2, Reply, Smile, Download, Play, Pause, RotateCcw } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Dropdown } from '@/components/ui/Dropdown'
import Link from 'next/link'
import { useChat } from '@/lib/firebase/hooks/useChat'
import { useAuth } from '@/lib/firebase/hooks/useAuth'
import { smartUploadService } from '@/lib/services/smartUploadService'
import { useMemo } from 'react'
import type { ChatMessage } from '@/lib/firebase/services/chatService'

interface Message {
  id: number
  text: string
  sender: 'me' | 'other'
  time: string
  createdAt?: number // For sorting
  image?: string
  file?: { name: string; url: string; size: number }
  voice?: { url: string; duration: number }
  replyTo?: { id: number; text: string; sender: string }
  reactions?: { emoji: string; users: string[] }[]
  isEdited?: boolean
  isDeleted?: boolean
}

interface PreviewFile {
  type: 'image' | 'file'
  file: File
  preview?: string
}

interface MessagePopupProps {
  user: {
    id: number
    name: string
    username: string
    avatar: string
    online: boolean
  }
  userId?: string // Firebase userId for chat
  onClose: () => void
  onMinimize: () => void
  onCall?: (type: 'audio' | 'video') => void
  position?: { x: number; y: number }
}

// Format last seen time
function formatLastSeen(lastSeen?: number, isOnline?: boolean): string {
  if (isOnline) return 'Đang hoạt động'
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

export function MessagePopup({ user, userId, onClose, onMinimize, onCall, position }: MessagePopupProps) {
  const { user: authUser } = useAuth()
  const { 
    messages: chatMessages, 
    loading: chatLoading, 
    sendMessage: sendChatMessage, 
    editMessage: editChatMessage, 
    deleteMessage: deleteChatMessage, 
    addReaction: addChatReaction,
    typing: isTyping,
    isOnline,
    lastSeen,
    setTyping: updateTypingStatus,
  } = useChat(userId || null)
  
  // Debug: Log props
  useEffect(() => {
    console.log('MessagePopup initialized:', { userId, user, authUser: authUser?.uid })
  }, [userId, user, authUser])
  
  // Keep local state for UI-only features
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  // Calculate initial position - on mobile, avoid bottom navigation (64px + safe area)
  const getInitialPosition = () => {
    if (typeof window === 'undefined') return { x: 0, y: 0 }
    
    const isMobile = window.innerWidth < 1024 // lg breakpoint
    // Bottom nav height: h-16 (64px) + padding (0.5rem = 8px top/bottom) + safe area
    const bottomNavHeight = isMobile ? 80 : 0 // Approximate: 64px + 16px padding + safe area
    const popupHeight = 500
    const popupWidth = isMobile ? Math.min(320, window.innerWidth - 16) : 320 // w-80 = 320px
    
    return {
      x: isMobile ? (window.innerWidth - popupWidth) / 2 : window.innerWidth - 380,
      y: isMobile ? window.innerHeight - popupHeight - bottomNavHeight - 8 : window.innerHeight - 600, // 8px margin from bottom nav
    }
  }
  
  const [popupPosition, setPopupPosition] = useState(
    position || getInitialPosition()
  )
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [attachDropdownOpen, setAttachDropdownOpen] = useState(false)
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; duration: number } | null>(null)
  const recordingStreamRef = useRef<MediaStream | null>(null)
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null)
  const [messageMenuOpen, setMessageMenuOpen] = useState<number | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [replyingToChatMsg, setReplyingToChatMsg] = useState<ChatMessage | null>(null) // Keep original ChatMessage for reply
  const [reactionPickerOpen, setReactionPickerOpen] = useState<number | null>(null)
  const [timeTooltip, setTimeTooltip] = useState<{ msgId: number; x: number; y: number; time: string } | null>(null)
  const menuCloseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const timeTooltipTimerRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recordingTimerRef = useRef<number | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const menuRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const reactionPickerRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const audioRefs = useRef<Map<number, HTMLAudioElement>>(new Map())
  const [playingVoiceId, setPlayingVoiceId] = useState<number | null>(null)
  const [voiceProgress, setVoiceProgress] = useState<Map<number, { current: number; duration: number }>>(new Map())

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏']

  useEffect(() => {
    if (position) {
      setPopupPosition(position)
    }
  }, [position])

  // Create a map to quickly find ChatMessage by Message.id (number)
  const chatMessageIdMap = useMemo(() => {
    const map = new Map<number, ChatMessage>()
    chatMessages.forEach((chatMsg) => {
      const msgIdNum = parseInt(String(chatMsg.id).replace(/\D/g, '')) || 0
      if (msgIdNum > 0) {
        map.set(msgIdNum, chatMsg)
      }
    })
    return map
  }, [chatMessages])

  // Convert ChatMessage to Message format
  const messages: Message[] = useMemo(() => {
    return chatMessages
      .map((msg): Message => {
        const isMe = msg.senderId === authUser?.uid
        const createdAt = typeof msg.createdAt === 'number' ? msg.createdAt : parseInt(String(msg.createdAt)) || Date.now()
        const time = new Date(createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        
        return {
          id: parseInt(msg.id.replace(/\D/g, '')) || Date.now(), // Convert string id to number
          text: msg.text || '',
          sender: isMe ? ('me' as const) : ('other' as const),
          time,
          createdAt, // Store createdAt for sorting
          ...(msg.imageUrl && { image: msg.imageUrl }),
          ...(msg.fileUrl && {
            file: {
              name: msg.fileName || 'File',
              url: msg.fileUrl,
              size: msg.fileSize || 0,
            },
          }),
          ...(msg.voiceUrl && {
            voice: {
              url: msg.voiceUrl,
              duration: msg.voiceDuration || 0,
            },
          }),
          ...(msg.replyToId && msg.replyToText && {
            replyTo: {
              id: parseInt(msg.replyToId.replace(/\D/g, '')) || 0,
              text: msg.replyToText,
              sender: msg.senderId === authUser?.uid ? 'Bạn' : user.name,
            },
          }),
          ...(msg.reactions && {
            reactions: Object.entries(msg.reactions).map(([emoji, userIds]) => ({
              emoji,
              users: userIds,
            })),
          }),
          isEdited: msg.isEdited,
          isDeleted: msg.isDeleted,
        }
      })
      .sort((a, b) => {
        // Sort by createdAt (oldest first) - Facebook style (oldest on top, newest on bottom)
        const timeA = (a as any).createdAt || a.id
        const timeB = (b as any).createdAt || b.id
        return timeA - timeB
      })
  }, [chatMessages, authUser?.uid, user.name])

  // Combine real messages with local UI messages - remove duplicates
  const allMessages = useMemo(() => {
    // Create a map to deduplicate messages by ID
    const messagesMap = new Map<number, Message>()
    
    // Add messages from chatMessages first
    messages.forEach(msg => {
      messagesMap.set(msg.id, msg)
    })
    
    // Add local messages, but only if they don't exist in chatMessages yet
    localMessages.forEach(msg => {
      if (!messagesMap.has(msg.id)) {
        messagesMap.set(msg.id, msg)
      }
    })
    
    return Array.from(messagesMap.values()).sort((a, b) => {
      // Sort by createdAt (oldest first) - Facebook style
      const timeA = (a as any).createdAt || a.id
      const timeB = (b as any).createdAt || b.id
      return timeA - timeB
    })
  }, [messages, localMessages])

  useEffect(() => {
    // Scroll to bottom (newest message) when messages change or typing indicator appears
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [allMessages, isTyping])

  // Handle click outside for menu and reaction picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Check menu
      if (messageMenuOpen !== null) {
        const menuRef = menuRefs.current.get(messageMenuOpen)
        if (menuRef && !menuRef.contains(target)) {
          // Kiểm tra xem có phải click vào reaction picker không
          const reactionPickerRef = reactionPickerRefs.current.get(reactionPickerOpen || -1)
          if (!reactionPickerRef || !reactionPickerRef.contains(target)) {
            setMessageMenuOpen(null)
          }
        }
      }
      
      // Check reaction picker
      if (reactionPickerOpen !== null) {
        const reactionPickerRef = reactionPickerRefs.current.get(reactionPickerOpen)
        if (reactionPickerRef && !reactionPickerRef.contains(target)) {
          // Kiểm tra xem có phải click vào menu không
          const menuRef = menuRefs.current.get(messageMenuOpen || -1)
          if (!menuRef || !menuRef.contains(target)) {
            setReactionPickerOpen(null)
          }
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

  // Update typing indicator when user types
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingTimeRef = useRef<number>(0)
  
  useEffect(() => {
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    if (newMessage.trim() && userId) {
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
  }, [newMessage, updateTypingStatus, userId])

  const handleSendMessage = async () => {
    const hasContent = newMessage.trim() || previewFiles.length > 0
    if (!hasContent) {
      console.log('No content to send')
      return
    }
    
    if (!userId) {
      console.error('No userId provided', { userId, user })
      alert('Không thể xác định người nhận. Vui lòng thử lại.')
      return
    }
    
    if (!authUser?.uid) {
      console.error('User not authenticated', { authUser })
      alert('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.')
      return
    }

    console.log('Sending message:', { userId, senderId: authUser.uid, text: newMessage, hasFiles: previewFiles.length > 0 })

    try {
      let imageUrl: string | undefined
      let fileUrl: string | undefined
      let fileName: string | undefined
      let fileSize: number | undefined
      
      // Upload files if any
      if (previewFiles.length > 0) {
        const file = previewFiles[0].file
        console.log('Uploading file:', { name: file.name, type: file.type, size: file.size })
        
        // Get conversationId for chat messages
        let conversationId: string | undefined
        if (userId && authUser?.uid) {
          const conversationIds = [authUser.uid, userId].sort()
          conversationId = `${conversationIds[0]}_${conversationIds[1]}`
        }
        
        const uploadResult = await smartUploadService.upload(file, undefined, {
          userId: authUser.uid,
          conversationId,
        })
        console.log('File uploaded:', uploadResult.url)
        
        if (file.type.startsWith('image/')) {
          imageUrl = uploadResult.url
        } else {
          fileUrl = uploadResult.url
          fileName = file.name
          fileSize = file.size
        }
      }

      // Send message via chat service
      console.log('Calling sendChatMessage...')
      
      // Prepare message options - only include defined values
      const messageOptions: {
        type?: 'text' | 'image' | 'file' | 'voice'
        imageUrl?: string
        fileUrl?: string
        fileName?: string
        fileSize?: number
        voiceUrl?: string
        voiceDuration?: number
        replyToId?: string
        replyToText?: string
      } = {
        type: previewFiles[0]?.type === 'image' ? 'image' : previewFiles[0]?.type === 'file' ? 'file' : 'text',
      }
      
      // Only add optional fields if they have values
      if (imageUrl) {
        messageOptions.imageUrl = imageUrl
      }
      if (fileUrl) {
        messageOptions.fileUrl = fileUrl
        if (fileName) {
          messageOptions.fileName = fileName
        }
        if (fileSize) {
          messageOptions.fileSize = fileSize
        }
      }
      if (replyingTo && replyingToChatMsg) {
        // Use original ChatMessage ID and text for reply
        messageOptions.replyToId = replyingToChatMsg.id
        
        // Get reply text - prefer text, fallback to file/image/voice description
        let replyText = replyingToChatMsg.text || ''
        if (!replyText) {
          if (replyingToChatMsg.fileUrl) {
            replyText = `📎 ${replyingToChatMsg.fileName || 'File'}`
          } else if (replyingToChatMsg.imageUrl) {
            replyText = '📷 Ảnh'
          } else if (replyingToChatMsg.voiceUrl) {
            replyText = `🎤 Tin nhắn thoại ${replyingToChatMsg.voiceDuration || 0}s`
          }
        }
        
        if (replyText) {
          messageOptions.replyToText = replyText
        }
      }
      
      await sendChatMessage(newMessage, messageOptions)
      console.log('Message sent successfully')

      // Clear input
      setNewMessage('')
      setPreviewFiles([])
      updateTypingStatus(false).catch(console.error)
      setReplyingTo(null)
      setReplyingToChatMsg(null)
    } catch (error) {
      console.error('Error sending message:', error)
      alert(`Có lỗi xảy ra khi gửi tin nhắn: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
    
    files.forEach((file) => {
      // Validate file size (max 5MB)
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" quá lớn. Kích thước tối đa: 5MB`)
        return
      }
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviewFiles((prev) => [...prev, { type: 'image', file, preview: reader.result as string }])
        }
        reader.readAsDataURL(file)
      } else {
        setPreviewFiles((prev) => [...prev, { type: 'file', file }])
      }
    })
    if (e.target) e.target.value = ''
  }

  const handleRemovePreview = (index: number) => {
    setPreviewFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const startRecording = async () => {
    try {
      // Clear previous recording
      setRecordedAudio(null)
      
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
      
      // Start timer
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => track.stop())
      recordingStreamRef.current = null
    }
    setIsRecording(false)
    setRecordedAudio(null)
    setRecordingTime(0)
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
  }

  const sendRecording = async () => {
    if (!recordedAudio || !userId || !authUser?.uid) return

    try {
      // Upload voice file
      const audioFile = new File([recordedAudio.blob], 'voice.webm', { type: 'audio/webm' })
      
      // Get conversationId for chat messages
      let conversationId: string | undefined
      if (userId && authUser?.uid) {
        const conversationIds = [authUser.uid, userId].sort()
        conversationId = `${conversationIds[0]}_${conversationIds[1]}`
      }
      
      const uploadResult = await smartUploadService.upload(audioFile, 'audio', {
        userId: authUser.uid,
        conversationId,
      })
      
      // Send voice message via chat service
      const voiceOptions: {
        type: 'voice'
        voiceUrl: string
        voiceDuration: number
      } = {
        type: 'voice',
        voiceUrl: uploadResult.url,
        voiceDuration: recordedAudio.duration,
      }
      
      await sendChatMessage('', voiceOptions)
      
      // Clear recording
      setRecordedAudio(null)
      setRecordingTime(0)
    } catch (error) {
      console.error('Error sending voice message:', error)
      alert('Có lỗi xảy ra khi gửi tin nhắn thoại')
    }
  }

  const reRecord = async () => {
    setRecordedAudio(null)
    setRecordingTime(0)
    await startRecording()
  }

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
    }
  }, [isRecording])

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
      if (typeof window === 'undefined') return
      
      const isMobile = window.innerWidth < 1024
      // Bottom nav height: h-16 (64px) + padding + safe area ≈ 80px
      const bottomNavHeight = isMobile ? 80 : 0
      const popupWidth = isMobile ? Math.min(320, window.innerWidth - 16) : 320
      const popupHeight = 500
      const maxX = window.innerWidth - popupWidth
      const maxY = isMobile ? window.innerHeight - popupHeight - bottomNavHeight - 8 : window.innerHeight - popupHeight // 8px margin
      
      const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, maxX))
      const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, maxY))
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

  // Check if mobile for responsive sizing
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <motion.div
      ref={popupRef}
      className={`fixed ${isMobile ? 'w-[calc(100vw-16px)] max-w-[320px]' : 'w-80'} h-[500px] z-50 glass-strong rounded-apple-lg shadow-apple-lg border border-apple-gray-200 dark:border-apple-gray-800 flex flex-col overflow-hidden`}
      style={{
        left: `${popupPosition.x}px`,
        top: `${popupPosition.y}px`,
        cursor: isDragging ? 'grabbing' : 'default',
        pointerEvents: 'auto',
        maxHeight: isMobile ? 'calc(100vh - 80px)' : '500px', // Reserve space for bottom nav on mobile
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
          <Avatar src={user.avatar} size="sm" online={isOnline} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs text-apple-primary truncate leading-tight">{user.name}</p>
            <p className="text-xs text-apple-tertiary truncate leading-tight mt-0.5">
              {isTyping ? 'Đang nhập...' : formatLastSeen(lastSeen, isOnline)}
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
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-visible p-4 space-y-4 bg-apple-gray-50 dark:bg-apple-gray-900 scrollbar-hide relative"
      >
        {chatLoading && allMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-apple-tertiary">Đang tải tin nhắn...</div>
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-apple-tertiary text-sm">Chưa có tin nhắn nào</div>
          </div>
        ) : (
          <>
            {/* Messages */}
            {allMessages.map((msg) => {
          const isHovered = hoveredMessageId === msg.id
          const isMenuOpen = messageMenuOpen === msg.id
          const isEditing = editingMessageId === msg.id
          const isReactionPickerOpen = reactionPickerOpen === msg.id

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
              className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'} group`}
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
                      time: msg.time,
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
              {msg.replyTo && (
                <div className={`max-w-[50%] px-3 py-1.5 mb-1 rounded-apple text-xs ${
                  msg.sender === 'me'
                    ? 'bg-blue-400/20 text-blue-100 border-l-2 border-blue-300'
                    : 'bg-apple-gray-200 dark:bg-apple-gray-700 text-apple-tertiary border-l-2 border-apple-gray-400'
                }`}>
                  <p className="font-medium truncate">{msg.replyTo.sender}</p>
                  <p className="truncate opacity-75 line-clamp-2">{msg.replyTo.text}</p>
                </div>
              )}

              <div className={`relative flex items-center w-full ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                {/* Message Bubble - tối đa 70% chiều rộng */}
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-apple-lg relative ${
                msg.sender === 'me'
                  ? 'bg-blue-500 text-white rounded-br-sm'
                  : 'bg-white dark:bg-apple-gray-800 text-apple-primary rounded-bl-sm'
                  } ${msg.isDeleted ? 'opacity-50' : ''} ${
                    (msg.image || msg.voice || msg.file) ? '!p-0 !bg-transparent dark:!bg-transparent !border-0' : ''
              }`}
            >
                  {!msg.isDeleted && msg.image && (
                    <img
                      src={msg.image}
                      alt="Attachment"
                      className="w-full rounded-apple max-h-48 object-cover"
                    />
                  )}
                  {!msg.isDeleted && msg.file && (
                    <div className={`flex items-center space-x-2 p-2 bg-black/10 dark:bg-white/10 rounded-apple ${msg.image || msg.voice ? '' : 'mb-2'}`}>
                      <FileIcon className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{msg.file.name}</p>
                        <p className="text-xs opacity-75">
                          {msg.file.size < 1024 * 1024 
                            ? `${(msg.file.size / 1024).toFixed(1)} KB`
                            : `${(msg.file.size / (1024 * 1024)).toFixed(2)} MB`}
                        </p>
                      </div>
                      <a
                        href={msg.file.url}
                        download={msg.file.name}
                        className="p-1.5 hover:bg-black/20 dark:hover:bg-white/20 rounded-apple transition-colors flex-shrink-0"
                        title="Tải xuống"
                        onClick={(e) => {
                          e.preventDefault()
                          // Extract file extension from URL if needed
                          let fileName = msg.file!.name
                          if (!fileName || fileName === 'File') {
                            // Try to extract from URL
                            const url = msg.file!.url
                            if (url.startsWith('data:')) {
                              const matches = url.match(/data:([^;]+);base64/)
                              if (matches) {
                                const mimeType = matches[1]
                                const ext = mimeType.split('/')[1] || 'bin'
                                fileName = `file.${ext}`
                              }
                            } else {
                              // Cloudinary URL - try to extract original filename
                              const urlParts = url.split('/')
                              fileName = urlParts[urlParts.length - 1] || 'file'
                            }
                          }
                          
                          // If it's a base64 data URL, convert to blob and download
                          if (msg.file!.url.startsWith('data:')) {
                            const link = document.createElement('a')
                            link.href = msg.file!.url
                            link.download = fileName
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          } else {
                            // Cloudinary URL - download directly
                            const link = document.createElement('a')
                            link.href = msg.file!.url
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
                  {!msg.isDeleted && msg.voice && (() => {
                    const isPlaying = playingVoiceId === msg.id
                    const progress = voiceProgress.get(msg.id) || { current: 0, duration: msg.voice.duration }
                    
                    return (
                      <div className="flex items-center space-x-3 p-3 bg-black/10 dark:bg-white/10 rounded-apple-lg min-w-[200px] max-w-[280px]">
                        {/* Play/Pause Button */}
                        <button
                          className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors"
                          onClick={() => {
                            let audio = audioRefs.current.get(msg.id)
                            
                            if (!audio) {
                              audio = new Audio(msg.voice!.url)
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
                                  newMap.set(msg.id, { current: audio!.currentTime, duration: audio!.duration || msg.voice!.duration })
                                  return newMap
                                })
                              })
                              
                              audio.addEventListener('ended', () => {
                                setPlayingVoiceId(null)
                                setVoiceProgress(prev => {
                                  const newMap = new Map(prev)
                                  newMap.set(msg.id, { current: 0, duration: audio!.duration || msg.voice!.duration })
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
                              max={progress.duration || msg.voice.duration}
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
                            <span>{Math.floor(progress.duration || msg.voice.duration)}s</span>
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
                              // Find original ChatMessage for edit using map
                              const chatMsg = chatMessageIdMap.get(msg.id)
                              
                              if (chatMsg) {
                                await editChatMessage(chatMsg.id, editText.trim())
                              } else {
                                console.error('ChatMessage not found for edit:', { msgId: msg.id })
                              }
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
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {msg.reactions.map((reaction, idx) => (
                        <motion.button
                          key={`${msg.id}-${reaction.emoji}-${idx}`}
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
                            {reaction.emoji}
                          </motion.span>
                          <span className="opacity-75">{reaction.users.length}</span>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Icon bút nhỏ ở góc dưới khi đã chỉnh sửa */}
                  {msg.isEdited && !msg.isDeleted && (
                    <Edit2 
                      className={`absolute w-3 h-3 opacity-60 pointer-events-none ${
                        msg.sender === 'me' 
                          ? 'bottom-1 right-1 text-white' 
                          : 'bottom-1 left-1 text-apple-tertiary'
                      }`}
                    />
                  )}
                </div>

                {/* Menu - hiển thị bên cạnh message bubble */}
                {isHovered && !msg.isDeleted && (
                  <div className={`flex items-center flex-shrink-0 z-20 ${
                    msg.sender === 'me' ? 'order-first mr-5' : 'ml-5'
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
                        <MoreVertical className={`w-4 h-4 ${msg.sender === 'me' ? 'text-blue-100' : 'text-apple-secondary'}`} />
                      </button>

                      {/* Menu Dropdown */}
                      {isMenuOpen && (() => {
                        // Tính toán vị trí dropdown dựa trên vị trí của message trong container
                        const messageEl = messageRefs.current.get(msg.id)
                        const containerEl = messagesContainerRef.current
                        let verticalPos = 'bottom' // 'top' hoặc 'bottom'
                        let horizontalPos = msg.sender === 'me' ? 'left' : 'right'
                        
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
                            const containerWidth = containerRect.width
                            const buttonLeft = buttonRect.left
                            const containerLeft = containerRect.left
                            
                            // Nếu button ở gần phải (từ 70% trở đi) → dropdown hiện trái
                            // Nếu button ở gần trái (dưới 30%) → dropdown hiện phải
                            const buttonPositionX = ((buttonLeft - containerLeft) / containerWidth) * 100
                            if (msg.sender === 'me') {
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
                            {msg.sender === 'me' && msg.text && (
                              <button
                                onClick={() => {
                                  setEditingMessageId(msg.id)
                                  setEditText(msg.text)
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
                                // Find original ChatMessage for reply using map
                                const chatMsg = chatMessageIdMap.get(msg.id)
                                
                                if (chatMsg) {
                                  setReplyingToChatMsg(chatMsg)
                                  setReplyingTo(msg)
                                } else {
                                  console.error('ChatMessage not found for reply:', { msgId: msg.id })
                                }
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
                            {msg.sender === 'me' && (
                              <>
                                <div className="h-px bg-apple-gray-200 dark:bg-apple-gray-800 my-1" />
                                <button
                                  onClick={async () => {
                                    try {
                                      // Find original ChatMessage for delete using map
                                      const chatMsg = chatMessageIdMap.get(msg.id)
                                      
                                      if (chatMsg) {
                                        await deleteChatMessage(chatMsg.id)
                                      } else {
                                        console.error('ChatMessage not found for delete:', { msgId: msg.id })
                                      }
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
                  let horizontalPos = msg.sender === 'me' ? 'right' : 'left'
                  
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
                      if (msg.sender === 'me') {
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
                        transition={{ delay: idx * 0.05, type: 'spring', stiffness: 500, damping: 15 }}
                        onClick={async (e) => {
                          e.stopPropagation() // Ngăn event bubble lên để không trigger click outside
                          try {
                            // Find original chat message id using map
                            const chatMsg = chatMessageIdMap.get(msg.id)
                            
                            if (chatMsg) {
                              await addChatReaction(chatMsg.id, emoji)
                            } else {
                              console.error('ChatMessage not found for reaction:', { msgId: msg.id })
                            }
                            setReactionPickerOpen(null)
                          } catch (error) {
                            console.error('Error adding reaction:', error)
                          }
                        }}
                        className="p-2 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 rounded-apple transition-colors text-lg relative"
                        whileHover={{ scale: 1.2 }}
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
        })}
          </>
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
                  {replyingTo.sender === 'me' ? 'Bạn' : user.name}
                </p>
              </div>
              <p className="text-xs text-apple-tertiary truncate">
                {replyingTo.text || 
                  (replyingToChatMsg?.fileUrl ? `📎 ${replyingToChatMsg.fileName || 'File'}` :
                   replyingToChatMsg?.imageUrl ? '📷 Ảnh' :
                   replyingToChatMsg?.voiceUrl ? `🎤 Tin nhắn thoại ${replyingToChatMsg.voiceDuration || 0}s` :
                   'Tin nhắn')}
              </p>
            </div>
            <button
              onClick={() => {
                setReplyingTo(null)
                setReplyingToChatMsg(null)
              }}
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
                          onClick={() => handleRemovePreview(index)}
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
                          onClick={() => handleRemovePreview(index)}
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

      {/* Input */}
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
              onClick={stopRecording}
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
                onClick={cancelRecording}
                className="p-2 rounded-apple bg-red-500 text-white hover:bg-red-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Hủy"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={reRecord}
                className="p-2 rounded-apple bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Ghi lại"
              >
                <RotateCcw className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={sendRecording}
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
                <Plus className="w-4 h-4 text-apple-secondary" />
              </motion.button>
            </Dropdown>

            {/* Hidden file inputs */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Text Input */}
            <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                className="w-full px-4 py-2 rounded-apple-lg bg-apple-gray-100 dark:bg-apple-gray-800 border border-apple-gray-200 dark:border-apple-gray-700 text-apple-primary placeholder:text-apple-tertiary focus:outline-none focus:ring-2 focus:ring-apple-gray-400 dark:focus:ring-apple-gray-600 text-sm"
          />
            </div>

            {/* Voice Button or Send Button */}
            {newMessage.trim() || previewFiles.length > 0 ? (
          <motion.button
                className="p-2 rounded-apple-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex-shrink-0"
            onClick={handleSendMessage}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-4 h-4" />
          </motion.button>
            ) : (
              <motion.button
                className="p-2 rounded-apple-lg bg-apple-gray-100 dark:bg-apple-gray-800 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700 transition-colors flex-shrink-0"
                onClick={startRecording}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Ghi âm"
              >
                <Mic className="w-4 h-4 text-apple-secondary" />
              </motion.button>
            )}
        </div>
        )}
      </div>
    </motion.div>
  )
}
