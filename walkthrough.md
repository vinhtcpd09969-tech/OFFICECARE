# Walkthrough - Kết quả Nâng cấp Hệ thống Tài chính & Hoàn tiền thông minh

Tài liệu này tổng hợp kết quả nâng cấp hệ thống cấn trừ phí khám lâm sàng và phân tích toán học dòng tiền hoàn trả khi hủy gói liệu trình giữa chừng.

---

## 1. Các nghiệp vụ và tính năng đã giải quyết

### 1.1. Công thức tính phí phạt hủy gói chuẩn xác (10% trên số tiền thực đóng)
*   **Vấn đề:** Khi khách hàng mua gói trả góp (ví dụ trả góp 50% đóng 2.565.000đ), hệ thống cũ tính phạt 10% trên tổng giá trị gói (5.130.000đ) là 513.000đ. Điều này là không hợp lý vì khách hàng mới chỉ tạm ứng một phần tiền.
*   **Giải pháp:** 
    *   Cập nhật [admin.repository.ts](file:///d:/VLTT/VLTT/backend/src/repositories/admin.repository.ts) để tính phí phạt bằng `10%` số tiền khách đã thực đóng:
        ```typescript
        const phi_phat_thuc_te = Math.round((so_tien_da_dong * phi_phat_percent) / 100);
        ```
    *   **Kết quả:** Với gói 5.130.000đ của Vinh nguyễn đã đóng 2.565.000đ, phí phạt 10% được tính chính xác là **256.500đ** (thay vì 513.000đ). Số tiền hoàn trả thực tế cho khách tăng lên là **2.108.500đ**.

### 1.2. Tham chiếu động nguồn gốc ca khám & tự động lấy giá dịch vụ từ Database (Không hardcode 200k)
*   **Vấn đề:** Giá dịch vụ khám lâm sàng có thể thay đổi tùy thuộc vào cấu hình dịch vụ trong bảng `goi_dich_vu` và lịch hẹn cụ thể. Việc gán cứng `-200.000đ` bị nghiêm cấm để tránh dữ liệu sai lệch.
*   **Giải pháp:**
    *   **Backend:** 
        *   Khi hoàn tiền gói dịch vụ, hệ thống truy vấn bảng `cuoc_hen` và `goi_dich_vu` thông qua `cuoc_hen_id` để lấy đúng giá bán (`don_gia`) của loại dịch vụ khám được chỉ định cho cuộc hẹn đó:
            ```sql
            SELECT dv.don_gia FROM cuoc_hen ch JOIN goi_dich_vu dv ON ch.goi_dich_vu_id = dv.id WHERE ch.id = $1
            ```
        *   Khi truy vấn danh sách hóa đơn và chi tiết hóa đơn, cột `chi_phi_kham` được tính toán động bằng cách kết nối với bảng dịch vụ thay vì trả về `200000` cứng.
        *   Khi đồng bộ hóa đơn khám và tìm kiếm hóa đơn chưa thanh toán, hệ thống truy vấn mức giá khám hiện tại của hệ thống (`SELECT don_gia FROM goi_dich_vu WHERE loai_goi = 'KHAM' LIMIT 1`) làm điều kiện lọc.
    *   **Frontend ([InvoiceDetailModal.tsx](file:///d:/VLTT/VLTT/frontend/src/features/admin/pages/ManageFinance/components/InvoiceDetailModal.tsx)):**
        *   Nếu khách hàng đã thanh toán hóa đơn khám trước đó độc lập: Giao diện hiển thị rõ: `2.3. Thu hồi miễn phí khám (Hóa đơn khám HD-XXXXXX ngày DD/MM/YYYY): -[Giá khám thực tế]đ`.
        *   Nếu khách hàng thanh toán gộp tại quầy (không có hóa đơn khám riêng lúc đầu): Giao diện hiển thị rõ: `2.3. Thu hồi miễn phí khám (Ca khám ngày DD/MM/YYYY): -[Giá khám thực tế]đ`.
        *   Đồng bộ thông tin trong phần chú thích ghi nhận dòng tiền bên dưới để hiển thị mức giá hoàn toàn động.

---

## 2. Kết quả Xác minh & Đồng bộ Cơ sở dữ liệu

*   Đã chạy tập lệnh SQL cập nhật trạng thái thực tế của cả 2 hóa đơn bị hủy gói trên hệ thống về đúng giá trị tính toán mới:
    1.  **Hóa đơn HD-A649C8 (Vinh nguyễn):** Khách đóng 2.565.000đ, phạt 256.500đ (10%), giữ chi phí khám thực tế từ ca khám ngày 10/07/2026, hoàn trả 2.108.500đ. Hệ thống tự động sinh hóa đơn khám lâm sàng đã thanh toán tương ứng.
    2.  **Hóa đơn HD-CF888A (Trần Vinh):** Khách đóng 100% (4.860.000đ), phạt 486.000đ (10%), giữ chi phí khám thực tế từ ca khám ngày 10/07/2026, hoàn trả 4.174.000đ. Hệ thống tự động sinh hóa đơn khám lâm sàng đã thanh toán tương ứng.
*   **TypeScript Compile Status:** Biên dịch thành công 100% không có lỗi ở cả Frontend và Backend.

---

## 3. Redesign "Quản lý Khách hàng" thành Medical CRM/EMR + khóa cứng hạn sử dụng gói

### 3.1. Trang Khách hàng: từ bảng đơn giản thành CRM có thống kê & popup chi tiết
*   **Vấn đề:** Trang [ManageCustomers](file:///d:/VLTT/VLTT/frontend/src/features/admin/pages/ManageCustomers/index.tsx) cũ là 1 file 452 dòng monolithic, tải toàn bộ `getMedicalRecords()` (mọi khách hàng + mọi phác đồ + mọi lịch hẹn) chỉ để vẽ 1 bảng, không phân trang, không lọc theo uy tín.
*   **Giải pháp:**
    *   Thêm 2 endpoint mới không đụng API cũ: `GET /admin/customers/overview` (danh sách phân trang, lọc trạng thái đa chọn + điểm uy tín) và `GET /admin/customers/:id/emr` (chi tiết 1 khách hàng, lazy-load khi mở) trong [admin.repository.ts](file:///d:/VLTT/VLTT/backend/src/repositories/admin.repository.ts) / `admin.service.ts` / `admin.controller.ts` / `admin.routes.ts`.
    *   Card thống kê đổi tên "Gói liệu trình" → **"Hồ sơ điều trị"** (khách chỉ khám 1 buổi cũng đã "có hồ sơ"), tách 3 nhóm: Liệu trình (biểu đồ 4 trạng thái), Khám, Dịch vụ lẻ.
    *   Bảng khách hàng tách riêng cột "Hồ sơ điều trị" (icon xem hồ sơ) và cột "Gói liệu trình" (trạng thái + ghi chú theo từng trạng thái: còn X ngày để kích hoạt / đã X ngày từ kích hoạt / đã X ngày từ buổi hoàn thành trước đó / đã hủy).
    *   Tách toàn bộ logic ra `features/admin/components/customers/{hooks,ui}` theo đúng FSD (xem `.claude/skills/fsd-conventions`).

### 3.2. Trang chi tiết hồ sơ (PatientEmrDetail): accordion dài → popup chi tiết
*   **Vấn đề:** [PatientEmrDetail.tsx](file:///d:/VLTT/VLTT/frontend/src/features/admin/components/PatientEmrDetail.tsx) dùng accordion nội tuyến — bấm "Chi tiết" 1 gói/1 ca khám sẽ đẩy nội dung rất dài xuống ngay trong trang, gây kéo cuộn xấu.
*   **Giải pháp:**
    *   Chuyển "Chi tiết" của cả 2 bảng (Phác đồ điều trị / Khám & Dịch vụ lẻ) từ accordion nội tuyến sang **popup modal riêng** (Framer Motion, đồng bộ style với `ConfirmDialog.tsx`), nội dung cuộn độc lập trong modal thay vì đẩy cả trang.
    *   Popup phác đồ: rút gọn hồ sơ khám chỉ còn Chẩn đoán + Chống chỉ định (bỏ "Hướng điều trị & Ghi chú"), thêm khối bác sĩ chỉ định + thời gian khám gốc (ảnh bác sĩ, ngày giờ, phòng khám) dạng lưới 2 cột; danh sách buổi điều trị giữ nguyên toàn bộ logic khóa thanh toán/thứ tự buổi (không đổi công thức nghiệp vụ).
    *   Popup khám/dịch vụ lẻ: thêm khối **"Lý do khám"** + **"Ảnh khách hàng đính kèm"** (lấy từ `cuoc_hen.ghi_chu_khach_hang`/`anh_dinh_kem_url`, vốn đã có sẵn từ luồng đặt lịch nhưng trước đây chưa được backend `getCustomerEmr` trả về) — chỉ hiện với ca khám (`loai === 'KHAM'`), không hiện ở dịch vụ lẻ. Thêm nút xem nhanh khi ca khám đã dẫn tới 1 phác đồ **đã kích hoạt** (trước đây chỉ có banner khi phác đồ còn "chờ kích hoạt").
    *   Các khối thông tin phụ (chuyên gia/thời gian, chẩn đoán/chống chỉ định) chuyển từ 1 cột sang lưới 2 cột, mở rộng modal `max-w-2xl` → `max-w-3xl` để giảm khoảng trống dọc dư thừa.

### 3.3. Khóa cứng "Hạn sử dụng gói" — chỉ lấy từ cấu hình gói, không cho sửa tay, không ghi đè lại
*   **Vấn đề:** Trang hóa đơn checkout vẫn còn ô nhập tay "Hạn sử dụng gói (ngày)", trái với thống nhất trước đó là hạn sử dụng phải tự động và cố định.
*   **Giải pháp:**
    *   [receptionist.service.ts](file:///d:/VLTT/VLTT/backend/src/services/receptionist.service.ts): hạn sử dụng của `phac_do_dieu_tri` giờ lấy duy nhất từ `goi_dich_vu.han_su_dung_mac_dinh_ngay` tại thời điểm kích hoạt, ghi bằng `UPDATE ... WHERE han_su_dung IS NULL` — đảm bảo chỉ set đúng 1 lần; đổi cấu hình gói sau này hoặc phác đồ nhận thêm hóa đơn khác (đợt 2 trả góp) đều không ghi đè lại giá trị đã chốt.
    *   [ManageFinance/index.tsx](file:///d:/VLTT/VLTT/frontend/src/features/admin/pages/ManageFinance/index.tsx) + `useCheckout.ts`: bỏ hẳn ô nhập tay và state `durationDays` liên quan.
    *   **Backfill dữ liệu cũ:** chạy SQL cập nhật `han_su_dung` cho các phác đồ đã kích hoạt trước khi có fix này (3/4 phác đồ, dùng đúng `han_su_dung_mac_dinh_ngay` của từng gói). 1 phác đồ còn lại (gói "Liệu trình Giải áp Cột sống Thắt lưng...") chưa backfill được vì gói đó chưa từng cấu hình `han_su_dung_mac_dinh_ngay` — chờ Admin cấu hình ở trang Gói dịch vụ rồi backfill tiếp.

### 3.4. Kết quả kiểm tra
*   `cd backend && npx tsc --noEmit` và `cd frontend && npx tsc --noEmit`: sạch, không lỗi.
*   `cd backend && npx vitest run`: 56/56 test pass.
*   Test tay qua Playwright ở `/admin/customers`: popup Khám hiển thị đúng lý do khám + ảnh đính kèm; popup Liệu trình hiển thị đúng chẩn đoán/chống chỉ định + danh sách buổi.

