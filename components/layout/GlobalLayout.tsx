'use client'

import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { RightSidebar } from './RightSidebar'
import { BottomNavigation } from './BottomNavigation'
import { MessagePopupManager } from '@/components/messages/MessagePopupManager'
import { CallModal } from '@/components/call/CallModal'
import { VideoCallModal } from '@/components/call/VideoCallModal'
import { AnimatePresence } from 'framer-motion'
import { useState, useCallback, useEffect } from 'react'
import { Message as MessageType } from '@/components/messages/MessageDropdown'
import { usePathname } from 'next/navigation'

interface OpenChat {
  id: number
  user: {
    id: number
    name: string
    username: string
    avatar: string
    online: boolean
  }
  position: { x: number; y: number }
  minimized: boolean
}

interface CallState {
  user: {
    id: number
    name: string
    username: string
    avatar: string
    online: boolean
  }
  type: 'audio' | 'video'
  incoming: boolean
}

export function GlobalLayout({ children }: { children: React.ReactNode }) {
  const [openChats, setOpenChats] = useState<OpenChat[]>([])
  const [callState, setCallState] = useState<CallState | null>(null)
  const pathname = usePathname()

  // Đóng tất cả popup khi vào trang tin nhắn
  useEffect(() => {
    if (pathname === '/messages' || pathname?.startsWith('/messages/')) {
      setOpenChats([])
    }
  }, [pathname])

  const handleOpenChat = useCallback((message: MessageType) => {
    if (typeof window === 'undefined') return
    
    // Chặn mở popup khi đang ở trang tin nhắn
    if (pathname === '/messages' || pathname?.startsWith('/messages/')) {
      return
    }
    
    // Kiểm tra xem chat đã mở chưa
    const existingChat = openChats.find((chat) => chat.id === message.id)
    if (existingChat) {
      // Nếu đã mở, chỉ cần un-minimize
      setOpenChats(
        openChats.map((chat) =>
          chat.id === message.id ? { ...chat, minimized: false } : chat
        )
      )
      return
    }

    // Tạo chat mới
    const newChat: OpenChat = {
      id: message.id,
      user: {
        id: message.id,
        name: message.user.name,
        username: message.user.username,
        avatar: message.user.avatar,
        online: message.user.online,
      },
      position: {
        x: window.innerWidth - 380,
        y: window.innerHeight - 600,
      },
      minimized: false,
    }

    setOpenChats([...openChats, newChat])
  }, [openChats, pathname])

  const handleCloseChat = useCallback((chatId: number) => {
    setOpenChats(openChats.filter((chat) => chat.id !== chatId))
  }, [openChats])

  const handleMinimizeChat = useCallback((chatId: number) => {
    setOpenChats(
      openChats.map((chat) =>
        chat.id === chatId ? { ...chat, minimized: true } : chat
      )
    )
  }, [openChats])

  const handleCall = useCallback((user: OpenChat['user'], type: 'audio' | 'video') => {
    setCallState({
      user,
      type,
      incoming: false,
    })
  }, [])

  const handleCloseCall = useCallback(() => {
    setCallState(null)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header onOpenChat={handleOpenChat} />
      <div className="max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 lg:ml-72 xl:ml-80 xl:mr-80 min-w-0 pb-20 lg:pb-4 mt-4 lg:mt-8">
            {children}
          </main>
          <RightSidebar />
        </div>
      </div>
      <BottomNavigation />
      <MessagePopupManager
        openChats={openChats}
        onCloseChat={handleCloseChat}
        onMinimizeChat={handleMinimizeChat}
        onCall={handleCall}
      />

      {/* Call Modals */}
      <AnimatePresence mode="wait">
        {callState && callState.type === 'audio' && (
          <CallModal
            key="audio-call"
            user={callState.user}
            type="audio"
            onClose={handleCloseCall}
            incoming={callState.incoming}
          />
        )}

        {callState && callState.type === 'video' && (
          <VideoCallModal
            key="video-call"
            user={callState.user}
            onClose={handleCloseCall}
            incoming={callState.incoming}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
