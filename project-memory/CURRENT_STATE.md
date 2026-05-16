# Current State

- **Ngày cập nhật:** 2026-05-16
- **Progress:** Hoàn thành toàn bộ Module Admin (Phase 1-6). Hệ thống đã chuyển đổi sang kiến trúc 3 Lớp (Backend) và Feature-Based (Frontend).
- **Infrastructure:** Backend & Frontend running stable. 

## Stack đang chạy
- Backend: `http://localhost:5000` (Express + TypeScript + PostgreSQL, mô hình 3 Lớp)
- Frontend: `http://localhost:5173` (Vite + React TSX + Tailwind, mô hình Feature-Based)
- Database: Docker PostgreSQL (`physioflow_db` - port 5432)

## Những gì đã hoàn thành

### Module Admin (Full Phase 1-6):
- **Admin Dashboard & Layout:** Sidebar chuyên nghiệp, Recharts hiển thị doanh thu.
- **Quản lý Tài nguyên:** CRUD Dịch vụ, Phòng, Gói điều trị, Thiết bị y tế (theo dõi bảo trì).
- **Quản lý Nhân sự & Khách hàng:** Quản lý toàn bộ tài khoản nhân viên (Khóa/Mở khóa) và danh sách Khách hàng.
- **Tài chính & Marketing:** Quản lý Voucher, Hóa đơn và tính năng Hoàn tiền.
- **Hồ sơ y tế:** Giao diện tra cứu Bệnh án.

### Cấu trúc Backend (3-Tier Refactored):
- Phân tách rạch ròi Controllers - Services - Repositories.
- `src/repositories/` chứa toàn bộ câu lệnh SQL tĩnh.
- `src/services/` chứa nghiệp vụ cốt lõi.
- `src/controllers/` siêu mỏng, chỉ lo Validate & Response.

### Cấu trúc Frontend (Feature-Based Refactored):
- Dịch chuyển từ mô hình phẳng sang các module: `features/admin`, `features/auth`, `features/customer`, `features/receptionist`.
- Tách biệt `routes/AppRoutes.tsx`.
- Tái cấu trúc lại `admin.api.ts`.

## Trạng thái file quan trọng
- `backend/src/routes/*` — Các entry point của API.
- `frontend/src/features/*/pages/*` — Nơi chứa toàn bộ Pages.
- `frontend/src/routes/AppRoutes.tsx` — Routing hệ thống.

### 🔴 Lỗi cần giải quyết
- Không có lỗi nghiêm trọng. Project đang chạy rất mượt.

### 🔜 Bước tiếp theo
- Triển khai toàn bộ các tính năng dành cho **Lễ tân** và **Bác sĩ/Kỹ thuật viên**.
