# Hướng dẫn setup Cloudinary

## Bước 1: Tạo tài khoản Cloudinary

1. Truy cập [cloudinary.com](https://cloudinary.com/)
2. Click **"Sign Up for Free"**
3. Điền form đăng ký (email, password...)
4. Xác nhận email
5. Đăng nhập vào dashboard

## Bước 2: Lấy thông tin cấu hình

1. Trong Cloudinary Dashboard, bạn sẽ thấy:
   - **Cloud Name**: Tên cloud của bạn (ví dụ: `dxyz123`)
   - **API Key**: Key để upload
   - **API Secret**: Secret key (giữ bí mật!)

2. Vào **Settings** > **Upload**
3. Scroll xuống **Upload presets**
4. Click **"Add upload preset"** hoặc chỉnh sửa preset có sẵn
5. Cấu hình preset:
   - **Preset name**: `pora-vnsocial` (hoặc tên bạn muốn)
   - **Signing Mode**: 
     - **"Unsigned"** - Đơn giản hơn, upload trực tiếp từ browser (khuyên dùng)
     - **"Signed"** - An toàn hơn, cần API secret key (dùng cho server-side)
   - **Asset folder**: `samples/ecommerce` (hoặc folder bạn muốn, để tổ chức files)
   - **Allowed file formats**: Select all hoặc specific formats
   - **Max file size**: 100MB (hoặc tùy bạn)
   - **Auto-optimization**: Enable
   - **Eager transformations**: (Optional) Thêm transformations để auto-generate thumbnails
6. Click **"Save"**

## Bước 3: Cấu hình trong project

Tạo file `.env.local` (hoặc update nếu đã có):

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=pora-vnsocial
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
```

**Lưu ý về Signing Mode**:
- Nếu preset là **"Unsigned"**: Chỉ cần `cloud_name` và `upload_preset`, code sẽ hoạt động ngay
- Nếu preset là **"Signed"**: Cần thêm API secret key và phải implement server-side upload (qua Next.js API route)

**Khuyên dùng "Unsigned"** để đơn giản cho client-side upload.

**Lưu ý**: 
- `NEXT_PUBLIC_` prefix là bắt buộc để Next.js expose ra client-side
- **KHÔNG** commit file `.env.local` lên git (đã có trong `.gitignore`)

## Bước 4: Test upload

Sau khi setup xong, bạn có thể test:

```typescript
import { storageService } from '@/lib/services/storageService'

// Upload image
const file = ... // File object từ input
const result = await storageService.uploadImage(file, {
  folder: 'posts',
  maxSizeMB: 10
})

console.log('Uploaded:', result.url)
```

## Folder Structure trong Cloudinary

Cấu trúc được khuyến nghị:

```
pora/
  ├── posts/          # Ảnh/video từ posts
  ├── avatars/        # Avatar users
  ├── covers/         # Cover images
  ├── messages/       # Files trong messages
  └── audio/          # Voice messages
```

## Pricing

**Free Tier**:
- ✅ 25GB storage
- ✅ 25GB bandwidth/tháng
- ✅ Unlimited transformations
- ✅ CDN included

**Paid** (khi vượt free tier):
- Storage: $0.04/GB
- Bandwidth: $0.04/GB

## Security Best Practices

1. **Upload Preset**: Dùng **Unsigned** cho client upload (đơn giản hơn)
2. **Signed Upload**: Dùng cho server-side upload (an toàn hơn, cần secret key)
3. **File size limits**: Set max file size trong preset
4. **Allowed formats**: Chỉ allow các format cần thiết
5. **Folder restrictions**: Sử dụng folder để organize và dễ quản lý

## Transformations (Tự động optimize)

Cloudinary tự động optimize:
- **Format**: Auto-choose best format (webp, avif...)
- **Quality**: Auto-compress
- **Dimensions**: Auto-resize nếu cần

Ví dụ URL với transformations:
```
https://res.cloudinary.com/cloud_name/image/upload/w_800,h_600,c_limit,q_auto,f_auto/posts/image.jpg
```

## Next Steps

1. Setup Cloudinary account (5 phút)
2. Cấu hình environment variables
3. Test upload từ code
4. Tích hợp vào forms (posts, messages, profile avatar...)

