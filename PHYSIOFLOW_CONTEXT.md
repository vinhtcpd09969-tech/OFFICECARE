# OFFICE CARE - SYSTEM CONTEXT & TECHNICAL SPECIFICATION

> [!IMPORTANT]
> **TÀI LIỆU KHẢO SÁT & ĐỒNG BỘ CHÍNH THỨC CỦA DỰ ÁN OFFICE CARE.**
> Tài liệu này phản ánh chính xác 100% cấu trúc mã nguồn, cơ sở dữ liệu PostgreSQL thực tế đang hoạt động của hệ thống phòng khám **Office Care** (thay thế cho phiên bản PhysioFlow cũ).

---

## 1. TECH STACK THỰC TẾ (PRODUCTION BASELINE)

Dự án Office Care được thiết kế theo kiến trúc tách biệt hoàn toàn giữa Frontend (Vite/React) và Backend (Node.js/Express REST API), tối ưu hóa hiệu năng và bảo mật.

### 💻 Frontend (Client Dashboard & Booking)
| Mục | Công nghệ thực tế | Vai trò |
| :--- | :--- | :--- |
| **Framework** | **React** (Vite Bundler) | Xây dựng ứng dụng đơn trang (SPA) tốc độ cao |
| **Styling** | **Tailwind CSS** | Thiết kế giao diện tiện ích (utility-first), không sử dụng CSS Modules |
| **State Store** | **Zustand** | Quản lý global state (authStore, bookingStore) gọn nhẹ và mượt mà |
| **Validation** | **Zod** | Validate định dạng dữ liệu biểu mẫu (Form Schemas) tại Client |
| **HTTP Client** | **Axios** | Instance tập trung, tự động chặn và đính kèm JWT (Interceptors) |
| **Routing** | **React Router v6** | Quản lý định tuyến và bảo vệ tuyến đường (`ProtectedRoute`) theo vai trò |

### ⚙️ Backend (REST API Server)
| Mục | Công nghệ thực tế | Vai trò |
| :--- | :--- | :--- |
| **Runtime** | **Node.js + TypeScript** | Môi trường chạy mã nguồn server an toàn và chặt chẽ |
| **Framework** | **Express** | Tổ chức code theo mô hình 3 lớp chuẩn: Routes ➔ Controllers ➔ Services ➔ Repositories |
| **Database** | **PostgreSQL** | Cơ sở dữ liệu quan hệ chính của hệ thống |
| **DB Driver** | **`pg` (node-postgres)** | Thực hiện truy vấn **Raw SQL bằng Connection Pool**, tuyệt đối không dùng ORM |
| **Auth** | **JWT + OTP** | Xác thực qua mã OTP Email; sử dụng Access Token (15 phút) và Refresh Token (7 ngày) |
| **Validation** | **Zod** | Validation Middleware kiểm tra dữ liệu đầu vào trước khi vào Controller |

---

## 2. CẤU TRÚC CƠ SỞ DỮ LIỆU THỰC TẾ (ACTUAL POSTGRESQL SCHEMA)

Cơ sở dữ liệu thực tế của hệ thống được chuẩn hóa tối ưu, tích hợp chặt chẽ các ràng buộc toàn vẹn tầng database và cơ chế soft-delete. Dưới đây là đặc tả chi tiết của 23 bảng đang vận hành:

### 2.1 PHÂN HỆ NGƯỜI DÙNG & PHÂN QUYỀN (USERS & AUTH)

#### 1. Bảng `vai_tro` (Roles catalog)
Chứa danh mục các vai trò trong hệ thống (chỉ đọc, không thêm/xóa tại runtime).
*   `id` (smallserial, PK)
*   `ma_vai_tro` (varchar(20), UNIQUE): `'khach_hang'` | `'le_tan'` | `'ky_thuat_vien'` | `'bac_si'` | `'admin'`
*   `ten_hien_thi` (varchar(50))
*   `mo_ta_quyen` (text)

#### 2. Bảng `nguoi_dung` (User credentials)
Tài khoản chung cho tất cả các vai trò.
*   `id` (uuid, PK, DEFAULT `gen_random_uuid()`)
*   `ho_ten` (varchar(150), NOT NULL)
*   `email` (varchar(255), UNIQUE, NOT NULL)
*   `so_dien_thoai` (varchar(20))
*   `mat_khau_hash` (varchar(255), NOT NULL)
*   `vai_tro_id` (smallint, FK ➔ `vai_tro(id)`)
*   `trang_thai` (varchar(20), DEFAULT `'hoat_dong'`)
*   `da_xac_thuc_email` (boolean, DEFAULT `false`)
*   `avatar_url` (text)
*   `thoi_gian_tao` (timestamp, DEFAULT `now()`)
*   `lan_dang_nhap_cuoi` (timestamp)
*   `deleted_at` (timestamp, Soft delete)

#### 3. Bảng `khach_hang` (Customer Profiles)
Hồ sơ thông tin chi tiết của khách hàng (liên kết 1-1 với `nguoi_dung`).
*   `id` (uuid, PK)
*   `nguoi_dung_id` (uuid, FK ➔ `nguoi_dung(id)`)
*   `ngay_sinh` (date)
*   `gioi_tinh` (varchar(10))
*   `dia_chi` (text)
*   `hang_khach_hang` (varchar(20), DEFAULT `'thuong'`) -- `'thuong'`, `'bac'`, `'vang'`, `'kim_cuong'`
*   `preferred_ktv_id` (uuid, FK ➔ `chuyen_gia_y_te(id)`)
*   `thoi_gian_tao` (timestamp, DEFAULT `now()`)
*   `deleted_at` (timestamp, Soft delete)
*   `so_cccd` (varchar(20))

#### 4. Bảng `chuyen_gia_y_te` (Medical Specialists Profile)
Bảng hồ sơ chung cho cả **Bác sĩ** (`bac_si`) và **Kỹ thuật viên** (`ky_thuat_vien`).
*   `id` (uuid, PK)
*   `nguoi_dung_id` (uuid, FK ➔ `nguoi_dung(id)`)
*   `ma_nhan_vien` (varchar(20), NOT NULL)
*   `chuyen_mon_chinh` (varchar(200), NOT NULL)
*   `so_nam_kinh_nghiem` (integer)
*   `chung_chi` (text)
*   `mo_ta_ban_than` (text)
*   `anh_dai_dien_url` (text)
*   `trang_thai` (varchar(20), DEFAULT `'hoat_dong'`) -- `'hoat_dong'`, `'nghi_phep'`, `'tam_nghi'`
*   `ngay_vao_lam` (date)

---

### 2.2 DANH MỤC DỊCH VỤ & THIẾT BỊ (CATALOG & EQUIPMENT)

#### 5. Bảng `danh_muc_dich_vu` (Service Categories)
*   `id` (bigserial, PK)
*   `ten_danh_muc` (varchar(100), NOT NULL)
*   `mo_ta` (text)
*   `thu_tu_hien_thi` (integer, DEFAULT 0)
*   `an_hien` (boolean, DEFAULT `true`)

#### 6. Bảng `dich_vu` (Services)
*   `id` (uuid, PK)
*   `danh_muc_id` (bigint, FK ➔ `danh_muc_dich_vu(id)`)
*   `ten_dich_vu` (varchar(200), NOT NULL)
*   `mo_ta_ngan` (varchar(500))
*   `mo_ta_chi_tiet` (text)
*   `thoi_luong_phut` (integer, NOT NULL)
*   `don_gia` (bigint, NOT NULL) -- Đơn vị: VNĐ
*   `hinh_anh_url` (text)
*   `trang_thai` (varchar(20), DEFAULT `'hoat_dong'`)
*   `thu_tu_hien_thi` (integer, DEFAULT 0)
*   `thiet_bi_yeu_cau` (varchar(100)) -- Tên loại thiết bị y tế yêu cầu

#### 7. Bảng `phong` (Rooms)
*   `id` (bigserial, PK)
*   `ten_phong` (varchar(100), NOT NULL)
*   `ma_phong` (varchar(20), NOT NULL)
*   `loai_phong` (varchar(100))
*   `loai_dich_vu_ho_tro` (jsonb) -- Lưu trữ danh sách dịch vụ hỗ trợ dưới dạng jsonb
*   `thiet_bi` (jsonb) -- Lưu danh sách thiết bị hiện có
*   `mo_ta` (text)
*   `trang_thai` (varchar(20), DEFAULT `'san_sang'`)
*   `tang` (varchar(20))

#### 8. Bảng `phong_dich_vu` (Room Service Map)
Bảng trung gian tối ưu hóa truy vấn phòng trống theo danh mục dịch vụ.
*   `id` (bigserial, PK)
*   `phong_id` (bigint, FK ➔ `phong(id)`)
*   `danh_muc_id` (bigint, FK ➔ `danh_muc_dich_vu(id)`)

#### 9. Bảng `thiet_bi_y_te` (Medical Equipments)
Quản lý thiết bị y tế chuyên dụng để điều trị (ví dụ: máy shockwave, máy điện xung...).
*   `id` (uuid, PK)
*   `ma_thiet_bi` (varchar(20), UNIQUE, NOT NULL)
*   `ten_thiet_bi` (varchar(100), NOT NULL)
*   `loai_thiet_bi` (varchar(100)) -- 'shockwave', 'tens', 'laser_class4', 'ultrasound'
*   `ngay_mua` (date)
*   `ngay_bao_tri_tiep_theo` (date)
*   `trang_thai` (varchar(20), DEFAULT `'san_sang'`)
*   `phong_id_hien_tai` (bigint, FK ➔ `phong(id)`)
*   `ghi_chu` (text)
*   `thoi_gian_tao` (timestamp, DEFAULT `now()`)

---

### 2.3 QUẢN LÝ LỊCH HẸN & LỊCH TRỰC (BOOKING & WORK SCHEDULES)

#### 10. Bảng `lich_dat` (Appointments)
Tâm điểm điều phối dịch vụ. Lưu trữ lịch hẹn khám mới hoặc trị liệu của khách hàng.
*   `id` (uuid, PK)
*   `ma_lich_dat` (varchar(20), NOT NULL)
*   `khach_hang_id` (uuid, FK ➔ `khach_hang(id)`)
*   `ho_ten_khach` (varchar(150)) -- Dành cho khách đặt lịch hộ hoặc vãng lai
*   `so_dien_thoai` (varchar(20))
*   `gioi_tinh_khach` (varchar(10))
*   `dich_vu_id` (uuid, FK ➔ `dich_vu(id)`)
*   `ky_thuat_vien_id` (uuid, FK ➔ `chuyen_gia_y_te(id)`) -- BS lượng giá hoặc KTV điều trị
*   `phong_id` (bigint, FK ➔ `phong(id)`)
*   `ngay_gio_bat_dau` (timestamp, NOT NULL)
*   `ngay_gio_ket_thuc` (timestamp, NOT NULL)
*   `ly_do_kham` (text)
*   `anh_dinh_kem_url` (text)
*   `trang_thai` (varchar(30), DEFAULT `'cho_xac_nhan'`) -- `'cho_xac_nhan'`, `'da_xac_nhan'`, `'da_checkin'`, `'hoan_thanh'`, `'da_huy'`
*   `dang_ky_goi_id` (uuid)
*   `ghi_chu_dat_lich` (text)
*   `ghi_chu_noi_bo` (text)
*   `thoi_gian_checkin` (timestamp)
*   `thoi_gian_huy` (timestamp)
*   `ly_do_huy` (text)
*   `nguoi_tao` (varchar(20), DEFAULT `'khach_hang'`)
*   `thoi_gian_tao` (timestamp, DEFAULT `now()`)
*   **[LÂM SÀNG CẬP NHẬT]** `chan_doan` (text) -- Bác sĩ ghi nhận chẩn đoán y khoa trực tiếp tại đây!
*   **[LÂM SÀNG CẬP NHẬT]** `chong_chi_dinh` (text) -- Ghi nhận chống chỉ định y khoa (ví dụ: loãng xương nặng, có máy tạo nhịp...)
*   **[LÂM SÀNG CẬP NHẬT]** `khuyen_nghi_dich_vu_id` (uuid, FK ➔ `dich_vu(id)`) -- BS gợi ý dịch vụ lẻ phù hợp
*   **[LÂM SÀNG CẬP NHẬT]** `khuyen_nghi_goi_id` (uuid, FK ➔ `goi_dich_vu(id)`) -- BS gợi ý gói điều trị combo phù hợp

#### 11. Bảng `lich_lam_viec` (Work Schedules)
Lịch phân ca trực hàng ngày của Bác sĩ và Kỹ thuật viên.
*   `id` (uuid, PK)
*   `nguoi_dung_id` (uuid, FK ➔ `nguoi_dung(id)`)
*   `ngay` (date, NOT NULL)
*   `gio_bat_dau` (time, NOT NULL)
*   `gio_ket_thuc` (time, NOT NULL)
*   `trang_thai` (varchar(20), DEFAULT `'hoat_dong'`)

---

### 2.4 HỆ THỐNG GÓI DỊCH VỤ & LIỆU TRÌNH (TREATMENT PACKAGES)

#### 12. Bảng `goi_dich_vu` (Packages)
Danh mục các gói điều trị combo (ví dụ: combo trị liệu vai gáy 10 buổi).
*   `id` (uuid, PK)
*   `ten_goi` (varchar(200), NOT NULL)
*   `ma_goi` (varchar(30), UNIQUE, NOT NULL)
*   `mo_ta` (text)
*   `tong_so_buoi` (integer, NOT NULL)
*   `gia_goi` (bigint, NOT NULL)
*   `gia_goc` (bigint)
*   `han_dung_thang` (integer, DEFAULT 6)
*   `hien_thi_website` (boolean, DEFAULT `true`)
*   `trang_thai` (varchar(20), DEFAULT `'hoat_dong'`)
*   `chi_tiet_dich_vu` (jsonb, DEFAULT `'[]'`) -- Danh sách phân bổ số buổi của từng dịch vụ trong gói
*   `thoi_gian_tao` (timestamp, DEFAULT `now()`)

#### 13. Bảng `goi_dich_vu_chi_tiet` (Package Services Map)
*   `id` (bigserial, PK)
*   `goi_dich_vu_id` (uuid, FK ➔ `goi_dich_vu(id)`)
*   `dich_vu_id` (uuid, FK ➔ `dich_vu(id)`)
*   `so_buoi_trong_goi` (integer, NOT NULL)

#### 14. Bảng `lich_dieu_tri` (Customer Treatment Records)
Theo dõi tiến trình các gói điều trị hoặc liệu trình mà khách hàng đã mua và đang sử dụng.
*   `id` (uuid, PK)
*   `khach_hang_id` (uuid, FK ➔ `khach_hang(id)`)
*   `loai_dieu_tri` (varchar(20)) -- `'dich_vu_le'` | `'theo_goi'`
*   `dich_vu_id` (uuid, FK ➔ `dich_vu(id)`)
*   `goi_dich_vu_id` (uuid, FK ➔ `goi_dich_vu(id)`)
*   `tong_so_buoi` (integer, NOT NULL)
*   `so_buoi_da_dung` (integer, DEFAULT 0)
*   `trang_thai` (varchar(20), DEFAULT `'dang_dieu_tri'`) -- `'dang_dieu_tri'`, `'hoan_thanh'`, `'tam_dung'`, `'da_huy'`
*   `thoi_gian_tao` (timestamp, DEFAULT `now()`)

#### 15. Bảng `buoi_tri_lieu` (Treatment Sessions)
Lưu nhật ký thực hiện chi tiết cho từng buổi tập vật lý trị liệu.
*   `id` (uuid, PK)
*   `lich_dieu_tri_id` (uuid, FK ➔ `lich_dieu_tri(id)`)
*   `khach_hang_id` (uuid, FK ➔ `khach_hang(id)`)
*   `ky_thuat_vien_id` (uuid, FK ➔ `chuyen_gia_y_te(id)`)
*   `phong_id` (bigint, FK ➔ `phong(id)`)
*   `dich_vu_id` (uuid, FK ➔ `dich_vu(id)`)
*   `thoi_gian_bat_dau` (timestamp, NOT NULL)
*   `thoi_gian_ket_thuc` (timestamp)
*   `danh_gia_truoc_buoi` (integer) -- Điểm đau tự đánh giá (0-10)
*   `danh_gia_sau_buoi` (integer) -- Điểm đau sau khi kết thúc buổi (0-10)
*   `danh_gia_hieu_qua` (integer) -- KTV chấm điểm (0-10)
*   `so_thu_tu_buoi` (integer) -- Buổi thứ mấy trong liệu trình
*   `danh_gia_id` (uuid)
*   `trang_thai` (varchar(20), DEFAULT `'dang_thuc_hien'`) -- `'dang_thuc_hien'`, `'hoan_thanh'`, `'gian_doan'`
*   `canh_bao_dac_biet` (text)
*   `ai_tom_tat_ngan` (varchar(300)) -- [AI TỰ ĐỘNG SINH]
*   `thoi_gian_ghi_chu` (timestamp)

---

### 2.5 HÓA ĐƠN, THANH TOÁN & MARKETING (BILLING, PAYMENT & PROMOTION)

#### 16. Bảng `hoa_don` (Invoices)
*   `id` (uuid, PK)
*   `ma_hoa_don` (varchar(20), NOT NULL)
*   `khach_hang_id` (uuid, FK ➔ `khach_hang(id)`)
*   `loai_hoa_don` (varchar(20)) -- `'dich_vu_don'`, `'goi_dieu_tri'`, `'danh_gia'`
*   `lich_dat_id` (uuid, FK ➔ `lich_dat(id)`)
*   `dang_ky_goi_id` (uuid) -- ID gói liên quan
*   `tong_tien_truoc_giam` (bigint, DEFAULT 0)
*   `so_tien_giam` (bigint, DEFAULT 0)
*   `tong_tien_thanh_toan` (bigint, NOT NULL)
*   `da_thanh_toan` (bigint, DEFAULT 0)
*   `trang_thai` (varchar(30), DEFAULT `'chua_thanh_toan'`) -- `'chua_thanh_toan'`, `'thanh_toan_mot_phan'`, `'da_thanh_toan'`, `'da_hoan_tien'`
*   `ghi_chu` (text)
*   `ngay_tao` (timestamp, DEFAULT `now()`)
*   `ngay_thanh_toan` (timestamp)
*   `thu_boi` (uuid) -- ID nhân viên lễ tân thu tiền

#### 17. Bảng `hoa_don_chi_tiet` (Invoice Details)
*   `id` (bigserial, PK)
*   `hoa_don_id` (uuid, FK ➔ `hoa_don(id)`)
*   `mo_ta` (varchar(300), NOT NULL)
*   `don_gia` (bigint, NOT NULL)
*   `so_luong` (integer, DEFAULT 1)
*   `thanh_tien` (bigint, NOT NULL)
*   `dich_vu_id` (uuid, FK ➔ `dich_vu(id)`)

#### 18. Bảng `thanh_toan` (Transactions)
Quản lý các giao dịch chuyển tiền (hỗ trợ đóng phí nhiều lần/trả góp).
*   `id` (uuid, PK)
*   `ma_giao_dich` (varchar(50), NOT NULL)
*   `hoa_don_id` (uuid, FK ➔ `hoa_don(id)`)
*   `so_tien` (bigint, NOT NULL)
*   `phuong_thuc` (varchar(20)) -- `'tien_mat'`, `'chuyen_khoan'`, `'the'`, `'momo'`, `'vnpay'`
*   `trang_thai` (varchar(20), DEFAULT `'cho_xu_ly'`) -- `'cho_xu_ly'`, `'thanh_cong'`, `'that_bai'`, `'da_hoan_tien'`
*   `ma_tham_chieu` (varchar(100)) -- Mã giao dịch từ ngân hàng
*   `nguoi_thu_tien_id` (uuid)
*   `thoi_gian_giao_dich` (timestamp, DEFAULT `now()`)
*   `ghi_chu` (text)

#### 19. Bảng `voucher` (Discounts)
*   `id` (uuid, PK)
*   `ma_voucher` (varchar(50), NOT NULL)
*   `ten_chien_dich` (varchar(200))
*   `loai_giam` (varchar(20)) -- `'phan_tram'` | `'tien_mat'`
*   `gia_tri_giam` (bigint, NOT NULL)
*   `giam_toi_da` (bigint)
*   `don_hang_toi_thieu` (bigint, DEFAULT 0)
*   `ap_dung_cho` (varchar(30), DEFAULT `'tat_ca'`)
*   `so_luong_toi_da` (integer)
*   `so_luong_da_dung` (integer, DEFAULT 0)
*   `ngay_bat_dau` (date, NOT NULL)
*   `ngay_het_han` (date)
*   `tao_boi` (uuid, FK ➔ `nguoi_dung(id)`)
*   `trang_thai` (varchar(20), DEFAULT `'hoat_dong'`)
*   `thoi_gian_tao` (timestamp, DEFAULT `now()`)

---

### 2.6 BẢNG PHỤ TRỢ (UTILITIES & LOGS)

#### 20. Bảng `otp_codes` (OTP Codes)
Xác thực OTP qua email khi đăng ký hoặc quên mật khẩu.
*   `id` (uuid, PK)
*   `email` (varchar(255), NOT NULL)
*   `otp` (varchar(6), NOT NULL)
*   `expires_at` (timestamp with time zone, NOT NULL)
*   `created_at` (timestamp with time zone, DEFAULT `now()`)

#### 21. Bảng `refresh_tokens` (Auth Tokens Store)
*   `id` (serial, PK)
*   `nguoi_dung_id` (uuid, FK ➔ `nguoi_dung(id)`)
*   `token` (text, NOT NULL)
*   `expires_at` (timestamp, NOT NULL)
*   `created_at` (timestamp, DEFAULT `now()`)

#### 22. Bảng `system_audit_log` (Action Audits)
Ghi nhật ký bảo mật các thao tác ghi đè chẩn đoán AI hoặc hoàn tiền.
*   `id` (bigserial, PK)
*   `user_id` (uuid, FK ➔ `nguoi_dung(id)`)
*   `action` (varchar(100), NOT NULL) -- 'tao', 'sua', 'hoan_tien', 'override_ai'...
*   `entity_type` (varchar(50), NOT NULL)
*   `entity_id` (varchar(100))
*   `payload` (text) -- Dữ liệu chi tiết trước/sau khi đổi dạng JSON
*   `ip_address` (varchar(50))
*   `created_at` (timestamp, DEFAULT `now()`)

#### 23. Bảng `danh_gia_dich_vu` (Service Feedbacks)
Đánh giá chất lượng của khách hàng sau mỗi buổi trị liệu vật lý.
*   `id` (uuid, PK)
*   `buoi_tri_lieu_id` (uuid, FK ➔ `buoi_tri_lieu(id)`)
*   `khach_hang_id` (uuid, FK ➔ `khach_hang(id)`)
*   `ky_thuat_vien_id` (uuid, FK ➔ `chuyen_gia_y_te(id)`)
*   `so_sao_tong` (integer, NOT NULL) -- Chấm điểm tổng quan (1-5)
*   `so_sao_ktv` (integer) -- Chấm điểm thái độ KTV (1-5)
*   `nhan_xet` (text)
*   `hieu_qua_dieu_tri` (varchar(30))
*   `se_quay_lai` (boolean)
*   `hien_thi_cong_khai` (boolean, DEFAULT `false`)
*   `thoi_gian_danh_gia` (timestamp, DEFAULT `now()`)

---

## 3. BUSINESS RULES & LUỒNG NGHIỆP VỤ THỰC TẾ (CLINIC OPERATIONS)

Hệ thống phòng khám Office Care vận hành theo các quy tắc nghiệp vụ đặc thù, đã được mã hóa tối ưu trong các Services của Backend:

### 3.1 Quy Tắc Chống Trùng Lịch (Double-Booking Exclusions)
*   **Chống trùng Kỹ thuật viên:** Một Bác sĩ hoặc Kỹ thuật viên (`chuyen_gia_y_te`) không thể thực hiện hai lịch hẹn khám/trị liệu trùng khung giờ hoạt động trong ngày.
*   **Chống trùng Phòng:** Một Phòng (`phong`) không thể tiếp nhận hai lịch hẹn trùng khung giờ.
*   **Bắt lỗi tầng DB:** Ràng buộc này được thực thi nghiêm ngặt tại tầng Database qua các Exclusions hoặc kiểm tra logic tại `appointment.service.ts`. Backend sẽ bắt lỗi xung đột và trả về HTTP `409 Conflict` kèm thông báo chi tiết cho Lễ tân điều phối.

### 3.2 Luồng Dùng Thử Combo 3 Buổi Tinh Gọn (3-Session Trial Flow)
Để tăng tỷ lệ chuyển đổi khách đặt liệu trình, hệ thống áp dụng luồng dùng thử không bắt buộc thanh toán trước:
1.  **Đăng ký dùng thử:** Khách hàng đăng ký gói điều trị combo dưới dạng dùng thử (`loai_dang_ky = 'thu_nghiem'`, `trang_thai = 'cho_kich_hoat'`). Chưa cần tạo hóa đơn thanh toán.
2.  **Xác minh thông tin (Check-in buổi 1):** Khi đến phòng khám buổi đầu tiên, Lễ tân bắt buộc phải xác minh và ghi nhận thông tin **Số CCCD** (`so_cccd`) vào hồ sơ khách hàng. Khách hàng ký cam kết thỏa thuận dùng thử.
3.  **Tập 3 buổi dùng thử:** Khách hàng được phép đặt lịch tập vật lý trị liệu tối đa 3 buổi đầu tiên hoàn toàn miễn phí.
4.  **Khóa lịch ở buổi thứ 4:** Đến buổi thứ 4, hệ thống sẽ **tự động khóa lịch đặt mới**. Lễ tân sẽ tạo hóa đơn thanh toán cho toàn bộ gói. Khách hàng phải hoàn tất thanh toán (hoặc đóng tiền đợt 1 trả góp) để chuyển trạng thái gói thành `'chinh_thuc'` và kích hoạt liệu trình tập các buổi tiếp theo.
5.  **Xử lý từ chối/quá hạn:** Nếu khách từ chối tiếp tục hoặc quá hạn quyết định, hệ thống chuyển sang tính phí lẻ cho 3 buổi đã sử dụng dựa trên đơn giá dịch vụ đơn lẻ (`dich_vu.don_gia`) và khóa chức năng đặt lịch mới cho đến khi hoàn tất thanh toán.

### 3.3 Chính Sách Hủy Gói & Hoàn Tiền (Refund Logic)
Hệ thống cung cấp tính năng hủy gói liệu trình đang dùng dở cho Lễ tân, tự động tính số tiền hoàn trả cho khách hàng theo công thức nghiêm ngặt:
$$\text{Số tiền hoàn trả} = \left( \frac{\text{Giá trị gói}}{\text{Tổng số buổi định mức}} \right) \times \text{Số buổi chưa tập} \times 50\%$$
*Công thức này khấu trừ 50% chi phí bồi thường hợp đồng và hao phí quản lý vận hành phòng khám đối với số buổi chưa tập.*

### 3.4 Quy Chuẩn Đồng Bộ Chẩn Đoán AI (AI-Generated Content Rules)
*   **Tóm tắt AI:** Nhật ký buổi trị liệu (`ai_tom_tat_ngan` trong `buoi_tri_lieu`) do AI tạo lập dựa trên SOAP note của KTV phải được đánh dấu nhãn **"✦ AI"** hiển thị nổi bật trên giao diện người dùng.
*   **Ghi đè thủ công (Override):** Kỹ thuật viên hoặc Bác sĩ y khoa có quyền sửa đổi thủ công nội dung này. Khi hành động ghi đè diễn ra, backend sẽ tự động log một sự kiện bảo mật vào `system_audit_log` với hành động `'override_ai'` nhằm mục đích hậu kiểm chất lượng.
