# Notifications System - Hướng dẫn Setup

## Tổng quan

Hệ thống thông báo realtime sử dụng Firestore để lưu trữ và realtime listeners để cập nhật tự động.

## Firestore Collection Structure

**Collection:** `notifications`

**Document Structure:**
```typescript
{
  userId: string,           // User nhận thông báo
  actorId: string,          // User tạo thông báo
  actorName: string,        // Tên người tạo
  actorAvatar?: string,     // Avatar người tạo
  actorUsername?: string,   // Username người tạo
  type: NotificationType,   // Loại thông báo
  message?: string,         // Nội dung thông báo
  targetType: 'post' | 'comment' | 'user' | 'device' | null,
  targetId?: string,        // ID của target
  metadata?: object,        // Thông tin thêm
  read: boolean,           // Đã đọc chưa
  readAt?: Timestamp,      // Thời gian đọc
  createdAt: Timestamp,    // Thời gian tạo
  updatedAt: Timestamp,    // Thời gian cập nhật
}
```

## Notification Types

1. **`like`** - Like bài viết
2. **`comment`** - Bình luận bài viết
3. **`reply`** - Reply bình luận
4. **`follow`** - Theo dõi user
5. **`share`** - Chia sẻ bài viết
6. **`login_device`** - Đăng nhập từ thiết bị khác
7. **`friend_request`** - Yêu cầu kết bạn
8. **`friend_accept`** - Chấp nhận kết bạn

## Firestore Security Rules

Vào Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Notifications
    match /notifications/{notificationId} {
      // User chỉ có thể đọc notifications của chính mình
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      
      // Chỉ hệ thống (server) mới có thể tạo/update notifications
      // Trên client, chỉ có thể update read status
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && 
                       resource.data.userId == request.auth.uid &&
                       request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read', 'readAt']);
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

## Firestore Indexes

**QUAN TRỌNG:** Cần tạo composite index cho query notifications.

### Index 1: Notifications by userId + read + createdAt
```
Collection: notifications
Fields:
  - userId (Ascending)
  - read (Ascending)
  - createdAt (Descending)
```

### Index 2: Notifications by userId + createdAt
```
Collection: notifications
Fields:
  - userId (Ascending)
  - createdAt (Descending)
```

### Cách tạo Index:

**Option 1: Từ Firebase Console**
1. Vào Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Collection ID: `notifications`
4. Add fields theo thứ tự trên
5. Query scope: Collection
6. Click "Create"

**Option 2: Từ Error Message (Tự động)**
1. Khi chạy app, nếu thiếu index, Firebase sẽ báo lỗi
2. Click link trong error message
3. Firebase Console sẽ mở với form tạo index sẵn
4. Click "Create Index"

**Option 3: firestore.indexes.json**
Tạo file `firestore.indexes.json` trong project root:

```json
{
  "indexes": [
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "read",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Sau đó deploy:
```bash
firebase deploy --only firestore:indexes
```

## Sử dụng

### 1. Lấy notifications (Realtime)

```typescript
import { useNotifications } from '@/lib/firebase/hooks/useNotifications'
import { useAuth } from '@/lib/firebase/hooks/useAuth'

const { user } = useAuth()
const { notifications, unreadCount, loading } = useNotifications(user?.uid || null, {
  limitCount: 50,
  unreadOnly: false,
  realtime: true,
})
```

### 2. Tạo notification khi có event

```typescript
import { notifyLike, notifyComment, notifyFollow, notifyLoginDevice } from '@/lib/firebase/utils/notificationHelpers'

// Like post
await notifyLike(postOwnerId, likerId, postId)

// Comment post
await notifyComment(postOwnerId, commenterId, postId, commentId)

// Reply comment
await notifyReply(commentOwnerId, replierId, postId, commentId, replyId)

// Follow user
await notifyFollow(followedUserId, followerId)

// Share post
await notifyShare(postOwnerId, sharerId, postId)

// Login from device
await notifyLoginDevice(userId, 'iPhone 13, iOS 16')

// Friend request
await notifyFriendRequest(requestedUserId, requesterId)

// Friend accept
await notifyFriendAccept(acceptedUserId, accepterId)
```

### 3. Mark as read

```typescript
import { notificationService } from '@/lib/firebase/services/notificationService'

// Mark single notification
await notificationService.markAsRead(notificationId, false)

// Mark all as read
await notificationService.markAllAsRead(userId)
```

### 4. Format time

```typescript
import { formatNotificationTime } from '@/lib/firebase/hooks/useNotifications'

const timeStr = formatNotificationTime(notification.createdAt)
// "2 phút trước", "1 giờ trước", "3 ngày trước", etc.
```

## Tích hợp vào các tính năng

### Like Post
```typescript
// Trong PostCard hoặc nơi handle like
import { notifyLike } from '@/lib/firebase/utils/notificationHelpers'

const handleLike = async () => {
  // ... existing like logic ...
  
  // Tạo notification (chỉ khi like, không phải unlike)
  if (!liked && post.author.id !== currentUserId) {
    await notifyLike(post.author.id, currentUserId, post.id)
  }
}
```

### Comment Post
```typescript
import { notifyComment } from '@/lib/firebase/utils/notificationHelpers'

const handleComment = async (commentText: string) => {
  // ... create comment logic ...
  const commentId = '...' // ID của comment vừa tạo
  
  // Tạo notification
  if (post.author.id !== currentUserId) {
    await notifyComment(post.author.id, currentUserId, post.id, commentId)
  }
}
```

### Reply Comment
```typescript
import { notifyReply } from '@/lib/firebase/utils/notificationHelpers'

const handleReply = async (replyText: string, parentComment: Comment) => {
  // ... create reply logic ...
  const replyId = '...'
  
  // Tạo notification
  if (parentComment.author.id !== currentUserId) {
    await notifyReply(
      parentComment.author.id,
      currentUserId,
      post.id,
      parentComment.id,
      replyId
    )
  }
}
```

### Follow User
```typescript
import { notifyFollow } from '@/lib/firebase/utils/notificationHelpers'

const handleFollow = async (userId: string) => {
  // ... follow logic ...
  
  // Tạo notification
  await notifyFollow(userId, currentUserId)
}
```

### Login Device
```typescript
import { notifyLoginDevice } from '@/lib/firebase/utils/notificationHelpers'
import { useAuth } from '@/lib/firebase/hooks/useAuth'

// Trong authService hoặc nơi handle login
const detectDevice = () => {
  const ua = navigator.userAgent
  // Detect device from user agent
  return 'iPhone 13, iOS 16' // or detect from ua
}

const handleLogin = async () => {
  // ... login logic ...
  
  // Tạo notification về đăng nhập từ thiết bị khác
  const deviceInfo = detectDevice()
  await notifyLoginDevice(userId, deviceInfo)
}
```

## Best Practices

1. **Không notify chính mình**: Helper functions tự động check và skip nếu `userId === actorId`
2. **Batch writes**: Sử dụng `useBatch: false` cho notifications để đảm bảo immediate delivery
3. **Limit notifications**: Chỉ load 50-100 notifications mới nhất
4. **Client-side filter**: Nếu Firestore index chưa sẵn sàng, filter ở client
5. **Mark as read on click**: Tự động mark as read khi user click vào notification
6. **Cleanup old notifications**: Có thể xóa notifications cũ (>30 ngày) để giảm storage

## Testing

### Tạo test notification

```typescript
import { notificationService } from '@/lib/firebase/services/notificationService'

// Tạo test notification
await notificationService.createNotification(
  userId,           // User nhận
  actorId,          // User tạo
  'like',           // Type
  {
    targetType: 'post',
    targetId: 'post123',
    metadata: { postId: 'post123' },
  }
)
```

## Troubleshooting

### Error: "The query requires an index"
→ Tạo composite index theo hướng dẫn trên. Firebase sẽ tự động fallback về client-side filter nếu index chưa có.

### Notifications không realtime update
→ Check Firestore rules và đảm bảo user có quyền đọc notifications của chính mình.

### Notification bị duplicate
→ Check logic tạo notification, đảm bảo không tạo nhiều lần cho cùng một action.

### Performance issues
→ Giới hạn số lượng notifications load, sử dụng pagination cho list dài.

