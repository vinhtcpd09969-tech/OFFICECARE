# Current State

- **Ngày cập nhật:** 2026-05-15
- **Progress:** Module Login & Register hoàn thiện. Đã chuyển đổi sang luồng Xác thực Email (OTP) với Ethereal Mail. Dashboard Shell đã được xây dựng.
- **Infrastructure:** GitHub Repository: Connected (Branch: `main`).

## Stack đang chạy
- Backend: `http://localhost:5000` (Express + TypeScript + pg Raw SQL)
- Frontend: `http://localhost:3000` (Vite + React TSX + Tailwind)
- Database: Docker PostgreSQL (`physioflow_db` - port 5432)
- pgAdmin: `http://localhost:5050`

## Những gì đã hoàn thành

### Module Authentication:
- Backend đã có schema validation chặt chẽ (Zod) cho đăng nhập, đăng ký và xác thực OTP.
- Frontend đã cài đặt `react-hook-form`, `zod`, `zustand` để xử lý form và state.
- Route guard (`ProtectedRoute`) bảo vệ các trang yêu cầu đăng nhập.
- Bỏ trường số điện thoại, tích hợp chức năng gửi Email Xác thực OTP thông qua Nodemailer giả lập (`Ethereal`).
- Sửa thành công lỗi 400 Bad Request ở `/register` và các cảnh báo React Router v7.

### Dashboard Shell (Mới hoàn thành):
- `DashboardLayout.tsx`: Boxed Layout chuẩn UX Psychology, với Topbar tinh giản và Sidebar menu ẩn/hiện tùy chọn.
- `Dashboard.tsx`: Chứa các thành phần Dashboard theo bản thiết kế mẫu (Biểu đồ Mức độ đau, Tiến độ gói, Gợi ý AI có thẻ ✦ AI, Lịch hẹn sắp tới).
- Đồng bộ UI với `DESIGN.md` (Mint Teal & Deep Navy).

## Trạng thái file quan trọng
- `backend/src/controllers/auth.controller.ts` — có `login`, `register`, `refreshToken`, `getMe`, `verifyEmail`.
- `backend/src/routes/auth.routes.ts` — có đầy đủ API Auth.
- `backend/src/schemas/auth.schema.ts` — Schema cho OTP.
- `backend/src/utils/mailer.ts` — Gửi thư Ethereal.
- `frontend/src/layouts/DashboardLayout.tsx` — Giao diện khung app chính.
- `frontend/src/pages/Dashboard.tsx` — Giao diện Home của user.

### 🔴 Lỗi cần giải quyết
- Không có lỗi hiện hành.

### 🔜 Bước tiếp theo
- Xây dựng Module Quản lý Lịch hẹn (Dành cho Admin/Lễ tân).
- Phát triển API Lấy Lịch hẹn.
