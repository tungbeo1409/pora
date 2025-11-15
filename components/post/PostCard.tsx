'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Edit, Trash2, Flag, X, Check, Image as ImageIcon, Loader2 } from 'lucide-react'
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
  const [postImage, setPostImage] = useState<string | null>(post.image || null)
  const [editImage, setEditImage] = useState<string | null>(post.image || null)
  const [isSaving, setIsSaving] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const MAX_CHARACTERS = 2000

  const handleLike = () => {
    setLiked(!liked)
    setLikesCount(liked ? likesCount - 1 : likesCount + 1)
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditContent(postContent)
    setEditImage(postImage || null)
    setDropdownOpen(false)
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      setImageError('Nội dung không được để trống')
      return
    }

    if (editContent.length > MAX_CHARACTERS) {
      setImageError(`Nội dung không được vượt quá ${MAX_CHARACTERS} ký tự`)
      return
    }

    setIsSaving(true)
    setImageError(null)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    setPostContent(editContent)
    setPostImage(editImage)
    setIsEditing(false)
    setIsSaving(false)
    setImageError(null)
    
    // In real app, call API to update post here
    // await updatePost(post.id, { content: editContent, image: editImage })
  }

  const handleCancelEdit = () => {
    setEditContent(postContent)
    setEditImage(postImage || null)
    setIsEditing(false)
    setImageError(null)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setImageError('Kích thước ảnh không được vượt quá 5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditImage(reader.result as string)
        setImageError(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setEditImage(null)
    setImageError(null)
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
        avatar: '',
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
        avatar: '',
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
          <div className="flex items-center space-x-1 flex-shrink-0 relative z-50">
            {/* Edit Button - Only show for own posts */}
            {post.isOwn && (
              <motion.button
                className="p-2 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleEdit}
                title="Chỉnh sửa bài viết"
              >
                <Edit className="w-5 h-5 text-apple-secondary" />
              </motion.button>
            )}
            
            {/* Dropdown Menu */}
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
                title="Tùy chọn"
              >
                <MoreHorizontal className="w-5 h-5 text-apple-secondary" />
              </motion.button>
            </Dropdown>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit-mode"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="space-y-4 mb-4 overflow-hidden"
            >
              {/* Edit Content */}
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => {
                    setEditContent(e.target.value)
                    setImageError(null)
                  }}
                  className="w-full px-4 py-3 rounded-apple-lg bg-apple-gray-50 dark:bg-apple-gray-900 border border-apple-gray-200 dark:border-apple-gray-800 text-apple-primary placeholder:text-apple-tertiary focus:outline-none focus:ring-2 focus:ring-apple-gray-400 dark:focus:ring-apple-gray-600 text-sm resize-none min-h-[120px] transition-all duration-200"
                  rows={5}
                  placeholder="Bạn đang nghĩ gì?"
                  autoFocus
                  maxLength={MAX_CHARACTERS}
                />
                <div className="flex items-center justify-between">
                  <AnimatePresence>
                    {imageError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-xs text-red-500"
                      >
                        {imageError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <span className={clsx(
                    'text-xs ml-auto',
                    editContent.length > MAX_CHARACTERS * 0.9
                      ? 'text-orange-500'
                      : editContent.length > MAX_CHARACTERS
                      ? 'text-red-500'
                      : 'text-apple-tertiary'
                  )}>
                    {editContent.length} / {MAX_CHARACTERS}
                  </span>
                </div>
              </div>

              {/* Image Edit Section */}
              {editImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative rounded-apple-lg overflow-hidden bg-apple-gray-100 dark:bg-apple-gray-800 group"
                >
                  <Image
                    src={editImage}
                    alt="Edit post image"
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover"
                    unoptimized
                  />
                  <motion.button
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                    onClick={handleRemoveImage}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isSaving}
                  />
                  <motion.div
                    className="flex items-center space-x-2 px-4 py-2 rounded-apple-lg bg-apple-gray-100 dark:bg-apple-gray-800 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700 transition-colors text-apple-secondary text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>{editImage ? 'Thay đổi ảnh' : 'Thêm ảnh'}</span>
                  </motion.div>
                </label>
                <p className="text-xs text-apple-tertiary">JPG, PNG hoặc GIF, tối đa 5MB</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-apple-gray-200 dark:border-apple-gray-800">
                <motion.button
                  className="px-4 py-2 rounded-apple-lg hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors text-sm font-medium text-apple-secondary disabled:opacity-50"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  whileHover={{ scale: isSaving ? 1 : 1.05 }}
                  whileTap={{ scale: isSaving ? 1 : 0.95 }}
                >
                  <div className="flex items-center space-x-2">
                    <X className="w-4 h-4" />
                    <span>Hủy</span>
                  </div>
                </motion.button>
                <motion.button
                  className="px-4 py-2 rounded-apple-lg bg-apple-gray-900 dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editContent.trim() || editContent.length > MAX_CHARACTERS}
                  whileHover={{ scale: isSaving || !editContent.trim() ? 1 : 1.05 }}
                  whileTap={{ scale: isSaving || !editContent.trim() ? 1 : 0.95 }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="view-mode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-apple-primary mb-4 leading-relaxed whitespace-pre-wrap"
            >
              {postContent}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Image - Only show when not editing */}
        <AnimatePresence>
          {postImage && !isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="rounded-apple-lg overflow-hidden mb-4 bg-apple-gray-100 dark:bg-apple-gray-800"
              whileHover={{ scale: 1.01 }}
            >
              <Image
                src={postImage}
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
        </AnimatePresence>

        {/* Actions - Hide when editing */}
        {!isEditing && (
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
        )}

        {/* Comments Section - Hide when editing */}
        {!isEditing && (
          <CommentSection 
            comments={comments} 
            postId={post.id} 
            showComments={showComments}
            onToggleComments={() => setShowComments(!showComments)}
          />
        )}
      </AppleCard>
    </motion.div>
  )
}
