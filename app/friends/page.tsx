'use client'

import { GlobalLayout } from '@/components/layout/GlobalLayout'
import { AppleCard } from '@/components/ui/AppleCard'
import { Avatar } from '@/components/ui/Avatar'
import { AppleButton } from '@/components/ui/AppleButton'
import { UserPlus, UserMinus, Search, MessageCircle } from 'lucide-react'
import { useState } from 'react'

const friends = [
  {
    id: 1,
    name: 'Nguyễn Văn A',
    username: '@nguyenvana',
    avatar: 'https://i.pravatar.cc/150?img=1',
    mutualFriends: 12,
    online: true,
  },
  {
    id: 2,
    name: 'Trần Thị B',
    username: '@tranthib',
    avatar: 'https://i.pravatar.cc/150?img=2',
    mutualFriends: 8,
    online: false,
  },
  {
    id: 3,
    name: 'Lê Văn C',
    username: '@levanc',
    avatar: 'https://i.pravatar.cc/150?img=3',
    mutualFriends: 15,
    online: true,
  },
  {
    id: 4,
    name: 'Phạm Thị D',
    username: '@phamthid',
    avatar: 'https://i.pravatar.cc/150?img=4',
    mutualFriends: 5,
    online: false,
  },
]

export default function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <GlobalLayout>
      <div className="max-w-4xl mx-auto">
        <div>
          <AppleCard className="p-6 mb-6">
            <h1 className="text-3xl font-bold text-apple-primary mb-2">Bạn bè</h1>
            <p className="text-apple-secondary mb-4">Bạn có {friends.length} người bạn</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-apple-tertiary" />
              <input
                type="text"
                placeholder="Tìm kiếm bạn bè..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-apple-lg bg-apple-gray-100 dark:bg-apple-gray-800 border border-apple-gray-200 dark:border-apple-gray-700 text-apple-primary placeholder:text-apple-tertiary focus:outline-none focus:ring-2 focus:ring-apple-gray-400 dark:focus:ring-apple-gray-600"
              />
            </div>
          </AppleCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {friends
            .filter((friend) =>
              friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              friend.username.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((friend) => (
              <div key={friend.id}>
                <AppleCard className="p-6" hover>
                  <div className="flex items-start space-x-4">
                    <Avatar src={friend.avatar} size="lg" online={friend.online} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-apple-primary">{friend.name}</h3>
                      <p className="text-sm text-apple-tertiary mb-2">{friend.username}</p>
                      <p className="text-sm text-apple-secondary mb-4">
                        {friend.mutualFriends} bạn chung
                      </p>
                      <div className="flex space-x-2">
                        <AppleButton size="sm" variant="secondary">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Nhắn tin
                        </AppleButton>
                        <AppleButton size="sm" variant="ghost">
                          <UserMinus className="w-4 h-4 mr-2" />
                          Hủy kết bạn
                        </AppleButton>
                      </div>
                    </div>
                  </div>
                </AppleCard>
              </div>
            ))}
        </div>
      </div>
    </GlobalLayout>
  )
}

