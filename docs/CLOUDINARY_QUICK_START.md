# Hướng dẫn Setup Cloudinary - Từng bước

## Bước 1: Lấy Cloud Name từ Cloudinary

1. Đăng nhập vào [Cloudinary Dashboard](https://cloudinary.com/console)
2. Ở góc **trên bên phải**, bạn sẽ thấy:
   ```
   Welcome to Cloudinary
   dxxxxxxxxx  ← Đây là Cloud Name của bạn
   ```
   (Cloud Name thường có dạng: `d1234567` hoặc `pora-d6c25`)

3. **Copy** Cloud Name này (ví dụ: `d1234567`)

---

## Bước 2: Tạo file `.env.local`

1. Mở project trong VS Code (hoặc editor khác)
2. Ở **root folder** của project (cùng cấp với `package.json`), tạo file mới tên: **`.env.local`**
   - Nếu không thấy file này, có thể nó bị ẩn. Trong VS Code: View → Show Hidden Files

3. Mở file `.env.local` và thêm nội dung:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=d1234567
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=pora-vnsocial
```

**Lưu ý**: 
- Thay `d1234567` bằng Cloud Name thực tế của bạn
- `pora-vnsocial` là preset name bạn đã tạo (giữ nguyên nếu đúng)
- Không có khoảng trắng trước/sau dấu `=`
- Không có dấu ngoặc kép `"` hoặc `'`

**Ví dụ đúng**:
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dxyz123
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=pora-vnsocial
```

**Ví dụ SAI**:
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "dxyz123"  ← Có khoảng trắng và dấu ngoặc
```

4. **Save** file (Ctrl+S hoặc Cmd+S)

---

## Bước 3: Restart Development Server

1. Nếu đang chạy `npm run dev`, nhấn **Ctrl+C** để dừng
2. Chạy lại:
   ```bash
   npm run dev
   ```
3. Đợi server khởi động xong (sẽ thấy "Ready" trong terminal)

---

## Bước 4: Test Upload

### Option A: Dùng Component Example

1. Tạo file test: `app/test-upload/page.tsx`

```typescript
'use client'

import { FileUploadExample } from '@/components/examples/FileUploadExample'

export default function TestUploadPage() {
  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-apple-gray-50 to-apple-gray-100 dark:from-black dark:to-apple-gray-900">
      <div className="max-w-2xl mx-auto">
        <FileUploadExample />
      </div>
    </div>
  )
}
```

2. Truy cập: `http://localhost:3000/test-upload`
3. Chọn một ảnh để upload
4. Xem kết quả!

### Option B: Test trực tiếp trong Console

1. Mở browser console (F12)
2. Paste code này:

```javascript
// Test upload
const input = document.createElement('input')
input.type = 'file'
input.accept = 'image/*'
input.onchange = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'pora-vnsocial')
  formData.append('cloud_name', 'YOUR_CLOUD_NAME') // Thay bằng cloud name của bạn
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/upload`,
      { method: 'POST', body: formData }
    )
    const result = await response.json()
    console.log('Upload thành công!', result.secure_url)
  } catch (error) {
    console.error('Lỗi:', error)
  }
}
input.click()
```

---

## Bước 5: Kiểm tra lỗi

### Nếu upload không hoạt động, kiểm tra:

1. **File `.env.local` có đúng tên không?**
   - Phải là `.env.local` (có dấu chấm ở đầu)
   - Không phải `env.local` hoặc `.env.local.txt`

2. **Environment variables đã được load chưa?**
   - Restart server sau khi tạo/sửa `.env.local`
   - Kiểm tra trong code: `console.log(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)`

3. **Cloud Name và Preset đúng chưa?**
   - Cloud Name: Kiểm tra lại trong Cloudinary Dashboard
   - Preset name: Phải đúng chính xác `pora-vnsocial` (case-sensitive)

4. **Preset đã đổi sang "Unsigned" chưa?**
   - Vào Cloudinary Dashboard → Settings → Upload
   - Tìm preset `pora-vnsocial`
   - Signing Mode phải là **"Unsigned"**

5. **Check browser console:**
   - Mở F12 → Console tab
   - Xem có error gì không
   - Common errors:
     - `Cloudinary chưa được cấu hình` → Thiếu env variables
     - `Invalid preset` → Preset name sai
     - `401 Unauthorized` → Preset vẫn đang "Signed"

---

## Bước 6: Sử dụng trong code

Sau khi test thành công, bạn có thể dùng trong các component:

```typescript
import { storageService } from '@/lib/services/storageService'

// Trong component:
const handleFileUpload = async (file: File) => {
  try {
    const result = await storageService.uploadImage(file, {
      folder: 'posts',
      maxSizeMB: 10
    })
    console.log('URL:', result.url)
    // Lưu result.url vào Firestore
  } catch (error) {
    console.error('Upload failed:', error)
  }
}
```

---

## Troubleshooting

### Error: "Cloudinary chưa được cấu hình"
→ File `.env.local` chưa có hoặc env variables chưa được load. Restart server.

### Error: "Invalid upload preset"
→ Preset name sai. Kiểm tra lại trong Cloudinary Dashboard.

### Error: "401 Unauthorized"
→ Preset vẫn đang "Signed". Đổi sang "Unsigned" trong Cloudinary Dashboard.

### Upload thành công nhưng không thấy ảnh
→ Check URL trong console. Mở URL trong browser để xem ảnh.

---

## Next Steps

Sau khi upload thành công, bạn có thể:
1. Tích hợp vào form tạo post
2. Tích hợp vào messages (gửi ảnh/video)
3. Tích hợp vào profile (đổi avatar/cover)
4. Lưu URL vào Firestore để hiển thị lại sau

