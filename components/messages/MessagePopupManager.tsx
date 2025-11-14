'use client'

import { AnimatePresence } from 'framer-motion'
import { MessagePopup } from './MessagePopup'
import { useState, useEffect } from 'react'

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

interface MessagePopupManagerProps {
  openChats: OpenChat[]
  onCloseChat: (chatId: number) => void
  onMinimizeChat: (chatId: number) => void
  onCall?: (user: OpenChat['user'], type: 'audio' | 'video') => void
}

export function MessagePopupManager({
  openChats,
  onCloseChat,
  onMinimizeChat,
  onCall,
}: MessagePopupManagerProps) {
  const [positions, setPositions] = useState<Map<number, { x: number; y: number }>>(new Map())

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Tính toán vị trí cho các popup để không chồng lên nhau
    const newPositions = new Map<number, { x: number; y: number }>()
    const popupWidth = 320
    const popupHeight = 500
    const spacing = 20

    openChats.forEach((chat, index) => {
      if (!chat.minimized) {
        const x = window.innerWidth - popupWidth - spacing - (index * (popupWidth + spacing))
        const y = window.innerHeight - popupHeight - spacing
        newPositions.set(chat.id, { x, y })
      }
    })

    setPositions(newPositions)
  }, [openChats])

  return (
    <div className="fixed inset-0 pointer-events-none z-[60]">
      <AnimatePresence>
        {openChats
          .filter((chat) => !chat.minimized)
          .map((chat, index) => {
            const position = positions.get(chat.id) || chat.position
            return (
              <MessagePopup
                key={chat.id}
                user={chat.user}
                onClose={() => onCloseChat(chat.id)}
                onMinimize={() => onMinimizeChat(chat.id)}
                onCall={onCall ? (type) => onCall(chat.user, type) : undefined}
                position={position}
              />
            )
          })}
      </AnimatePresence>
    </div>
  )
}

