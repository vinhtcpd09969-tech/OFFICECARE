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

