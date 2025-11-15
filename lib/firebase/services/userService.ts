/**
 * User Service
 * Handles user-related Firestore operations
 */

import { BaseService, BaseDocument } from './baseService'
import { query, where, orderBy, limit, QueryConstraint } from 'firebase/firestore'

export interface User extends BaseDocument {
  name: string
  username: string
  email: string
  avatar: string
  bio?: string
  cover?: string
  followers: number
  following: number
  posts: number
  isPrivate?: boolean
  verified?: boolean
}

export class UserService extends BaseService<User> {
  constructor() {
    super('users')
  }

  /**
   * Get user by username
   */
  async getByUsername(username: string): Promise<User | null> {
    try {
      const constraints: QueryConstraint[] = [
        where('username', '==', username),
        limit(1),
      ]

      const users = await this.query(constraints)
      return users.length > 0 ? users[0] : null
    } catch (error) {
      console.error('Error getting user by username:', error)
      throw error
    }
  }

  /**
   * Search users by name or username
   * Firestore doesn't support full-text search, so we search by prefix
   * For better search, consider using Algolia or similar
   */
  async searchUsers(searchTerm: string, limitCount = 20): Promise<User[]> {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return []
      }

      const term = searchTerm.toLowerCase().trim()
      
      // Try to search by username first (more efficient)
      try {
        const constraints: QueryConstraint[] = [
          where('username', '>=', term),
          where('username', '<=', term + '\uf8ff'),
          limit(limitCount),
        ]

        const usersByUsername = await this.query(constraints)
        
        // If we found users by username and reached limit, return them
        if (usersByUsername.length >= limitCount) {
          return usersByUsername
        }

        // Also search by name (case-insensitive search needs client-side filtering)
        // Firestore doesn't support case-insensitive queries, so we get all and filter
        // For production, consider using Algolia or Cloud Firestore text search extension
        const allUsers = await this.query([limit(limitCount * 2)])
        const usersByName = allUsers.filter(
          (user) => 
            user.name.toLowerCase().includes(term) ||
            user.username.toLowerCase().includes(term)
        )

        // Combine and deduplicate
        const combined = [...usersByUsername]
        const existingIds = new Set(usersByUsername.map(u => u.id))
        
        for (const user of usersByName) {
          if (!existingIds.has(user.id) && combined.length < limitCount) {
            combined.push(user)
          }
        }

        return combined.slice(0, limitCount)
      } catch (error: any) {
        // If index doesn't exist, fall back to client-side search
        if (error?.code === 'failed-precondition') {
          console.warn('Firestore index not found for username search, using client-side search')
          const allUsers = await this.query([limit(100)])
          return allUsers
            .filter(
              (user) =>
                user.name.toLowerCase().includes(term) ||
                user.username.toLowerCase().includes(term)
            )
            .slice(0, limitCount)
        }
        throw error
      }
    } catch (error) {
      console.error('Error searching users:', error)
      throw error
    }
  }

  /**
   * Get multiple users by IDs (batch read)
   * Uses parallel getDoc calls for better performance
   */
  async getByIds(userIds: string[]): Promise<User[]> {
    try {
      const { getDoc } = await import('firebase/firestore')
      const promises = userIds.map((id) => this.getById(id, true))
      const results = await Promise.all(promises)
      return results.filter((user): user is User => user !== null)
    } catch (error) {
      console.error('Error getting users by IDs:', error)
      throw error
    }
  }

  /**
   * Get popular users (most followers)
   */
  async getPopularUsers(limitCount = 10): Promise<User[]> {
    try {
      const constraints: QueryConstraint[] = [
        orderBy('followers', 'desc'),
        limit(limitCount),
      ]

      return await this.query(constraints)
    } catch (error) {
      console.error('Error getting popular users:', error)
      throw error
    }
  }

  /**
   * Update user stats (followers, following, posts count)
   */
  async updateStats(
    userId: string,
    updates: {
      followers?: number
      following?: number
      posts?: number
    }
  ): Promise<void> {
    const updatesToApply: any = {}
    
    if (updates.followers !== undefined) {
      updatesToApply.followers = updates.followers
    }
    if (updates.following !== undefined) {
      updatesToApply.following = updates.following
    }
    if (updates.posts !== undefined) {
      updatesToApply.posts = updates.posts
    }

    if (Object.keys(updatesToApply).length > 0) {
      await this.update(userId, updatesToApply, false) // Don't use batch for stats updates
    }
  }

  /**
   * Increment followers count
   */
  async incrementFollowers(userId: string, increment = 1): Promise<void> {
    const user = await this.getById(userId, false)
    if (user) {
      await this.updateStats(userId, {
        followers: (user.followers || 0) + increment,
      })
    }
  }

  /**
   * Increment following count
   */
  async incrementFollowing(userId: string, increment = 1): Promise<void> {
    const user = await this.getById(userId, false)
    if (user) {
      await this.updateStats(userId, {
        following: (user.following || 0) + increment,
      })
    }
  }

  /**
   * Increment posts count
   */
  async incrementPosts(userId: string, increment = 1): Promise<void> {
    const user = await this.getById(userId, false)
    if (user) {
      await this.updateStats(userId, {
        posts: (user.posts || 0) + increment,
      })
    }
  }
}

export const userService = new UserService()

