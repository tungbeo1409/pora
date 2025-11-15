'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '@/components/ui/Avatar'
import { X, Minimize2, Send, MoreVertical, Phone, Video, User, Plus, Image as ImageIcon, File, Mic, X as XIcon, Edit2, Trash2, Reply, Smile } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Dropdown } from '@/components/ui/Dropdown'
import Link from 'next/link'

interface Message {
  id: number
  text: string
  sender: 'me' | 'other'
  time: string
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
  onClose: () => void
  onMinimize: () => void
  onCall?: (type: 'audio' | 'video') => void
  position?: { x: number; y: number }
}

const initialMessages: Message[] = [
  { id: 1, text: 'Xin chào! Bạn có khỏe không?', sender: 'other', time: '10:30' },
  { id: 2, text: 'Chào bạn! Mình khỏe, cảm ơn bạn đã hỏi thăm.', sender: 'me', time: '10:32' },
  { id: 3, text: 'Tuyệt vời! Bạn có rảnh để thảo luận về dự án không?', sender: 'other', time: '10:33' },
  { id: 4, text: '', image: 'https://picsum.photos/400/300?random=1', sender: 'me', time: '10:34' },
  { id: 5, text: 'Có chứ! Mình đang rảnh. Bạn muốn bắt đầu từ đâu?', sender: 'me', time: '10:35' },
  { id: 6, text: '', image: 'https://picsum.photos/400/500?random=2', sender: 'other', time: '10:36' },
  { id: 7, text: 'Đây là ảnh từ chuyến đi cuối tuần!', sender: 'other', time: '10:36' },
  { id: 8, text: 'Cảm ơn bạn đã giúp đỡ!', sender: 'other', time: '10:40' },
  { id: 9, text: '', image: 'https://picsum.photos/500/400?random=3', sender: 'me', time: '10:42' },
  { id: 10, text: 'Chia sẻ một bức ảnh đẹp với bạn', sender: 'me', time: '10:42' },
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
  const [attachDropdownOpen, setAttachDropdownOpen] = useState(false)
  const [typing, setTyping] = useState(false)
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null)
  const [messageMenuOpen, setMessageMenuOpen] = useState<number | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [reactionPickerOpen, setReactionPickerOpen] = useState<number | null>(null)
  const [timeTooltip, setTimeTooltip] = useState<{ msgId: number; x: number; y: number; time: string } | null>(null)
  const menuCloseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const timeTooltipTimerRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const menuRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const reactionPickerRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏']

  useEffect(() => {
    if (position) {
      setPopupPosition(position)
    }
  }, [position])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  // Simulate typing indicator
  useEffect(() => {
    if (newMessage.trim()) {
      setTyping(true)
      const timer = setTimeout(() => setTyping(false), 2000)
      return () => clearTimeout(timer)
    } else {
      setTyping(false)
    }
  }, [newMessage])

  const handleSendMessage = () => {
    const hasContent = newMessage.trim() || previewFiles.length > 0
    if (!hasContent) return

    const message: Message = {
      id: Date.now(),
      text: newMessage,
      sender: 'me',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      ...(replyingTo && {
        replyTo: {
          id: replyingTo.id,
          text: replyingTo.text,
          sender: replyingTo.sender === 'me' ? 'Bạn' : user.name,
        },
      }),
      ...(previewFiles[0]?.type === 'image' && { image: previewFiles[0].preview }),
      ...(previewFiles[0]?.type === 'file' && {
        file: {
          name: previewFiles[0].file.name,
          url: URL.createObjectURL(previewFiles[0].file),
          size: previewFiles[0].file.size,
        },
      }),
    }

    setMessages([...messages, message])
    setNewMessage('')
    setPreviewFiles([])
    setTyping(false)
    setReplyingTo(null)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => {
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        audio.onloadedmetadata = () => {
          const duration = Math.round(audio.duration)
          const message: Message = {
            id: Date.now(),
            text: '',
            sender: 'me',
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            voice: { url: audioUrl, duration },
          }
          setMessages((prev) => [...prev, message])
        }
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      recordingTimerRef.current = setInterval(() => {
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
      setRecordingTime(0)
    }
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
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-visible p-4 space-y-4 bg-apple-gray-50 dark:bg-apple-gray-900 scrollbar-hide relative"
      >
        {messages.map((msg) => {
          const isHovered = hoveredMessageId === msg.id
          const isMenuOpen = messageMenuOpen === msg.id
          const isEditing = editingMessageId === msg.id
          const isReactionPickerOpen = reactionPickerOpen === msg.id

          return (
          <motion.div
            key={msg.id}
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
                    (msg.image || msg.voice) ? '!p-0 !bg-transparent dark:!bg-transparent' : ''
              }`}
            >
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="Attachment"
                      className="w-full rounded-apple max-h-48 object-cover"
                    />
                  )}
                  {msg.file && (
                    <div className={`flex items-center space-x-2 p-2 bg-black/10 dark:bg-white/10 rounded-apple ${msg.image || msg.voice ? '' : 'mb-2'}`} style={{ border: 'none' }}>
                      <File className="w-4 h-4" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{msg.file.name}</p>
                        <p className="text-xs opacity-75">
                          {(msg.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  )}
                  {msg.voice && (
                    <div className="flex items-center space-x-2">
                      <button
                        className="flex items-center space-x-2 px-3 py-1.5 bg-black/20 dark:bg-white/20 rounded-apple hover:bg-black/30 dark:hover:bg-white/30 transition-colors"
                        onClick={() => {
                          const audio = new Audio(msg.voice!.url)
                          audio.play()
                        }}
                      >
                        <Mic className="w-4 h-4" />
                        <span className="text-xs font-medium">{msg.voice.duration}s</span>
                      </button>
                    </div>
                  )}
                  {msg.isDeleted ? (
                    <p className="text-sm italic opacity-75">Tin nhắn đã được thu hồi</p>
                  ) : isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && editText.trim()) {
                            setMessages(messages.map(m => 
                              m.id === msg.id ? { ...m, text: editText, isEdited: true } : m
                            ))
                            setEditingMessageId(null)
                            setEditText('')
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
                            {msg.sender === 'me' && (
                              <>
                                <div className="h-px bg-apple-gray-200 dark:bg-apple-gray-800 my-1" />
                                <button
                                  onClick={() => {
                                    setMessages(messages.map(m => 
                                      m.id === msg.id ? { ...m, isDeleted: true, text: '' } : m
                                    ))
                                    setMessageMenuOpen(null)
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
                        onClick={(e) => {
                          e.stopPropagation() // Ngăn event bubble lên để không trigger click outside
                          const existingReaction = messages.find(m => m.id === msg.id)?.reactions?.find(r => r.emoji === emoji)
                          const isAdding = !existingReaction
                          
                          setMessages(messages.map(m => {
                            if (m.id === msg.id) {
                              if (existingReaction) {
                                // Remove reaction
                                return {
                                  ...m,
                                  reactions: m.reactions?.filter(r => r.emoji !== emoji) || []
                                }
                              } else {
                                // Add reaction with animation
                                return {
                                  ...m,
                                  reactions: [
                                    ...(m.reactions || []),
                                    { emoji, users: ['Bạn'] }
                                  ]
                                }
                              }
                            }
                            return m
                          }))
                          
                          // Hiệu ứng bounce khi thêm reaction thành công
                          if (isAdding) {
                            // Trigger animation bằng cách force re-render với key mới
                            setTimeout(() => {
                              setMessages(prev => prev)
                            }, 100)
                          }
                          
                          setReactionPickerOpen(null)
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
        {/* Typing Indicator */}
        {typing && (
          <motion.div
            className="flex justify-start"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-white dark:bg-apple-gray-800 rounded-apple-lg rounded-bl-sm px-4 py-2">
              <div className="flex space-x-1">
                <motion.div
                  className="w-2 h-2 bg-apple-tertiary rounded-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 bg-apple-tertiary rounded-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-apple-tertiary rounded-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </div>
          </motion.div>
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
              <p className="text-xs text-apple-tertiary truncate">{replyingTo.text}</p>
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
                          onClick={() => handleRemovePreview(index)}
                          className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative px-3 py-2 rounded-apple bg-apple-gray-100 dark:bg-apple-gray-800 flex items-center space-x-2" style={{ border: 'none' }}>
                        <File className="w-4 h-4 text-apple-secondary" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-apple-primary truncate max-w-[120px]">
                            {preview.file.name}
                          </p>
                          <p className="text-xs text-apple-tertiary">
                            {(preview.file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemovePreview(index)}
                          className="p-1 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700 rounded-full transition-colors"
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
              Dừng & Gửi
            </button>
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
                  icon: <File className="w-4 h-4" />,
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
