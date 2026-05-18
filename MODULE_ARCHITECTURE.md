# KIẾN TRÚC NGHIỆP VỤ & PHÂN HỆ CHỨC NĂNG - OFFICE CARE

> [!IMPORTANT]
> **TÀI LIỆU KIẾN TRÚC NGHIỆP VỤ CHÍNH THỨC CỦA DỰ ÁN OFFICE CARE.**
> Tài liệu này được thiết kế và đồng bộ 100% với các Route Frontend React, Controller Backend Express, và các trường dữ liệu PostgreSQL thực tế trong dự án.

---

## 1. NGUYÊN TẮC VẬN HÀNH CỐT LÕI (CORE OPERATIONS)

Hệ thống phòng khám Vật lý trị liệu **Office Care** tối ưu hóa hiệu quả y khoa và quy trình kinh doanh qua 3 nguyên tắc nền tảng:
1.  **Cửa ngõ Đặt lịch Tinh gọn (Smart Booking Entrance):** Khách hàng vãng lai có thể nhanh chóng đặt lịch khám lâm sàng trực tuyến mà không cần đăng ký tài khoản trước. Lịch hẹn đầu tiên luôn mặc định là khám lượng giá (`kham_moi`).
2.  **Bác sĩ Lâm sàng làm Cửa ngõ (Doctor Gateway):** Bác sĩ chuyên khoa khám lâm sàng trực tiếp, ghi nhận chẩn đoán y khoa, chống chỉ định và là người duy nhất ra chỉ định phác đồ gói điều trị phù hợp nhất để đảm bảo an toàn y khoa.
3.  **Chính sách Trải nghiệm Xây dựng Lòng tin (3-Session Trial):** Khách hàng được trải nghiệm 3 buổi tập vật lý trị liệu đầu tiên hoàn toàn miễn phí trước khi quyết định ký hợp đồng chính thức và kích hoạt thanh toán toàn gói ở buổi thứ 4.

---

## 2. MA TRẬN VAI TRÒ & MÀN HÌNH TƯƠNG TÁC (ACTOR-SCREEN MATRIX)

Mã nguồn Frontend React phân chia thành 5 vai trò (roles) chính với các chức năng và màn hình nghiệp vụ chuyên sâu:

| Vai trò (Actor) | Phạm vi quyền hạn (Scope) | Phân hệ Frontend chính | Chức năng & Màn hình tương tác |
| :--- | :--- | :--- | :--- |
| 👥 **Khách hàng** | Xem lịch hẹn, theo dõi gói liệu trình cá nhân, chấm sao feedback | `frontend/src/features/customer/` | **Dashboard Portal Khách hàng:** <br>- Đặt lịch khám trực tuyến.<br>- Theo dõi số buổi tập vật lý trị liệu còn lại trong gói.<br>- Chấm điểm, gửi feedback cho KTV sau buổi tập. |
| 🩺 **Bác sĩ Lâm sàng** | Khám lượng giá bệnh nhân, ghi nhận chẩn đoán lâm sàng, chỉ định gói | `frontend/src/features/doctor/` | **Màn hình Khám & Chỉ định Y khoa:** <br>- Xem danh sách khách chờ khám trong ngày.<br>- Nhập chẩn đoán y khoa (`chan_doan`) và chống chỉ định (`chong_chi_dinh`).<br>- Ra chỉ định khuyến khuyến nghị gói dịch vụ (`khuyen_nghi_goi_id`). |
| 🏥 **Lễ tân** | Quản lý lịch hẹn phòng khám, check-in CCCD, thanh toán, quản lý nhân sự | `frontend/src/features/receptionist/` | **Màn hình Lễ tân Điều phối:** <br>- Lưới lịch hẹn thời gian thực (Calendar Grid) của tất cả chuyên gia.<br>- Check-in khách đến, đối soát thông tin CCCD y khoa.<br>- Lập hóa đơn (`hoa_don`), thu tiền trả góp/toàn gói (`thanh_toan`).<br>- Hủy gói y khoa, tự động áp dụng công thức hoàn tiền. |
| 💻 **Kỹ thuật viên** | Xem lịch điều trị cá nhân, ghi chép nhật ký SOAP y khoa sau buổi tập | `frontend/src/features/technician/` | **Màn hình Trị liệu & SOAP Notes:** <br>- Lịch phân ca trực nhật cá nhân.<br>- Nhập SOAP Note chi tiết sau mỗi buổi tập (Điểm đau trước/sau buổi, kỹ thuật thực hiện).<br>- Ghi chú tóm tắt AI tình trạng bệnh nhân. |
| 👑 **Admin tối cao** | Toàn quyền cấu hình tài nguyên hệ thống, nhân sự, tài chính, marketing | `frontend/src/features/admin/` | **Dashboard Admin Quản trị:** <br>- Thiết lập danh mục Dịch vụ và Phòng (gán thiết bị chuyên dụng `thiet_bi_y_te`).<br>- Cấu hình Gói điều trị (`goi_dich_vu`) kèm chi tiết phân bổ dưới dạng JSONB.<br>- Quản lý chiến dịch Voucher marketing.<br>- Xem doanh thu tài chính, đối soát giao dịch và tra cứu nhật ký bảo mật `system_audit_log`. |

---

## 3. LUỒNG NGHIỆP VỤ ĐẶT LỊCH & ĐIỀU TRỊ THỰC TẾ (CLINICAL FLOW)

### 🔄 Giai đoạn 1: Đặt lịch trực tuyến không cần đăng nhập (Smart Booking)
1.  Khách hàng truy cập Landing Page của **Office Care**.
2.  Chọn nút "Đặt lịch khám mới".
3.  Chọn Ngày, Khung giờ, và Bác sĩ/Chuyên gia mong muốn.
4.  Điền thông tin cơ bản: **Họ tên khách**, **Số điện thoại**, **Giới tính**, **Lý do khám** (`ly_do_kham`), và **Hình ảnh đính kèm** chụp vùng đau hoặc phim X-quang/MRI (`anh_dinh_kem_url`).
5.  **Xử lý ở Backend:** Hệ thống lưu lịch hẹn vào bảng `lich_dat` với loại lịch `loai_lich = 'kham_moi'` và trạng thái `trang_thai = 'cho_xac_nhan'`.
    *   *Đặc biệt:* Nếu số điện thoại đã tồn tại tài khoản, hệ thống liên kết lịch hẹn với khách hàng cũ. Nếu chưa có, hệ thống tự động khởi tạo hồ sơ người dùng mới và gửi thông tin xác thực qua Email.

### 🏥 Giai đoạn 2: Tiếp tiếp nhận & Khám lượng giá lâm sàng (Consultation)
1.  Bệnh nhân đến phòng khám. Lễ tân thực hiện **Check-in**, chuyển trạng thái lịch hẹn sang `trang_thai = 'da_checkin'`.
2.  **Khám Bác sĩ:** Bác sĩ lâm sàng mở màn hình làm việc riêng, xem trước triệu chứng và hình ảnh phim chụp bệnh nhân đã gửi lên khi đặt lịch.
3.  Bác sĩ tiến hành khám lâm sàng, đo biên độ vận động cơ khớp của bệnh nhân.
4.  Bác sĩ ghi nhận thông tin trực tiếp vào cuộc hẹn `lich_dat`:
    *   `chan_doan`: Ví dụ "Thoát vị đĩa đệm L4-L5 chèn ép rễ thần kinh".
    *   `chong_chi_dinh`: Ví dụ "Chống chỉ định sóng ngắn nhiệt sâu (đang cấy ghép kim loại đùi)".
    *   `khuyen_nghi_goi_id`: Chỉ định gói combo phù hợp (Ví dụ: "Gói trị liệu thắt lưng đặc thù 10 buổi").

### 🎁 Giai đoạn 3: Đăng ký & Trải nghiệm 3 Buổi dùng thử (Trial Sessions)
1.  Bệnh nhân đồng ý phác đồ. Lễ tân thu phí khám ban đầu (nếu có).
2.  Lễ tân đăng ký gói cho khách: Tạo bản ghi trong `lich_dieu_tri` với `loai_dieu_tri = 'theo_goi'`, trạng thái `trang_thai = 'dang_dieu_tri'`, số buổi đã dùng `so_buoi_da_dung = 0`.
3.  Hệ thống kích hoạt luồng dùng thử:
    *   Cho phép khách đặt lịch và thực hiện tối đa 3 buổi đầu tiên mà không cần thanh toán hóa đơn gói.
    *   Kỹ thuật viên thực hiện trị liệu cho khách theo đúng phác đồ bác sĩ chỉ định. Sau mỗi buổi tập, KTV nhập điểm đau trước/sau buổi, ghi chú SOAP note và cập nhật `so_buoi_da_dung = so_buoi_da_dung + 1`.

### 🔒 Giai đoạn 4: Khóa lịch & Thanh toán chuyển đổi ở Buổi thứ 4 (Conversion Lockout)
1.  Sau khi hoàn thành buổi trị liệu thứ 3, hệ thống **tự động khóa lịch đặt mới** đối với bệnh nhân. 
2.  Hệ thống tạo hóa đơn thanh toán toàn bộ gói (`hoa_don` có trạng thái `'chua_thanh_toan'`).
3.  Khách hàng có hai lựa chọn:
    *   **Đồng ý chốt mua gói:** Khách thanh toán toàn bộ gói (hoặc đóng đợt 1 trả góp) cho Lễ tân. Khi hóa đơn được thanh toán đủ (`da_thanh_toan >= tong_tien_thanh_toan`), hệ thống chuyển đổi trạng thái gói sang `'dang_su_dung'` chính thức, mở khóa cho phép đặt tiếp các buổi còn lại.
    *   **Từ chối mua gói:** Hệ thống hủy gói đăng ký dùng thử. Lễ tân chuyển hóa đơn thành tính phí 3 buổi tập lẻ theo đơn giá đơn của dịch vụ (`dich_vu.don_gia`). Khách phải hoàn tất phí lẻ này và bị chặn đặt lịch mới trên toàn hệ thống cho đến khi thanh toán xong.

---

## 4. CHÍNH SÁCH HỦY GÓI & HOÂN TIỀN NGHIÊM NGẶT (REFUND SPECIFICATION)

Khi bệnh nhân yêu cầu dừng liệu trình giữa chừng vì lý do cá nhân, Lễ tân thực hiện luồng hủy gói trên hệ thống. Số tiền hoàn trả được tính toán tự động dựa trên ràng buộc sau:

### 📐 Công thức toán học (Refund Formula)
$$\text{Số tiền hoàn trả} = \left( \frac{\text{Giá trị gói thực tế thanh toán}}{\text{Tổng số buổi định mức}} \right) \times \text{Số buổi chưa tập} \times 50\%$$

*Trong đó:*
*   **Giá trị gói thực tế thanh toán:** Số tiền thực thu sau khi đã trừ đi các chương trình giảm giá Voucher (chính là `hoa_don.da_thanh_toan`).
*   **Số buổi chưa tập:** Được tính bằng `tong_so_buoi - so_buoi_da_dung`.
*   **Hệ số khấu trừ 50%:** Quy định bồi thường hợp đồng do đơn phương hủy dịch vụ và khấu hao thiết bị y tế đã hao phí.

---

## 5. ĐẶC TẢ GHI CHÚ Y KHOA SOAP NOTE & AI ASSISTANT

Sau mỗi buổi tập vật lý trị liệu, Kỹ thuật viên bắt buộc phải điền hồ sơ y khoa theo tiêu chuẩn quốc tế **SOAP Note** trực tiếp vào bảng `ghi_chu_buoi`:

*   **S (Subjective - Chủ quan):** Triệu chứng, cảm giác đau mỏi chủ quan của bệnh nhân lúc bắt đầu buổi tập (Điểm đau tự chấm `danh_gia_truoc_buoi` từ 0 đến 10).
*   **O (Objective - Khách quan):** Biên độ vận động cơ khớp đo được, tình trạng co thắt cơ mặt sờ nắn lâm sàng của KTV.
*   **A (Assessment - Lượng giá):** Đánh giá mức độ phản hồi, hiệu quả bài tập của bệnh nhân trong buổi tập (KTV chấm điểm `danh_gia_hieu_qua`).
*   **P (Plan - Kế hoạch):** Kế hoạch bài tập nâng cao hoặc giãn cơ cho buổi tập tiếp theo.

### ✦ Tích hợp Trợ lý AI (AI Clinical Assistant)
*   Hệ thống AI tự động phân tích 4 phần S-O-A-P của KTV để sinh ra một chuỗi tóm tắt bệnh án ngắn gọn (`ai_tom_tat_ngan` tối đa 300 ký tự) hiển thị trực tiếp cho KTV ở ca tiếp theo đọc nhanh trong 10 giây.
*   Mọi tóm tắt do AI sinh ra bắt buộc phải hiển thị kèm biểu tượng **"✦ AI"** để phân biệt. Nếu chuyên gia sửa đổi thủ công nội dung này, hệ thống sẽ tự động ghi nhật ký hậu kiểm `system_audit_log` với hành động `'override_ai'`.
