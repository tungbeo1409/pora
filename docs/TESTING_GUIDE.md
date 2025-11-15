# Testing Guide - Follow, Friend, Chat

Hướng dẫn test các tính năng đã implement.

## PHẦN 3: Update Messages Page ✅

Đã hoàn thành:
- ✅ Tích hợp `useChat` và `useConversations` hooks
- ✅ Realtime messages từ Realtime Database
- ✅ Fetch user data cho conversations
- ✅ Online status tracking
- ✅ Send message với file/image/voice upload
- ✅ Edit/Delete message
- ✅ Add reaction
- ✅ Mark as read

## PHẦN 4: Testing

### 4.1 Test Follow/Unfollow

**Bước 1: Setup 2 tài khoản**
1. Mở 2 browser khác nhau (hoặc 1 browser + 1 incognito)
2. Browser 1: Đăng nhập với user A
3. Browser 2: Đăng nhập với user B

**Bước 2: Test Follow**
1. Browser 1: Vào profile của user B (`/profile?user={userIdB}`)
2. Click nút "Theo dõi"
3. **Kiểm tra:**
   - Button đổi thành "Hủy theo dõi"
   - Firestore → Collection `follows` → Có document `${userIdA}_${userIdB}`
   - Firestore → Collection `users` → `userIdA` → `following` tăng lên 1
   - Firestore → Collection `users` → `userIdB` → `followers` tăng lên 1
   - Browser 2: Check notifications → Có notification "follow"

**Bước 3: Test Unfollow**
1. Browser 1: Click "Hủy theo dõi"
2. **Kiểm tra:**
   - Button đổi thành "Theo dõi"
   - Firestore → Document `${userIdA}_${userIdB}` bị xóa
   - Stats giảm đi 1

### 4.2 Test Friend Request/Accept

**Bước 1: Send Friend Request**
1. Browser 1 (user A): Vào profile user B
2. Click "Kết bạn"
3. **Kiểm tra:**
   - Button đổi thành "Đã gửi lời mời"
   - Firestore → Collection `friends` → Document có `status: 'pending'`, `requestedBy: userIdA`
   - Browser 2: Check notifications → Có notification "friend_request"

**Bước 2: Accept Friend Request**
1. Browser 2 (user B): Vào profile user A
2. **Kiểm tra:**
   - Hiển thị nút "Chấp nhận" và "Từ chối"
3. Click "Chấp nhận"
4. **Kiểm tra:**
   - Button đổi thành "Hủy kết bạn"
   - Firestore → Document có `status: 'accepted'`
   - Browser 1: Check notifications → Có notification "friend_accept"

**Bước 3: Test Reject**
1. Gửi lại friend request từ user khác
2. Click "Từ chối"
3. **Kiểm tra:**
   - Button đổi thành "Kết bạn"
   - Firestore → Document có `status: 'rejected'` hoặc bị xóa

**Bước 4: Test Remove Friend**
1. Từ user đã là bạn: Click "Hủy kết bạn"
2. **Kiểm tra:**
   - Button đổi thành "Kết bạn"
   - Firestore → Document bị xóa

### 4.3 Test Realtime Chat

**Bước 1: Setup Chat**
1. Browser 1 (user A): Vào profile user B
2. Click "Nhắn tin"
3. **Kiểm tra:**
   - URL: `/messages?user={userIdB}`
   - Conversations list hiển thị conversation với user B

**Bước 2: Send Message**
1. Browser 1: Nhập tin nhắn và nhấn Enter
2. **Kiểm tra:**
   - Realtime Database → `chats/{conversationId}/messages` → Có message mới
   - Message hiển thị trong chat area
   - Browser 2: Message tự động xuất hiện (realtime)

**Bước 3: Test Edit Message**
1. Browser 1: Hover vào message của mình
2. Click menu (3 chấm) → "Sửa"
3. Sửa text và nhấn Enter
4. **Kiểm tra:**
   - Message được update trong Realtime Database
   - Browser 2: Message tự động update (realtime)
   - Có icon bút nhỏ ở góc message

**Bước 4: Test Delete Message**
1. Browser 1: Menu → "Thu hồi"
2. **Kiểm tra:**
   - Message bị đánh dấu `isDeleted: true` trong Realtime Database
   - Browser 2: Message hiển thị "Tin nhắn đã được thu hồi"

**Bước 5: Test Reaction**
1. Browser 1: Menu → "Thả cảm xúc" → Chọn emoji
2. **Kiểm tra:**
   - Reaction xuất hiện dưới message
   - Realtime Database → `reactions` object có emoji
   - Browser 2: Reaction tự động xuất hiện

**Bước 6: Test Reply**
1. Browser 1: Menu → "Trả lời"
2. Nhập tin nhắn và gửi
3. **Kiểm tra:**
   - Tin nhắn có preview reply ở trên
   - Realtime Database → Message có `replyToId` và `replyToText`

**Bước 7: Test File/Image Upload**
1. Browser 1: Click "+" → "Chọn ảnh" hoặc "Chọn file"
2. Chọn file và gửi
3. **Kiểm tra:**
   - File được upload (Base64 hoặc Cloudinary)
   - URL được lưu trong Realtime Database
   - File hiển thị trong chat

**Bước 8: Test Voice**
1. Browser 1: Click mic icon
2. Record voice và gửi
3. **Kiểm tra:**
   - Voice được upload lên Cloudinary
   - URL được lưu trong Realtime Database
   - Voice player hiển thị với duration

**Bước 9: Test Online Status**
1. Browser 1 (user A): Login
2. Browser 2 (user B): Vào Messages → Chọn conversation với user A
3. **Kiểm tra:**
   - Header hiển thị "Đang hoạt động" (online indicator)
   - Avatar có green dot
4. Browser 1: Logout
5. **Kiểm tra:**
   - Browser 2: Status đổi thành "Offline"

**Bước 10: Test Mark as Read**
1. Browser 1: Gửi tin nhắn cho user B
2. Browser 2: Vào conversation
3. **Kiểm tra:**
   - Unread count giảm về 0
   - Realtime Database → `metadata/{userIdB}/unreadCount` = 0

**Bước 11: Test Conversations List**
1. Browser 1: Gửi tin nhắn cho nhiều users
2. **Kiểm tra:**
   - Conversations list hiển thị tất cả conversations
   - Sắp xếp theo `lastMessageTime` (mới nhất trước)
   - Hiển thị unread count
   - Hiển thị last message preview

### 4.4 Test Notifications

**Bước 1: Test Follow Notification**
1. User A follow User B
2. **Kiểm tra:**
   - User B: Notification dropdown có notification mới
   - Badge hiển thị số lượng
   - Notification type = 'follow'

**Bước 2: Test Friend Request Notification**
1. User A send friend request to User B
2. **Kiểm tra:**
   - User B: Có notification "friend_request"
   - Click vào notification → Navigate đến profile user A

**Bước 3: Test Friend Accept Notification**
1. User B accept friend request
2. **Kiểm tra:**
   - User A: Có notification "friend_accept"

**Bước 4: Test Notification Realtime**
1. Browser 1: User A follow User B
2. Browser 2: User B đang mở app
3. **Kiểm tra:**
   - Notification tự động xuất hiện trong dropdown (không cần refresh)

## Troubleshooting

### Lỗi: "Permission denied" khi send message
→ Check Realtime Database rules đã đúng chưa

### Lỗi: "Index not found" khi query
→ Tạo Firestore indexes theo hướng dẫn trong `docs/FOLLOW_FRIEND_CHAT_SETUP.md`

### Messages không realtime update
→ Check:
1. Realtime Database đã enable chưa
2. Rules đã publish chưa
3. `rtdb` đã được initialize trong `lib/firebase/config.ts` chưa

### Online status không update
→ Check:
1. `chatService.setOnlineStatus()` được gọi khi login
2. `chatService.listenToOnlineStatus()` được setup đúng
3. Realtime Database rules cho `presence` đã đúng

### File upload không hoạt động
→ Check:
1. Cloudinary config trong `.env.local`
2. Upload preset đã set "Unsigned" chưa
3. File size có quá lớn không

## Checklist Testing

- [ ] Follow/Unfollow hoạt động
- [ ] Friend Request/Accept/Reject hoạt động
- [ ] Send text message realtime
- [ ] Send image/file message
- [ ] Send voice message
- [ ] Edit message
- [ ] Delete message
- [ ] Add reaction
- [ ] Reply message
- [ ] Online status hiển thị đúng
- [ ] Mark as read hoạt động
- [ ] Conversations list hiển thị đúng
- [ ] Notifications realtime update
- [ ] Follow notification tạo đúng
- [ ] Friend request/accept notifications tạo đúng

