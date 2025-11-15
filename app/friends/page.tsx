'use client'

import { GlobalLayout } from '@/components/layout/GlobalLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppleCard } from '@/components/ui/AppleCard'
import { Avatar } from '@/components/ui/Avatar'
import { AppleButton } from '@/components/ui/AppleButton'
import { UserPlus, UserMinus, MessageCircle, Search, Users, Loader2 } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/lib/firebase/hooks/useAuth'
import { friendService } from '@/lib/firebase/services/friendService'
import { userService, User } from '@/lib/firebase/services/userService'
import { useMessage } from '@/contexts/MessageContext'
import { useRouter } from 'next/navigation'
import { chatService } from '@/lib/firebase/services/chatService'

type TabType = 'friends' | 'search'

export default function FriendsPage() {
  return (
    <ProtectedRoute>
      <GlobalLayout>
        <FriendsContent />
      </GlobalLayout>
    </ProtectedRoute>
  )
}

// Separate component that uses MessageProvider
function FriendsContent() {
  const { user } = useAuth()
  const { openChat } = useMessage()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<TabType>('friends')
  const [searchQuery, setSearchQuery] = useState('')
  const [friends, setFriends] = useState<User[]>([])
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [unfriendingIds, setUnfriendingIds] = useState<Set<string>>(new Set())

  // Load friends list
  useEffect(() => {
    const loadFriends = async () => {
      if (!user?.uid) return

      try {
        setLoading(true)
        const friendIds = await friendService.getFriends(user.uid)
        
        if (friendIds.length > 0) {
          const friendUsers = await userService.getByIds(friendIds)
          setFriends(friendUsers)
        } else {
          setFriends([])
        }
      } catch (error) {
        console.error('Error loading friends:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFriends()
  }, [user?.uid])

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        return
      }

      try {
        setSearchLoading(true)
        const results = await userService.searchUsers(searchQuery.trim(), 20)
        // Filter out current user
        const filtered = results.filter((u) => u.id !== user?.uid)
        setSearchResults(filtered)
      } catch (error) {
        console.error('Error searching users:', error)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }

    // Debounce search
    const timeoutId = setTimeout(searchUsers, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, user?.uid])

  // Filter friends by search query
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends

    const term = searchQuery.toLowerCase()
    return friends.filter(
      (friend) =>
        friend.name.toLowerCase().includes(term) ||
        friend.username.toLowerCase().includes(term)
    )
  }, [friends, searchQuery])

  // Handle unfriend
  const handleUnfriend = async (friendId: string) => {
    if (!user?.uid || unfriendingIds.has(friendId)) return

    try {
      setUnfriendingIds((prev) => new Set(prev).add(friendId))
      await friendService.removeFriend(user.uid, friendId)
      
      // Remove from friends list
      setFriends((prev) => prev.filter((f) => f.id !== friendId))
    } catch (error) {
      console.error('Error unfriending:', error)
      alert('Có lỗi khi hủy kết bạn. Vui lòng thử lại.')
    } finally {
      setUnfriendingIds((prev) => {
        const next = new Set(prev)
        next.delete(friendId)
        return next
      })
    }
  }

  // Handle send message
  const handleSendMessage = (friendUser: User) => {
    if (!friendUser.id || !user?.uid) return

    try {
      const conversationId = chatService.getConversationId(user.uid, friendUser.id)
      openChat({
        id: Date.now(),
        userId: friendUser.id,
        user: {
          id: Date.now(),
          name: friendUser.name,
          username: friendUser.username,
          avatar: friendUser.avatar,
          online: false,
        },
      })
    } catch (error) {
      console.error('Error opening chat:', error)
    }
  }

  // Check friend status for search results
  const getFriendStatus = async (userId: string): Promise<'accepted' | 'pending' | 'sent' | 'none'> => {
    if (!user?.uid) return 'none'

    try {
      const status = await friendService.getFriendStatus(user.uid, userId)
      if (status === 'accepted') return 'accepted'
      if (status === 'pending') {
        // Check who sent the request
        const friendId = friendService.getFriendId(user.uid, userId)
        const friend = await friendService.getById(friendId, true)
        if (friend?.requestedBy === user.uid) {
          return 'sent'
        }
        return 'pending'
      }
      return 'none'
    } catch (error) {
      console.error('Error getting friend status:', error)
      return 'none'
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <AppleCard className="p-6 mb-6">
            <h1 className="text-3xl font-bold text-apple-primary mb-2">Bạn bè</h1>
            <p className="text-apple-secondary mb-4">
              {loading ? 'Đang tải...' : `Bạn có ${friends.length} người bạn`}
            </p>

            {/* Tabs */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setActiveTab('friends')}
                className={`px-4 py-2 rounded-apple-lg font-medium transition-colors ${
                  activeTab === 'friends'
                    ? 'bg-apple-gray-900 dark:bg-white text-white dark:text-black'
                    : 'bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-secondary hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Danh sách bạn bè</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`px-4 py-2 rounded-apple-lg font-medium transition-colors ${
                  activeTab === 'search'
                    ? 'bg-apple-gray-900 dark:bg-apple-gray-800 text-white dark:text-black'
                    : 'bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-secondary hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4" />
                  <span>Tìm kiếm người dùng</span>
                </div>
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-apple-tertiary" />
              <input
                type="text"
                placeholder={
                  activeTab === 'friends'
                    ? 'Tìm kiếm bạn bè...'
                    : 'Tìm kiếm theo tên hoặc username...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-apple-lg bg-apple-gray-100 dark:bg-apple-gray-800 border border-apple-gray-200 dark:border-apple-gray-700 text-apple-primary placeholder:text-apple-tertiary focus:outline-none focus:ring-2 focus:ring-apple-gray-400 dark:focus:ring-apple-gray-600"
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-apple-tertiary animate-spin" />
              )}
            </div>
          </AppleCard>

          {/* Friends List */}
          {activeTab === 'friends' && (
            <>
              {loading ? (
                <AppleCard className="p-6 text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 text-apple-secondary animate-spin" />
                  <p className="text-apple-secondary">Đang tải danh sách bạn bè...</p>
                </AppleCard>
              ) : filteredFriends.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredFriends.map((friend) => {
                    if (!friend.id) return null
                    return (
                    <div key={friend.id}>
                      <AppleCard className="p-6" hover>
                        <div className="flex items-start space-x-4">
                          <div
                            onClick={() => friend.id && router.push(`/profile?userId=${friend.id}`)}
                            className="cursor-pointer"
                          >
                            <Avatar
                              src={friend.avatar}
                              alt={friend.name}
                              size="lg"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className="font-semibold text-apple-primary truncate cursor-pointer hover:underline"
                              onClick={() => friend.id && router.push(`/profile?userId=${friend.id}`)}
                            >
                              {friend.name}
                            </h3>
                            <p className="text-sm text-apple-tertiary truncate">@{friend.username}</p>
                            {friend.bio && (
                              <p className="text-sm text-apple-secondary mt-2 line-clamp-2">{friend.bio}</p>
                            )}
                            <div className="flex space-x-2 mt-4">
                              <AppleButton
                                size="sm"
                                variant="secondary"
                                onClick={() => handleSendMessage(friend)}
                                className="flex-shrink-0"
                              >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Nhắn tin
                              </AppleButton>
                              <AppleButton
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUnfriend(friend.id!)}
                                disabled={unfriendingIds.has(friend.id!)}
                                className="flex-shrink-0"
                              >
                                {unfriendingIds.has(friend.id!) ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <UserMinus className="w-4 h-4 mr-2" />
                                )}
                                Hủy kết bạn
                              </AppleButton>
                            </div>
                          </div>
                        </div>
                      </AppleCard>
                    </div>
                    )
                  })}
                </div>
              ) : (
                <AppleCard className="p-6 text-center">
                  {searchQuery.trim() ? (
                    <p className="text-apple-secondary">Không tìm thấy bạn bè nào phù hợp</p>
                  ) : (
                    <>
                      <Users className="w-12 h-12 mx-auto mb-4 text-apple-tertiary" />
                      <p className="text-apple-secondary mb-2">Chưa có bạn bè nào</p>
                      <p className="text-sm text-apple-tertiary">
                        Tìm kiếm người dùng để kết bạn
                      </p>
                    </>
                  )}
                </AppleCard>
              )}
            </>
          )}

          {/* Search Results */}
          {activeTab === 'search' && (
            <>
              {searchQuery.trim() ? (
                searchLoading ? (
                  <AppleCard className="p-6 text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-4 text-apple-secondary animate-spin" />
                    <p className="text-apple-secondary">Đang tìm kiếm...</p>
                  </AppleCard>
                ) : searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map((userResult) => {
                      if (!userResult.id) return null
                      return (
                      <UserSearchResult
                        key={userResult.id}
                        user={userResult}
                        currentUserId={user?.uid || ''}
                        onSendMessage={handleSendMessage}
                        onViewProfile={() => userResult.id && router.push(`/profile?userId=${userResult.id}`)}
                      />
                      )
                    })}
                  </div>
                ) : (
                  <AppleCard className="p-6 text-center">
                    <Search className="w-12 h-12 mx-auto mb-4 text-apple-tertiary" />
                    <p className="text-apple-secondary">Không tìm thấy người dùng nào</p>
                  </AppleCard>
                )
              ) : (
                <AppleCard className="p-6 text-center">
                  <Search className="w-12 h-12 mx-auto mb-4 text-apple-tertiary" />
                  <p className="text-apple-secondary">Nhập từ khóa để tìm kiếm người dùng</p>
                </AppleCard>
              )}
            </>
          )}
        </div>
  )
}

// User Search Result Component
interface UserSearchResultProps {
  user: User
  currentUserId: string
  onSendMessage: (user: User) => void
  onViewProfile: () => void
}

function UserSearchResult({ user, currentUserId, onSendMessage, onViewProfile }: UserSearchResultProps) {
  const [friendStatus, setFriendStatus] = useState<'accepted' | 'pending' | 'sent' | 'loading' | 'none'>('loading')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkFriendStatus = async () => {
      if (!currentUserId || !user.id) return

      try {
        setFriendStatus('loading')
        const status = await friendService.getFriendStatus(currentUserId, user.id)
        if (status === 'accepted') {
          setFriendStatus('accepted')
        } else if (status === 'pending') {
          // Check who sent the request
          const friendId = friendService.getFriendId(currentUserId, user.id)
          const friend = await friendService.getById(friendId, true)
          if (friend?.requestedBy === currentUserId) {
            setFriendStatus('sent')
          } else {
            setFriendStatus('pending')
          }
        } else {
          setFriendStatus('none')
        }
      } catch (error) {
        console.error('Error checking friend status:', error)
        setFriendStatus('none')
      }
    }

    checkFriendStatus()
  }, [currentUserId, user.id])

  const handleFriendAction = async () => {
    if (!currentUserId || !user.id || loading) return

    try {
      setLoading(true)

      if (friendStatus === 'accepted') {
        // Unfriend
        await friendService.removeFriend(currentUserId, user.id)
        setFriendStatus('none')
      } else if (friendStatus === 'sent') {
        // Cancel request
        await friendService.removeFriend(currentUserId, user.id)
        setFriendStatus('none')
      } else if (friendStatus === 'pending') {
        // Accept request
        await friendService.acceptRequest(currentUserId, user.id, currentUserId)
        setFriendStatus('accepted')
      } else {
        // Send request
        await friendService.sendRequest(currentUserId, user.id)
        setFriendStatus('sent')
      }
    } catch (error: any) {
      console.error('Error handling friend action:', error)
      alert(error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppleCard className="p-6" hover>
      <div className="flex items-start space-x-4">
        <div
          onClick={onViewProfile}
          className="cursor-pointer"
        >
          <Avatar
            src={user.avatar}
            alt={user.name}
            size="lg"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-apple-primary truncate cursor-pointer hover:underline"
            onClick={onViewProfile}
          >
            {user.name}
          </h3>
          <p className="text-sm text-apple-tertiary truncate">@{user.username}</p>
          {user.bio && (
            <p className="text-sm text-apple-secondary mt-2 line-clamp-2">{user.bio}</p>
          )}
          <div className="flex items-center space-x-2 mt-2 text-xs text-apple-tertiary">
            <span>{user.followers || 0} người theo dõi</span>
            <span>•</span>
            <span>{user.posts || 0} bài viết</span>
          </div>
          <div className="flex space-x-2 mt-4">
            {friendStatus === 'accepted' && (
              <AppleButton
                size="sm"
                variant="secondary"
                onClick={() => onSendMessage(user)}
                className="flex-shrink-0"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Nhắn tin
              </AppleButton>
            )}
            <AppleButton
              size="sm"
              variant={friendStatus === 'accepted' ? 'ghost' : 'primary'}
              onClick={handleFriendAction}
              disabled={loading || friendStatus === 'loading'}
              className="flex-shrink-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : friendStatus === 'accepted' ? (
                <UserMinus className="w-4 h-4 mr-2" />
              ) : friendStatus === 'sent' ? (
                <UserPlus className="w-4 h-4 mr-2" />
              ) : friendStatus === 'pending' ? (
                <UserPlus className="w-4 h-4 mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {loading
                ? 'Đang xử lý...'
                : friendStatus === 'accepted'
                ? 'Hủy kết bạn'
                : friendStatus === 'sent'
                ? 'Đã gửi lời mời'
                : friendStatus === 'pending'
                ? 'Chấp nhận'
                : 'Kết bạn'}
            </AppleButton>
          </div>
        </div>
      </div>
    </AppleCard>
  )
}
