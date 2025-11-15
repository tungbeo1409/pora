# Follow, Friend, Chat - Hướng dẫn Setup

## Tổng quan

Hệ thống gồm 3 tính năng chính:
1. **Follow/Unfollow** - Theo dõi user (sử dụng Firestore)
2. **Friend Request/Accept** - Kết bạn (sử dụng Firestore)
3. **Realtime Chat** - Nhắn tin realtime (sử dụng Realtime Database để tiết kiệm số lượt đọc)

## 1. Follow Service

### Firestore Collection: `follows`

**Document Structure:**
```typescript
{
  followerId: string,    // User theo dõi
  followingId: string,   // User được theo dõi
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

**Document ID:** `${followerId}_${followingId}`

### Firestore Rules

```javascript
match /follows/{followId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && 
                   request.resource.data.followerId == request.auth.uid;
  allow delete: if request.auth != null && 
                   resource.data.followerId == request.auth.uid;
}
```

### Indexes

**Index 1:** `followerId + createdAt`
```
Collection: follows
Fields:
  - followerId (Ascending)
  - createdAt (Descending)
```

**Index 2:** `followingId + createdAt`
```
Collection: follows
Fields:
  - followingId (Ascending)
  - createdAt (Descending)
```

## 2. Friend Service

### Firestore Collection: `friends`

**Document Structure:**
```typescript
{
  userId: string,        // User 1 (sorted)
  friendId: string,      // User 2 (sorted)
  status: 'pending' | 'accepted' | 'rejected' | 'blocked',
  requestedBy: string,   // User ID của người gửi request
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

**Document ID:** `${min(userId1, userId2)}_${max(userId1, userId2)}`

### Firestore Rules

```javascript
match /friends/{friendId} {
  // User can read if they are part of the friendship
  allow read: if request.auth != null && 
                (resource.data.userId == request.auth.uid || 
                 resource.data.friendId == request.auth.uid);
  
  // User can create if they are the requester
  allow create: if request.auth != null && 
                   request.resource.data.requestedBy == request.auth.uid;
  
  // User can update if they are part of the friendship
  allow update: if request.auth != null && 
                   (resource.data.userId == request.auth.uid || 
                    resource.data.friendId == request.auth.uid);
  
  // User can delete if they are part of the friendship
  allow delete: if request.auth != null && 
                   (resource.data.userId == request.auth.uid || 
                    resource.data.friendId == request.auth.uid);
}
```

### Indexes

**Index 1:** `userId + status + updatedAt`
```
Collection: friends
Fields:
  - userId (Ascending)
  - status (Ascending)
  - updatedAt (Descending)
```

**Index 2:** `friendId + status + updatedAt`
```
Collection: friends
Fields:
  - friendId (Ascending)
  - status (Ascending)
  - updatedAt (Descending)
```

**Index 3:** `requestedBy + status + createdAt`
```
Collection: friends
Fields:
  - requestedBy (Ascending)
  - status (Ascending)
  - createdAt (Descending)
```

## 3. Chat Service (Realtime Database)

### Database Structure

```
chats/
  {userId1}_{userId2}/  (sorted IDs)
    messages/
      {messageId}/
        id: string
        text: string
        senderId: string
        receiverId: string
        type: 'text' | 'image' | 'file' | 'voice'
        imageUrl?: string
        fileUrl?: string
        fileName?: string
        fileSize?: number
        voiceUrl?: string
        voiceDuration?: number
        replyToId?: string
        replyToText?: string
        reactions: { [emoji: string]: string[] }
        isEdited: boolean
        isDeleted: boolean
        createdAt: number (timestamp)
        updatedAt?: number
    metadata/
      {userId}/
        lastMessage: { id, text, type }
        lastMessageTime: number
        unreadCount: number

presence/
  {userId}/
    status: 'online' | 'offline'
    lastSeen: number
```

### Realtime Database Rules

⚠️ **LƯU Ý:** Realtime Database rules không hỗ trợ method `split()`. Dùng rules sau đây:

```json
{
  "rules": {
    "chats": {
      ".read": "auth != null",
      "$conversationId": {
        "messages": {
          ".read": "auth != null",
          "$messageId": {
            ".write": "auth != null && newData.child('senderId').val() == auth.uid && (!data.exists() || data.child('senderId').val() == auth.uid)",
            ".validate": "newData.hasChildren(['senderId', 'receiverId', 'type', 'createdAt']) && newData.child('senderId').val() == auth.uid && newData.child('receiverId').val() != null && newData.child('receiverId').val() != auth.uid"
          }
        },
        "metadata": {
          ".read": "auth != null",
          "$userId": {
            ".read": "auth != null",
            "lastMessage": {
              ".write": "auth != null && ($userId == auth.uid || newData.hasChildren(['id', 'text', 'type']))"
            },
            "lastMessageTime": {
              ".write": "auth != null"
            },
            "unreadCount": {
              ".write": "auth != null"
            }
          }
        }
      }
    },
    "conversations": {
      "$conversationId": {
        "images": {
          ".read": "auth != null",
          "$imageId": {
            ".write": "auth != null && newData.child('uploadedBy').val() == auth.uid"
          }
        },
        "videos": {
          ".read": "auth != null",
          "$videoId": {
            ".write": "auth != null && newData.child('uploadedBy').val() == auth.uid"
          }
        },
        "audio": {
          ".read": "auth != null",
          "$audioId": {
            ".write": "auth != null && newData.child('uploadedBy').val() == auth.uid"
          }
        }
      }
    },
    "users": {
      "$userId": {
        "images": {
          ".read": "auth != null",
          "$imageId": {
            ".write": "auth != null && $userId == auth.uid && newData.child('uploadedBy').val() == auth.uid"
          }
        },
        "videos": {
          ".read": "auth != null",
          "$videoId": {
            ".write": "auth != null && $userId == auth.uid && newData.child('uploadedBy').val() == auth.uid"
          }
        },
        "audio": {
          ".read": "auth != null",
          "$audioId": {
            ".write": "auth != null && $userId == auth.uid && newData.child('uploadedBy').val() == auth.uid"
          }
        }
      }
    },
    "presence": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null && $userId == auth.uid"
      }
    }
  }
}
```

**Giải thích:**
- **Read messages:** Authenticated users có thể đọc messages (bảo mật được đảm bảo ở application level - chỉ query conversations của họ)
- **Write messages:** User chỉ có thể tạo/edit message nếu họ là `senderId` HOẶC update reactions nếu họ là sender hoặc receiver của message
- **Validate:** Khi tạo message mới, phải có đầy đủ fields bắt buộc (`senderId`, `receiverId`, `type`, `createdAt`). Khi update reactions, chỉ cần có field `reactions`
- **Metadata:**
  - **lastMessage:** User có thể update metadata của chính mình HOẶC update của người khác nếu update có cấu trúc hợp lệ (`id`, `text`, `type`) - cho phép sender update receiver metadata khi gửi tin nhắn
  - **lastMessageTime:** Authenticated users có thể update (được update cùng với lastMessage)
  - **unreadCount:** Authenticated users có thể update (sender update receiver unreadCount khi gửi tin nhắn)
- **Conversations (images/videos/audio):**
  - **Read:** Authenticated users có thể đọc media files trong conversations
  - **Write:** User chỉ có thể upload media nếu họ là `uploadedBy` (kiểm tra `newData.child('uploadedBy').val() == auth.uid`)
- **Users (images/videos/audio):**
  - **Read:** Authenticated users có thể đọc media files (có thể đọc của mình hoặc người khác)
  - **Write:** User chỉ có thể upload media vào thư mục của chính mình và `uploadedBy` phải là chính họ (`$userId == auth.uid && newData.child('uploadedBy').val() == auth.uid`)

**Lưu ý bảo mật:**
- Mặc dù read rule cho phép authenticated users đọc tất cả messages, bảo mật được đảm bảo vì:
  1. Frontend chỉ query conversations mà user tham gia (application-level filtering)
  2. Write rule chỉ cho phép user tạo message với `senderId` là chính họ
  3. Validate rule đảm bảo `senderId` và `receiverId` hợp lệ
- Metadata update được cho phép khi:
  1. User update metadata của chính mình (tất cả fields)
  2. HOẶC user update lastMessage của người khác với cấu trúc hợp lệ (chỉ khi gửi tin nhắn mới)
  3. lastMessageTime và unreadCount có thể được update bởi bất kỳ authenticated user (được update cùng với lastMessage khi gửi tin nhắn)

### Setup Realtime Database Rules

1. Vào Firebase Console → Realtime Database → Rules
2. Copy toàn bộ nội dung từ file `REALTIME_DATABASE_RULES.txt` trong project
3. Paste vào Rules editor
4. Click "Publish"

⚠️ **QUAN TRỌNG:** 
- Rules mới không dùng `split()` method (không được hỗ trợ trong Realtime Database rules)
- Đảm bảo bạn đã publish rules mới trước khi test chat functionality

## Sử dụng

### Follow/Unfollow

```typescript
import { followService } from '@/lib/firebase/services/followService'

// Follow
await followService.follow(currentUserId, targetUserId)

// Unfollow
await followService.unfollow(currentUserId, targetUserId)

// Check if following
const isFollowing = await followService.isFollowing(currentUserId, targetUserId)

// Get followers
const followers = await followService.getFollowers(userId)

// Get following
const following = await followService.getFollowing(userId)
```

### Friend Request/Accept

```typescript
import { friendService } from '@/lib/firebase/services/friendService'

// Send friend request
await friendService.sendRequest(currentUserId, targetUserId)

// Accept request
await friendService.acceptRequest(currentUserId, targetUserId, currentUserId)

// Reject request
await friendService.rejectRequest(currentUserId, targetUserId)

// Remove friend
await friendService.removeFriend(currentUserId, targetUserId)

// Check friend status
const status = await friendService.getFriendStatus(currentUserId, targetUserId)
// Returns: 'pending' | 'accepted' | 'rejected' | 'blocked' | null

// Get friends
const friends = await friendService.getFriends(userId)

// Get pending requests (received)
const pending = await friendService.getPendingRequests(userId)
```

### Chat (Realtime)

```typescript
import { useChat, useConversations } from '@/lib/firebase/hooks/useChat'

// In component
const { messages, loading, sendMessage, editMessage, deleteMessage, addReaction } = useChat(
  otherUserId,
  { limitCount: 50, realtime: true }
)

// Send message
await sendMessage('Hello!', {
  type: 'text',
  // Or with file
  // type: 'image',
  // imageUrl: 'https://...',
  // Or with reply
  // replyToId: 'messageId',
  // replyToText: 'Original message',
})

// Edit message
await editMessage(messageId, 'Updated text')

// Delete message
await deleteMessage(messageId)

// Add reaction
await addReaction(messageId, '👍')

// Get conversations list
const { conversations, loading } = useConversations()
```

### Online Status

```typescript
import { chatService } from '@/lib/firebase/services/chatService'

// Set online status
await chatService.setOnlineStatus(userId, true)

// Listen to online status
const unsubscribe = chatService.listenToOnlineStatus(
  otherUserId,
  (isOnline) => {
    console.log('User is online:', isOnline)
  }
)
```

## Tích hợp vào UI

### Profile Page

Đã tích hợp trong `app/profile/page.tsx`:
- Nút "Theo dõi" / "Hủy theo dõi"
- Nút "Kết bạn" / "Chấp nhận" / "Từ chối" / "Hủy kết bạn"
- Trạng thái: `none`, `pending`, `sent`, `accepted`

### Messages Page

Cần update `app/messages/page.tsx` để sử dụng:
```typescript
import { useChat, useConversations } from '@/lib/firebase/hooks/useChat'
import { useSearchParams } from 'next/navigation'

const searchParams = useSearchParams()
const userIdParam = searchParams.get('user')
const { conversations } = useConversations()
const { messages, sendMessage } = useChat(userIdParam || null)
```

## Best Practices

1. **Follow vs Friend:**
   - Follow: Một chiều, không cần accept
   - Friend: Hai chiều, cần accept

2. **Realtime Database:**
   - Dùng cho chat để tiết kiệm số lượt đọc Firestore
   - Realtime DB không tính theo document reads mà theo data transfer
   - Phù hợp cho realtime chat với nhiều messages

3. **Caching:**
   - Follow status được cache trong Firestore cache
   - Friend status được cache
   - Chat messages không cache (luôn realtime)

4. **Notifications:**
   - Follow → tự động tạo notification
   - Friend request → tự động tạo notification
   - Friend accept → tự động tạo notification

5. **Performance:**
   - Sử dụng batch writes khi có thể
   - Limit số lượng messages trong conversation
   - Cleanup old messages nếu cần

## Troubleshooting

### Error: "Follow document already exists"
→ Đã follow rồi, check status trước khi follow

### Error: "Cannot follow yourself"
→ Không thể follow chính mình

### Realtime Database not initialized
→ Đảm bảo `rtdb` được export từ `lib/firebase/config.ts`

### Chat messages không realtime
→ Check Realtime Database rules và đảm bảo user có quyền đọc/write

### Online status không update
→ Call `chatService.setOnlineStatus()` khi user login/logout

