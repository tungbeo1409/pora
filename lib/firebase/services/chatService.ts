/**
 * Chat Service
 * Handles realtime chat using Firebase Realtime Database
 * Uses Realtime DB to save read operations (cheaper than Firestore reads)
 */

import { rtdb } from '../config'
import { ref, push, set, onValue, off, query, orderByChild, limitToLast, child, get, update, remove, serverTimestamp, Unsubscribe } from 'firebase/database'
import type { DatabaseReference } from 'firebase/database'

export interface ChatMessage {
  id: string
  text?: string
  senderId: string
  receiverId: string
  type: 'text' | 'image' | 'file' | 'voice'
  imageUrl?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  voiceUrl?: string
  voiceDuration?: number
  replyToId?: string
  replyToText?: string
  reactions?: { [emoji: string]: string[] } // { '👍': ['userId1', 'userId2'] }
  isEdited?: boolean
  isDeleted?: boolean
  createdAt: number | string
  updatedAt?: number | string
}

export interface Conversation {
  id: string
  userId: string
  lastMessage?: ChatMessage
  lastMessageTime?: number
  unreadCount: number
  isOnline?: boolean
}

export class ChatService {
  private basePath = 'chats'

  /**
   * Get conversation ID between two users (sorted)
   */
  getConversationId(userId1: string, userId2: string): string {
    const ids = [userId1, userId2].sort()
    return `${ids[0]}_${ids[1]}`
  }

  /**
   * Get messages path for a conversation
   */
  private getMessagesPath(conversationId: string): string {
    return `${this.basePath}/${conversationId}/messages`
  }

  /**
   * Get conversation metadata path
   */
  private getConversationPath(conversationId: string, userId: string): string {
    return `${this.basePath}/${conversationId}/metadata/${userId}`
  }

  /**
   * Send a message
   */
  async sendMessage(
    senderId: string,
    receiverId: string,
    message: {
      text?: string
      type?: 'text' | 'image' | 'file' | 'voice'
      imageUrl?: string
      fileUrl?: string
      fileName?: string
      fileSize?: number
      voiceUrl?: string
      voiceDuration?: number
      replyToId?: string
      replyToText?: string
    }
  ): Promise<string> {
    try {
      if (!rtdb) {
        throw new Error('Realtime Database not initialized')
      }

      const conversationId = this.getConversationId(senderId, receiverId)
      const messagesRef = ref(rtdb, this.getMessagesPath(conversationId))
      
      // Create message
      const messageRef = push(messagesRef)
      const messageId = messageRef.key!

      const now = Date.now()
      const messageData: ChatMessage = {
        id: messageId,
        senderId,
        receiverId,
        text: message.text || '',
        type: message.type || 'text',
        reactions: {},
        isEdited: false,
        isDeleted: false,
        createdAt: now,
      }

      // Only add optional fields if they exist (avoid undefined values in Realtime DB)
      if (message.imageUrl) {
        messageData.imageUrl = message.imageUrl
      }
      if (message.fileUrl) {
        messageData.fileUrl = message.fileUrl
        if (message.fileName) {
          messageData.fileName = message.fileName
        }
        if (message.fileSize) {
          messageData.fileSize = message.fileSize
        }
      }
      if (message.voiceUrl) {
        messageData.voiceUrl = message.voiceUrl
        if (message.voiceDuration) {
          messageData.voiceDuration = message.voiceDuration
        }
      }
      if (message.replyToId) {
        messageData.replyToId = message.replyToId
        if (message.replyToText) {
          messageData.replyToText = message.replyToText
        }
      }

      await set(messageRef, messageData)

      // Update conversation metadata
      const updates: { [key: string]: any } = {}

      // Update sender's metadata
      const lastMessage: any = {
        id: messageId,
        text: message.text || '',
        type: message.type || 'text',
      }
      // Only add optional fields if they exist
      if (message.imageUrl) {
        lastMessage.imageUrl = message.imageUrl
      }
      if (message.fileUrl) {
        lastMessage.fileUrl = message.fileUrl
      }
      if (message.voiceUrl) {
        lastMessage.voiceUrl = message.voiceUrl
      }
      
      updates[`${this.getConversationPath(conversationId, senderId)}/lastMessageTime`] = now
      updates[`${this.getConversationPath(conversationId, senderId)}/lastMessage`] = lastMessage
      updates[`${this.getConversationPath(conversationId, senderId)}/unreadCount`] = 0 // Sender has read their own message

      // Update receiver's metadata
      updates[`${this.getConversationPath(conversationId, receiverId)}/lastMessageTime`] = now
      updates[`${this.getConversationPath(conversationId, receiverId)}/lastMessage`] = lastMessage
      
      // Increment unread count for receiver
      const receiverMetadataRef = ref(rtdb, `${this.getConversationPath(conversationId, receiverId)}/unreadCount`)
      const receiverMetadataSnap = await get(receiverMetadataRef)
      const currentUnread = receiverMetadataSnap.exists() ? receiverMetadataSnap.val() : 0
      updates[`${this.getConversationPath(conversationId, receiverId)}/unreadCount`] = currentUnread + 1

      await update(ref(rtdb, '/'), updates)

      return messageId
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  /**
   * Listen to messages in a conversation (realtime)
   */
  listenToMessages(
    userId1: string,
    userId2: string,
    callback: (messages: ChatMessage[]) => void,
    limitCount = 50
  ): Unsubscribe {
    if (!rtdb) {
      console.error('Realtime Database not initialized')
      return () => {}
    }

    const conversationId = this.getConversationId(userId1, userId2)
    const messagesRef = ref(rtdb, this.getMessagesPath(conversationId))
    const messagesQuery = query(messagesRef, orderByChild('createdAt'), limitToLast(limitCount))

    const unsubscribe = onValue(
      messagesQuery,
      (snapshot) => {
        if (snapshot.exists()) {
          const messagesData = snapshot.val()
          const messages: ChatMessage[] = Object.keys(messagesData)
            .map((key) => ({
              ...messagesData[key],
              id: key,
            }))
            .sort((a, b) => {
              // Ensure createdAt is a number for sorting
              const timeA = typeof a.createdAt === 'number' ? a.createdAt : (typeof a.createdAt === 'string' ? parseInt(String(a.createdAt)) || 0 : 0)
              const timeB = typeof b.createdAt === 'number' ? b.createdAt : (typeof b.createdAt === 'string' ? parseInt(String(b.createdAt)) || 0 : 0)
              return timeA - timeB // Sort oldest first (ascending)
            })

          callback(messages)
        } else {
          callback([])
        }
      },
      (error) => {
        console.error('Error listening to messages:', error)
        callback([])
      }
    )

    return unsubscribe
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      if (!rtdb) {
        throw new Error('Realtime Database not initialized')
      }

      const unreadRef = ref(rtdb, `${this.getConversationPath(conversationId, userId)}/unreadCount`)
      await set(unreadRef, 0)
    } catch (error) {
      console.error('Error marking messages as read:', error)
      throw error
    }
  }

  /**
   * Edit a message
   */
  async editMessage(
    conversationId: string,
    messageId: string,
    newText: string
  ): Promise<void> {
    try {
      if (!rtdb) {
        throw new Error('Realtime Database not initialized')
      }

      const messageRef = ref(rtdb, `${this.getMessagesPath(conversationId)}/${messageId}`)
      await update(messageRef, {
        text: newText,
        isEdited: true,
        updatedAt: Date.now(),
      })
    } catch (error) {
      console.error('Error editing message:', error)
      throw error
    }
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    try {
      if (!rtdb) {
        throw new Error('Realtime Database not initialized')
      }

      const messageRef = ref(rtdb, `${this.getMessagesPath(conversationId)}/${messageId}`)
      await update(messageRef, {
        isDeleted: true,
        text: '',
        updatedAt: Date.now(),
      })
    } catch (error) {
      console.error('Error deleting message:', error)
      throw error
    }
  }

  /**
   * Add reaction to a message
   */
  async addReaction(
    conversationId: string,
    messageId: string,
    emoji: string,
    userId: string
  ): Promise<void> {
    try {
      if (!rtdb) {
        throw new Error('Realtime Database not initialized')
      }

      const messageRef = ref(rtdb, `${this.getMessagesPath(conversationId)}/${messageId}`)
      const messageSnap = await get(messageRef)

      if (!messageSnap.exists()) {
        throw new Error('Message not found')
      }

      const message = messageSnap.val() as ChatMessage
      const reactions = message.reactions || {}

      // Toggle reaction (if exists, remove; if not, add)
      if (reactions[emoji] && reactions[emoji].includes(userId)) {
        reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId)
        if (reactions[emoji].length === 0) {
          delete reactions[emoji]
        }
      } else {
        if (!reactions[emoji]) {
          reactions[emoji] = []
        }
        reactions[emoji].push(userId)
      }

      await update(messageRef, { reactions })
    } catch (error) {
      console.error('Error adding reaction:', error)
      throw error
    }
  }

  /**
   * Listen to conversations for a user (realtime)
   */
  listenToConversations(
    userId: string,
    callback: (conversations: Conversation[]) => void
  ): Unsubscribe {
    if (!rtdb) {
      console.error('Realtime Database not initialized')
      return () => {}
    }

    const conversationsRef = ref(rtdb, `${this.basePath}`)

    const unsubscribe = onValue(
      conversationsRef,
      async (snapshot) => {
        if (!snapshot.exists()) {
          callback([])
          return
        }

        const conversationsData = snapshot.val()
        const conversations: Conversation[] = []

        // Get all conversations where userId is involved
        for (const conversationId of Object.keys(conversationsData)) {
          const metadata = conversationsData[conversationId]?.metadata
          if (!metadata || !metadata[userId]) continue

          const userMetadata = metadata[userId]
          const [userId1, userId2] = conversationId.split('_')
          const otherUserId = userId1 === userId ? userId2 : userId1

          conversations.push({
            id: conversationId,
            userId: otherUserId,
            lastMessage: userMetadata.lastMessage,
            lastMessageTime: userMetadata.lastMessageTime,
            unreadCount: userMetadata.unreadCount || 0,
          })
        }

        // Sort by last message time (newest first)
        conversations.sort((a, b) => {
          const timeA = a.lastMessageTime || 0
          const timeB = b.lastMessageTime || 0
          return timeB - timeA
        })

        callback(conversations)
      },
      (error) => {
        console.error('Error listening to conversations:', error)
        callback([])
      }
    )

    return unsubscribe
  }

  /**
   * Set user online status
   */
  async setOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      if (!rtdb) {
        throw new Error('Realtime Database not initialized')
      }

      const statusRef = ref(rtdb, `presence/${userId}`)
      if (isOnline) {
        await set(statusRef, {
          status: 'online',
          lastSeen: Date.now(),
        })
      } else {
        await update(statusRef, {
          status: 'offline',
          lastSeen: Date.now(),
        })
      }
    } catch (error) {
      console.error('Error setting online status:', error)
    }
  }

  /**
   * Listen to user online status and last seen
   */
  listenToOnlineStatus(
    userId: string,
    callback: (isOnline: boolean, lastSeen?: number) => void
  ): Unsubscribe {
    if (!rtdb) {
      console.error('Realtime Database not initialized')
      return () => {}
    }

    const statusRef = ref(rtdb, `presence/${userId}`)
    const unsubscribe = onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        callback(data.status === 'online', data.lastSeen)
      } else {
        callback(false, undefined)
      }
    })

    return unsubscribe
  }

  /**
   * Set typing status for a conversation (stored in metadata)
   */
  async setTyping(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    try {
      if (!rtdb) {
        throw new Error('Realtime Database not initialized')
      }

      // Store typing status in metadata, same path as lastMessage, lastMessageTime, etc.
      const typingRef = ref(rtdb, `${this.getConversationPath(conversationId, userId)}/typing`)
      if (isTyping) {
        await set(typingRef, Date.now())
      } else {
        await remove(typingRef)
      }
    } catch (error) {
      console.error('Error setting typing status:', error)
    }
  }

  /**
   * Listen to typing status in a conversation (from metadata)
   */
  listenToTyping(
    conversationId: string,
    currentUserId: string,
    callback: (typingUsers: string[]) => void
  ): Unsubscribe {
    if (!rtdb) {
      console.error('Realtime Database not initialized')
      return () => {}
    }

    // Get the other user's ID from conversationId
    const [userId1, userId2] = conversationId.split('_')
    const otherUserId = userId1 === currentUserId ? userId2 : userId1
    
    // Listen to the other user's typing status in their metadata
    const typingRef = ref(rtdb, `${this.getConversationPath(conversationId, otherUserId)}/typing`)
    
    const unsubscribe = onValue(typingRef, (snapshot) => {
      if (snapshot.exists()) {
        const typingTime = snapshot.val()
        // Only consider as typing if updated within last 3 seconds
        if (typingTime && (Date.now() - typingTime < 3000)) {
          callback([otherUserId])
        } else {
          callback([])
        }
      } else {
        callback([])
      }
    })

    return unsubscribe
  }

  /**
   * Update last seen timestamp (heartbeat)
   */
  async updateLastSeen(userId: string): Promise<void> {
    try {
      if (!rtdb) {
        throw new Error('Realtime Database not initialized')
      }

      const statusRef = ref(rtdb, `presence/${userId}/lastSeen`)
      await set(statusRef, Date.now())
    } catch (error) {
      console.error('Error updating last seen:', error)
    }
  }
}

export const chatService = new ChatService()

