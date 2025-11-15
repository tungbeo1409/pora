# Hướng dẫn thiết lập Firebase cho PORA

## Bước 1: Tạo Project Firebase

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** hoặc **"Thêm dự án"**
3. Nhập tên project: `pora-d6c25` (hoặc tên bạn muốn)
4. Click **"Continue"**
5. Tắt/tắt Google Analytics (tùy chọn)
6. Click **"Create project"**
7. Đợi Firebase tạo project (khoảng 1-2 phút)
8. Click **"Continue"**

## Bước 2: Thêm Web App

1. Trong Firebase Console, click vào icon **Web** (`</>`)
2. Nhập tên app: `PORA Web`
3. **KHÔNG** check "Also set up Firebase Hosting" (chúng ta không dùng Hosting)
4. Click **"Register app"**
5. Copy config code (đã có trong `lib/firebase/config.ts`)

## Bước 3: Thiết lập Firestore Database

### 3.1. Tạo Database

1. Trong Firebase Console, vào **Firestore Database** (menu bên trái)
2. Click **"Create database"**
3. Chọn **"Start in production mode"** (chúng ta sẽ cấu hình rules sau)
4. Chọn location: **asia-southeast1** (Singapore) - gần Việt Nam nhất
5. Click **"Enable"**
6. Đợi database được tạo (1-2 phút)

### 3.2. Cấu hình Security Rules

1. Trong Firestore Database, click tab **"Rules"**
2. Copy và paste đoạn rules sau:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      // Anyone can read user profiles
      allow read: if true;
      
      // Only the user can write their own data
      allow write: if isOwner(userId);
    }
    
    // Posts collection
    match /posts/{postId} {
      // Anyone can read posts
      allow read: if true;
      
      // Only authenticated users can create posts
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      
      // Only post owner can update/delete
      allow update, delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }
    
    // Comments collection
    match /posts/{postId}/comments/{commentId} {
      // Anyone can read comments
      allow read: if true;
      
      // Only authenticated users can create comments
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      
      // Only comment owner can update/delete
      allow update, delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }
    
    // Messages collection (private messages)
    match /messages/{messageId} {
      // Only participants can read messages
      allow read: if isSignedIn() && (
        resource.data.senderId == request.auth.uid ||
        resource.data.receiverId == request.auth.uid
      );
      
      // Only authenticated users can create messages
      allow create: if isSignedIn() && (
        request.resource.data.senderId == request.auth.uid ||
        request.resource.data.receiverId == request.auth.uid
      );
      
      // Only message sender can update (for edited messages)
      allow update: if isSignedIn() && resource.data.senderId == request.auth.uid;
    }
    
    // Conversations collection
    match /conversations/{conversationId} {
      // Only participants can read conversations
      allow read: if isSignedIn() && (
        resource.data.participants[request.auth.uid] != null
      );
      
      // Only authenticated users can create conversations
      allow create: if isSignedIn() && (
        request.auth.uid in request.resource.data.participants
      );
      
      // Only participants can update
      allow update: if isSignedIn() && (
        request.auth.uid in resource.data.participants
      );
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      // Users can only read their own notifications
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      
      // System can create notifications
      allow create: if isSignedIn();
      
      // Users can update their own notifications (mark as read)
      allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
    }
    
    // Friends collection
    match /friends/{userId} {
      // Users can read their own friends list
      allow read: if isSignedIn() && userId == request.auth.uid;
      
      // Users can manage their own friends list
      allow write: if isSignedIn() && userId == request.auth.uid;
    }
    
    // Reactions collection (for posts/comments)
    match /{document=**}/reactions/{reactionId} {
      // Anyone can read reactions
      allow read: if true;
      
      // Only authenticated users can add reactions
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      
      // Only reaction owner can delete
      allow delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Click **"Publish"**

### 3.3. Tạo Indexes (nếu cần)

Firestore sẽ tự động yêu cầu tạo indexes khi bạn chạy queries phức tạp. Khi có lỗi về index:

1. Click vào link error trong console
2. Click **"Create Index"** trong Firebase Console
3. Đợi index được tạo (có thể mất vài phút)

**Lưu ý**: Tốt nhất nên tạo indexes trước cho các queries thường dùng để tránh delay.

#### Indexes đề xuất (tạo thủ công trong tab "Indexes"):

**Posts:**
- Collection: `posts`
- Fields: `createdAt` (Descending), `userId` (Ascending)
- Query scope: Collection

**Comments:**
- Collection: `posts/{postId}/comments`
- Fields: `createdAt` (Ascending)
- Query scope: Collection

**Messages:**
- Collection: `messages`
- Fields: `conversationId` (Ascending), `createdAt` (Descending)
- Query scope: Collection

**Notifications:**
- Collection: `notifications`
- Fields: `userId` (Ascending), `createdAt` (Descending)
- Query scope: Collection

## Bước 4: Thiết lập Authentication

### 4.1. Enable Authentication Methods

1. Vào **Authentication** (menu bên trái)
2. Click **"Get started"**
3. Click tab **"Sign-in method"**

### 4.2. Enable Email/Password

1. Click vào **"Email/Password"**
2. Enable **"Email/Password"** (toggle đầu tiên)
3. **KHÔNG** enable "Email link (passwordless sign-in)" (trừ khi bạn muốn)
4. Click **"Save"**

### 4.3. (Optional) Enable Google Sign-in

1. Click vào **"Google"**
2. Enable Google provider
3. Chọn support email
4. Click **"Save"**

### 4.4. Cấu hình Authorized domains

1. Trong tab **"Settings"** của Authentication
2. Scroll xuống **"Authorized domains"**
3. Domain mặc định đã có: `localhost`, `your-project.firebaseapp.com`
4. Thêm domain production của bạn nếu cần

## Bước 5: Cấu trúc Database

### Collections Structure:

```
users/
  {userId}/
    - name: string
    - username: string
    - email: string
    - avatar: string
    - bio?: string
    - createdAt: timestamp
    - updatedAt: timestamp

posts/
  {postId}/
    - userId: string (reference to users)
    - content: string
    - images?: string[]
    - likes: number
    - comments: number
    - createdAt: timestamp
    - updatedAt: timestamp

posts/{postId}/comments/
  {commentId}/
    - userId: string
    - content: string
    - likes: number
    - createdAt: timestamp
    - updatedAt: timestamp

messages/
  {messageId}/
    - conversationId: string
    - senderId: string
    - receiverId: string
    - content: string
    - type: 'text' | 'image' | 'file'
    - createdAt: timestamp
    - read: boolean

conversations/
  {conversationId}/
    - participants: map { userId: boolean }
    - lastMessage: string
    - lastMessageAt: timestamp
    - createdAt: timestamp

notifications/
  {notificationId}/
    - userId: string
    - type: 'like' | 'comment' | 'follow' | 'message'
    - title: string
    - body: string
    - read: boolean
    - createdAt: timestamp

friends/
  {userId}/
    - friendIds: array of strings
    - pendingRequests: array of strings
```

## Bước 6: Test Connection

1. Chạy app: `npm run dev`
2. Mở browser console
3. Kiểm tra xem có lỗi Firebase nào không
4. Thử đăng ký tài khoản mới
5. Kiểm tra trong Firebase Console > Authentication xem user đã được tạo chưa

## Bước 7: Production Setup

### 7.1. Environment Variables (nếu cần)

Tạo file `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAJIgndlB8Mx5la_1YBABuhN6Cmkl0JG6c
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pora-d6c25.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pora-d6c25
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pora-d6c25.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=866209366450
NEXT_PUBLIC_FIREBASE_APP_ID=1:866209366450:web:a1e3aadc504357bf74a4ab
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-FS44L22TYE
```

### 7.2. Quotas và Limits

- **Free tier (Spark Plan)**:
  - 50K reads/day
  - 20K writes/day
  - 20K deletes/day
  - 1GB storage
  - 10GB network egress/month

- **Blaze Plan** (Pay as you go):
  - $0.06 per 100K document reads
  - $0.18 per 100K document writes
  - $0.02 per 100K document deletes

### 7.3. Monitoring

1. Vào **Firestore Usage** để theo dõi số reads/writes
2. Vào **Authentication > Users** để quản lý users
3. Vào **Firestore > Data** để xem/quản lý data

## Troubleshooting

### Lỗi: "Missing or insufficient permissions"
- Kiểm tra Security Rules đã publish chưa
- Kiểm tra user đã đăng nhập chưa
- Kiểm tra rules có cho phép operation đó không

### Lỗi: "Index required"
- Click vào link error để tạo index
- Hoặc vào Firestore > Indexes để tạo thủ công

### Database chậm
- Kiểm tra location (nên dùng asia-southeast1)
- Tối ưu queries (limit, where conditions)
- Sử dụng cache (đã có trong code)

### Quota exceeded
- Nâng cấp lên Blaze Plan
- Hoặc tối ưu code để giảm reads/writes

## Best Practices

1. **Sử dụng Cache**: Code đã có cache system, sử dụng nó
2. **Batch Operations**: Sử dụng `batchWriter` cho nhiều writes
3. **Pagination**: Luôn sử dụng `limit()` và `startAfter()` cho lists
4. **Indexes**: Tạo indexes trước cho queries phức tạp
5. **Offline Support**: Firestore tự động cache, app sẽ hoạt động offline
6. **Security Rules**: Luôn validate data trong rules, không chỉ client-side
7. **Monitoring**: Theo dõi usage để tránh vượt quota

## Tài liệu tham khảo

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Firebase Pricing](https://firebase.google.com/pricing)

