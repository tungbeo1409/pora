'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Reply, Send, Edit, Trash2, MoreVertical, X, Check } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useState } from 'react'
import { AppleInput } from '@/components/ui/AppleInput'
import { Dropdown } from '@/components/ui/Dropdown'
import Link from 'next/link'

interface Comment {
  id: number
  author: {
    id: number
    name: string
    username: string
    avatar: string
  }
  content: string
  timeAgo: string
  likes: number
  liked?: boolean
  replies?: Comment[]
  isOwn?: boolean
}

interface CommentSectionProps {
  comments: Comment[]
  postId: number
  showComments: boolean
  onToggleComments: () => void
}

export function CommentSection({ comments: initialComments, postId, showComments, onToggleComments }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(
    initialComments.map(c => ({ ...c, isOwn: c.author.id === 1 })) // Giả sử user id = 1
  )
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null)

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now(),
      author: {
        id: 1,
        name: 'Bạn',
        username: '@ban',
        avatar: 'https://i.pravatar.cc/150?img=5',
      },
      content: newComment,
      timeAgo: 'Vừa xong',
      likes: 0,
      liked: false,
      isOwn: true,
    }

    setComments([...comments, comment])
    setNewComment('')
  }

  const handleLikeComment = (commentId: number) => {
    setComments(
      comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            liked: !comment.liked,
            likes: comment.liked ? comment.likes - 1 : comment.likes + 1,
          }
        }
        return comment
      })
    )
  }

  const handleEditComment = (commentId: number) => {
    const comment = comments.find(c => c.id === commentId)
    if (comment) {
      setEditingId(commentId)
      setEditContent(comment.content)
      setDropdownOpen(null)
    }
  }

  const handleSaveEdit = (commentId: number) => {
    if (!editContent.trim()) return

    setComments(
      comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            content: editContent,
          }
        }
        return comment
      })
    )
    setEditingId(null)
    setEditContent('')
  }

  const handleDeleteComment = (commentId: number) => {
    setComments(comments.filter(c => c.id !== commentId))
    setDropdownOpen(null)
  }

  const dropdownItems = (comment: Comment) => [
    ...(comment.isOwn
      ? [
          {
            label: 'Chỉnh sửa',
            icon: <Edit className="w-4 h-4" />,
            onClick: () => handleEditComment(comment.id),
          },
          {
            label: 'Xóa',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: () => handleDeleteComment(comment.id),
            danger: true,
          },
        ]
      : [
          {
            label: 'Báo cáo',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: () => console.log('Report comment'),
            danger: true,
          },
        ]),
  ]

  return (
    <div className="mt-4">
      <motion.button
        className="text-sm text-apple-secondary hover:text-apple-primary transition-colors mb-4 font-medium"
        onClick={onToggleComments}
        whileHover={{ scale: 1.02, x: 4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <motion.span
          animate={{ rotate: showComments ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="inline-block mr-2"
        >
          ▼
        </motion.span>
        {showComments ? 'Ẩn bình luận' : `Xem ${comments.length} bình luận`}
      </motion.button>

      <AnimatePresence mode="wait">
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 30,
              opacity: { duration: 0.2 },
              height: { duration: 0.3 }
            }}
            className="space-y-4 overflow-hidden"
          >
            {/* Comments List */}
            <motion.div 
              className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {comments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  className="flex space-x-3"
                  initial={{ opacity: 0, x: -20, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 300, 
                    damping: 30,
                    delay: index * 0.05
                  }}
                >
                  <Link href={`/profile?user=${comment.author.id}`}>
                    <Avatar src={comment.author.avatar} size="sm" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="glass rounded-apple-lg p-3 mb-2 relative group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <Link href={`/profile?user=${comment.author.id}`} className="hover:underline">
                            <span className="font-semibold text-sm text-apple-primary truncate">
                              {comment.author.name}
                            </span>
                          </Link>
                          <span className="text-xs text-apple-tertiary flex-shrink-0">
                            {comment.author.username} · {comment.timeAgo}
                          </span>
                        </div>
                        <Dropdown
                          items={dropdownItems(comment)}
                          isOpen={dropdownOpen === comment.id}
                          onClose={() => setDropdownOpen(null)}
                          position="auto"
                        >
                          <motion.button
                            className="p-1 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors opacity-0 group-hover:opacity-100"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setDropdownOpen(dropdownOpen === comment.id ? null : comment.id)
                            }}
                          >
                            <MoreVertical className="w-3.5 h-3.5 text-apple-secondary" />
                          </motion.button>
                        </Dropdown>
                      </div>
                      {editingId === comment.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full px-3 py-2 rounded-apple-lg bg-apple-gray-100 dark:bg-apple-gray-800 border border-apple-gray-200 dark:border-apple-gray-700 text-apple-primary placeholder:text-apple-tertiary focus:outline-none focus:ring-2 focus:ring-apple-gray-400 dark:focus:ring-apple-gray-600 text-sm resize-none"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex items-center space-x-2">
                            <motion.button
                              className="p-1.5 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                              onClick={() => handleSaveEdit(comment.id)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Check className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              className="p-1.5 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
                              onClick={() => {
                                setEditingId(null)
                                setEditContent('')
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <X className="w-4 h-4 text-apple-secondary" />
                            </motion.button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-apple-primary leading-relaxed">
                          {comment.content}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 ml-3">
                      <motion.button
                        className="flex items-center space-x-1 text-xs text-apple-tertiary hover:text-red-500 transition-colors"
                        onClick={() => handleLikeComment(comment.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Heart
                          className={`w-3 h-3 ${comment.liked ? 'fill-red-500 text-red-500' : ''}`}
                        />
                        <span>{comment.likes}</span>
                      </motion.button>
                      <motion.button
                        className="text-xs text-apple-tertiary hover:text-blue-500 transition-colors"
                        onClick={() => setReplyingTo(comment.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Phản hồi
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Add Comment */}
            <div className="flex items-start space-x-3 pt-3 border-t border-apple-gray-200 dark:border-apple-gray-800">
              <Link href="/profile">
                <Avatar src="https://i.pravatar.cc/150?img=5" size="sm" />
              </Link>
              <div className="flex-1 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Viết bình luận..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  className="flex-1 px-4 py-2 rounded-apple-lg bg-apple-gray-100 dark:bg-apple-gray-800 border border-apple-gray-200 dark:border-apple-gray-700 text-apple-primary placeholder:text-apple-tertiary focus:outline-none focus:ring-2 focus:ring-apple-gray-400 dark:focus:ring-apple-gray-600 text-sm"
                />
                <motion.button
                  className="p-2 rounded-apple-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  onClick={handleAddComment}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
