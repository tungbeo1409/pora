/**
 * Friend Service
 * Handles friend request/accept/reject operations in Firestore
 */

import { BaseService, BaseDocument } from './baseService'
import { query, where, orderBy, limit, QueryConstraint } from 'firebase/firestore'
import { notifyFriendRequest, notifyFriendAccept } from '../utils/notificationHelpers'

export type FriendStatus = 'pending' | 'accepted' | 'rejected' | 'blocked'

export interface Friend extends BaseDocument {
  userId: string       // User gửi request
  friendId: string     // User nhận request
  status: FriendStatus // Trạng thái: pending, accepted, rejected, blocked
  requestedBy: string  // User ID của người gửi request
  createdAt: any       // Timestamp
  updatedAt: any       // Timestamp
}

export class FriendService extends BaseService<Friend> {
  constructor() {
    super('friends')
  }

  /**
   * Generate friend document ID (sorted to ensure consistency)
   */
  getFriendId(userId1: string, userId2: string): string {
    const ids = [userId1, userId2].sort()
    return `${ids[0]}_${ids[1]}`
  }

  /**
   * Send friend request
   */
  async sendRequest(requestedBy: string, requestedTo: string): Promise<void> {
    try {
      // Don't send request to yourself
      if (requestedBy === requestedTo) {
        throw new Error('Không thể gửi lời mời kết bạn cho chính mình')
      }

      // Validate user IDs
      if (!requestedBy || !requestedTo) {
        throw new Error('User ID không hợp lệ')
      }

      const friendId = this.getFriendId(requestedBy, requestedTo)
      
      // Check if already exists (use cache but don't fail on permission error)
      let existing: Friend | null = null
      try {
        existing = await this.getById(friendId, true)
      } catch (error: any) {
        // If permission denied on read, treat as not exists (might be first request)
        if (error?.code !== 'permission-denied') {
          throw error
        }
        // Permission denied means document might not exist or we can't read it
        // Continue to try creating
        console.warn('Permission denied reading friend document, assuming not exists:', error)
      }
      if (existing) {
        if (existing.status === 'pending') {
          // Check who sent the request
          if (existing.requestedBy === requestedBy) {
            throw new Error('Đã gửi lời mời kết bạn rồi')
          } else {
            throw new Error('Người dùng này đã gửi lời mời kết bạn cho bạn')
          }
        }
        if (existing.status === 'accepted') {
          throw new Error('Đã là bạn bè rồi')
        }
        // If rejected, can send again - delete old document first
        await this.delete(friendId, false)
      }

      // Create friend document
      const friendData: Partial<Friend> = {
        userId: requestedBy < requestedTo ? requestedBy : requestedTo,
        friendId: requestedBy < requestedTo ? requestedTo : requestedBy,
        status: 'pending',
        requestedBy,
      }

      // Create friend document (don't merge, don't batch for immediate effect)
      await this.set(friendId, friendData, false, false)

      // Send notification (don't fail if notification fails)
      try {
        await notifyFriendRequest(requestedTo, requestedBy)
      } catch (notificationError) {
        console.warn('Failed to send friend request notification (non-critical):', notificationError)
        // Continue anyway - friend request was created successfully
      }
    } catch (error: any) {
      console.error('Error sending friend request:', error)
      
      // Provide user-friendly error messages
      if (error?.message) {
        throw error
      } else if (error?.code === 'permission-denied') {
        throw new Error('Bạn không có quyền thực hiện hành động này. Vui lòng kiểm tra Firestore rules.')
      } else if (error?.code === 'unavailable') {
        throw new Error('Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.')
      } else {
        throw new Error('Có lỗi xảy ra khi gửi lời mời kết bạn. Vui lòng thử lại.')
      }
    }
  }

  /**
   * Accept friend request
   */
  async acceptRequest(userId1: string, userId2: string, acceptedBy: string): Promise<void> {
    try {
      const friendId = this.getFriendId(userId1, userId2)
      const friend = await this.getById(friendId, false)

      if (!friend) {
        throw new Error('Friend request not found')
      }

      if (friend.status !== 'pending') {
        throw new Error('Friend request is not pending')
      }

      // Update status to accepted
      await this.update(
        friendId,
        {
          status: 'accepted',
        },
        false // Don't batch
      )

      // Send notification to the requester
      const requesterId = friend.requestedBy
      if (requesterId !== acceptedBy) {
        await notifyFriendAccept(requesterId, acceptedBy)
      }
    } catch (error) {
      console.error('Error accepting friend request:', error)
      throw error
    }
  }

  /**
   * Reject friend request
   */
  async rejectRequest(userId1: string, userId2: string): Promise<void> {
    try {
      const friendId = this.getFriendId(userId1, userId2)
      const friend = await this.getById(friendId, false)

      if (!friend) {
        throw new Error('Friend request not found')
      }

      // Update status to rejected
      await this.update(
        friendId,
        {
          status: 'rejected',
        },
        false
      )
    } catch (error) {
      console.error('Error rejecting friend request:', error)
      throw error
    }
  }

  /**
   * Remove friend (unfriend)
   */
  async removeFriend(userId1: string, userId2: string): Promise<void> {
    try {
      const friendId = this.getFriendId(userId1, userId2)
      await this.delete(friendId, false)
    } catch (error) {
      console.error('Error removing friend:', error)
      throw error
    }
  }

  /**
   * Block user
   */
  async blockUser(blockedBy: string, blockedUser: string): Promise<void> {
    try {
      const friendId = this.getFriendId(blockedBy, blockedUser)
      
      const friendData: Partial<Friend> = {
        userId: blockedBy < blockedUser ? blockedBy : blockedUser,
        friendId: blockedBy < blockedUser ? blockedUser : blockedBy,
        status: 'blocked',
        requestedBy: blockedBy,
      }

      await this.set(friendId, friendData, false, false)
    } catch (error) {
      console.error('Error blocking user:', error)
      throw error
    }
  }

  /**
   * Check friend status between two users
   */
  async getFriendStatus(userId1: string, userId2: string): Promise<FriendStatus | null> {
    try {
      const friendId = this.getFriendId(userId1, userId2)
      const friend = await this.getById(friendId, true) // Use cache
      return friend?.status || null
    } catch (error) {
      console.error('Error getting friend status:', error)
      return null
    }
  }

  /**
   * Check if two users are friends
   */
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const status = await this.getFriendStatus(userId1, userId2)
    return status === 'accepted'
  }

  /**
   * Get all friends of a user
   */
  async getFriends(userId: string, limitCount = 100): Promise<string[]> {
    try {
      // Get friends where userId is first
      const constraints1: QueryConstraint[] = [
        where('userId', '==', userId),
        where('status', '==', 'accepted'),
        orderBy('updatedAt', 'desc'),
        limit(limitCount),
      ]

      // Get friends where userId is second
      const constraints2: QueryConstraint[] = [
        where('friendId', '==', userId),
        where('status', '==', 'accepted'),
        orderBy('updatedAt', 'desc'),
        limit(limitCount),
      ]

      const [friends1, friends2] = await Promise.all([
        this.query(constraints1, true),
        this.query(constraints2, true),
      ])

      // Combine and extract friend IDs
      const friendIds = [
        ...friends1.map((f) => f.friendId),
        ...friends2.map((f) => f.userId),
      ]

      // Remove duplicates
      return Array.from(new Set(friendIds))
    } catch (error) {
      console.error('Error getting friends:', error)
      throw error
    }
  }

  /**
   * Get pending friend requests (received)
   */
  async getPendingRequests(userId: string, limitCount = 50): Promise<Friend[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('friendId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(limitCount),
      ]

      return await this.query(constraints, false) // Don't cache pending requests
    } catch (error) {
      console.error('Error getting pending requests:', error)
      throw error
    }
  }

  /**
   * Get sent friend requests (pending)
   */
  async getSentRequests(userId: string, limitCount = 50): Promise<Friend[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('requestedBy', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(limitCount),
      ]

      return await this.query(constraints, false)
    } catch (error) {
      console.error('Error getting sent requests:', error)
      throw error
    }
  }
}

export const friendService = new FriendService()

