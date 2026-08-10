# Kế hoạch Chỉnh sửa & Vẽ lại Sơ đồ ERD (OfficeCare Database)

## 📌 Tổng quan Thay đổi
Bản vẽ ERD cũ của bạn được dựa trên Schema bản cũ. Sau đợt tái thiết kế nghiệp vụ (mô hình lấy số – chờ gọi, quản lý theo Buổi & Ngân sách phút, tách biệt trạng thái Thanh toán và Lâm sàng), Database hiện tại đã được nâng cấp đồng bộ 100%.

Tài liệu này là **Hướng dẫn từng bước chi tiết** giúp bạn cập nhật sơ đồ ERD từ bản cũ sang bản mới nhanh chóng và chính xác nhất.

---

## 🗑️ 1. CÁC MỐI QUAN HỆ CẦN BỎ (DELETED RELATIONSHIPS)

Khi bạn xóa bảng `tam_giu_cho`, hãy **XÓA 2 ĐƯỜNG NỐI MỐI QUAN HỆ** sau trên sơ đồ cũ:

1. **Xóa đường nối giữa `nguoi_dung` và `tam_giu_cho`**:
   - *Bản cũ*: `nguoi_dung` (Đầu 1) ───────────< `tam_giu_cho` (Đầu N)
   - *Thao tác*: **Xóa hẳn đường kẻ này**.
2. **Xóa đường nối giữa `goi_dich_vu` và `tam_giu_cho`**:
   - *Bản cũ*: `goi_dich_vu` (Đầu 1) ───────────< `tam_giu_cho` (Đầu N)
   - *Thao tác*: **Xóa hẳn đường kẻ này**.

---

## ➕ 2. CÁC MỐI QUAN HỆ MỚI CẦN NỐI (NEW RELATIONSHIPS)

Hãy **VẼ 2 ĐƯỜNG NỐI MỐI QUAN HỆ MỚI** sau vào sơ đồ:

### 1. Quan hệ MỚI thứ 1: Nối `cuoc_hen` với `phien_lam_viec` (Quan hệ 1 - N)
- **Ký hiệu trên sơ đồ**: `cuoc_hen` **(Đầu 1)** ───────────< **`phien_lam_viec` (Đầu N)**
- **Đầu 1 (One)**: Đặt ở bảng **`cuoc_hen`** (gắn vào cột Khóa chính `id`).
- **Đầu N (Many / Ký hiệu chân chim `<`)**: Đặt ở bảng **`phien_lam_viec`** (gắn vào cột Khóa ngoại `cuoc_hen_id`).
- *Ý nghĩa nghiệp vụ*: Một cuộc hẹn có thể có nhiều phiên làm việc thời gian thực (ví dụ: Lần khám 1 và Lần tái khám 2 là 2 phiên của cùng 1 cuộc hẹn).

### 2. Quan hệ MỚI thứ 2: Nối `phong_lam_viec` với `thiet_bi` (Quan hệ 1 - N)
- **Ký hiệu trên sơ đồ**: `phong_lam_viec` **(Đầu 1)** ───────────< **`thiet_bi` (Đầu N)**
- **Đầu 1 (One)**: Đặt ở bảng **`phong_lam_viec`** (gắn vào cột Khóa chính `id`).
- **Đầu N (Many / Ký hiệu chân chim `<`)**: Đặt ở bảng **`thiet_bi`** (gắn vào cột Khóa ngoại `phong_id`).
- *Ý nghĩa nghiệp vụ*: Một phòng làm việc/trị liệu có thể chứa nhiều máy móc thiết bị khác nhau.

---

## 📋 3. DANH SÁCH ĐỐI CHIẾU TẤT CẢ MỐI QUAN HỆ CHUẨN TRÊN SƠ ĐỒ ERD MỚI

### A. Nhóm Mối quan hệ 1 - 1 (One-to-One):
1. `nguoi_dung` **(1)** ───────── **(1)** `ho_so_chuyen_gia` *(FK: `ho_so_chuyen_gia.nguoi_dung_id`)*
2. `cuoc_hen` **(1)** ───────── **(1)** `nhat_ky_buoi_dieu_tri` *(FK: `nhat_ky_buoi_dieu_tri.cuoc_hen_id`)*

### B. Nhóm Mối quan hệ 1 - N (One-to-Many):
*(Ký hiệu: Bảng bên trái giữ Đầu 1, Bảng bên phải giữ Đầu N/Chân chim `<`)*

1. `vai_tro` **(1)** ───────────< `nguoi_dung` **(N)** *(FK: `nguoi_dung.vai_tro_id`)*
2. `nguoi_dung` **(1)** ───────────< `cuoc_hen` **(N)** *(Nhân sự phụ trách - FK: `cuoc_hen.nhan_su_id`)*
3. `nguoi_dung` **(1)** ───────────< `cuoc_hen` **(N)** *(Người tạo - FK: `cuoc_hen.nguoi_tao_id`)*
4. `nguoi_dung` **(1)** ───────────< `lich_truc_nhan_su` **(N)** *(FK: `lich_truc_nhan_su.nhan_su_id`)*
5. `nguoi_dung` **(1)** ───────────< `nhat_ky_buoi_dieu_tri` **(N)** *(FK: `nhat_ky_buoi_dieu_tri.nguoi_tao_id`)*
6. `nguoi_dung` **(1)** ───────────< `giao_dich_thanh_toan` **(N)** *(FK: `giao_dich_thanh_toan.nhan_vien_thuc_hien_id`)*
7. `nguoi_dung` **(1)** ───────────< `refresh_tokens` **(N)** *(FK: `refresh_tokens.nguoi_dung_id`)*
8. `nguoi_dung` **(1)** ───────────< `bai_viet` **(N)** *(FK: `bai_viet.nguoi_viet_id`)*
9. `nguoi_dung` **(1)** ───────────< `danh_gia` **(N)** *(FK: `danh_gia.nhan_su_id`)*
10. `nguoi_dung` **(1)** ───────────< `danh_gia` **(N)** *(FK: `danh_gia.nguoi_phan_hoi_id`)*
11. `khach_hang` **(1)** ───────────< `cuoc_hen` **(N)** *(FK: `cuoc_hen.khach_hang_id`)*
12. `khach_hang` **(1)** ───────────< `phac_do_dieu_tri` **(N)** *(FK: `phac_do_dieu_tri.khach_hang_id`)*
13. `khach_hang` **(1)** ───────────< `hoa_don` **(N)** *(FK: `hoa_don.khach_hang_id`)*
14. `khach_hang` **(1)** ───────────< `danh_gia` **(N)** *(FK: `danh_gia.khach_hang_id`)*
15. `khach_hang` **(1)** ───────────< `phien_chat_ai` **(N)** *(FK: `phien_chat_ai.khach_hang_id`)*
16. `khach_hang` **(1)** ───────────< `refresh_tokens` **(N)** *(FK: `refresh_tokens.khach_hang_id`)*
17. `goi_dich_vu` **(1)** ───────────< `cuoc_hen` **(N)** *(FK: `cuoc_hen.goi_dich_vu_id`)*
18. `goi_dich_vu` **(1)** ───────────< `phac_do_dieu_tri` **(N)** *(FK: `phac_do_dieu_tri.goi_dich_vu_id`)*
19. `goi_dich_vu` **(1)** ───────────< `chi_dinh_buoi` **(N)** *(FK: `chi_dinh_buoi.goi_dich_vu_id`)*
20. `goi_dich_vu` **(1)** ───────────< `danh_gia` **(N)** *(FK: `danh_gia.goi_dich_vu_id`)*
21. `phac_do_dieu_tri` **(1)** ───────────< `cuoc_hen` **(N)** *(FK: `cuoc_hen.phac_do_dieu_tri_id`)*
22. `phac_do_dieu_tri` **(1)** ───────────< `hoa_don` **(N)** *(FK: `hoa_don.phac_do_dieu_tri_id`)*
23. `phac_do_dieu_tri` **(1)** ───────────< `chi_dinh_buoi` **(N)** *(FK: `chi_dinh_buoi.phac_do_dieu_tri_id`)*
24. `nhat_ky_buoi_dieu_tri` **(1)** ───────────< `chi_dinh_buoi` **(N)** *(FK: `chi_dinh_buoi.nhat_ky_id`)*
25. ⭐ **`cuoc_hen` (1)** ───────────< **`phien_lam_viec` (N)** *(MỚI - FK: `phien_lam_viec.cuoc_hen_id`)*
26. `cuoc_hen` **(1)** ───────────< `hoa_don` **(N)** *(FK: `hoa_don.cuoc_hen_id`)*
27. `cuoc_hen` **(1)** ───────────< `danh_gia` **(N)** *(FK: `danh_gia.cuoc_hen_id`)*
28. `hoa_don` **(1)** ───────────< `giao_dich_thanh_toan` **(N)** *(FK: `giao_dich_thanh_toan.hoa_don_id`)*
29. `khuyen_mai_voucher` **(1)** ───────────< `hoa_don` **(N)** *(FK: `hoa_don.voucher_id`)*
30. `phong_lam_viec` **(1)** ───────────< `cuoc_hen` **(N)** *(FK: `cuoc_hen.phong_id`)*
31. `phong_lam_viec` **(1)** ───────────< `lich_truc_nhan_su` **(N)** *(FK: `lich_truc_nhan_su.phong_id`)*
32. ⭐ **`phong_lam_viec` (1)** ───────────< **`thiet_bi` (N)** *(MỚI - FK: `thiet_bi.phong_id`)*
33. `phien_chat_ai` **(1)** ───────────< `tin_nhan_chat_ai` **(N)** *(FK: `tin_nhan_chat_ai.phien_chat_ai_id`)*

---

## ✏️ 4. CÁC BẢNG CẦN BỔ SUNG CỘT THUỘC TÍNH MỚI (UPDATED TABLES)

Bạn hãy bổ sung các cột mới dưới đây vào các Bảng tương ứng trên sơ đồ ERD cũ:

### 1. Bảng `cuoc_hen`:
Bổ sung 6 cột thuộc tính mới:
- ➕ `buoi` (VarChar 10): `'sang'` / `'chieu'` *(Đơn vị đặt lịch theo buổi)*
- ➕ `trang_thai_thanh_toan` (VarChar 20, Default: `'chua_thanh_toan'`): `'chua_thanh_toan'` / `'dang_cho_thanh_toan'` / `'da_thanh_toan'`
- ➕ `loai_huy` (VarChar 20, Nullable): `'khach_huy_som'` / `'khach_huy'` / `'phong_kham_huy'`
- ➕ `han_tai_kham` (Date, Nullable): *Hạn quay lại do Chuyên viên đặt khi chờ tái lượng giá*
- ➕ `gan_qua_hang_doi` (Boolean, Default: false)
- ➕ `thoi_luong_phut` (Integer, Nullable)

### 2. Bảng `nhat_ky_buoi_dieu_tri`:
Bổ sung 2 cột thuộc tính dữ liệu JSONB:
- ➕ `du_lieu_luong_gia` (JSONB, Nullable): *Lưu chỉ số ROM, MMT dạng cấu trúc*
- ➕ `du_lieu_tri_lieu` (JSONB, Nullable): *Lưu nhật ký thao tác thời gian thực của KTV*

### 3. Bảng `hoa_don`:
Bổ sung 2 cột thuộc tính mới:
- ➕ `ti_le_phat_huy_goi` (SmallInt, Nullable): *Snapshot % phạt hủy gói (10%)*
- ➕ `thoi_diem_tao_link_thanh_toan` (Timestamptz, Nullable): *Thời điểm mở PayOS QR để sweep tự động*

### 4. Bảng `khuyen_mai_voucher`:
Bổ sung 3 cột thuộc tính mới:
- ➕ `tu_dong_ap_dung` (Boolean, Default: false)
- ➕ `kenh_ap_dung` (String[] Array, Default: `[]`) — `'online'`, `'tai_quay'`, `'tat_ca'`
- ➕ `loai_goi_ap_dung` (String[] Array, Default: `[]`) — `'KHAM'`, `'LE'`, `'LIEU_TRINH'`, `'tat_ca'`

### 5. Bảng `ho_so_chuyen_gia`:
Bổ sung 1 cột thuộc tính mới:
- ➕ `so_khach_song_song` (SmallInt, Default: 1): *Chuyên viên = 1, KTV = 2*

### 6. Bảng `thiet_bi`:
Bổ sung 1 cột thuộc tính mới (Khóa ngoại):
- ➕ `phong_id` (Integer, Nullable, FK ───> `phong_lam_viec.id`)

---

## 🎨 5. TÓM TẮT SƠ ĐỒ CHUẨN ĐỂ ĐỐI CHIẾU (CHECKLIST VẼ ERD)

Sau khi chỉnh sửa xong, sơ đồ ERD mới của bạn sẽ bao gồm **chính xác 22 Bảng**:

| STT | Tên Bảng (Table Name) | Vai trò chính trong ERD |
|---|---|---|
| 1 | **`vai_tro`** | Danh mục 6 vai trò người dùng (Khách hàng, Lễ tân, KTV, Bác sĩ, Admin, Quản lý) |
| 2 | **`nguoi_dung`** | Tài khoản Nhân sự / Nhân viên phòng khám |
| 3 | **`ho_so_chuyen_gia`** | Hồ sơ chuyên môn nhân sự (bổ sung `so_khach_song_song`) |
| 4 | **`lich_truc_nhan_su`** | Phân ca trực theo ngày và phòng làm việc |
| 5 | **`khach_hang`** | Tài khoản Khách hàng / Bệnh nhân |
| 6 | **`cuoc_hen`** | Lượt khám & Trị liệu trung tâm (bổ sung `buoi`, `trang_thai_thanh_toan`, `loai_huy`...) |
| 7 | **`phien_lam_viec`** *(MỚI)* | ⭐ Hàng đợi & Thời gian thực lúc khách đang ở phòng khám |
| 8 | **`nhat_ky_buoi_dieu_tri`** | Nhật ký lâm sàng (VAS, bổ sung `du_lieu_luong_gia`, `du_lieu_tri_lieu`) |
| 9 | **`chi_dinh_buoi`** | Chỉ định gói trị liệu từ ca Lượng giá ban đầu |
| 10 | **`goi_dich_vu`** | Danh mục Gói trị liệu / Dịch vụ lẻ / Khám |
| 11 | **`phac_do_dieu_tri`** | Tiến trình gói trị liệu của khách hàng |
| 12 | **`hoa_don`** | Hóa đơn tài chính (bổ sung `ti_le_phat_huy_goi`) |
| 13 | **`giao_dich_thanh_toan`** | Chi tiết từng đợt thanh toán (PayOS / Tiền mặt / POS) |
| 14 | **`khuyen_mai_voucher`** | Mã giảm giá (bổ sung `kenh_ap_dung`, `loai_goi_ap_dung`...) |
| 15 | **`danh_gia`** | Đánh giá & Phản hồi cảm xúc từ khách hàng |
| 16 | **`phong_lam_viec`** | Danh mục Phòng khám / Phòng trị liệu |
| 17 | **`thiet_bi`** | Danh mục Máy móc thiết bị PHCN |
| 18 | **`bai_viet`** | Bài viết kiến thức y tế & Tin tức phòng khám |
| 19 | **`phien_chat_ai`** | Phiên trò chuyện tư vấn AI Chatbot |
| 20 | **`tin_nhan_chat_ai`** | Chi tiết tin nhắn AI Chatbot |
| 21 | **`otp_codes`** | Mã OTP xác minh email |
| 22 | **`refresh_tokens`** | Token làm mới phiên đăng nhập |
