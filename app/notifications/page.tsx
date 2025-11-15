'use client'

import { GlobalLayout } from '@/components/layout/GlobalLayout'
import { AppleCard } from '@/components/ui/AppleCard'
import { Avatar } from '@/components/ui/Avatar'
import { Heart, MessageCircle, UserPlus, Share2 } from 'lucide-react'

const notifications = [
  {
    id: 1,
    type: 'like',
    user: {
      name: 'Nguyễn Văn A',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    action: 'thích bài viết của bạn',
    time: '5 phút trước',
    read: false,
    icon: Heart,
    color: 'text-red-500',
  },
  {
    id: 2,
    type: 'comment',
    user: {
      name: 'Trần Thị B',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    action: 'đã bình luận bài viết của bạn',
    time: '15 phút trước',
    read: false,
    icon: MessageCircle,
    color: 'text-blue-500',
  },
  {
    id: 3,
    type: 'follow',
    user: {
      name: 'Lê Văn C',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    action: 'đã theo dõi bạn',
    time: '1 giờ trước',
    read: true,
    icon: UserPlus,
    color: 'text-green-500',
  },
  {
    id: 4,
    type: 'share',
    user: {
      name: 'Phạm Thị D',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    action: 'đã chia sẻ bài viết của bạn',
    time: '2 giờ trước',
    read: true,
    icon: Share2,
    color: 'text-purple-500',
  },
  {
    id: 5,
    type: 'like',
    user: {
      name: 'Hoàng Văn E',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    action: 'thích bài viết của bạn',
    time: '3 giờ trước',
    read: true,
    icon: Heart,
    color: 'text-red-500',
  },
]

export default function NotificationsPage() {
  return (
    <GlobalLayout>
      <div className="max-w-2xl mx-auto">
        <div>
          <AppleCard className="p-6 mb-4">
            <h1 className="text-2xl font-bold text-apple-primary mb-2">Thông báo</h1>
            <p className="text-apple-secondary">Bạn có {notifications.filter((n) => !n.read).length} thông báo mới</p>
          </AppleCard>
        </div>

        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = notification.icon
            return (
              <div key={notification.id}>
                <AppleCard
                  className={`p-4 ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                  hover
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar src={notification.user.avatar} size="md" />
                      <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white dark:bg-black ${notification.color}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-apple-primary">
                        <span className="font-semibold">{notification.user.name}</span>{' '}
                        <span className="text-apple-secondary">{notification.action}</span>
                      </p>
                      <p className="text-xs text-apple-tertiary mt-1">{notification.time}</p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    )}
                  </div>
                </AppleCard>
              </div>
            )
          })}
        </div>
      </div>
    </GlobalLayout>
  )
}

