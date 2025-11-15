# Smart Upload Service - Hướng dẫn sử dụng

## Tổng quan

Smart Upload Service tự động quyết định cách upload file:
- **Ảnh (< 500KB)**: Base64 → Firestore/Realtime DB
- **Ảnh (> 500KB)**: Cloudinary → URL
- **Video**: Cloudinary → URL → Firebase
- **Audio**: Cloudinary → URL → Firebase
- **Auto cache**: localStorage (small) hoặc IndexedDB (large)

## Cài đặt Realtime Database

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project → **Realtime Database**
3. Click **"Create Database"**
4. Chọn location (gần VN nhất: `asia-southeast1`)
5. Chọn mode: **"Start in test mode"** (hoặc set rules sau)
6. Click **"Enable"**

### Security Rules (Realtime Database)

```json
{
  "rules": {
    "conversations": {
      "$conversationId": {
        "images": {
          ".read": "auth != null",
          ".write": "auth != null"
        },
        "videos": {
          ".read": "auth != null",
          ".write": "auth != null"
        },
        "audio": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    },
    "users": {
      "$userId": {
        "images": {
          ".read": "auth != null && (auth.uid == $userId || data.child('public').val() == true)",
          ".write": "auth != null && auth.uid == $userId"
        },
        "videos": {
          ".read": "auth != null && (auth.uid == $userId || data.child('public').val() == true)",
          ".write": "auth != null && auth.uid == $userId"
        }
      }
    }
  }
}
```

## Sử dụng

### 1. Upload ảnh (Base64 vào Firestore)

```typescript
import { smartUploadService } from '@/lib/services/smartUploadService'
import { useAuth } from '@/lib/firebase/hooks/useAuth'

const { user } = useAuth()

// Upload ảnh post
const handleImageUpload = async (file: File) => {
  try {
    const result = await smartUploadService.uploadImage(file, {
      userId: user!.uid,
      collection: 'post_images', // Firestore collection
    })

    console.log('Upload thành công:', result)
    // result.url = base64 data URL hoặc Cloudinary URL
    // result.cached = true nếu đã có trong cache
    
    // Lưu result.url vào post document
  } catch (error) {
    console.error('Upload failed:', error)
  }
}
```

### 2. Upload ảnh chat (Base64 vào Realtime DB)

```typescript
// Upload ảnh trong chat message (real-time sync)
const handleChatImageUpload = async (file: File, conversationId: string) => {
  try {
    const result = await smartUploadService.uploadImage(file, {
      userId: user!.uid,
      useRealtimeDB: true, // Dùng Realtime DB
      conversationId: conversationId,
    })

    // result.firebasePath = "conversations/{convId}/images/{imgId}"
    // result.url = base64 data URL
    
    // Lưu result.firebasePath vào message
  } catch (error) {
    console.error('Upload failed:', error)
  }
}
```

### 3. Upload video (Cloudinary)

```typescript
const handleVideoUpload = async (file: File) => {
  try {
    const result = await smartUploadService.uploadVideo(file, {
      userId: user!.uid,
      saveToFirebase: true, // Lưu URL vào Firebase
    })

    // result.url = Cloudinary URL
    // result.thumbnailUrl = Video thumbnail URL
    
    // Lưu result.url vào post/message
  } catch (error) {
    console.error('Upload failed:', error)
  }
}
```

### 4. Upload audio (Ghi âm)

```typescript
const handleAudioUpload = async (file: File, conversationId?: string) => {
  try {
    const result = await smartUploadService.uploadAudio(file, {
      userId: user!.uid,
      conversationId: conversationId,
      saveToFirebase: true,
    })

    // result.url = Cloudinary URL
    
    // Lưu vào message
  } catch (error) {
    console.error('Upload failed:', error)
  }
}
```

### 5. Get ảnh từ Firebase (với cache)

```typescript
// Get ảnh đã lưu (tự động check cache)
const getImage = async (imagePath: string) => {
  const url = await smartUploadService.getImage(
    'post_images/img_123', // Firestore path
    false // false = Firestore, true = Realtime DB
  )

  if (url) {
    // url = base64 data URL hoặc Cloudinary URL
    // Đã được cache tự động
  }
}
```

### 6. Get video từ Firebase

```typescript
const getVideo = async (videoPath: string) => {
  const data = await smartUploadService.getVideo(
    'videos/vid_123',
    false // false = Firestore, true = Realtime DB
  )

  if (data) {
    console.log('Video URL:', data.url)
    console.log('Thumbnail:', data.thumbnailUrl)
  }
}
```

## Cache Management

### Check cache size

```typescript
import { localCache } from '@/lib/utils/localCache'

const size = await localCache.getSize()
console.log('Cache size:', size)
// { localStorage: 12345, indexedDB: 0 }
```

### Clear cache

```typescript
// Clear all cache
await localCache.clear()

// Clear specific key
await localCache.delete('image_user123_photo.jpg_1024')
```

### Check if cached

```typescript
const isCached = await localCache.has('image_user123_photo.jpg_1024')
```

## Best Practices

1. **Ảnh nhỏ (< 500KB)**: Dùng base64 → Firestore
   - Nhanh, không cần Cloudinary
   - Phù hợp cho avatar, thumbnails

2. **Ảnh lớn (> 500KB)**: Dùng Cloudinary
   - Tự động optimize
   - CDN nhanh

3. **Video**: Luôn dùng Cloudinary
   - Base64 quá lớn cho video
   - Cloudinary có video processing

4. **Chat messages**: Dùng Realtime DB
   - Real-time sync
   - Phù hợp cho chat

5. **Posts**: Dùng Firestore
   - Persistence tốt
   - Query linh hoạt

## Cache TTL

- **Ảnh**: 7 ngày
- **Video/Audio**: 30 ngày

Có thể customize trong `smartUploadService.ts`:

```typescript
private readonly IMAGE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days
private readonly VIDEO_CACHE_TTL = 30 * 24 * 60 * 60 * 1000 // 30 days
```

## Giới hạn

- **Base64 max size**: 500KB (có thể điều chỉnh)
- **Firestore document**: 1MB limit
- **localStorage**: ~1MB per domain
- **IndexedDB**: ~50% disk space (browser dependent)

## Troubleshooting

### Error: "Realtime Database chưa được cấu hình"
→ Enable Realtime Database trong Firebase Console

### Error: "Lưu ảnh vào Firebase thất bại"
→ Check Firebase rules cho Realtime DB và Firestore

### Cache không hoạt động
→ Check browser support cho IndexedDB
→ Check localStorage quota

### Ảnh upload nhưng không hiển thị
→ Check URL format (base64 phải bắt đầu với `data:image/...`)
→ Check cache có expired không

