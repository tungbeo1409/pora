# PWA Setup Guide

## Tạo Icons

1. Mở file `public/generate-icons.html` trong trình duyệt
2. Click "Generate Icons" hoặc icons sẽ tự động được tạo
3. Click vào mỗi icon để tải về
4. Đặt các file icon vào thư mục `public/`:
   - `icon-192x192.png`
   - `icon-512x512.png`

Hoặc bạn có thể tạo icons bằng công cụ online như:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator
- https://favicon.io/

## Kiểm tra PWA

### Chrome DevTools
1. Mở Chrome DevTools (F12)
2. Vào tab "Application"
3. Kiểm tra "Manifest" và "Service Workers"

### Lighthouse
1. Mở Chrome DevTools (F12)
2. Vào tab "Lighthouse"
3. Chọn "Progressive Web App"
4. Click "Generate report"

## Tính năng PWA

- ✅ **Manifest**: Cấu hình app metadata
- ✅ **Service Worker**: Offline support và caching
- ✅ **Install Prompt**: Prompt để cài đặt app
- ✅ **App Icons**: Icons cho PWA
- ✅ **Standalone Mode**: Chạy như app độc lập
- ✅ **Offline Support**: Có thể hoạt động offline

## Lưu ý

- Service Worker chỉ hoạt động trong production mode
- Để test PWA, cần build và serve static files:
  ```bash
  npm run build
  npm start
  # hoặc
  npm run serve
  ```
- Script `npm start` tự động sử dụng `serve` để serve static files từ thư mục `out/`
- Nếu muốn dùng port khác:
  ```bash
  npx serve@latest out -p 8080
  ```


