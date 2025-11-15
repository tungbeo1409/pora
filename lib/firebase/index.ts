/**
 * Firebase exports
 * Main entry point for Firebase functionality
 */

// Config
export { app, db, rtdb, auth, analytics } from './config'

// Hooks
export { useFirestoreQuery } from './hooks/useFirestoreQuery'
export { useFirestoreDoc } from './hooks/useFirestoreDoc'
export { useNotifications, formatNotificationTime, getNotificationIconInfo } from './hooks/useNotifications'

// Services
export { BaseService, type BaseDocument } from './services/baseService'
export { authService } from './services/authService'
export type { SignUpData, SignInData } from './services/authService'
export { userService } from './services/userService'
export type { User } from './services/userService'
export { notificationService } from './services/notificationService'
export type { Notification, NotificationType } from './services/notificationService'
export { followService } from './services/followService'
export type { Follow } from './services/followService'
export { friendService } from './services/friendService'
export type { Friend, FriendStatus } from './services/friendService'
export { chatService } from './services/chatService'
export type { ChatMessage, Conversation } from './services/chatService'

// Hooks
export { useChat, useConversations } from './hooks/useChat'

// Utils
export { firebaseCache, generateCacheKey } from './utils/cache'
export { batchWriter } from './utils/batch'
export * from './utils/notificationHelpers'

