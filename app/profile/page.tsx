'use client'

import { GlobalLayout } from '@/components/layout/GlobalLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppleCard } from '@/components/ui/AppleCard'
import { AppleButton } from '@/components/ui/AppleButton'
import { Avatar } from '@/components/ui/Avatar'
import { PostCard } from '@/components/post/PostCard'
import { Dropdown } from '@/components/ui/Dropdown'
import { Settings, MessageCircle, UserPlus, MoreHorizontal, Edit, Share2, Flag, UserMinus, BellOff } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useAuth } from '@/lib/firebase/hooks/useAuth'
import { User } from '@/lib/firebase/services/userService'
import { followService } from '@/lib/firebase/services/followService'
import { friendService } from '@/lib/firebase/services/friendService'
import { useMessage } from '@/contexts/MessageContext'
import { useEffect, useState, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'

const userPosts: any[] = []

// Component to handle message button (must be inside GlobalLayout for useMessage)
function MessageButton({
  viewingUserId,
  profileUser,
  displayName,
  username,
  avatar,
  disabled,
}: {
  viewingUserId: string
  profileUser: User | null
  displayName: string
  username: string
  avatar: string
  disabled: boolean
}) {
  const { openChat } = useMessage()
  
  return (
    <AppleButton 
      variant="secondary" 
      size="sm"
      onClick={() => {
        // Generate a unique ID for the chat popup (using userId hash)
        const chatId = Math.abs(
          viewingUserId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        ) % 1000000
        
        openChat({
          id: chatId,
          userId: viewingUserId, // Pass actual userId for chat
          user: {
            id: chatId,
            name: profileUser?.name || displayName,
            username: profileUser?.username || username,
            avatar: profileUser?.avatar || avatar || '/non-avatar.png',
            online: false, // TODO: Get real online status
          },
        })
      }}
      disabled={disabled}
      className="flex items-center"
    >
      <MessageCircle className="w-4 h-4 mr-2 flex-shrink-0" />
      <span>Nhắn tin</span>
    </AppleButton>
  )
}

function ProfileContent() {
  const { user: authUser, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const userIdParam = searchParams.get('userId') || searchParams.get('user') // Support both 'userId' and 'user' query params
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted' | 'sent'>('none')
  const [loadingFollow, setLoadingFollow] = useState(false)
  const [loadingFriend, setLoadingFriend] = useState(false)

  // Check if viewing own profile or another user's profile
  const viewingUserId = userIdParam || authUser?.uid || ''
  const isOwnProfile = !userIdParam || (userIdParam === authUser?.uid)
  
  // Reset loading state when userId changes
  useEffect(() => {
    if (viewingUserId) {
      setLoading(true)
      setProfileUser(null)
    }
  }, [viewingUserId])

  // Helper function to refresh friend status
  const refreshFriendStatus = useCallback(async () => {
    if (!authUser?.uid || authUser.uid === viewingUserId) return
    
    try {
      const status = await friendService.getFriendStatus(authUser.uid, viewingUserId)
      if (status === 'pending') {
        // Check who sent the request by checking the friend document directly
        const friendId = friendService.getFriendId(authUser.uid, viewingUserId)
        try {
          const friendDoc = await friendService.getById(friendId, false)
          
          if (friendDoc) {
            // If requestedBy is current user, status is 'sent'
            // Otherwise, status is 'pending' (received)
            setFriendStatus(friendDoc.requestedBy === authUser.uid ? 'sent' : 'pending')
          } else {
            setFriendStatus('none')
          }
        } catch (error: any) {
          // If permission denied, assume not exists
          if (error?.code === 'permission-denied') {
            setFriendStatus('none')
          } else {
            throw error
          }
        }
      } else if (status === 'accepted') {
        setFriendStatus('accepted')
      } else {
        setFriendStatus('none')
      }
    } catch (error) {
      console.error('Error checking friend status:', error)
      setFriendStatus('none')
    }
  }, [authUser?.uid, viewingUserId])

  // Get user profile from Firestore and check follow/friend status
  useEffect(() => {
    if (authUser && !authLoading && viewingUserId) {
      const getUserProfile = async () => {
        try {
          setLoading(true)
          const { userService } = await import('@/lib/firebase/services/userService')
          const user = await userService.getById(viewingUserId)
          
          if (!user) {
            console.error('User not found:', viewingUserId)
            setLoading(false)
            return
          }
          
          setProfileUser(user)

          // Check follow status
          if (authUser.uid !== viewingUserId) {
            try {
              const following = await followService.isFollowing(authUser.uid, viewingUserId)
              setIsFollowing(following)
            } catch (error) {
              console.error('Error checking follow status:', error)
              setIsFollowing(false)
            }

            // Check friend status
            try {
              await refreshFriendStatus()
            } catch (error) {
              console.error('Error refreshing friend status:', error)
            }
          } else {
            // Own profile - reset friend/follow status
            setIsFollowing(false)
            setFriendStatus('none')
          }
        } catch (error: any) {
          console.error('Error loading user profile:', error)
          if (error?.code === 'permission-denied') {
            console.error('Permission denied loading user profile')
          }
          setProfileUser(null)
        } finally {
          setLoading(false)
        }
      }
      getUserProfile()
    } else if (!authLoading && !viewingUserId) {
      // No userId and auth not loading - might be own profile
      setLoading(false)
    }
  }, [authUser, authLoading, viewingUserId, refreshFriendStatus])

  // Get display name from Firebase Auth or Firestore
  const displayName = profileUser?.name || authUser?.displayName || 'Chưa có tên'
  const username = profileUser?.username || authUser?.email?.split('@')[0] || ''
  const bio = profileUser?.bio || ''
  const avatar = profileUser?.avatar || authUser?.photoURL || ''
  const cover = profileUser?.cover || ''
  const followers = profileUser?.followers || 0
  const following = profileUser?.following || 0
  const posts = profileUser?.posts || 0

  if (loading || authLoading) {
    return (
      <ProtectedRoute>
        <GlobalLayout>
          <div className="max-w-4xl mx-auto">
            <AppleCard className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-48 bg-apple-gray-200 dark:bg-apple-gray-800 rounded-lg" />
                <div className="h-8 bg-apple-gray-200 dark:bg-apple-gray-800 rounded w-1/3" />
              </div>
            </AppleCard>
          </div>
        </GlobalLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <GlobalLayout>
      <div className="max-w-4xl mx-auto">
        {/* Cover & Profile */}
        <div>
          <AppleCard className="overflow-visible p-0 mb-6">
            {/* Cover */}
            <div className="relative h-48 sm:h-56 bg-gradient-to-br from-apple-gray-200 to-apple-gray-300 dark:from-apple-gray-800 dark:to-apple-gray-900 rounded-t-apple-lg overflow-hidden">
              {cover ? (
                <Image
                  src={cover}
                  alt="Cover"
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 opacity-80" />
              )}
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
                      src={avatar} 
                      size="xl"
                    />
                  </div>
                </div>
                <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-end justify-between space-y-4 sm:space-y-0 w-full min-w-0">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-apple-primary truncate">{displayName}</h1>
                    <p className="text-apple-tertiary truncate">@{username}</p>
                    {bio && (
                      <p className="text-apple-secondary mt-2 leading-relaxed">{bio}</p>
                    )}
                    {!bio && (
                      <p className="text-apple-tertiary mt-2 italic">Chưa có tiểu sử</p>
                    )}
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    {isOwnProfile ? (
                      <>
                        {/* Own Profile Actions */}
                        <AppleButton variant="secondary" size="sm" onClick={() => window.location.href = '/settings'} className="flex items-center">
                          <Edit className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>Chỉnh sửa hồ sơ</span>
                        </AppleButton>
                        <Dropdown
                          items={[
                            {
                              label: 'Cài đặt',
                              icon: <Settings className="w-4 h-4" />,
                              onClick: () => (window.location.href = '/settings'),
                            },
                            {
                              label: 'Chia sẻ profile',
                              icon: <Share2 className="w-4 h-4" />,
                              onClick: () => {
                                navigator.clipboard.writeText(`${window.location.origin}/profile?user=${viewingUserId}`)
                                // You can add a toast notification here
                                alert('Đã sao chép link profile')
                              },
                            },
                          ]}
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
                      </>
                    ) : (
                      <>
                        {/* Other User Profile Actions */}
                        <MessageButton 
                          viewingUserId={viewingUserId}
                          profileUser={profileUser}
                          displayName={displayName}
                          username={username}
                          avatar={avatar}
                          disabled={loadingFriend}
                        />
                        {friendStatus === 'none' && (
                          <AppleButton 
                            size="sm"
                            onClick={async () => {
                              if (!authUser?.uid || loadingFollow) return
                              setLoadingFollow(true)
                              try {
                                if (isFollowing) {
                                  await followService.unfollow(authUser.uid, viewingUserId)
                                  setIsFollowing(false)
                                } else {
                                  await followService.follow(authUser.uid, viewingUserId)
                                  setIsFollowing(true)
                                }
                              } catch (error: any) {
                                console.error('Error following/unfollowing:', error)
                                alert(error.message || 'Có lỗi xảy ra')
                              } finally {
                                setLoadingFollow(false)
                              }
                            }}
                            disabled={loadingFollow}
                            className="flex items-center"
                          >
                            {isFollowing ? (
                              <>
                                <UserMinus className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span>Hủy theo dõi</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span>Theo dõi</span>
                              </>
                            )}
                          </AppleButton>
                        )}
                        {friendStatus === 'pending' && (
                          <>
                            <AppleButton 
                              size="sm"
                              onClick={async () => {
                                if (!authUser?.uid || loadingFriend) return
                                setLoadingFriend(true)
                                try {
                                  await friendService.acceptRequest(authUser.uid, viewingUserId, authUser.uid)
                                  setFriendStatus('accepted')
                                  // Refresh user stats
                                  const { userService } = await import('@/lib/firebase/services/userService')
                                  const user = await userService.getById(viewingUserId)
                                  setProfileUser(user)
                                } catch (error: any) {
                                  console.error('Error accepting request:', error)
                                  alert(error.message || 'Có lỗi xảy ra')
                                } finally {
                                  setLoadingFriend(false)
                                }
                              }}
                              disabled={loadingFriend}
                              className="flex items-center"
                            >
                              <UserPlus className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span>Chấp nhận</span>
                            </AppleButton>
                            <AppleButton 
                              variant="secondary"
                              size="sm"
                              onClick={async () => {
                                if (!authUser?.uid || loadingFriend) return
                                setLoadingFriend(true)
                                try {
                                  await friendService.rejectRequest(authUser.uid, viewingUserId)
                                  // Refresh friend status
                                  await refreshFriendStatus()
                                } catch (error: any) {
                                  console.error('Error rejecting request:', error)
                                  alert(error.message || 'Có lỗi xảy ra')
                                } finally {
                                  setLoadingFriend(false)
                                }
                              }}
                              disabled={loadingFriend}
                            >
                              Từ chối
                            </AppleButton>
                          </>
                        )}
                        {friendStatus === 'sent' && (
                          <AppleButton 
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                              if (!authUser?.uid || loadingFriend) return
                              if (!confirm('Bạn có muốn hủy lời mời kết bạn?')) return
                              setLoadingFriend(true)
                              try {
                                // Remove friend request (delete friend document)
                                await friendService.removeFriend(authUser.uid, viewingUserId)
                                // Refresh friend status
                                await refreshFriendStatus()
                              } catch (error: any) {
                                console.error('Error canceling friend request:', error)
                                alert(error.message || 'Có lỗi xảy ra')
                              } finally {
                                setLoadingFriend(false)
                              }
                            }}
                            disabled={loadingFriend}
                            className="flex items-center"
                          >
                            <UserMinus className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>Hủy lời mời</span>
                          </AppleButton>
                        )}
                        {friendStatus === 'accepted' && (
                          <AppleButton 
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                              if (!authUser?.uid || loadingFriend) return
                              if (!confirm('Bạn có chắc muốn hủy kết bạn?')) return
                              setLoadingFriend(true)
                              try {
                                await friendService.removeFriend(authUser.uid, viewingUserId)
                                // Refresh friend status and user stats
                                await refreshFriendStatus()
                                const { userService } = await import('@/lib/firebase/services/userService')
                                const user = await userService.getById(viewingUserId)
                                setProfileUser(user)
                              } catch (error: any) {
                                console.error('Error removing friend:', error)
                                alert(error.message || 'Có lỗi xảy ra')
                              } finally {
                                setLoadingFriend(false)
                              }
                            }}
                            disabled={loadingFriend}
                            className="flex items-center"
                          >
                            <UserMinus className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>Hủy kết bạn</span>
                          </AppleButton>
                        )}
                        {friendStatus === 'none' && (
                          <AppleButton 
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                              if (!authUser?.uid || loadingFriend) return
                              if (!confirm('Bạn có muốn gửi lời mời kết bạn?')) return
                              setLoadingFriend(true)
                              try {
                                await friendService.sendRequest(authUser.uid, viewingUserId)
                                // Refresh friend status to get accurate state
                                await refreshFriendStatus()
                              } catch (error: any) {
                                console.error('Error sending friend request:', error)
                                alert(error.message || 'Có lỗi xảy ra')
                              } finally {
                                setLoadingFriend(false)
                              }
                            }}
                            disabled={loadingFriend}
                            className="flex items-center"
                          >
                            <UserPlus className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>Kết bạn</span>
                          </AppleButton>
                        )}
                        <Dropdown
                          items={[
                            {
                              label: 'Chia sẻ profile',
                              icon: <Share2 className="w-4 h-4" />,
                              onClick: () => {
                                navigator.clipboard.writeText(`${window.location.origin}/profile?user=${viewingUserId}`)
                                alert('Đã sao chép link profile')
                              },
                            },
                            {
                              label: 'Chặn người dùng',
                              icon: <BellOff className="w-4 h-4" />,
                              onClick: () => {
                                if (confirm('Bạn có chắc muốn chặn người dùng này?')) {
                                  // TODO: Implement block user logic
                                  alert('Đã chặn người dùng')
                                }
                              },
                              danger: true,
                            },
                            {
                              label: 'Báo cáo',
                              icon: <Flag className="w-4 h-4" />,
                              onClick: () => {
                                // TODO: Implement report user logic
                                alert('Đã gửi báo cáo')
                              },
                              danger: true,
                            },
                          ]}
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
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-6 mt-6 pt-6 border-t border-apple-gray-200 dark:border-apple-gray-800">
                <div>
                  <p className="text-2xl font-bold text-apple-primary">{posts}</p>
                  <p className="text-sm text-apple-tertiary">Bài viết</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-apple-primary">{followers}</p>
                  <p className="text-sm text-apple-tertiary">Người theo dõi</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-apple-primary">{following}</p>
                  <p className="text-sm text-apple-tertiary">Đang theo dõi</p>
                </div>
              </div>
            </div>
          </AppleCard>
        </div>

        {/* Posts */}
        {userPosts.length > 0 ? (
          <div className="space-y-4">
            {userPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <AppleCard className="p-6 text-center">
            <p className="text-apple-secondary">Chưa có bài viết nào</p>
          </AppleCard>
        )}
      </div>
      </GlobalLayout>
    </ProtectedRoute>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <GlobalLayout>
          <div className="max-w-4xl mx-auto">
            <AppleCard className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-48 bg-apple-gray-200 dark:bg-apple-gray-800 rounded-lg" />
                <div className="h-8 bg-apple-gray-200 dark:bg-apple-gray-800 rounded w-1/3" />
              </div>
            </AppleCard>
          </div>
        </GlobalLayout>
      </ProtectedRoute>
    }>
      <ProfileContent />
    </Suspense>
  )
}
