'use client'

import { createContext, useContext, ReactNode } from 'react'

interface MessageUser {
  id: number
  name: string
  username: string
  avatar: string
  online: boolean
}

export interface Message {
  id: number
  userId?: string // Firebase userId for chat
  user: MessageUser
  preview?: string
  lastMessage?: string // Last message preview (optional for compatibility)
  time?: string
  unread?: number
}

interface MessageContextType {
  openChat: (message: Message) => void
}

const MessageContext = createContext<MessageContextType | undefined>(undefined)

export function MessageProvider({ 
  children, 
  onOpenChat 
}: { 
  children: ReactNode
  onOpenChat: (message: Message) => void 
}) {
  return (
    <MessageContext.Provider value={{ openChat: onOpenChat }}>
      {children}
    </MessageContext.Provider>
  )
}

export function useMessage() {
  const context = useContext(MessageContext)
  if (context === undefined) {
    throw new Error('useMessage must be used within a MessageProvider')
  }
  return context
}

