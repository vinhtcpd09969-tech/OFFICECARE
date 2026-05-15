# KIẾN TRÚC MODULE & PHÂN TÍCH NGHIỆP VỤ - PHYSIOFLOW

## 1. Phân tích nghiệp vụ (Domain Analysis)

### 1.1. Khách hàng mục tiêu: Dân văn phòng
- **Đặc thù bệnh lý:** Thường xuyên gặp các vấn đề về cơ xương khớp do ngồi lâu sai tư thế (đau mỏi cổ vai gáy, thoái hóa đốt sống cổ, thoát vị đĩa đệm thắt lưng, hội chứng ống cổ tay).
- **Hành vi & Nhu cầu:** 
  - Quỹ thời gian eo hẹp, thường chỉ rảnh vào buổi tối hoặc cuối tuần.
  - Cần sự linh hoạt trong việc đặt lịch và dời lịch.
  - Thích sự minh bạch về phác đồ điều trị và chi phí.
  - Mong muốn theo dõi được tiến triển bệnh lý trực quan qua từng buổi.

### 1.2. Quy trình cốt lõi tại trung tâm
1. **Đặt lịch (Booking):** Khách hàng chủ động đặt lịch hoặc Lễ tân đặt giúp.
2. **Tiếp đón & Check-in:** Lễ tân xác nhận lịch, thu thập thông tin cơ bản.
3. **Khám lượng giá ban đầu (Initial Assessment):** KTV/Bác sĩ đánh giá tầm vận động, mức độ đau, tư thế tổng quát và đưa ra phác đồ (khuyến nghị gói).
4. **Thực hiện liệu trình (Treatment/SOAP):** Qua từng buổi, KTV thực hiện các biện pháp can thiệp và ghi chép theo chuẩn SOAP (Subjective - Objective - Assessment - Plan).
5. **Thanh toán:** Lễ tân tạo hóa đơn, trừ buổi trong gói hoặc thu tiền lẻ.
6. **Tái khám & Đánh giá (Follow-up):** Đánh giá lại hiệu quả sau 1 liệu trình, xin feedback từ khách hàng.

---

## 2. Ma trận Module & Actor (Actor-Module Matrix)

| Module | Khách hàng (1) | Lễ tân (2) | Kỹ thuật viên (3) | Admin (4) |
| :--- | :---: | :---: | :---: | :---: |
| **[Shared] Auth & Phân quyền** | X | X | X | X |
| **[Shared] Hồ sơ cá nhân** | X | X | X | X |
| **[Shared] Thông báo (In-app, Zalo)**| X | X | X | X |
| **Đặt lịch & Theo dõi lịch hẹn** | Xem/Tạo lịch cá nhân | Toàn quyền điều phối | Xem lịch cá nhân | Xem tổng quan |
| **Quản lý Gói tập & Hóa đơn** | Xem lịch sử mua/dùng | Check-in, Tạo/Thu tiền | Xem tiến độ gói | Quản lý, Báo cáo |
| **Hồ sơ Y tế & Tiến trình** | Xem tiến trình (Read) | Chỉ xem cơ bản | Toàn quyền (SOAP) | Xem (Read) |
| **Phản hồi & Feedback** | Viết đánh giá | Xem & Phản hồi | Xem feedback cá nhân | Quản lý toàn bộ |
| **Quản lý Danh mục (Dịch vụ/Phòng)**| - | Xem | Xem | Toàn quyền |
| **Báo cáo Doanh thu & Hiệu suất** | - | Xem dòng tiền ca/ngày| - | Toàn quyền |
| **Quản lý Nhân sự (KTV)** | - | - | - | Toàn quyền |

---

## 3. Ràng buộc bảo mật (Strict Access Control)

Hệ thống phải áp dụng các quy tắc bảo mật cứng (Hard-coded RBAC Guard) để tránh rò rỉ dữ liệu y tế và tài chính:

- **Khách hàng (Client-side):** 
  - TUYỆT ĐỐI KHÔNG được xem Hồ sơ y tế / Ghi chú buổi của người khác.
  - KHÔNG được phép sửa đổi nội dung Lượng giá y tế (Assessment) hoặc Ghi chú chuyên môn của KTV.
  - KHÔNG được thay đổi số dư gói hoặc trạng thái thanh toán.
- **Kỹ thuật viên (Therapist):** 
  - KHÔNG được truy cập vào Module Doanh thu / Dòng tiền của trung tâm.
  - KHÔNG được sửa đổi giá dịch vụ, cấu trúc gói điều trị hay voucher.
  - Chỉ được chỉnh sửa Ghi chú buổi (SOAP) của chính mình tạo ra trong một khoảng thời gian nhất định (sau đó sẽ bị lock để bảo vệ tính pháp lý của hồ sơ y tế).
- **Lễ tân (Receptionist):**
  - KHÔNG được phép thay đổi Ghi chú chuyên môn y tế (SOAP) của KTV.
  - KHÔNG được phép cấu hình lại Danh mục hệ thống, cấu hình Khuyến mãi hay xóa user KTV.
- **Admin (System):**
  - Toàn quyền vận hành nhưng các thao tác nhạy cảm (Sửa hồ sơ y tế, Xóa hóa đơn) phải được ghi log bắt buộc vào bảng `audit_log`.

---

## 4. Đối chiếu kỹ thuật & Database Recommendations

Sau khi đối chiếu với cấu trúc `schema_vatlytrilieu_v4 (1).sql`, Database hiện tại được thiết kế **rất xuất sắc và tinh tế**, đáp ứng tới 95% yêu cầu nghiệp vụ hiện đại.

### 4.1. Điểm mạnh đã có trong DB
- **Thấu hiểu Domain dân văn phòng:** Bảng `ho_so_y_te` đã có sẵn trường `so_gio_ngoi_may_tinh_per_ngay` và `moi_truong_lam_viec`. Rất phù hợp với tệp khách hàng mục tiêu.
- **SOAP Notes Flow:** Bảng `danh_gia` (Assessment) và `ghi_chu_buoi` (với enum `loai` bao gồm tiến trình, kỹ thuật, kế hoạch buổi kế) đã mô phỏng hoàn hảo quy trình SOAP.
- **Booking Optimization:** Sử dụng Constraint `EXCLUDE USING gist` để chống trùng lịch cứng ở tầng Database là một thiết kế rất cao cấp.
- **Security Trail:** Bảng `audit_log` đã được thiết kế sẵn để bắt các hành động nhạy cảm.

### 4.2. Database Recommendations (Các điểm cần mở rộng)

1. **Module Bài tập về nhà (Home Exercises)**
   - *Hiện tại:* Chưa có bảng riêng để KTV giao bài tập về nhà cho dân văn phòng tự tập. (Chỉ có thể nhét vào `ghi_chu_buoi` dưới dạng text).
   - *Đề xuất:* Thêm bảng `bai_tap_ve_nha` (id, buoi_tri_lieu_id, ten_bai_tap, link_video_youtube, so_hiep, so_lan, ghi_chu). Điều này giúp Khách hàng xem lại app để tự tập tại nhà - một Use-case rất phổ biến cho dân văn phòng.

2. **Quản lý ca làm việc Lễ tân (Cash Drawer/Shift)**
   - *Hiện tại:* Lễ tân thu tiền vào bảng `thanh_toan` chung.
   - *Đề xuất:* Nếu trung tâm có quy mô, nên có bảng `ca_lam_viec` để chốt ca, kiểm tra dòng tiền mặt (tiền đầu ca, tiền thu trong ca, tiền cuối ca) tránh thất thoát.

3. **Cơ chế Lock Ghi chú y tế (Medical Record Locking)**
   - *Hiện tại:* `ghi_chu_buoi` có trường `sua_luc` nhưng chưa có rule cấm sửa sau 24h.
   - *Đề xuất:* Triển khai logic khóa record ở tầng API (hoặc DB Trigger) không cho phép sửa hồ sơ y tế sau một khoảng thời gian quy định nhằm đảm bảo tính toàn vẹn pháp lý y khoa.
