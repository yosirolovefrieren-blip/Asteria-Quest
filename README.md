# Asteria Quest Board

Web bảng nhiệm vụ Fantasy. Node.js (Express) + Upstash Redis + Render.

## 1. Tạo database Upstash (miễn phí)
1. Đăng ký tại upstash.com, vào **Redis** → **Create Database**.
2. Chọn vùng gần bạn (ví dụ Singapore), gói **Free**.
3. Trong trang database, mục **REST API**, copy 2 giá trị:
   `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN`.

## 2. Đưa code lên GitHub
1. Tạo repository mới (để Private hoặc Public đều được).
2. Upload toàn bộ nội dung thư mục này (`server.js`, `package.json`, `seed.json`, `public/`, `.gitignore`).
   Không upload `node_modules` và file `.env`.

## 3. Deploy lên Render (miễn phí)
1. Vào render.com → **New** → **Web Service** → chọn repository GitHub vừa tạo.
2. Điền:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
3. Mục **Environment Variables**, thêm 3 biến:
   - `UPSTASH_REDIS_REST_URL` = giá trị ở bước 1
   - `UPSTASH_REDIS_REST_TOKEN` = giá trị ở bước 1
   - `ADMIN_PASSWORD` = mật khẩu Admin (ví dụ `Firefly`)
4. Bấm **Create Web Service**. Khi xong, Render cấp link dạng `https://ten-ban-dat.onrender.com`.

## Lưu ý
- Gói Free của Render sẽ "ngủ" sau 15 phút không có truy cập. Lần mở đầu tiên sau đó mất khoảng 30 đến 60 giây.
- Lần đầu mở web, 11 nhiệm vụ mẫu trong `seed.json` tự được nạp vào Upstash. Sau đó dữ liệu do Admin quản lý.
- Mật khẩu Admin được kiểm tra ở server, không nằm trong mã trang. Muốn đổi mật khẩu, sửa biến `ADMIN_PASSWORD` trên Render.
- Chạy thử trên máy: cài Node 18+, chạy `npm install`, đặt 3 biến môi trường rồi `npm start`, mở http://localhost:3000.
