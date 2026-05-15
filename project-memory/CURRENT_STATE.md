# Current State

- **Ngày cập nhật:** 2026-05-16
- **Progress:** Hoàn thành phần lớn Module Admin (Phase 4 & 5). Hệ thống đã có đầy đủ Dashboard quản trị toàn diện: Quản lý Nhân sự, Khách hàng, Dịch vụ, Phòng, Thiết bị, Ca làm việc, Lịch hẹn và Hồ sơ y tế. Đã tái cấu trúc Backend Route phân tách Client/Admin.
- **Infrastructure:** Backend & Frontend running stable. Database schema updated with `system_audit_log` and `lich_lam_viec_ktv`.

## Stack đang chạy
- Backend: `http://localhost:5000` (Express + TypeScript + pg Raw SQL)
- Frontend: `http://localhost:3000` (Vite + React TSX + Tailwind)
- Database: Docker PostgreSQL (`physioflow_db` - port 5432)

## Những gì đã hoàn thành

### Module Admin (Phase 1-5):
- **Admin Dashboard & Layout:** Sidebar chuyên nghiệp với đầy đủ menu điều hướng.
- **Quản lý Tài nguyên:** CRUD Dịch vụ, Phòng, Gói điều trị, Thiết bị y tế (theo dõi bảo trì).
- **Quản lý Nhân sự & Khách hàng:** Quản lý toàn bộ tài khoản nhân viên (Bác sĩ, KTV, Lễ tân) và danh sách Khách hàng.
- **Quản lý Lịch trình:** Hệ thống xếp ca làm việc cho KTV và Master View quản lý toàn bộ Lịch hẹn hệ thống.
- **Hồ sơ y tế:** Giao diện tra cứu Bệnh án (Assessment) dành cho Admin.
- **Audit Log:** Ghi lại mọi hành động nhạy cảm vào bảng `system_audit_log`.

### Cấu trúc Backend (Refactored):
- Phân tách rạch ròi `/api/client` (dành cho website công khai) và `/api/admin` (dành cho quản trị nội bộ).
- Chuyển toàn bộ API nghiệp vụ Admin vào `admin.routes.ts` với Middleware bảo vệ Role-based.

## Trạng thái file quan trọng
- `backend/src/routes/admin.routes.ts` — Cổng API Admin duy nhất.
- `backend/src/controllers/admin.controller.ts` — Logic quản trị toàn diện.
- `frontend/src/layouts/AdminLayout.tsx` — Giao diện Dashboard Admin.
- `frontend/src/App.tsx` — Routing hệ thống (đã cập nhật các route Admin mới).

### 🔴 Lỗi cần giải quyết
- Không có lỗi nghiêm trọng. Cần lưu ý mapping cột giữa schema cũ và schema mới khi mở rộng Audit Log.

### 🔜 Bước tiếp theo (Phase 6)
- **Tài chính:** Quản lý Thanh toán, Hóa đơn và Refund.
- **Marketing:** Quản lý Voucher & Khuyến mãi.
- **Báo cáo:** Xây dựng biểu đồ thống kê Doanh thu và Hiệu suất.
- **Đánh giá:** Module xem Feedback của khách hàng.
