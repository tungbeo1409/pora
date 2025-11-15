# VnSocial - Mạng xã hội phong cách Apple

Một mạng xã hội với thiết kế tối giản, sang trọng theo phong cách Apple, được xây dựng bằng Next.js, Tailwind CSS và Framer Motion.

## ✨ Tính năng

- 🎨 **Thiết kế phong cách Apple**: Tối giản, sạch sẽ, sang trọng
- 🌓 **Dark Mode**: Chế độ tối với màu sắc tinh tế
- 📱 **Responsive**: Tối ưu cho mọi thiết bị
- 🎭 **Animations mượt mà**: Sử dụng Framer Motion
- 🧩 **Component-based**: Cấu trúc component rõ ràng, dễ bảo trì

## 🚀 Bắt đầu

### Yêu cầu

- Node.js 18+ 
- npm hoặc yarn

### Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build cho production (tạo static files trong thư mục out/)
npm run build

# Chạy production server (static files)
npm start
# hoặc
npm run serve
```

Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt.

## 📁 Cấu trúc dự án

```
VnSocial/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Trang chủ
│   ├── login/             # Trang đăng nhập
│   ├── signup/            # Trang đăng ký
│   ├── profile/           # Trang hồ sơ
│   ├── messages/          # Trang tin nhắn
│   ├── notifications/     # Trang thông báo
│   └── settings/          # Trang cài đặt
├── components/
│   ├── ui/                # Base components
│   │   ├── AppleCard.tsx
│   │   ├── AppleButton.tsx
│   │   ├── AppleInput.tsx
│   │   └── Avatar.tsx
│   ├── layout/            # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── RightSidebar.tsx
│   │   └── GlobalLayout.tsx
│   ├── post/              # Post components
│   │   ├── PostCard.tsx
│   │   └── Comment.tsx
│   └── story/             # Story components
│       └── Story.tsx
└── ...
```

## 🎨 Thiết kế

### Màu sắc

- **Chủ đạo**: Trắng, đen, xám
- **Opacity nhẹ**: Sử dụng backdrop blur
- **Shadow tinh tế**: Shadow rất nhẹ, không quá đậm

### Typography

- **Font**: San Francisco / Inter
- **Size**: Rộng rãi, dễ đọc
- **Weight**: Medium, Semibold, Bold

### Border Radius

- **Nhỏ**: 12px
- **Lớn**: 20px

### Animations

- **Spring animations**: Mượt mà, tự nhiên
- **Hover effects**: Tinh tế, không quá đậm
- **Transitions**: 200-300ms

## 🛠️ Công nghệ

- **Next.js 14**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS
- **Framer Motion**: Animations
- **Lucide React**: Icons

## 📝 Ghi chú

- Dự án sử dụng dummy data để demo UI
- Tất cả components đã được tối ưu cho mobile-first
- Dark mode được lưu trong localStorage
- Tất cả animations sử dụng Framer Motion với spring physics

## 📄 License

MIT

