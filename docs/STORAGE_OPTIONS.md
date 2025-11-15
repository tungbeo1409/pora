# Tùy chọn lưu trữ File (không dùng Firebase Storage)

## Tổng quan

Firestore chỉ lưu **metadata** (URL, tên file, kích thước...), **KHÔNG** lưu file thực tế. Vì vậy bạn cần một dịch vụ lưu trữ khác.

## Các lựa chọn phổ biến

### 1. **Cloudinary** (Khuyên dùng) ⭐
- ✅ **Free tier**: 25GB storage, 25GB bandwidth/tháng
- ✅ **Tự động optimize**: Resize, compress, format conversion
- ✅ **CDN**: Tốc độ nhanh toàn cầu
- ✅ **Video processing**: Encoding, thumbnail generation
- ✅ **Dễ tích hợp**: Simple API

**Pricing**: 
- Free: 25GB storage, 25GB bandwidth
- Paid: $0.04/GB storage, $0.04/GB bandwidth

### 2. **ImgBB** (Miễn phí)
- ✅ **Hoàn toàn miễn phí** (có giới hạn)
- ✅ **Không cần đăng ký** cho public images
- ✅ **API đơn giản**
- ❌ **Hạn chế**: 32MB/file, không có video processing

### 3. **AWS S3** (Professional)
- ✅ **Rất mạnh**: Storage, CDN (CloudFront)
- ✅ **Scalable**: Phù hợp cho production lớn
- ⚠️ **Phức tạp hơn**: Cần setup AWS account, IAM, CORS...
- 💰 **Pricing**: $0.023/GB storage, $0.085/GB transfer

### 4. **Supabase Storage** (Open source)
- ✅ **Open source**: Self-hosted được
- ✅ **Similar to Firebase**: Dễ migrate
- ✅ **Free tier**: 1GB storage
- ⚠️ **Cần host riêng** nếu muốn dùng nhiều

### 5. **Base64 + Firestore** (Không khuyên dùng)
- ❌ **Giới hạn 1MB** mỗi document
- ❌ **Tốn tiền**: Mỗi read/write đều tính phí
- ❌ **Chậm**: Tăng kích thước document
- ✅ **Không cần service bên ngoài**

## Khuyến nghị: Cloudinary

Vì:
1. **Free tier rộng rãi** (25GB)
2. **Tự động optimize** ảnh/video
3. **CDN built-in** → Load nhanh
4. **API đơn giản**
5. **Xử lý video** tốt (thumbnails, encoding)

## Cấu trúc dữ liệu trong Firestore

Với bất kỳ storage nào, Firestore sẽ lưu:

```typescript
{
  type: 'image' | 'video' | 'file' | 'audio',
  url: 'https://...', // URL từ storage service
  thumbnail?: 'https://...', // Thumbnail cho video
  name: 'filename.jpg',
  size: 1024000, // bytes
  mimeType: 'image/jpeg',
  uploadedAt: timestamp,
  uploadedBy: userId
}
```

## Next Steps

1. Chọn storage service (Cloudinary được khuyên dùng)
2. Setup account và lấy API keys
3. Tạo upload service trong code
4. Tích hợp vào forms (posts, messages, profile...)

