# Firebase Quick Start - Checklist

## ✅ Các bước cần làm NGAY

### 1. Firestore Database
- [ ] Vào [Firebase Console](https://console.firebase.google.com/)
- [ ] Chọn project `pora-d6c25`
- [ ] Vào **Firestore Database** > **Create database**
- [ ] Chọn **Production mode**
- [ ] Chọn location: **asia-southeast1** (Singapore)
- [ ] Click **Enable**

### 2. Security Rules
- [ ] Vào tab **Rules** trong Firestore
- [ ] Copy toàn bộ rules từ `docs/FIREBASE_SETUP.md` (phần 3.2)
- [ ] Paste và click **Publish**

### 3. Authentication
- [ ] Vào **Authentication** > **Get started**
- [ ] Tab **Sign-in method**
- [ ] Enable **Email/Password**
- [ ] Click **Save**

### 4. Test
- [ ] Chạy `npm run dev`
- [ ] Mở browser console
- [ ] Kiểm tra không có lỗi Firebase
- [ ] Thử đăng ký user mới

## 📋 Collections cần tạo

Firestore sẽ tự động tạo collections khi bạn viết data. Không cần tạo thủ công.

Các collections sẽ được tạo tự động:
- `users`
- `posts`
- `messages`
- `conversations`
- `notifications`
- `friends`

## 🔥 Indexes (tạo sau khi có data)

Khi chạy queries, Firebase sẽ tự động yêu cầu tạo indexes. Click vào link error để tạo.

Hoặc tạo thủ công trong tab **Indexes**:

1. **Posts** (để hiển thị feed)
   - Collection: `posts`
   - Fields: `createdAt` (Descending)
   - Query scope: Collection

2. **Comments** (để load comments)
   - Collection: `posts/{postId}/comments`
   - Fields: `createdAt` (Ascending)
   - Query scope: Collection

3. **Messages** (để load tin nhắn)
   - Collection: `messages`
   - Fields: `conversationId` (Ascending), `createdAt` (Descending)
   - Query scope: Collection

4. **Notifications** (để load thông báo)
   - Collection: `notifications`
   - Fields: `userId` (Ascending), `createdAt` (Descending)
   - Query scope: Collection

## ⚠️ Lưu ý quan trọng

1. **Location**: Chọn `asia-southeast1` (Singapore) để latency thấp nhất
2. **Security Rules**: PHẢI setup rules trước khi deploy production
3. **Indexes**: Tạo indexes trước để tránh delay khi query
4. **Quota**: Theo dõi usage trong Free tier (50K reads/day)

## 🚀 Sau khi setup xong

1. Test đăng ký user → Kiểm tra trong Authentication > Users
2. Test tạo post → Kiểm tra trong Firestore > Data
3. Kiểm tra Security Rules hoạt động đúng

---

**Xem hướng dẫn chi tiết**: `docs/FIREBASE_SETUP.md`

