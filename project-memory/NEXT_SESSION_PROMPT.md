# Next Session Prompt: PhysioFlow - Phase 3: Dashboard Roles & Booking Flow

## Ngữ cảnh hiện tại
Chúng ta đã hoàn thiện hạ tầng Auth (RBAC), Phân tích nghiệp vụ sâu (`MODULE_ARCHITECTURE.md`) và xây dựng xong Trang chủ (Storefront) với phong cách thiết kế Y tế/Phòng khám (Blue-Medical). Hệ thống đã phân tách rạch ròi giữa Cửa hàng (Landing Page) và Cổng thông tin cá nhân (Dashboard Portal).

## Mục tiêu phiên tiếp theo
Tập trung vào việc hiện thực hóa các chức năng cốt lõi cho từng Actor trong Dashboard và xây dựng luồng Đặt lịch (Booking).

### 1. Dashboard theo Vai trò (Actor Dashboards)
- [ ] **Lễ tân (Receptionist):** Xây dựng giao diện Dashboard hiển thị Danh sách lịch hẹn trong ngày (Today's Schedule), bộ lọc theo KTV/Phòng và nút Check-in nhanh.
- [ ] **Admin:** Xây dựng dashboard báo cáo doanh thu sơ bộ và quản lý danh mục (Dịch vụ/Gói tập).
- [ ] **Khách hàng:** Tinh chỉnh Dashboard để hiển thị đúng thông tin cá nhân và lịch sử buổi tập.

### 2. Module Đặt lịch (Booking Flow)
- [ ] **Form Đặt lịch:** Tạo trang `/booking` (hoặc `/dat-lich`) với form chọn Dịch vụ, chọn KTV (tùy chọn) và chọn Khung giờ trống (Time slot picker).
- [ ] **Logic điều hướng:** Đảm bảo từ Trang chủ, khi bấm "Đặt lịch trị liệu", nếu chưa đăng nhập sẽ qua luồng Auth ➔ Quay lại `/booking`. Nếu đã đăng nhập thì vào thẳng form.

### 3. Đồng bộ Dữ liệu thật (Backend Integration)
- [ ] Xây dựng API `GET /api/public/services` và `GET /api/public/packages` để đổ dữ liệu thật từ Database lên Trang chủ thay cho Mock data hiện tại.

## Ghi chú kỹ thuật
- Tiếp tục sử dụng `lucide-react` cho icon và phong cách thiết kế sạch sẽ, xanh-trắng đã thống nhất.
- Kiểm tra các ràng buộc bảo mật (RBAC) đã thiết lập trong `ProtectedRoute.tsx` khi xây dựng các trang mới.
- Xem lại `MODULE_ARCHITECTURE.md` để đảm bảo logic nghiệp vụ khớp với quy trình thực tế.

---
*Sẵn sàng khi Sếp bắt đầu phiên làm việc mới!*
