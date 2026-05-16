# Next Session Prompt — Phase 7: Reception Module

Chào bạn! Chúng ta đã hoàn thành xuất sắc toàn bộ Module Admin (Phase 1-6). Hệ thống hiện tại đã có một Dashboard quản trị vô cùng mạnh mẽ với đầy đủ tính năng Tài chính, Marketing và Báo cáo.

**Lưu ý: Đảm bảo Docker (PostgreSQL) đang chạy trước khi bắt đầu.**

## Mục tiêu phiên tới: Triển khai Phase 7 (Module Lễ tân - Receptionist)

Lễ tân là bộ phận tiếp xúc khách hàng đầu tiên, cần các công cụ thao tác cực nhanh. Hãy tập trung vào:

### 1. Màn hình Dashboard Lễ tân (Reception Desk)
- **Tính năng:** View tóm tắt lịch hẹn trong ngày, các ca đang điều trị và các ca vừa hoàn thành chờ thanh toán.
- **Yêu cầu:** Giao diện tối giản, tập trung vào hành động.

### 2. Luồng Check-in nhanh
- **Frontend:** Nút check-in nhanh tại danh sách lịch hẹn.
- **Backend:** Cập nhật `thoi_gian_checkin` và chuyển trạng thái `lich_dat` sang `da_checkin`. Tự động gán phòng nếu chưa có.

### 3. Tạo Hóa đơn & Thu tiền tại chỗ
- **Backend:** Logic tự động tạo `hoa_don` và `hoa_don_chi_tiet` từ `lich_dat` đã hoàn thành.
- **Frontend:** Màn hình thanh toán nhanh, chọn phương thức (Tiền mặt, Chuyển khoản) và in hóa đơn (hoặc xuất PDF).

### 4. Quản lý Khách hàng (Lite)
- **Frontend:** Form đăng ký nhanh khách hàng mới ngay tại quầy lễ tân (không cần qua luồng Register phức tạp).

---

**Gợi ý Agent khởi đầu:**
"Hãy bắt đầu Phase 7: Triển khai Module Lễ tân. Đầu tiên hãy đọc lại schema bảng `hoa_don`, `thanh_toan` và `lich_dat` để nắm vững luồng dữ liệu, sau đó xây dựng tính năng Check-in nhanh và màn hình Quản lý Lễ tân tập trung."
