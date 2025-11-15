'use client'

import { GlobalLayout } from '@/components/layout/GlobalLayout'
import { AppleCard } from '@/components/ui/AppleCard'
import { PostCard } from '@/components/post/PostCard'
import { Heart } from 'lucide-react'

const favoritePosts = [
  {
    id: 1,
    author: {
      id: 1,
      name: 'Nguyễn Văn A',
      username: '@nguyenvana',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    content: 'Bài viết yêu thích đầu tiên. Nội dung rất hay và hữu ích!',
    image: 'https://picsum.photos/600/400?random=1',
    likes: 245,
    comments: 32,
    shares: 12,
    timeAgo: '2 ngày trước',
    liked: true,
    saved: false,
  },
  {
    id: 2,
    author: {
      id: 2,
      name: 'Trần Thị B',
      username: '@tranthib',
      avatar: 'https://i.pravatar.cc/150?img=2',
    },
    content: 'Một bài viết khác mà tôi đã yêu thích. Cảm ơn tác giả!',
    likes: 189,
    comments: 28,
    shares: 8,
    timeAgo: '5 ngày trước',
    liked: true,
    saved: false,
  },
]

export default function FavoritesPage() {
  return (
    <GlobalLayout>
      <div className="max-w-2xl mx-auto">
        <div>
          <AppleCard className="p-6 mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              <h1 className="text-3xl font-bold text-apple-primary">Yêu thích</h1>
            </div>
            <p className="text-apple-secondary">Bạn đã yêu thích {favoritePosts.length} bài viết</p>
          </AppleCard>
        </div>

        <div className="space-y-4">
          {favoritePosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </GlobalLayout>
  )
}

