/**
 * Chat Hook
 * Realtime listener for chat messages using Realtime Database
 */

import { useState, useEffect, useRef } from 'react'
import { chatService, ChatMessage, Conversation } from '../services/chatService'
import { useAuth } from './useAuth'

interface UseChatOptions {
  /** Limit number of messages (default: 50) */
  limitCount?: number
  /** Enable realtime updates (default: true) */
  realtime?: boolean
}

interface UseChatResult {
  messages: ChatMessage[]
  loading: boolean
  error: Error | null
  typing: boolean // Other user is typing
  isOnline: boolean // Other user online status
  lastSeen?: number // Other user last seen timestamp
  sendMessage: (text: string, options?: {
    type?: 'text' | 'image' | 'file' | 'voice'
    imageUrl?: string
    fileUrl?: string
    fileName?: string
    fileSize?: number
    voiceUrl?: string
    voiceDuration?: number
    replyToId?: string
    replyToText?: string
  }) => Promise<void>
  editMessage: (messageId: string, newText: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  addReaction: (messageId: string, emoji: string) => Promise<void>
  markAsRead: () => Promise<void>
  setTyping: (isTyping: boolean) => Promise<void>
}

/**
 * Hook to get realtime chat messages for a conversation
 */
export function useChat(
  otherUserId: string | null,
  options: UseChatOptions = {}
): UseChatResult {
  const { user } = useAuth()
  const { limitCount = 50, realtime = true } = options
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [lastSeen, setLastSeen] = useState<number | undefined>(undefined)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const typingUnsubscribeRef = useRef<(() => void) | null>(null)
  const onlineStatusUnsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!user?.uid || !otherUserId) {
      setMessages([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Cleanup previous subscriptions
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
    if (typingUnsubscribeRef.current) {
      typingUnsubscribeRef.current()
      typingUnsubscribeRef.current = null
    }
    if (onlineStatusUnsubscribeRef.current) {
      onlineStatusUnsubscribeRef.current()
      onlineStatusUnsubscribeRef.current = null
    }

    const conversationId = chatService.getConversationId(user.uid, otherUserId)

    if (realtime) {
      // Realtime listener for messages
      unsubscribeRef.current = chatService.listenToMessages(
        user.uid,
        otherUserId,
        (newMessages) => {
          setMessages(newMessages)
          setLoading(false)
          setError(null)

          // Mark as read when messages are loaded
          chatService.markAsRead(conversationId, user.uid).catch((err) => {
            console.error('Error marking as read:', err)
          })
        },
        limitCount
      )

      // Listen to typing status
      typingUnsubscribeRef.current = chatService.listenToTyping(
        conversationId,
        user.uid,
        (typingUsers) => {
          setIsOtherTyping(typingUsers.length > 0)
        }
      )

      // Listen to online status and last seen
      onlineStatusUnsubscribeRef.current = chatService.listenToOnlineStatus(
        otherUserId,
        (online, seen) => {
          setIsOnline(online)
          setLastSeen(seen)
        }
      )
    } else {
      // One-time fetch (not recommended for Realtime DB, but available)
      setLoading(false)
    }

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      if (typingUnsubscribeRef.current) {
        typingUnsubscribeRef.current()
        typingUnsubscribeRef.current = null
      }
      if (onlineStatusUnsubscribeRef.current) {
        onlineStatusUnsubscribeRef.current()
        onlineStatusUnsubscribeRef.current = null
      }
    }
  }, [user?.uid, otherUserId, limitCount, realtime])

  const sendMessage = async (
    text: string,
    options: {
      type?: 'text' | 'image' | 'file' | 'voice'
      imageUrl?: string
      fileUrl?: string
      fileName?: string
      fileSize?: number
      voiceUrl?: string
      voiceDuration?: number
      replyToId?: string
      replyToText?: string
    } = {}
  ) => {
    if (!user?.uid || !otherUserId) return

    try {
      await chatService.sendMessage(user.uid, otherUserId, {
        text,
        ...options,
      })
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err as Error)
      throw err
    }
  }

  const editMessage = async (messageId: string, newText: string) => {
    if (!user?.uid || !otherUserId) return

    try {
      const conversationId = chatService.getConversationId(user.uid, otherUserId)
      await chatService.editMessage(conversationId, messageId, newText)
    } catch (err) {
      console.error('Error editing message:', err)
      setError(err as Error)
      throw err
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!user?.uid || !otherUserId) return

    try {
      const conversationId = chatService.getConversationId(user.uid, otherUserId)
      await chatService.deleteMessage(conversationId, messageId)
    } catch (err) {
      console.error('Error deleting message:', err)
      setError(err as Error)
      throw err
    }
  }

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user?.uid || !otherUserId) return

    try {
      const conversationId = chatService.getConversationId(user.uid, otherUserId)
      await chatService.addReaction(conversationId, messageId, emoji, user.uid)
    } catch (err) {
      console.error('Error adding reaction:', err)
      setError(err as Error)
      throw err
    }
  }

  const markAsRead = async () => {
    if (!user?.uid || !otherUserId) return

    try {
      const conversationId = chatService.getConversationId(user.uid, otherUserId)
      await chatService.markAsRead(conversationId, user.uid)
    } catch (err) {
      console.error('Error marking as read:', err)
      setError(err as Error)
    }
  }

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!user?.uid || !otherUserId) return

    try {
      const conversationId = chatService.getConversationId(user.uid, otherUserId)
      await chatService.setTyping(conversationId, user.uid, isTyping)
    } catch (err) {
      console.error('Error setting typing status:', err)
    }
  }

  return {
    messages,
    loading,
    error,
    typing: isOtherTyping,
    isOnline,
    lastSeen,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    markAsRead,
    setTyping: updateTypingStatus,
  }
}

/**
 * Hook to get conversations list (realtime)
 */
export function useConversations() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!user?.uid) {
      setConversations([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Cleanup previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    // Realtime listener
    unsubscribeRef.current = chatService.listenToConversations(
      user.uid,
      (newConversations) => {
        setConversations(newConversations)
        setLoading(false)
        setError(null)
      }
    )

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [user?.uid])

  return { conversations, loading, error }
}

