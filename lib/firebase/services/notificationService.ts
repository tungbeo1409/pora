/**
 * Notification Service
 * Handles notification-related Firestore operations
 */

import { BaseService, BaseDocument } from './baseService'
import { query, where, orderBy, limit, QueryConstraint, Timestamp } from 'firebase/firestore'

export type NotificationType = 
  | 'like'           // Like bài viết
  | 'comment'        // Bình luận bài viết
  | 'reply'          // Reply bình luận
  | 'follow'         // Theo dõi
  | 'share'          // Chia sẻ bài viết
  | 'login_device'   // Đăng nhập thiết bị khác
  | 'friend_request' // Yêu cầu kết bạn
  | 'friend_accept'  // Chấp nhận kết bạn

export interface Notification extends BaseDocument {
  // User nhận thông báo
  userId: string
  
  // User tạo thông báo (người thực hiện hành động)
  actorId: string
  actorName: string
  actorAvatar?: string
  actorUsername?: string
  
  // Loại thông báo
  type: NotificationType
  
  // Nội dung thông báo (optional - có thể tự động generate từ type)
  message?: string
  
  // Metadata cho routing
  targetType: 'post' | 'comment' | 'user' | 'device' | null
  targetId?: string // postId, commentId, userId, etc.
  
  // Đã đọc chưa
  read: boolean
  readAt?: Timestamp | Date
  
  // Optional: Thông tin thêm
  metadata?: {
    postId?: string
    commentId?: string
    deviceInfo?: string // Cho login_device
    [key: string]: any
  }
}

export class NotificationService extends BaseService<Notification> {
  constructor() {
    super('notifications')
  }

  /**
   * Get notifications for a user (most recent first)
   * Note: Firestore requires composite index for userId + read + createdAt
   */
  async getByUserId(
    userId: string, 
    options: {
      limit?: number
      unreadOnly?: boolean
    } = {}
  ): Promise<Notification[]> {
    try {
      let constraints: QueryConstraint[] = []

      if (options.unreadOnly) {
        // Query with read filter - requires composite index
        constraints = [
          where('userId', '==', userId),
          where('read', '==', false),
          orderBy('createdAt', 'desc'),
        ]
      } else {
        // Query without read filter
        constraints = [
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
        ]
      }

      if (options.limit) {
        constraints.push(limit(options.limit))
      } else {
        constraints.push(limit(50)) // Default limit
      }

      return await this.query(constraints, false) // Don't cache notifications
    } catch (error: any) {
      // If index error, try client-side filter
      if (error?.code === 'failed-precondition') {
        console.warn('Firestore index not found, using client-side filter')
        const allConstraints: QueryConstraint[] = [
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(options.limit || 50),
        ]
        const all = await this.query(allConstraints, false)
        if (options.unreadOnly) {
          return all.filter((n) => !n.read)
        }
        return all
      }
      console.error('Error getting notifications by userId:', error)
      throw error
    }
  }

  /**
   * Get unread count for a user
   * Uses getByUserId with unreadOnly for consistency
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const notifications = await this.getByUserId(userId, { unreadOnly: true, limit: 1000 })
      return notifications.length
    } catch (error) {
      console.error('Error getting unread count:', error)
      throw error
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, useBatch = true): Promise<void> {
    try {
      const { serverTimestamp } = await import('firebase/firestore')
      await this.update(
        notificationId,
        {
          read: true,
          readAt: serverTimestamp() as any,
        },
        useBatch
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const unreadNotifications = await this.getByUserId(userId, { unreadOnly: true })
      
      // Use batch to update all at once
      const { serverTimestamp } = await import('firebase/firestore')
      const promises = unreadNotifications.map((notif) =>
        this.update(
          notif.id!,
          {
            read: true,
            readAt: serverTimestamp() as any,
          },
          true // Use batch
        )
      )

      // Execute batch
      const { batchWriter } = await import('../utils/batch')
      await batchWriter.flush()

      await Promise.all(promises)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      throw error
    }
  }

  /**
   * Create notification
   */
  async createNotification(
    userId: string,
    actorId: string,
    type: NotificationType,
    options: {
      targetType?: 'post' | 'comment' | 'user' | 'device' | null
      targetId?: string
      message?: string
      metadata?: Record<string, any>
      actorName?: string
      actorAvatar?: string
      actorUsername?: string
    } = {}
  ): Promise<string> {
    try {
      // Don't notify yourself (unless it's login_device)
      if (userId === actorId && type !== 'login_device') {
        return ''
      }

      // Get actor info if not provided
      let actorName = options.actorName
      let actorAvatar = options.actorAvatar
      let actorUsername = options.actorUsername

      if (!actorName || !actorAvatar) {
        const { userService } = await import('./userService')
        const actor = await userService.getById(actorId, true)
        if (actor) {
          actorName = actorName || actor.name
          actorAvatar = actorAvatar || actor.avatar
          actorUsername = actorUsername || actor.username
        }
      }

      // Generate message if not provided
      let message = options.message
      if (!message) {
        message = this.generateMessage(type, actorName || 'Người dùng')
      }

      const notificationId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      await this.create(
        notificationId,
        {
          userId,
          actorId,
          actorName: actorName || 'Người dùng',
          actorAvatar,
          actorUsername,
          type,
          message,
          targetType: options.targetType || null,
          targetId: options.targetId,
          metadata: options.metadata || {},
          read: false,
        },
        false // Don't use batch for notifications (want immediate delivery)
      )

      return notificationId
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  /**
   * Generate message based on notification type
   */
  private generateMessage(type: NotificationType, actorName: string): string {
    const messages: Record<NotificationType, string> = {
      like: 'đã thích bài viết của bạn',
      comment: 'đã bình luận bài viết của bạn',
      reply: 'đã trả lời bình luận của bạn',
      follow: 'đã theo dõi bạn',
      share: 'đã chia sẻ bài viết của bạn',
      login_device: 'đã đăng nhập từ thiết bị khác',
      friend_request: 'đã gửi lời mời kết bạn',
      friend_accept: 'đã chấp nhận lời mời kết bạn',
    }

    return messages[type] || 'đã tương tác với bạn'
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await this.delete(notificationId, false)
    } catch (error) {
      console.error('Error deleting notification:', error)
      throw error
    }
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllByUserId(userId: string): Promise<void> {
    try {
      const notifications = await this.getByUserId(userId)
      const promises = notifications.map((notif) => this.delete(notif.id!, false))
      await Promise.all(promises)
    } catch (error) {
      console.error('Error deleting all notifications:', error)
      throw error
    }
  }
}

export const notificationService = new NotificationService()

