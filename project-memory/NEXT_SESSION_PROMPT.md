# Next Session Prompt — Phase 6: Admin Finalization

Chào bạn! Trong phiên làm việc trước, chúng ta đã hoàn thành xuất sắc việc mở rộng Module Admin (Phase 4 & 5), bao gồm Quản lý Khách hàng, Thiết bị, Lịch trực và Hồ sơ bệnh án. Chúng ta cũng đã tái cấu trúc Backend Route cực kỳ sạch sẽ với `/api/client` và `/api/admin`.

## Mục tiêu phiên tới: Hoàn thiện Phase 6 (Tài chính, Marketing & Báo cáo)

Hãy tập trung vào việc biến Admin Dashboard thành một "War Room" thực thụ với các tính năng:

### 1. Quản lý Tài chính (Finance)
- **Backend:** Viết API tra cứu danh sách `hoa_don` và `thanh_toan`.
- **Frontend:** Xây dựng màn hình "Quản lý Thanh toán" để Admin theo dõi dòng tiền và duyệt hoàn tiền.

### 2. Quản lý Marketing (Vouchers)
- **Backend:** CRUD API cho bảng `voucher`.
- **Frontend:** Màn hình tạo mã khuyến mãi, thiết lập ngày hết hạn và số lượng sử dụng.

### 3. Quản lý Đánh giá (Feedback)
- **Frontend:** Màn hình xem các đánh giá (`danh_gia`) của khách hàng sau các buổi trị liệu.

### 4. Báo cáo & Thống kê (Analytics Dashboard)
- **Backend:** Viết các query tổng hợp (Aggregations) cho Doanh thu theo tháng, Tỷ lệ lịch hẹn thành công, và Hiệu suất KTV.
- **Frontend:** Tích hợp Chart (dùng Recharts hoặc Chart.js) vào trang Dashboard chính của Admin (`AdminDashboard.tsx`).

---

**Gợi ý Agent khởi đầu:**
"Hãy bắt đầu Phase 6: Hoàn thiện Module Admin. Đầu tiên hãy đọc và phân tích toàn bộ folder `.agent` (bao gồm rules, skills, và workflows) để nắm bắt chuẩn coding và quy trình làm việc, sau đó xây dựng API và màn hình Quản lý Thanh toán & Hóa đơn để theo dõi doanh thu của hệ thống."
