/**
 * Notifications Hook
 * Realtime listener for user notifications
 */

import { useState, useEffect, useRef } from 'react'
import { collection, query, where, orderBy, limit, onSnapshot, Unsubscribe, Timestamp } from 'firebase/firestore'
import { db } from '../config'
import { Notification, NotificationType } from '../services/notificationService'

interface UseNotificationsOptions {
  /** Limit number of notifications (default: 50) */
  limitCount?: number
  /** Only get unread notifications */
  unreadOnly?: boolean
  /** Enable realtime updates (default: true) */
  realtime?: boolean
}

interface UseNotificationsResult {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: Error | null
}

/**
 * Hook to get realtime notifications for the current user
 */
export function useNotifications(
  userId: string | null,
  options: UseNotificationsOptions = {}
): UseNotificationsResult {
  const { limitCount = 50, unreadOnly = false, realtime = true } = options
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const unsubscribeRef = useRef<Unsubscribe | null>(null)

  useEffect(() => {
    if (!userId) {
      setNotifications([])
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

    try {
      const notificationsRef = collection(db, 'notifications')
      
      // Build query constraints
      const constraints: any[] = [
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount),
      ]

      if (unreadOnly) {
        constraints.splice(constraints.length - 1, 0, where('read', '==', false))
      }

      const q = query(notificationsRef, ...constraints)

      if (realtime) {
        // Realtime listener
        unsubscribeRef.current = onSnapshot(
          q,
          (snapshot) => {
            const notifs = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Notification[]

            setNotifications(notifs)
            setLoading(false)
            setError(null)
          },
          (err) => {
            console.error('Notifications listener error:', err)
            setError(err as Error)
            setLoading(false)
          }
        )
      } else {
        // One-time fetch
        import('firebase/firestore').then(({ getDocs }) => {
          getDocs(q)
            .then((snapshot) => {
              const notifs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              })) as Notification[]

              setNotifications(notifs)
              setLoading(false)
            })
            .catch((err) => {
              console.error('Error fetching notifications:', err)
              setError(err as Error)
              setLoading(false)
            })
        })
      }
    } catch (err) {
      console.error('Error setting up notifications:', err)
      setError(err as Error)
      setLoading(false)
    }

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [userId, limitCount, unreadOnly, realtime])

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length

  return { notifications, unreadCount, loading, error }
}

/**
 * Format timestamp to relative time (e.g., "2 phút trước")
 */
export function formatNotificationTime(timestamp: Timestamp | Date | undefined): string {
  if (!timestamp) return 'Vừa xong'

  const now = new Date()
  const time = timestamp instanceof Date ? timestamp : timestamp.toDate()
  const diffMs = now.getTime() - time.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Vừa xong'
  if (diffMin < 60) return `${diffMin} phút trước`
  if (diffHour < 24) return `${diffHour} giờ trước`
  if (diffDay < 7) return `${diffDay} ngày trước`

  // Format as date if older than 7 days
  return time.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: time.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

/**
 * Get notification icon name and color based on type
 * Returns string name for icon component
 */
export function getNotificationIconInfo(type: NotificationType): { iconName: string; color: string } {
  const icons: Record<NotificationType, { iconName: string; color: string }> = {
    like: {
      iconName: 'Heart',
      color: 'text-red-500',
    },
    comment: {
      iconName: 'MessageCircle',
      color: 'text-blue-500',
    },
    reply: {
      iconName: 'Reply',
      color: 'text-blue-500',
    },
    follow: {
      iconName: 'UserPlus',
      color: 'text-green-500',
    },
    share: {
      iconName: 'Share2',
      color: 'text-purple-500',
    },
    login_device: {
      iconName: 'Smartphone',
      color: 'text-orange-500',
    },
    friend_request: {
      iconName: 'UserPlus',
      color: 'text-blue-500',
    },
    friend_accept: {
      iconName: 'UserCheck',
      color: 'text-green-500',
    },
  }

  return icons[type] || { iconName: 'Bell', color: 'text-apple-secondary' }
}

