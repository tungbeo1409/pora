'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Edit, Trash2, Flag, X, Check } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { AppleCard } from '@/components/ui/AppleCard'
import { Dropdown } from '@/components/ui/Dropdown'
import { CommentSection } from './CommentSection'
import { useState } from 'react'
import Image from 'next/image'
import clsx from 'clsx'
import Link from 'next/link'

interface Post {
  id: number
  author: {
    id: number
    name: string
    username: string
    avatar: string
  }
  content: string
  image?: string
  likes: number
  comments: number
  shares: number
  timeAgo: string
  liked?: boolean
  saved?: boolean
  isOwn?: boolean
}

interface PostCardProps {
  post: Post
  priority?: boolean
}

export function PostCard({ post, priority = false }: PostCardProps) {
  const [liked, setLiked] = useState(post.liked || false)
  const [saved, setSaved] = useState(post.saved || false)
  const [likesCount, setLikesCount] = useState(post.likes)
  const [showComments, setShowComments] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [postContent, setPostContent] = useState(post.content)

  const handleLike = () => {
    setLiked(!liked)
    setLikesCount(liked ? likesCount - 1 : likesCount + 1)
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditContent(postContent)
    setDropdownOpen(false)
  }

  const handleSaveEdit = () => {
    if (!editContent.trim()) return
    setPostContent(editContent)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditContent(postContent)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm('Bạn có chắc muốn xóa bài viết này?')) {
      console.log('Delete post', post.id)
      // Handle delete logic here
    }
    setDropdownOpen(false)
  }

  const dropdownItems = [
    ...(post.isOwn
      ? [
          {
            label: 'Chỉnh sửa',
            icon: <Edit className="w-4 h-4" />,
            onClick: handleEdit,
          },
          {
            label: 'Xóa',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: handleDelete,
            danger: true,
          },
        ]
      : [
          {
            label: 'Báo cáo',
            icon: <Flag className="w-4 h-4" />,
            onClick: () => console.log('Report post'),
            danger: true,
          },
        ]),
    {
      label: saved ? 'Bỏ lưu' : 'Lưu bài viết',
      icon: <Bookmark className="w-4 h-4" />,
      onClick: () => setSaved(!saved),
    },
  ]

  const comments = [
    {
      id: 1,
      author: {
        id: 1,
        name: 'Nguyễn Văn A',
        username: '@nguyenvana',
        avatar: 'https://i.pravatar.cc/150?img=1',
      },
      content: 'Bài viết rất hay! Cảm ơn bạn đã chia sẻ.',
      timeAgo: '1 giờ trước',
      likes: 12,
      liked: false,
    },
    {
      id: 2,
      author: {
        id: 2,
        name: 'Trần Thị B',
        username: '@tranthib',
        avatar: 'https://i.pravatar.cc/150?img=2',
      },
      content: 'Đồng ý với bạn! 👍',
      timeAgo: '30 phút trước',
      likes: 5,
      liked: true,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="mb-4"
    >
      <AppleCard className="p-6 relative z-0">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Link href={`/profile?user=${post.author.id}`} className="flex-shrink-0">
              <Avatar src={post.author.avatar} size="md" />
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/profile?user=${post.author.id}`} className="hover:underline">
                <p className="font-semibold text-apple-primary truncate">{post.author.name}</p>
              </Link>
              <p className="text-sm text-apple-tertiary truncate">{post.author.username} · {post.timeAgo}</p>
            </div>
          </div>
          <div className="flex-shrink-0 relative z-50">
            <Dropdown
              items={dropdownItems}
              isOpen={dropdownOpen}
              onClose={() => setDropdownOpen(false)}
              position="auto"
            >
              <motion.button
                className="p-2 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <MoreHorizontal className="w-5 h-5 text-apple-secondary" />
              </motion.button>
            </Dropdown>
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="space-y-3 mb-4">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-4 py-3 rounded-apple-lg bg-apple-gray-100 dark:bg-apple-gray-800 border border-apple-gray-200 dark:border-apple-gray-700 text-apple-primary placeholder:text-apple-tertiary focus:outline-none focus:ring-2 focus:ring-apple-gray-400 dark:focus:ring-apple-gray-600 text-sm resize-none min-h-[100px]"
              rows={4}
              autoFocus
            />
            <div className="flex items-center space-x-2">
              <motion.button
                className="px-4 py-2 rounded-apple-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm font-medium"
                onClick={handleSaveEdit}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>Lưu</span>
                </div>
              </motion.button>
              <motion.button
                className="px-4 py-2 rounded-apple-lg hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors text-sm font-medium text-apple-secondary"
                onClick={handleCancelEdit}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center space-x-2">
                  <X className="w-4 h-4" />
                  <span>Hủy</span>
                </div>
              </motion.button>
            </div>
          </div>
        ) : (
          <p className="text-apple-primary mb-4 leading-relaxed whitespace-pre-wrap">{postContent}</p>
        )}

        {/* Image */}
        {post.image && !isEditing && (
          <motion.div
            className="rounded-apple-lg overflow-hidden mb-4 bg-apple-gray-100 dark:bg-apple-gray-800"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <Image
              src={post.image}
              alt="Post image"
              width={600}
              height={400}
              className="w-full h-auto object-cover"
              priority={priority}
              fetchPriority={priority ? 'high' : 'auto'}
              loading={priority ? undefined : 'lazy'}
              unoptimized
            />
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-apple-gray-200 dark:border-apple-gray-800">
          <motion.button
            className="flex items-center space-x-2 text-apple-secondary hover:text-red-500 transition-colors"
            onClick={handleLike}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
            <span className="text-sm">{likesCount}</span>
          </motion.button>

          <motion.button
            className="flex items-center space-x-2 text-apple-secondary hover:text-blue-500 transition-colors"
            onClick={() => setShowComments(!showComments)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.comments}</span>
          </motion.button>

          <motion.button
            className="flex items-center space-x-2 text-apple-secondary hover:text-green-500 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Share2 className="w-5 h-5" />
            <span className="text-sm">{post.shares}</span>
          </motion.button>

          <motion.button
            className={clsx(
              'flex items-center space-x-2 transition-colors',
              saved ? 'text-yellow-500' : 'text-apple-secondary hover:text-yellow-500'
            )}
            onClick={() => setSaved(!saved)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bookmark className={clsx('w-5 h-5', saved && 'fill-yellow-500')} />
          </motion.button>
        </div>

        {/* Comments Section */}
        <CommentSection 
          comments={comments} 
          postId={post.id} 
          showComments={showComments}
          onToggleComments={() => setShowComments(!showComments)}
        />
      </AppleCard>
    </motion.div>
  )
}
