# Cloudinary Signing Mode: Signed vs Unsigned

## So sánh

### Unsigned (Khuyên dùng cho Client-side)

**Ưu điểm:**
- ✅ Đơn giản: Upload trực tiếp từ browser
- ✅ Không cần API secret key
- ✅ Code ngắn gọn, dễ implement
- ✅ Phù hợp cho hầu hết use cases

**Nhược điểm:**
- ⚠️ Ít kiểm soát hơn (file size, format được set trong preset)
- ⚠️ Bất kỳ ai có preset name đều có thể upload

**Cách setup:**
1. Vào Cloudinary Dashboard > Settings > Upload
2. Tìm preset `pora-vnsocial`
3. Đổi **Signing Mode** từ "Signed" → **"Unsigned"**
4. Save
5. Code sẽ hoạt động ngay, không cần thêm config

### Signed (An toàn hơn, cần Server-side)

**Ưu điểm:**
- ✅ An toàn hơn: Cần API secret key
- ✅ Kiểm soát tốt hơn: Validate file size, format ở server
- ✅ Có thể add custom parameters ở server

**Nhược điểm:**
- ❌ Cần implement Next.js API route
- ❌ Phức tạp hơn: Phải handle upload từ server
- ❌ Cần API secret key (không expose ra client)

**Cách setup nếu dùng Signed:**
1. Giữ **Signing Mode** là "Signed"
2. Tạo Next.js API route: `app/api/upload/route.ts`
3. Dùng API secret key ở server-side
4. Client gọi API route thay vì upload trực tiếp

## Khuyến nghị

**Cho project này**: Dùng **"Unsigned"** vì:
1. Đơn giản, dễ implement
2. Upload trực tiếp từ client → nhanh hơn
3. Cloudinary preset đã có các giới hạn (file size, format)
4. Đủ an toàn cho hầu hết use cases

**Nếu cần Signed** (ví dụ: upload file nhạy cảm, cần validate phức tạp):
- Tạo API route trong `app/api/upload/route.ts`
- Dùng API secret key ở server
- Client gửi file → API route → Cloudinary

## Cách đổi Preset từ Signed → Unsigned

1. Vào Cloudinary Dashboard
2. **Settings** > **Upload**
3. Tìm preset **"pora-vnsocial"**
4. Click để edit
5. **Signing mode** → Chọn **"Unsigned"**
6. **Save**
7. Done! Code sẽ hoạt động ngay

