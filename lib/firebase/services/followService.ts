/**
 * Follow Service
 * Handles follow/unfollow operations in Firestore
 */

import { BaseService, BaseDocument } from './baseService'
import { query, where, orderBy, limit, QueryConstraint } from 'firebase/firestore'
import { userService } from './userService'
import { notifyFollow } from '../utils/notificationHelpers'

export interface Follow extends BaseDocument {
  followerId: string  // User theo dõi
  followingId: string // User được theo dõi
  createdAt: any      // Timestamp
}

export class FollowService extends BaseService<Follow> {
  constructor() {
    super('follows')
  }

  /**
   * Follow a user
   */
  async follow(followerId: string, followingId: string): Promise<void> {
    try {
      // Don't follow yourself
      if (followerId === followingId) {
        throw new Error('Cannot follow yourself')
      }

      // Check if already following
      const existing = await this.isFollowing(followerId, followingId)
      if (existing) {
        throw new Error('Already following this user')
      }

      // Create follow document
      const followId = `${followerId}_${followingId}`
      await this.create(
        followId,
        {
          followerId,
          followingId,
        },
        false // Don't use batch for immediate effect
      )

      // Update follower stats
      try {
        await userService.incrementFollowing(followerId, 1)
        
        // Update following stats
        await userService.incrementFollowers(followingId, 1)
      } catch (statsError) {
        console.error('Error updating stats (non-critical):', statsError)
        // Continue anyway - follow document was created
      }

      // Send notification (don't fail if notification fails)
      try {
        await notifyFollow(followingId, followerId)
      } catch (notificationError) {
        console.warn('Failed to send follow notification (non-critical):', notificationError)
        // Continue anyway - follow was successful
      }
    } catch (error) {
      console.error('Error following user:', error)
      throw error
    }
  }

  /**
   * Unfollow a user
   */
  async unfollow(followerId: string, followingId: string): Promise<void> {
    try {
      const followId = `${followerId}_${followingId}`
      
      // Delete follow document
      await this.delete(followId, false)

      // Update follower stats (don't fail if stats update fails)
      try {
        await userService.incrementFollowing(followerId, -1)
        
        // Update following stats
        await userService.incrementFollowers(followingId, -1)
      } catch (statsError) {
        console.error('Error updating stats (non-critical):', statsError)
        // Continue anyway - follow document was deleted
      }
    } catch (error) {
      console.error('Error unfollowing user:', error)
      throw error
    }
  }

  /**
   * Check if user A is following user B
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const followId = `${followerId}_${followingId}`
      const follow = await this.getById(followId, true) // Use cache
      return follow !== null
    } catch (error) {
      console.error('Error checking follow status:', error)
      return false
    }
  }

  /**
   * Get all users that a user is following
   */
  async getFollowing(userId: string, limitCount = 100): Promise<string[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('followerId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount),
      ]

      const follows = await this.query(constraints, true)
      return follows.map((follow) => follow.followingId)
    } catch (error) {
      console.error('Error getting following:', error)
      throw error
    }
  }

  /**
   * Get all followers of a user
   */
  async getFollowers(userId: string, limitCount = 100): Promise<string[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('followingId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount),
      ]

      const follows = await this.query(constraints, true)
      return follows.map((follow) => follow.followerId)
    } catch (error) {
      console.error('Error getting followers:', error)
      throw error
    }
  }

  /**
   * Get mutual follows (users that both users follow)
   */
  async getMutualFollows(userId1: string, userId2: string): Promise<string[]> {
    try {
      const [following1, following2] = await Promise.all([
        this.getFollowing(userId1),
        this.getFollowing(userId2),
      ])

      // Find intersection
      const mutual = following1.filter((id) => following2.includes(id))
      return mutual
    } catch (error) {
      console.error('Error getting mutual follows:', error)
      throw error
    }
  }
}

export const followService = new FollowService()

