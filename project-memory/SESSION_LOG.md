# Session Log

## Session 1 — 2026-05-14 (Khởi tạo hạ tầng)
- Khởi tạo project memory system: `CURRENT_STATE.md`, `TASKS.md`, `SESSION_LOG.md`, `NEXT_SESSION_PROMPT.md`.
- Cập nhật `PHYSIOFLOW_CONTEXT.md` để bổ sung Docker vào Tech Stack.
- Tạo cấu trúc thư mục: `/backend`, `/frontend`, `/docker`.
- Viết `docker-compose.yml` và `docker/init.sql` (schema V4 đầy đủ).
- Scaffold backend (Express + pg) và frontend (Vite + React + Tailwind).
- User cài đặt Node.js v24. Chạy `npm install` thành công cho cả 2.
- Chạy `docker compose up -d` → PostgreSQL + pgAdmin hoạt động.
- Triển khai Backend Auth Module: `login`, `refreshToken`, `getMe` với JWT + bcrypt.
- Tạo bảng `refresh_tokens`, seed admin user.

## Session 2 — 2026-05-14 (TypeScript Migration & GitHub Setup)
- Migrate toàn bộ backend từ JavaScript → TypeScript (strict mode). 0 lỗi tsc.
- Cập nhật `PHYSIOFLOW_CONTEXT.md` và `PLAN-physio-website.md` để phản ánh TypeScript.
- Kết nối GitHub remote (`vinhtcpd09969-tech/PhysioFlow`).
- Cấu hình `.gitignore`, lần push đầu tiên thành công.
- Thiết lập Agent Git Rules: Auto-commit Conventional Commits, hỏi push cuối session.
- Cập nhật `CURRENT_STATE.md` và `NEXT_SESSION_PROMPT.md`.

## Session 3 — 2026-05-15 (Frontend TSX + Login UI + Register API)
- Migrate Frontend từ `.jsx` → `.tsx` (TypeScript). Tạo `tsconfig.json`, `tsconfig.node.json`.
- Tích hợp Design System từ `DESIGN.md` (Mint Teal, Deep Navy, font Manrope/Inter) vào `tailwind.config.js` và `index.css`.
- Tạo `authStore.ts` (Zustand với persist middleware).
- Tạo `api/axios.ts` (interceptors tự động gắn Bearer Token).
- Xây dựng `Login.tsx` hoàn chỉnh:
  - Cột trái: Form Minimalist với react-hook-form + zod validation, UX loading/error.
  - Cột phải: Background image thật, overlay Glassmorphism mờ, áp dụng Rule of Thirds (Logo top-left, Testimonial card bottom-third).
- Cập nhật `App.tsx` với React Router cơ bản.
- Backend: Bổ sung `registerSchema` (Zod), viết hàm `register` trong controller, mở route `POST /api/auth/register`.
- **Lưu ý:** Sếp xóa `registerSchema` trong `auth.schema.ts` vào cuối session (Register UI chưa làm). Plan Register UI + Dashboard Shell đã được duyệt, sẽ thực thi phiên sau.
- Đọc `DESIGN.md` tại `d:\DATN\WF\DESIGN.md` để lấy thông tin màu sắc và typography.
- Push commit `f38c85d` lên GitHub thành công.

## Session 4 — 2026-05-15 (Email OTP Verification & Dashboard Shell)
- **Database:** Thêm bảng `otp_codes` và trường `da_xac_thuc_email` (boolean) vào bảng `nguoi_dung` để thay thế hoàn toàn hình thức xác thực bằng số điện thoại.
- **Backend (Auth):**
  - Xóa toàn bộ logic xử lý `so_dien_thoai`.
  - Hàm `register` giờ đây tạo mã OTP và gửi qua mail (sử dụng thư viện `nodemailer` giả lập bằng Ethereal) thay vì trả JWT.
  - Viết hàm `verifyEmail` nhận `email` và `otp` từ người dùng, update DB, cấp phát JWT Tokens.
  - Fix lỗi 400 Bad Request do schema `confirmPassword` dư thừa ở Backend.
- **Frontend (Auth):**
  - Cập nhật trang `Register.tsx`: bỏ trường SĐT, tự động redirect sang trang Xác thực sau khi đăng ký.
  - Tạo trang `VerifyEmail.tsx`: Giao diện 6 ô nhập mã OTP có auto focus chuẩn UX, kết nối với API `/verify-email`.
  - Cập nhật `Login.tsx`: chỉ cho phép đăng nhập qua Email.
- **Frontend (Dashboard Shell):**
  - Xây dựng `DashboardLayout.tsx` với Boxed Layout (`max-w-7xl`), Sidebar và Topbar sử dụng `lucide-react`. Lấy tên/avatar từ Zustand Auth Store.
  - Xây dựng trang Home `Dashboard.tsx` hiển thị lưới 2 cột bắt mắt: Mức độ đau (Mockup Bar Chart), Tiến độ gói điều trị, Lịch hẹn sắp tới và Gợi ý AI (với badge ✦ AI).
  - Khắc phục các cảnh báo liên quan đến React Router v7 Future Flag.
- Commit toàn bộ code mới nhất (Hash: `b4ad5a5`) và push lên GitHub.

## Session 5 — 2026-05-15 (Domain Analysis, RBAC & Storefront)
- **Domain Analysis:** Khảo sát nghiệp vụ sâu sắc cho đối tượng dân văn phòng, tạo file `MODULE_ARCHITECTURE.md` quy định ma trận Actor-Module và quy trình SOAP.
- **RBAC Setup:** 
  - Phân quyền truy cập route và hiển thị sidebar cho 4 vai trò (Admin, Lễ tân, KTV, Khách hàng).
  - Tự động xác thực email cho `admin@physioflow.com` và `letan@physioflow.com` để thuận tiện kiểm thử.
- **UI/UX Fixes:** Sửa lỗi layout overlapping giữa Logo và Form tại trang Login khi hiện thông báo lỗi validation.
- **Storefront & Design:**
  - Chốt luồng UX: Trang chủ (Storefront) là cửa hàng mặc định khi vào `/`, Dashboard là cổng thông tin cá nhân.
  - Cập nhật `tailwind.config.js` sang tông màu **Xanh dương y tế** (#2563EB) sạch sẽ, tin cậy.
  - Tạo `LandingLayout.tsx` (Header/Footer chuẩn y khoa) và trang `Home.tsx` với đầy đủ các section marketing (Hero, Dịch vụ, Bảng giá).
  - Refactor `App.tsx` để hỗ trợ đa layout và routing phân tầng.
- **Lưu ý:** Thống nhất giữ Trang chủ làm hub chính ngay cả khi đã đăng nhập (hiện Avatar thay vì nút Login), Dashboard chỉ dùng để quản lý hồ sơ/lịch hẹn hiện có.
- Push commit `b4ad5a5` (chứa các thay đổi về RBAC và Storefront).
