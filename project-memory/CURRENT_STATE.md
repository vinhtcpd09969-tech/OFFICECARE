# Current State

- **Ngày cập nhật:** 2026-05-15
- **Progress:** Hoàn thành Phân tích nghiệp vụ sâu (Domain Analysis), Kiến trúc Module/Actor. Xây dựng xong Trang chủ (Storefront) chuẩn y tế và tái cấu trúc hệ thống Routing phân tách Storefront/Portal. Đã đổi tông màu sang Blue-Medical.
- **Infrastructure:** GitHub Repository: Connected (Branch: `main`, Latest commit: `b4ad5a5`).

## Stack đang chạy
- Backend: `http://localhost:5000` (Express + TypeScript + pg Raw SQL)
- Frontend: `http://localhost:3000` (Vite + React TSX + Tailwind)
- Database: Docker PostgreSQL (`physioflow_db` - port 5432)
- pgAdmin: `http://localhost:5050`

## Những gì đã hoàn thành

### Module Authentication & RBAC:
- Thiết lập Role-Based Access Control (RBAC) cho route và sidebar (Khách hàng, Lễ tân, Kỹ thuật viên, Quản trị viên).
- Fix lỗi UI Logo dính vào Form khi có thông báo lỗi (Login/Register).
- Tự động xác thực email cho tài khoản Admin/Lễ tân để demo.

### Domain Analysis:
- Tài liệu `MODULE_ARCHITECTURE.md` tại gốc dự án phân tích chi tiết quy trình SOAP, ma trận Actor-Module và các quy tắc bảo mật dữ liệu y khoa.

### Storefront & Routing (Mới hoàn thành):
- `LandingLayout.tsx`: Header/Footer phong cách Y tế, tích hợp xử lý trạng thái Auth động (hiện Avatar khi đã đăng nhập).
- `Home.tsx` (Landing Page): Hero Section, Dịch vụ cốt lõi, Bảng giá gói tập (Mock data).
- Tái cấu trúc `App.tsx`: Phân tách rạch ròi Layout của Landing Page và Dashboard Portal.
- Cập nhật `tailwind.config.js` sang màu **Blue 600** (#2563EB) tạo sự tin cậy y khoa.

## Trạng thái file quan trọng
- `MODULE_ARCHITECTURE.md` — Kiến trúc nghiệp vụ cốt lõi.
- `frontend/src/layouts/LandingLayout.tsx` — Giao diện cửa hàng.
- `frontend/src/pages/Home.tsx` — Trang chủ marketing.
- `frontend/src/App.tsx` — Cấu hình routing mới.

### 🔴 Lỗi cần giải quyết
- Không có lỗi hiện hành.

### 🔜 Bước tiếp theo
- Xây dựng Dashboard riêng cho Lễ tân và Admin.
- Phát triển Module Đặt lịch (Booking Flow) cho khách hàng (form đặt lịch và điều hướng từ Trang chủ).
- Triển khai API cho danh mục Dịch vụ và Gói tập để thay thế Mock data.
