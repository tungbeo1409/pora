# Commit Message Summary

## Tính năng mới đã thêm:

### 1. ✅ Tính năng Sửa Bài viết
- Thêm nút Edit trực tiếp trên PostCard
- Chức năng edit nội dung và hình ảnh
- Animation mượt khi chuyển đổi view/edit mode
- Validation và character counter
- Loading state khi save

### 2. ✅ PWA Support
- Manifest.json với metadata đầy đủ
- Service Worker cho offline support
- PWA Install prompt component
- PWA Icons (192x192, 512x512)
- Service Worker registration

### 3. ✅ Tối ưu Animation
- Chỉ giữ animation khi reload trang (initial load)
- Loại bỏ animation phức tạp khi hover/tap
- Chỉ dùng transition nhẹ nhàng (200ms)

### 4. ✅ Custom Server
- Script serve.js với Node.js built-in modules
- Auto-detect và sử dụng port khác nếu cần
- Xử lý basePath /pora đúng cách
- Copy PWA files script tự động

## Files mới:
- `components/PWAInstaller.tsx` - PWA install prompt
- `components/ServiceWorkerRegister.tsx` - Service worker registration
- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service worker
- `public/icon-*.png` - PWA icons
- `public/generate-icons.html` - Icon generator tool
- `scripts/copy-pwa-files.js` - Copy PWA files script
- `scripts/serve.js` - Custom server
- `README-PWA.md` - PWA documentation

## Files đã sửa:
- `app/layout.tsx` - Thêm PWA metadata và components
- `components/post/PostCard.tsx` - Thêm tính năng edit
- `components/layout/*` - Tối ưu animation
- `package.json` - Thêm scripts mới
- `README.md` - Cập nhật documentation

## Lệnh commit:

```bash
git add .
git commit -m "feat: Thêm PWA support, tính năng sửa bài viết và tối ưu animation

- Thêm PWA: manifest, service worker, install prompt
- Thêm tính năng sửa bài viết với UI/UX cải thiện
- Tối ưu animation: chỉ animation khi reload, transition nhẹ nhàng
- Custom server với auto port detection
- Cập nhật documentation"
```

