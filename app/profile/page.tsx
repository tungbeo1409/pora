'use client'

import { GlobalLayout } from '@/components/layout/GlobalLayout'
import { AppleCard } from '@/components/ui/AppleCard'
import { AppleButton } from '@/components/ui/AppleButton'
import { Avatar } from '@/components/ui/Avatar'
import { PostCard } from '@/components/post/PostCard'
import { Settings, MessageCircle, UserPlus, MoreHorizontal } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'

const userProfile = {
  name: 'Nguyễn Văn A',
  username: '@nguyenvana',
  bio: 'Designer & Developer. Yêu thích công nghệ và thiết kế. ✨',
  avatar: 'https://i.pravatar.cc/150?img=5',
  cover: 'https://picsum.photos/800/300?random=5',
  followers: 1250,
  following: 342,
  posts: 89,
}

const userPosts = [
  {
    id: 1,
    author: {
      id: 1,
      name: 'Nguyễn Văn A',
      username: '@nguyenvana',
      avatar: 'https://i.pravatar.cc/150?img=5',
    },
    content: 'Vừa hoàn thành một dự án mới! Cảm thấy rất tự hào về thành quả này.',
    image: 'https://picsum.photos/600/400?random=6',
    likes: 245,
    comments: 32,
    shares: 12,
    timeAgo: '1 ngày trước',
    liked: false,
    saved: false,
  },
  {
    id: 2,
    author: {
      id: 1,
      name: 'Nguyễn Văn A',
      username: '@nguyenvana',
      avatar: 'https://i.pravatar.cc/150?img=5',
    },
    content: 'Chia sẻ một số tips về thiết kế UI/UX mà tôi đã học được trong năm qua.',
    likes: 189,
    comments: 28,
    shares: 8,
    timeAgo: '3 ngày trước',
    liked: true,
    saved: false,
  },
]

export default function ProfilePage() {
  return (
    <GlobalLayout>
      <div className="max-w-4xl mx-auto">
        {/* Cover & Profile */}
        <div>
          <AppleCard className="overflow-visible p-0 mb-6">
            {/* Cover */}
            <div className="relative h-48 sm:h-56 bg-gradient-to-br from-apple-gray-200 to-apple-gray-300 dark:from-apple-gray-800 dark:to-apple-gray-900 rounded-t-apple-lg overflow-hidden">
              <Image
                src={userProfile.cover}
                alt="Cover"
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>

            {/* Profile Info */}
            <div className="relative px-6 pb-6 pt-20 sm:pt-24 bg-white dark:bg-black -mt-16 sm:-mt-20 rounded-b-apple-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="relative flex-shrink-0">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-white dark:bg-black p-1 -z-10">
                      <div className="w-full h-full rounded-full bg-apple-gray-200 dark:bg-apple-gray-800"></div>
                    </div>
                    <Avatar 
                      src={userProfile.avatar} 
                      size="xl"
                    />
                  </div>
                </div>
                <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-end justify-between space-y-4 sm:space-y-0 w-full min-w-0">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-apple-primary truncate">{userProfile.name}</h1>
                    <p className="text-apple-tertiary truncate">{userProfile.username}</p>
                    <p className="text-apple-secondary mt-2">{userProfile.bio}</p>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    <AppleButton variant="secondary" size="sm">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Nhắn tin
                    </AppleButton>
                    <AppleButton size="sm">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Theo dõi
                    </AppleButton>
                    <motion.button
                      className="p-2 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <MoreHorizontal className="w-5 h-5 text-apple-secondary" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-6 mt-6 pt-6 border-t border-apple-gray-200 dark:border-apple-gray-800">
                <div>
                  <p className="text-2xl font-bold text-apple-primary">{userProfile.posts}</p>
                  <p className="text-sm text-apple-tertiary">Bài viết</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-apple-primary">{userProfile.followers}</p>
                  <p className="text-sm text-apple-tertiary">Người theo dõi</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-apple-primary">{userProfile.following}</p>
                  <p className="text-sm text-apple-tertiary">Đang theo dõi</p>
                </div>
              </div>
            </div>
          </AppleCard>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {userPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </GlobalLayout>
  )
}
