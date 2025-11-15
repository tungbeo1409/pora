# Vị trí tạo file .env.local

## Đường dẫn chính xác:

File `.env.local` phải được tạo ở **ROOT FOLDER** của project, cùng cấp với file `package.json`.

```
C:\Users\tungb\Downloads\PORA\
├── app/                    ← Thư mục
├── components/             ← Thư mục
├── lib/                    ← Thư mục
├── public/                 ← Thư mục
├── docs/                   ← Thư mục
├── package.json            ← File (cùng cấp với .env.local)
├── next.config.js          ← File (cùng cấp với .env.local)
├── tsconfig.json           ← File (cùng cấp với .env.local)
└── .env.local              ← TẠO FILE Ở ĐÂY ✨
```

## Cách tạo trong VS Code:

### Cách 1: Tạo file mới (Dễ nhất)

1. Mở VS Code
2. Trong **Explorer** (bên trái), click chuột phải vào folder **PORA** (root folder)
   - Không phải click vào `app`, `components`, hay folder con nào khác
   - Phải click vào folder **PORA** (folder gốc)
3. Chọn **"New File"**
4. Gõ tên: `.env.local` (nhớ có dấu chấm ở đầu)
5. Nhấn Enter
6. Paste nội dung:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=pora-vnsocial
```

7. Save (Ctrl+S)

### Cách 2: Dùng Terminal trong VS Code

1. Mở Terminal trong VS Code (Ctrl+`)
2. Đảm bảo bạn đang ở folder gốc (sẽ thấy: `C:\Users\tungb\Downloads\PORA>`)
3. Chạy lệnh:

```bash
echo. > .env.local
```

4. Mở file `.env.local` (sẽ xuất hiện trong Explorer)
5. Paste nội dung:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=pora-vnsocial
```

6. Save

### Cách 3: Tạo bằng Notepad (Windows)

1. Mở Notepad
2. Paste nội dung:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=pora-vnsocial
```

3. File → Save As
4. Chọn folder: `C:\Users\tungb\Downloads\PORA`
5. Tên file: `.env.local` (quan trọng: có dấu chấm ở đầu, không có extension .txt)
6. "Save as type": Chọn **"All Files (*.*)"** (không chọn "Text Documents")
7. Save

## Kiểm tra đã tạo đúng chưa:

### Trong VS Code:
- Mở Explorer (bên trái)
- File `.env.local` phải nằm ở **cùng cấp** với `package.json`
- Không nằm trong thư mục `app`, `components`, hay bất kỳ folder nào khác

### Trong File Explorer (Windows):
1. Mở File Explorer
2. Đi đến: `C:\Users\tungb\Downloads\PORA`
3. Bật "Show hidden files":
   - View → Show → Hidden items (tick vào)
4. Bạn sẽ thấy file `.env.local` (có thể mờ hơn các file khác vì là hidden file)

## Lưu ý:

- ✅ File phải có tên **chính xác**: `.env.local` (có dấu chấm ở đầu)
- ❌ KHÔNG phải: `env.local` hoặc `.env.local.txt`
- ✅ Phải ở cùng cấp với `package.json`
- ❌ KHÔNG tạo trong thư mục `app` hay bất kỳ folder con nào

## Nếu không thấy file sau khi tạo:

File `.env.local` có thể bị ẩn. Trong VS Code:
1. Click vào icon **...** ở Explorer
2. Chọn **"Show Hidden Files"** hoặc **"Toggle Excluded Files"**

Hoặc trong File Explorer (Windows):
- View → Show → Hidden items

