'use client'

import { GlobalLayout } from '@/components/layout/GlobalLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppleCard } from '@/components/ui/AppleCard'
import { AppleButton } from '@/components/ui/AppleButton'
import { Avatar } from '@/components/ui/Avatar'
import { Heart, MessageCircle, UserPlus, Share2, Reply, Smartphone, UserCheck, Bell, CheckCheck } from 'lucide-react'
import { useAuth } from '@/lib/firebase/hooks/useAuth'
import { useNotifications, formatNotificationTime, getNotificationIconInfo } from '@/lib/firebase/hooks/useNotifications'
import { notificationService } from '@/lib/firebase/services/notificationService'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const iconMap: Record<string, any> = {
  Heart,
  MessageCircle,
  Reply,
  UserPlus,
  Share2,
  Smartphone,
  UserCheck,
  Bell,
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { notifications, unreadCount, loading } = useNotifications(user?.uid || null, {
    limitCount: 100,
    realtime: true,
  })
  const [markingAllRead, setMarkingAllRead] = useState(false)

  const handleMarkAllRead = async () => {
    if (!user?.uid) return
    setMarkingAllRead(true)
    try {
      await notificationService.markAllAsRead(user.uid)
    } catch (error) {
      console.error('Error marking all as read:', error)
    } finally {
      setMarkingAllRead(false)
    }
  }

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.read && notification.id) {
      try {
        await notificationService.markAsRead(notification.id, false)
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }

    // Navigate based on targetType
    if (notification.targetType === 'post' && notification.targetId) {
      router.push(`/?post=${notification.targetId}`)
    } else if (notification.targetType === 'comment' && notification.targetId) {
      router.push(`/?comment=${notification.targetId}`)
    } else if (notification.targetType === 'user' && notification.targetId) {
      router.push(`/profile?user=${notification.targetId}`)
    }
  }

  return (
    <ProtectedRoute>
      <GlobalLayout>
      <div className="max-w-2xl mx-auto">
        <div>
          <AppleCard className="p-6 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-2xl font-bold text-apple-primary mb-2">Thông báo</h1>
                <p className="text-apple-secondary">
                  {loading ? 'Đang tải...' : `Bạn có ${unreadCount} thông báo mới`}
                </p>
              </div>
              {unreadCount > 0 && (
                <AppleButton
                  variant="secondary"
                  size="sm"
                  onClick={handleMarkAllRead}
                  disabled={markingAllRead}
                  className="flex items-center"
                >
                  <CheckCheck className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Đọc tất cả</span>
                </AppleButton>
              )}
            </div>
          </AppleCard>
        </div>

        {loading ? (
          <AppleCard className="p-6 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-16 bg-apple-gray-200 dark:bg-apple-gray-800 rounded-lg" />
              <div className="h-16 bg-apple-gray-200 dark:bg-apple-gray-800 rounded-lg" />
            </div>
          </AppleCard>
        ) : notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const iconInfo = getNotificationIconInfo(notification.type)
              const Icon = iconMap[iconInfo.iconName] || Bell
              return (
                <div key={notification.id}>
                  <AppleCard
                    className={`p-4 cursor-pointer ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    hover
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <Avatar src={notification.actorAvatar || ''} size="md" />
                        <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white dark:bg-black ${iconInfo.color}`}>
                          <Icon className="w-3 h-3" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-apple-primary">
                          <span className="font-semibold">{notification.actorName}</span>{' '}
                          <span className="text-apple-secondary">{notification.message}</span>
                        </p>
                        <p className="text-xs text-apple-tertiary mt-1">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      )}
                    </div>
                  </AppleCard>
                </div>
              )
            })}
          </div>
        ) : (
          <AppleCard className="p-6 text-center">
            <p className="text-apple-secondary">Chưa có thông báo nào</p>
          </AppleCard>
        )}
      </div>
      </GlobalLayout>
    </ProtectedRoute>
  )
}

