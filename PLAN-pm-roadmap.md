# LỘ TRÌNH PHÁT TRIỂN HỆ THỐNG - OFFICE CARE (PRODUCT MANAGER VIEW)

> [!IMPORTANT]
> **TÀI LIỆU HOẠCH ĐỊNH LỘ TRÌNH CHÍNH THỨC CỦA OFFICE CARE.**
> Tài liệu này được thiết lập dưới góc nhìn Quản trị sản phẩm (Product Manager), định hình rõ những tính năng nền tảng đã làm được và vạch ra lộ trình mở rộng quy mô hệ thống phòng khám trong tương lai.

---

## 1. TUYÊN BỐ BÀI TOÁN SẢN PHẨM (PROBLEM STATEMENT)

Các phòng khám Vật lý trị liệu và phục hồi chức năng cao cấp dành cho dân văn phòng đang đối mặt với thách thức lớn trong việc số hóa vận hành. Việc quản lý thủ công dẫn đến các lỗi:
- Trùng lịch hẹn của chuyên gia y tế hoặc trùng phòng máy điều trị.
- Thiếu sự liên kết chặt chẽ giữa chẩn đoán lâm sàng của Bác sĩ và nhật ký tập luyện hàng ngày của Kỹ thuật viên (KTV).
- Khó kiểm soát luồng dùng thử combo 3 buổi ban đầu và tính toán tài chính khi khách yêu cầu hủy gói/hoàn tiền.

**Office Care** ra đời nhằm số hóa toàn diện quy trình y khoa khép kín: Khách hàng đặt lịch ➔ Lễ tân tiếp đón & check-in ➔ Bác sĩ khám lâm sàng & ra phác đồ chỉ định ➔ Kỹ thuật viên thực hiện trị liệu & ghi chép SOAP Note y khoa ➔ Admin kiểm soát tài chính, marketing voucher và vận hành tổng thể.

---

## 2. ĐỐI TƯỢNG SỬ DỤNG & ACTOR ROLES

Hệ thống được thiết kế tối ưu hóa trải nghiệm cho 5 đối tượng cốt lõi:
1.  **Khách hàng (Customer):** Người bệnh cần đặt lịch hẹn nhanh, theo dõi liệu trình phục hồi và tương tác phản hồi chất lượng.
2.  **Lễ tân (Receptionist):** Người điều phối phòng khám, check-in, xử lý hóa đơn thanh toán, voucher và hoàn trả chi phí.
3.  **Bác sĩ Chuyên khoa (Doctor):** Chuyên gia lâm sàng trực tiếp thăm khám lượng giá, nhập chẩn đoán và chỉ định liệu trình.
4.  **Kỹ thuật viên (Technician):** Chuyên viên trực tiếp thực hiện phác đồ điều trị vật lý và ghi chép tiến trình SOAP Note hàng ngày.
5.  **Admin (Quản trị viên):** Người thiết lập tài nguyên (Phòng, Thiết bị, Gói dịch vụ), kiểm soát tài chính và theo dõi nhật ký bảo mật.

---

## 3. CÁC TÍNH NĂNG NỀN TẢNG ĐÃ HOÀN THÀNH (PRODUCT BASELINE)

Đến thời điểm hiện tại, hệ thống đã hoàn thành xuất sắc và vận hành ổn định các phân hệ sau:
-   **Core Auth & User Provisioning:** Xác thực an toàn qua mã OTP Email; phân quyền cứng 5 roles tương tác; phát sinh JWT Tokens và refresh token tự động.
-   **Smart Booking System:** Form đặt lịch trực tuyến tinh gọn cho bệnh nhân vãng lai không cần đăng nhập trước; tự động tạo tài khoản nháp; đính kèm ảnh chụp vùng đau lâm sàng.
-   **Doctor Consultation Gateway:** Màn hình khám lâm sàng cho Bác sĩ; nhập chẩn đoán, chống chỉ định và ra chỉ định gói điều trị trực tiếp tại cuộc hẹn `lich_dat`.
-   **Unified Treatment Packages & Seeding:** Quản lý vòng đời gói điều trị `lich_dieu_tri` của khách; tích hợp luồng dùng thử combo 3 buổi; tự động khóa lịch đặt buổi thứ 4 chờ thanh toán.
-   **Receptionist Dashboard & Billing:** Lưới lịch trực quan của chuyên gia; quy trình check-in CCCD bệnh nhân; lập hóa đơn và thu tiền trả góp; tự động áp dụng công thức hoàn trả tiền 50% khi hủy gói.
-   **Marketing Voucher Campaign:** Admin thiết lập chiến dịch Voucher giảm giá (theo % hoặc số tiền mặt), cấu hình hạn mức đơn hàng tối thiểu và số lượng áp dụng.
-   **Security System Audit Log:** Tự động ghi nhận nhật ký bảo mật `system_audit_log` khi có hành động nhạy cảm (hoàn tiền, chuyên gia ghi đè ghi chú tự động của AI...).

---

## 4. HƯỚNG PHÁT TRIỂN TRONG TƯƠNG LAI (FUTURE ROADMAP)

Để đưa thương hiệu phòng khám **Office Care** dẫn đầu thị trường và mở rộng quy mô lớn, lộ trình phát triển tiếp theo gồm 6 phân hệ cốt lõi nâng cao:

### 🩺 Giai đoạn 1: Phân hệ Bác sĩ Y lâm sàng Nâng cao (Clinical Doctor Portal Pro)
*   **Màn hình Lượng giá Trực quan (Visual Pain Mapping):**
    *   Tích hợp mô hình cơ thể người 2D hoặc 3D tương tác. Bác sĩ có thể bấm chọn trực tiếp vào vùng đau (ví dụ: khớp vai trái, cột sống thắt lưng L4-L5) trên màn hình.
    *   Hệ thống tự động lưu tọa độ đau, mức độ đau ban đầu (thang đo VAS từ 0-10) và hiển thị trực quan tiến trình giảm đau qua các buổi tập.
*   **Chỉ định Bài tập cụ thể (Exercise Prescription):**
    *   Bác sĩ không chỉ chỉ định gói dịch vụ chung chung, mà có thể kê đơn bài tập chi tiết từ thư viện bài tập phục hồi chức năng của phòng khám (ví dụ: bài tập kéo giãn cơ hình lê, bài tập mạnh cơ trung tâm Plank nghiêng) để KTV nhìn thấy và thực hiện theo.

### 💻 Giai đoạn 2: Phân hệ Kỹ thuật viên Chuyên sâu (Advanced Technician Portal)
*   **Hồ sơ SOAP Note Y khoa Kỹ thuật số:**
    *   Nâng cấp form SOAP Note của KTV thành biểu mẫu kỹ thuật số thông minh. Cho phép sờ nắn lâm sàng và nhập nhanh bằng giọng nói (Speech-to-Text) giúp KTV tiết kiệm 90% thời gian ghi chép sau ca tập.
*   **Lịch trực nhật & Đổi ca tự động:**
    *   KTV có thể xem lịch trực tuần cá nhân, đăng ký nghỉ phép trực tiếp trên hệ thống. 
    *   Hỗ trợ Lễ tân đổi ca trực của KTV đột xuất khi có ca cấp cứu hoặc KTV nghỉ ốm, tự động kiểm tra trùng lịch và đẩy thông báo cập nhật ca mới.

### 🏥 Giai đoạn 3: Phân hệ Lễ tân & Điều phối Thông minh (Smart Receptionist Pro)
*   **Check-in Quét mã QR tự động:**
    *   Khi khách hàng đến phòng khám, chỉ cần đưa mã QR trên Portal cá nhân ra quét tại quầy lễ tân. Hệ thống sẽ tự động check-in, hiển thị số phòng máy được phân bổ và đẩy thông báo đến điện thoại của KTV phụ trách mà không cần Lễ tân thao tác thủ công.
*   **Hệ thống Bảng thông báo hàng chờ (Clinic Queue Board):**
    *   Tích hợp màn hình LCD hiển thị hàng chờ khám và trị liệu tại sảnh phòng khám (Ví dụ: "Mời bệnh nhân Nguyễn Văn A vào phòng trị liệu 201 gặp KTV Trần Văn B").

### 📱 Portal cá nhân sâu hơn cho Khách hàng (Deep Customer Portal)
*   **Biểu đồ Đường cong phục hồi (Visual Recovery Curve Chart):**
    *   Khách hàng có thể truy cập Portal cá nhân để xem trực quan biểu đồ tiến trình giảm điểm đau và tăng góc vận động khớp của mình qua từng buổi tập (được vẽ tự động dựa trên dữ liệu SOAP Note của KTV và chẩn đoán định kỳ của Bác sĩ).
*   **Kho Video Bài tập hướng dẫn tự luyện tập tại nhà (Home Exercise Library):**
    *   Cung cấp các video hướng dẫn bài tập giãn cơ, tập mạnh cơ sâu chuẩn y khoa được Bác sĩ kê riêng cho từng bệnh nhân để tự thực hiện tại nhà nhằm tăng tốc độ phục hồi.

### 🔔 Hệ thống Thông báo Tự động (Omnichannel Notifications)
*   **Nhắc lịch hẹn thông minh:**
    *   Tự động gửi thông báo nhắc lịch hẹn đặt trước thông qua Zalo ZNS, SMS hoặc Email cho bệnh nhân trước 24 giờ và nhắc nhở lần cuối trước 2 giờ đến lịch.
    *   Gửi thông báo đẩy (Web Push) cho Bác sĩ và KTV khi có bệnh nhân mới đặt lịch hoặc có ca check-in đến phòng khám.

### 🤖 Trợ lý Trí tuệ Nhân tạo y khoa (AI Medical Assistant Pro)
*   **AI Phân tích Phim chụp & Bệnh án:**
    *   Cho phép bác sĩ tải phim X-quang hoặc kết quả MRI lên. AI sẽ tự động đọc kết quả hình ảnh học để đưa ra các gợi ý chẩn đoán sơ bộ và cảnh báo các bài tập chống chỉ định y khoa nguy hiểm.
*   **AI Tổng hợp SOAP Note thành Báo cáo định kỳ:**
    *   AI tự động tổng hợp toàn bộ 10 buổi ghi chú SOAP Note của KTV thành một báo cáo y khoa phục hồi chức năng ngắn gọn để gửi cho Bác sĩ đánh giá trước khi bệnh nhân bước vào buổi lượng giá tái khám cuối liệu trình.

### 🏢 Kiến trúc Chuỗi Đa Chi nhánh (Multi-branch Clinic Support)
*   **Đồng bộ bệnh án liên chi nhánh:** Bệnh nhân khám ở Chi nhánh Quận 1 vẫn có thể tập vật lý trị liệu ở Chi nhánh Quận 3. Dữ liệu bệnh án, SOAP note và số buổi còn lại trong gói được đồng bộ tức thời trên hệ thống.
*   **Tách biệt dòng tiền và vận hành:** Admin quản trị tối cao có thể xem báo cáo tài chính riêng biệt của từng chi nhánh hoặc báo cáo tổng hợp toàn chuỗi; quản lý phân ca nhân sự và thiết bị y tế độc lập cho từng cơ sở vật lý.
