/**
 * Notification Helpers
 * Helper functions to create notifications for various events
 */

import { notificationService, NotificationType } from '../services/notificationService'
import { userService } from '../services/userService'

/**
 * Create like notification
 */
export async function notifyLike(
  postOwnerId: string,
  likerId: string,
  postId: string
): Promise<void> {
  try {
    await notificationService.createNotification(
      postOwnerId,
      likerId,
      'like',
      {
        targetType: 'post',
        targetId: postId,
        metadata: { postId },
      }
    )
  } catch (error) {
    console.error('Error creating like notification:', error)
  }
}

/**
 * Create comment notification
 */
export async function notifyComment(
  postOwnerId: string,
  commenterId: string,
  postId: string,
  commentId: string
): Promise<void> {
  try {
    // Don't notify if commenting on own post
    if (postOwnerId === commenterId) return

    await notificationService.createNotification(
      postOwnerId,
      commenterId,
      'comment',
      {
        targetType: 'post',
        targetId: postId,
        metadata: { postId, commentId },
      }
    )
  } catch (error) {
    console.error('Error creating comment notification:', error)
  }
}

/**
 * Create reply notification
 */
export async function notifyReply(
  commentOwnerId: string,
  replierId: string,
  postId: string,
  commentId: string,
  replyId: string
): Promise<void> {
  try {
    // Don't notify if replying to own comment
    if (commentOwnerId === replierId) return

    await notificationService.createNotification(
      commentOwnerId,
      replierId,
      'reply',
      {
        targetType: 'comment',
        targetId: commentId,
        metadata: { postId, commentId, replyId },
      }
    )
  } catch (error) {
    console.error('Error creating reply notification:', error)
  }
}

/**
 * Create follow notification
 */
export async function notifyFollow(
  followedUserId: string,
  followerId: string
): Promise<void> {
  try {
    await notificationService.createNotification(
      followedUserId,
      followerId,
      'follow',
      {
        targetType: 'user',
        targetId: followedUserId,
      }
    )
  } catch (error) {
    console.error('Error creating follow notification:', error)
  }
}

/**
 * Create share notification
 */
export async function notifyShare(
  postOwnerId: string,
  sharerId: string,
  postId: string
): Promise<void> {
  try {
    // Don't notify if sharing own post
    if (postOwnerId === sharerId) return

    await notificationService.createNotification(
      postOwnerId,
      sharerId,
      'share',
      {
        targetType: 'post',
        targetId: postId,
        metadata: { postId },
      }
    )
  } catch (error) {
    console.error('Error creating share notification:', error)
  }
}

/**
 * Create login device notification
 */
export async function notifyLoginDevice(
  userId: string,
  deviceInfo: string
): Promise<void> {
  try {
    await notificationService.createNotification(
      userId,
      userId, // Actor is the same user
      'login_device',
      {
        targetType: 'device',
        metadata: { deviceInfo },
        message: `Đã đăng nhập từ ${deviceInfo}`,
      }
    )
  } catch (error) {
    console.error('Error creating login device notification:', error)
  }
}

/**
 * Create friend request notification
 */
export async function notifyFriendRequest(
  requestedUserId: string,
  requesterId: string
): Promise<void> {
  try {
    await notificationService.createNotification(
      requestedUserId,
      requesterId,
      'friend_request',
      {
        targetType: 'user',
        targetId: requesterId,
      }
    )
  } catch (error) {
    console.error('Error creating friend request notification:', error)
  }
}

/**
 * Create friend accept notification
 */
export async function notifyFriendAccept(
  acceptedUserId: string,
  accepterId: string
): Promise<void> {
  try {
    await notificationService.createNotification(
      acceptedUserId,
      accepterId,
      'friend_accept',
      {
        targetType: 'user',
        targetId: accepterId,
      }
    )
  } catch (error) {
    console.error('Error creating friend accept notification:', error)
  }
}

