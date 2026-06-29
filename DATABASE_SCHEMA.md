# TÀI LIỆU THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)
*Dự án Hệ thống Quản lý Phòng khám Trị liệu & Phục hồi chức năng OfficeCare*

---

## 5.1 Cấu trúc các bảng trong Cơ sở dữ liệu

### 5.1.1 Bảng nguoi_dung (Quản lý tài khoản nhân viên & quản trị viên)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | uuid | Khóa chính tự sinh (UUID) | Bắt buộc |
| ho_ten | varchar(150) | Họ và tên nhân viên | Bắt buộc |
| email | varchar(255) | Địa chỉ email đăng nhập | Bắt buộc, Duy nhất |
| so_dien_thoai | varchar(20) | Số điện thoại liên hệ | Không bắt buộc |
| mat_khau_hash | varchar(255) | Mật khẩu tài khoản đã mã hóa | Bắt buộc |
| vai_tro_id | smallint | Mã định danh vai trò (FK trỏ tới vai_tro.id) | Bắt buộc |
| trang_thai | varchar(20) | Trạng thái hoạt động (hoat_dong, vo_hieu) | Mặc định hoat_dong |
| da_xac_thuc_email | boolean | Đã xác minh tài khoản qua email hay chưa | Mặc định false |
| avatar_url | text | Đường dẫn ảnh đại diện nhân sự | Không bắt buộc |
| thoi_gian_tao | timestamp | Thời gian đăng ký / khởi tạo tài khoản | Mặc định now() |
| lan_dang_nhap_cuoi | timestamp | Thời gian đăng nhập hệ thống gần nhất | Không bắt buộc |
| deleted_at | timestamp | Đánh dấu thời gian xóa mềm tài khoản | Không bắt buộc |

---

### 5.1.2 Bảng khach_hang (Quản lý thông tin bệnh nhân / khách hàng)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | uuid | Khóa chính tự sinh (UUID) | Bắt buộc |
| ho_ten | varchar(150) | Họ và tên đầy đủ của khách hàng | Bắt buộc |
| email | varchar(255) | Địa chỉ email liên hệ / đăng nhập | Không bắt buộc, Duy nhất |
| so_dien_thoai | varchar(20) | Số điện thoại chính chủ | Không bắt buộc |
| mat_khau_hash | varchar(255) | Mật khẩu đăng nhập cổng portal khách hàng | Không bắt buộc |
| trang_thai | varchar(20) | Trạng thái tài khoản (hoat_dong, vo_hieu) | Mặc định hoat_dong |
| da_xac_thuc_email | boolean | Đã xác minh email tài khoản | Mặc định false |
| avatar_url | text | Đường dẫn ảnh đại diện của khách hàng | Không bắt buộc |
| ngay_sinh | date | Ngày tháng năm sinh | Không bắt buộc |
| gioi_tinh | varchar(10) | Giới tính khách hàng | Không bắt buộc |
| dia_chi | text | Địa chỉ nơi ở hiện tại | Không bắt buộc |
| lan_dang_nhap_cuoi | timestamp | Thời gian đăng nhập portal gần nhất | Không bắt buộc |
| thoi_gian_tao | timestamp | Thời điểm tài khoản được khởi tạo | Mặc định now() |
| deleted_at | timestamp | Thời điểm tài khoản bị xóa mềm | Không bắt buộc |

---

### 5.1.3 Bảng chuyen_gia_y_te (Thông tin chi tiết Bác sĩ & Kỹ thuật viên)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | uuid | Khóa chính tự sinh (UUID) | Bắt buộc |
| nguoi_dung_id | uuid | Liên kết tài khoản hệ thống (FK trỏ tới nguoi_dung.id) | Bắt buộc |
| ma_nhan_vien | varchar(20) | Mã số định danh nhân viên (Ví dụ: NV001) | Bắt buộc, Duy nhất |
| chuyen_mon_chinh | varchar(200) | Chuyên khoa / thế mạnh chuyên môn chính | Bắt buộc |
| so_nam_kinh_nghiem | integer | Số năm kinh nghiệm làm việc thực tế | Không bắt buộc |
| chung_chi | text | Danh sách bằng cấp, chứng chỉ hành nghề y tế | Không bắt buộc |
| mo_ta_ban_than | text | Tiểu sử, giới thiệu ngắn về bản thân | Không bắt buộc |
| anh_dai_dien_url | text | Link ảnh chân dung chuyên nghiệp | Không bắt buộc |
| trang_thai | varchar(20) | Trạng thái công tác (hoat_dong, tam_nghi) | Mặc định hoat_dong |
| ngay_vao_lam | date | Ngày chính thức ký hợp đồng làm việc | Không bắt buộc |
| luong_cung_ca | bigint | Mức lương cơ bản tính trên mỗi ca làm việc | Mặc định 150000 |
| luong_kpi_ca | bigint | Mức hoa hồng / KPI nhận thêm trên mỗi ca làm | Mặc định 50000 |

---

### 5.1.4 Bảng lich_dat (Yêu cầu đặt hẹn khám lượng giá lâm sàng ban đầu)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | uuid | Khóa chính tự sinh (UUID) | Bắt buộc |
| ma_lich_dat | varchar(20) | Mã số đặt hẹn khám lâm sàng (Ví dụ: LD-12345) | Bắt buộc |
| khach_hang_id | uuid | ID khách hàng đặt lịch (FK trỏ tới khach_hang.id) | Không bắt buộc (cho khách vãng lai) |
| ho_ten_khach | varchar(150) | Họ tên khách hàng khi điền nhanh (khách vãng lai) | Không bắt buộc |
| so_dien_thoai | varchar(20) | Số điện thoại liên hệ đặt lịch | Không bắt buộc |
| gioi_tinh_khach | varchar(10) | Giới tính của khách hàng đặt hẹn | Không bắt buộc |
| dich_vu_id | uuid | Liên kết dịch vụ khám lâm sàng (FK trỏ tới dịch vụ Khám & Lượng giá chuyên sâu) | Không bắt buộc |
| bac_si_id | uuid | Bác sĩ khám lâm sàng chỉ định (FK tới chuyen_gia_y_te.id) | Bắt buộc (bác sĩ chịu trách nhiệm khám lượng giá) |
| phong_id | bigint | Phòng tiếp đón / phòng khám lượng giá ban đầu (FK tới phong.id) | Không bắt buộc |
| ngay_gio_bat_dau | timestamptz | Thời gian bắt đầu cuộc hẹn dự kiến | Bắt buộc |
| ngay_gio_ket_thuc | timestamptz | Thời gian kết thúc cuộc hẹn dự kiến | Bắt buộc |
| ly_do_kham | text | Triệu chứng bệnh lý / Lý do hẹn gặp bác sĩ | Không bắt buộc |
| anh_dinh_kem_url | text | Link ảnh chụp bệnh án / phim X-quang đính kèm | Không bắt buộc |
| trang_thai | varchar(30) | Trạng thái hẹn (cho_xac_nhan, da_xac_nhan, da_huy) | Mặc định cho_xac_nhan |
| ghi_chu_dat_lich | text | Tin nhắn / Yêu cầu đặc biệt từ khách hàng | Không bắt buộc |
| ghi_chu_noi_bo | text | Nhật ký ghi chú, trao đổi giữa nhân viên tiếp nhận | Không bắt buộc |
| thoi_gian_checkin | timestamptz | Thời điểm khách hàng thực tế có mặt tại phòng khám | Không bắt buộc |
| thoi_gian_huy | timestamptz | Thời điểm khách hàng hoặc hệ thống hủy lịch hẹn | Không bắt buộc |
| ly_do_huy | text | Lý do hủy lịch hẹn | Không bắt buộc |
| nguoi_tao | varchar(20) | Vai trò của người tạo lịch (khach_hang, le_tan) | Mặc định khach_hang |
| thoi_gian_tao | timestamptz | Thời điểm gửi yêu cầu đặt lịch hẹn | Mặc định now() |

---

### 5.1.5 Bảng ho_so_dieu_tri (Hồ sơ bệnh án và chỉ định điều trị của Bác sĩ)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | uuid | Khóa chính tự sinh (UUID) | Bắt buộc |
| lich_dat_id | uuid | ID lịch hẹn kiểm tra lâm sàng gốc (FK tới lich_dat.id) | Bắt buộc, Duy nhất |
| chuyen_gia_id | uuid | Bác sĩ lập bệnh án (FK trỏ tới chuyen_gia_y_te.id) | Không bắt buộc |
| chan_doan | text | Kết luận chẩn đoán lâm sàng của bác sĩ | Không bắt buộc |
| chong_chi_dinh | text | Các chống chỉ định (ví dụ: Không dùng sóng xung kích...) | Không bắt buộc |
| goi_dich_vu_id | uuid | Chỉ định mua trọn gói (FK trỏ tới goi_dich_vu.id) | Không bắt buộc |
| dich_vu_id | uuid | Chỉ định thực hiện dịch vụ lẻ (FK trỏ tới dich_vu.id) | Không bắt buộc |
| ghi_chu | text | Hướng dẫn dặn dò bệnh nhân sau điều trị | Không bắt buộc |
| thoi_gian_tao | timestamptz | Thời điểm lập hồ sơ bệnh án lâm sàng | Mặc định now() |

---

### 5.1.6 Bảng lich_dieu_tri (Theo dõi đợt điều trị/liệu trình của khách hàng)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | uuid | Khóa chính tự sinh (UUID) | Bắt buộc |
| khach_hang_id | uuid | ID khách hàng thụ hưởng (FK trỏ tới khach_hang.id) | Bắt buộc |
| loai_dieu_tri | varchar(20) | Phân loại đợt trị liệu (goi: Theo gói nhiều buổi, dich_vu_don: Trị liệu dịch vụ lẻ không cần khám hoặc mua lẻ) | Bắt buộc |
| tong_so_buoi | integer | Tổng số buổi trị liệu được duyệt (với dịch vụ lẻ tạo trực tiếp thì mặc định là 1) | Bắt buộc |
| so_buoi_da_dung | integer | Số buổi thực tế bệnh nhân đã thực hiện | Mặc định 0 |
| trang_thai | varchar(20) | Trạng thái (dang_dieu_tri, hoan_thanh, tam_dung) | Mặc định dang_dieu_tri |
| thoi_gian_tao | timestamptz | Ngày bắt đầu lập kế hoạch liệu trình | Mặc định now() |
| ma_lich_dieu_tri | varchar(20) | Mã liệu trình quản lý (Ví dụ: LT-0001) | Không bắt buộc, Duy nhất |
| phong_id | bigint | Phòng trị liệu ưu tiên phân bổ (FK trỏ tới phong.id) | Không bắt buộc |
| ghi_chu_noi_bo | text | Ghi chú theo dõi đặc biệt của Bác sĩ chỉ định hoặc lễ tân | Không bắt buộc |
| ngay_bat_dau | timestamp | Ngày thực tế bắt đầu buổi trị liệu đầu tiên | Không bắt buộc |
| ngay_ket_thuc | timestamp | Ngày thực tế hoàn thành toàn bộ liệu trình | Không bắt buộc |
| ho_so_dieu_tri_id | uuid | ID bệnh án chỉ định gốc (FK trỏ tới ho_so_dieu_tri.id, để trống nếu đặt dịch vụ lẻ trực tiếp không qua khám) | Không bắt buộc |

---

### 5.1.7 Bảng buoi_tri_lieu (Nhật ký từng buổi thực hiện trị liệu thực tế)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | uuid | Khóa chính tự sinh (UUID) | Bắt buộc |
| lich_dieu_tri_id | uuid | ID đợt điều trị liên kết (FK trỏ tới lich_dieu_tri.id) | Bắt buộc |
| khach_hang_id | uuid | ID bệnh nhân được trị liệu (FK trỏ tới khach_hang.id) | Bắt buộc |
| ky_thuat_vien_id | uuid | KTV trực tiếp đứng máy trị liệu (FK tới chuyen_gia_y_te.id) | Bắt buộc |
| phong_id | bigint | Phòng thực tế thực hiện buổi trị liệu (FK tới phong.id) | Không bắt buộc |
| dich_vu_id | uuid | Dịch vụ chính áp dụng trong buổi (FK trỏ tới dich_vu.id) | Không bắt buộc |
| thoi_gian_bat_dau | timestamptz | Thời điểm bắt đầu tiến hành trị liệu | Bắt buộc |
| thoi_gian_ket_thuc | timestamptz | Thời điểm hoàn thành ca trị liệu | Không bắt buộc |
| danh_gia_truoc_buoi | integer | Thang điểm đau trước buổi (VAS từ 1-10) | Không bắt buộc |
| danh_gia_sau_buoi | integer | Thang điểm đau sau buổi (VAS từ 1-10) | Không bắt buộc |
| danh_gia_hieu_qua | integer | Đánh giá mức độ hài lòng hoặc hiệu quả buổi (1-5 sao) | Không bắt buộc |
| so_thu_tu_buoi | integer | Thứ tự buổi thực hiện (Buổi số 1, Buổi số 2...) | Không bắt buộc |
| giuong_so | integer | Số giường nằm điều trị được phân bổ | Không bắt buộc |
| trang_thai | varchar(20) | Trạng thái ca trị liệu (dang_thuc_hien, hoan_thanh) | Mặc định dang_thuc_hien |
| canh_bao_dac_biet | text | Lưu ý an toàn từ Bác sĩ (ví dụ: Tránh cọ xát mạnh vết thương) | Không bắt buộc |
| ai_tom_tat_ngan | varchar(300) | Tóm tắt nhanh diễn biến buổi trị liệu do AI phân tích | Không bắt buộc |
| thoi_gian_ghi_chu | timestamptz | Thời điểm ghi nhận nhật ký của Kỹ thuật viên | Không bắt buộc |

---

### 5.1.8 Bảng buoi_tri_lieu_dich_vu (Chi tiết các dịch vụ áp dụng trong buổi trị liệu)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | uuid | Khóa chính tự sinh (UUID) | Bắt buộc |
| buoi_tri_lieu_id | uuid | ID buổi trị liệu liên kết (FK trỏ tới buoi_tri_lieu.id) | Bắt buộc |
| dich_vu_id | uuid | ID dịch vụ lẻ thực hiện (FK trỏ tới dich_vu.id) | Bắt buộc |
| so_luong | integer | Số lượng dịch vụ áp dụng trong buổi | Mặc định 1 |
| thoi_gian_thuc_hien | timestamp | Thời điểm bắt đầu thực hiện | Mặc định now() |
| ktv_id | uuid | Kỹ thuật viên phụ trách đứng máy (FK trỏ tới chuyen_gia_y_te.id) | Không bắt buộc |
| loai_dich_vu_su_dung | varchar(20) | Loại hình thanh toán (trong_goi, phat_sinh) | Mặc định trong_goi |
| trang_thai | varchar(20) | Trạng thái duyệt thực hiện (da_duyet, cho_duyet) | Mặc định da_duyet |
| ghi_chu_ly_do | text | Lý do hoặc ghi chú chỉ định thêm | Không bắt buộc |
| duyet_boi | uuid | Tài khoản người phê duyệt dịch vụ (FK tới nguoi_dung.id) | Không bắt buộc |
| duyet_luc | timestamp | Thời điểm phê duyệt | Không bắt buộc |

---

### 5.1.9 Bảng danh_gia_dich_vu (Đánh giá phản hồi dịch vụ từ khách hàng sau buổi trị liệu)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | uuid | Khóa chính tự sinh (UUID) | Bắt buộc |
| buoi_tri_lieu_id | uuid | ID buổi trị liệu được đánh giá (FK tới buoi_tri_lieu.id) | Bắt buộc |
| khach_hang_id | uuid | ID khách hàng phản hồi (FK tới khach_hang.id) | Bắt buộc |
| ky_thuat_vien_id | uuid | ID KTV được đánh giá (FK tới chuyen_gia_y_te.id) | Bắt buộc |
| so_sao_tong | integer | Đánh giá tổng quan chất lượng buổi (1-5 sao) | Bắt buộc |
| so_sao_ktv | integer | Đánh giá thái độ phục vụ của KTV (1-5 sao) | Không bắt buộc |
| nhan_xet | text | Nội dung phản hồi / góp ý chi tiết | Không bắt buộc |
| hieu_qua_dieu_tri | varchar(30) | Mức độ thuyên giảm đau nhức | Không bắt buộc |
| se_quay_lai | boolean | Khách có đồng ý quay lại hay không | Không bắt buộc |
| hien_thi_cong_khai | boolean | Cho phép hiển thị nhận xét trên Web | Mặc định false |
| thoi_gian_danh_gia | timestamp | Thời điểm gửi đánh giá phản hồi | Mặc định now() |

---

### 5.1.10 Bảng danh_muc_dich_vu (Quản lý danh mục nhóm dịch vụ lẻ & gói dịch vụ)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | bigint | Khóa chính tự tăng | Bắt buộc |
| ten_danh_muc | varchar(100) | Tên gọi của nhóm danh mục dịch vụ | Bắt buộc |
| mo_ta | text | Mô tả chi tiết nhóm danh mục | Không bắt buộc |
| thu_tu_hien_thi | integer | Thứ tự hiển thị trên danh sách lựa chọn | Mặc định 0 |
| an_hien | boolean | Trạng thái hiển thị trên giao diện | Mặc định true |
| loai_danh_muc | varchar(20) | Phân biệt danh mục (dich_vu, goi_dich_vu) | Mặc định dich_vu |

---

### 5.1.11 Bảng dich_vu (Quản lý danh sách dịch vụ trị liệu đơn lẻ)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | uuid | Khóa chính tự sinh (UUID) | Bắt buộc |
| danh_muc_id | bigint | Phân loại danh mục dịch vụ (FK tới danh_muc_dich_vu.id) | Bắt buộc |
| ten_dich_vu | varchar(200) | Tên gọi dịch vụ trị liệu | Bắt buộc |
| mo_ta | text | Mô tả chi tiết kỹ thuật áp dụng | Không bắt buộc |
| thoi_luong_phut | integer | Thời gian ước tính thực hiện dịch vụ (phút) | Không bắt buộc |
| don_gia | bigint | Giá niêm yết áp dụng cho dịch vụ lẻ | Không bắt buộc |
| hinh_anh_url | text | Đường dẫn ảnh minh họa dịch vụ trị liệu | Không bắt buộc |
| trang_thai | varchar(20) | Trạng thái kinh doanh (hoat_dong, vo_hieu) | Mặc định hoat_dong |
| thu_tu_hien_thi | integer | Thứ tự sắp xếp hiển thị trên bảng giá | Mặc định 0 |
| thiet_bi_yeu_cau | varchar(255) | Tên thiết bị y khoa chuyên dụng đi kèm | Không bắt buộc |

---

### 5.1.12 Bảng goi_dich_vu (Quản lý các gói liệu trình chăm sóc / điều trị dài hạn)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | uuid | Khóa chính tự sinh (UUID) | Bắt buộc |
| ten_goi | varchar(200) | Tên gói phác đồ trị liệu | Bắt buộc |
| ma_goi | varchar(30) | Mã ký hiệu gói (Ví dụ: GOI-DAUVAIGAY) | Bắt buộc, Duy nhất |
| mo_ta | text | Mô tả phác đồ điều trị trọn gói | Không bắt buộc |
| tong_so_buoi | integer | Tổng số buổi trị liệu của toàn bộ gói | Bắt buộc |
| thoi_luong_buoi_phut | integer | Thời lượng trung bình của mỗi buổi (phút) | Mặc định 60 |
| gia_goi | bigint | Số tiền thanh toán ưu đãi trọn gói | Bắt buộc |
| gia_goc | bigint | Tổng giá trị gốc nếu mua lẻ từng dịch vụ | Không bắt buộc |
| han_dung_thang | integer | Thời hạn sử dụng gói kể từ ngày mua (tháng) | Mặc định 6 |
| hien_thi_website | boolean | Có hiển thị gói lên website công khai hay ẩn | Mặc định true |
| trang_thai | varchar(20) | Trạng thái hoạt động gói (hoat_dong, ngung_ban) | Mặc định hoat_dong |
| thoi_gian_tao | timestamp | Thời điểm khởi tạo thông tin gói | Mặc định now() |
| danh_muc_id | bigint | Phân nhóm danh mục lớn (FK tới danh_muc_dich_vu.id) | Không bắt buộc |

---

### 5.1.13 Bảng goi_dich_vu_chi_tiet (Chi tiết cấu trúc dịch vụ lẻ cấu thành gói dịch vụ)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | integer | Khóa chính tự tăng | Bắt buộc |
| goi_dich_vu_id | uuid | ID gói dịch vụ liên kết (FK tới goi_dich_vu.id) | Không bắt buộc |
| dich_vu_id | uuid | ID dịch vụ lẻ liên kết (FK tới dich_vu.id) | Không bắt buộc |
| thu_tu_thuc_hien | integer | Thứ tự thực hiện dịch vụ lẻ trong gói | Mặc định 0 |
| thoi_luong_phut | integer | Thời lượng chỉ định (phút) | Không bắt buộc |

---

### 5.1.14 Bảng hoa_don (Quản lý hóa đơn mua gói/dịch vụ của khách hàng)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | uuid | Khóa chính tự sinh (UUID) | Bắt buộc |
| ma_hoa_don | varchar(20) | Số hóa đơn duy nhất (Ví dụ: HD-12345) | Bắt buộc |
| khach_hang_id | uuid | ID khách hàng thanh toán (FK tới khach_hang.id) | Bắt buộc |
| loai_hoa_don | varchar(20) | Loại hóa đơn (mua_goi, mua_le) | Bắt buộc |
| tong_tien_truoc_giam | bigint | Tổng giá trị hóa đơn gốc | Mặc định 0 |
| so_tien_giam | bigint | Số tiền chiết khấu / giảm trực tiếp | Mặc định 0 |
| tong_tien_thanh_toan | bigint | Số tiền thực tế khách hàng phải trả | Bắt buộc |
| da_thanh_toan | bigint | Số tiền thực tế khách đã trả | Mặc định 0 |
| trang_thai | varchar(30) | Trạng thái thanh toán (chua_thanh_toan, da_thanh_toan) | Mặc định chua_thanh_toan |
| ghi_chu | text | Ghi chú xuất hóa đơn | Không bắt buộc |
| ngay_tao | timestamp | Thời điểm tạo hóa đơn | Mặc định now() |
| ngay_thanh_toan | timestamp | Thời điểm hoàn thành thanh toán hóa đơn | Không bắt buộc |
| thu_boi | uuid | Nhân viên thu tiền xuất hóa đơn (FK tới nguoi_dung.id) | Không bắt buộc |
| loai_thanh_toan | varchar(20) | Hình thức thanh toán (tra_thang, tra_gop) | Mặc định tra_thang |
| voucher_id | uuid | ID voucher áp dụng giảm giá (FK tới voucher.id) | Không bắt buộc |
| so_tien_giam_voucher | bigint | Số tiền giảm trừ từ voucher | Mặc định 0 |
| so_tien_giam_phuong_thuc | bigint | Số tiền giảm trừ từ phương thức thanh toán | Mặc định 0 |
| lich_dieu_tri_id | uuid | ID liệu trình điều trị liên kết (FK tới lich_dieu_tri.id) | Không bắt buộc |

---

### 5.1.15 Bảng lich_lam_viec (Đăng ký lịch làm việc và chấm công của nhân sự)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | uuid | Khóa chính tự sinh (UUID) | Bắt buộc |
| nguoi_dung_id | uuid | ID tài khoản nhân sự (FK tới nguoi_dung.id) | Bắt buộc |
| ngay | date | Ngày làm việc đăng ký | Bắt buộc |
| gio_bat_dau | time | Giờ bắt đầu ca trực | Bắt buộc |
| gio_ket_thuc | time | Giờ kết thúc ca trực | Bắt buộc |
| trang_thai | varchar(20) | Trạng thái ca trực (hoat_dong, lam_ca) | Mặc định hoat_dong |
| thoi_gian_checkin | timestamptz | Thời điểm nhân viên checkin vào ca | Không bắt buộc |
| thoi_gian_checkout | timestamptz | Thời điểm nhân viên checkout ca trực | Không bắt buộc |
| trang_thai_cham_cong | varchar(30) | Trạng thái chấm công (dung_gio, di_tre...) | Không bắt buộc |
| phong_id | bigint | Phòng khám/trị liệu được phân bổ trực (FK tới phong.id) | Không bắt buộc |
| giuong_so | integer | Số giường được phân công trực tiếp | Không bắt buộc |

---

### 5.1.16 Bảng thong_bao (Hệ thống thông báo đẩy cho nhân viên & khách hàng)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | uuid | Khóa chính tự sinh (UUID) | Bắt buộc |
| nguoi_dung_id | uuid | ID nhân viên nhận tin (FK tới nguoi_dung.id) | Không bắt buộc |
| khach_hang_id | uuid | ID khách hàng nhận tin (FK tới khach_hang.id) | Không bắt buộc |
| tieu_de | varchar(200) | Tiêu đề của thông báo | Bắt buộc |
| noi_dung | text | Nội dung thông điệp chi tiết | Bắt buộc |
| loai | varchar(30) | Phân loại thông báo (he_thong, lich_hen, uu_dai) | Mặc định he_thong |
| da_doc | boolean | Đánh dấu đã đọc thông báo | Mặc định false |
| thoi_gian_tao | timestamp | Thời điểm gửi thông báo | Mặc định now() |

---

### 5.1.17 Bảng otp_codes (Quản lý mã xác thực OTP dùng một lần qua email)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | uuid | Khóa chính tự sinh (UUID) | Bắt buộc |
| email | varchar(255) | Email tiếp nhận mã xác thực | Bắt buộc |
| otp | varchar(6) | Mã số xác thực OTP gồm 6 chữ số | Bắt buộc |
| expires_at | timestamptz | Thời gian mã xác thực hết hiệu lực | Bắt buộc |
| created_at | timestamptz | Thời điểm gửi mã OTP | Mặc định now() |

---

### 5.1.18 Bảng phong (Quản lý phòng khám & phòng chức năng trị liệu)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | bigint | Khóa chính tự tăng | Bắt buộc |
| ten_phong | varchar(100) | Tên phòng hiển thị (Ví dụ: Phòng Khám Lâm Sàng 1) | Bắt buộc |
| ma_phong | varchar(20) | Ký hiệu mã phòng (Ví dụ: PK01) | Bắt buộc, Duy nhất |
| loai_phong | varchar(100) | Phân loại phòng (kham_benh, tri_lieu, phong_tap) | Không bắt buộc |
| mo_ta | text | Mô tả trang thiết bị, chức năng của phòng | Không bắt buộc |
| trang_thai | varchar(20) | Tình trạng phòng (san_sang, bao_tri, tam_khoa) | Mặc định san_sang |
| suc_chua | integer | Số lượng giường bệnh hoạt động đồng thời | Mặc định 1 |

---

### 5.1.19 Bảng refresh_tokens (Quản lý token duy trì phiên đăng nhập JWT)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | integer | Khóa chính tự tăng | Bắt buộc |
| nguoi_dung_id | uuid | ID nhân viên liên kết (FK tới nguoi_dung.id) | Không bắt buộc |
| khach_hang_id | uuid | ID khách hàng liên kết (FK tới khach_hang.id) | Không bắt buộc |
| token | text | Nội dung chuỗi token JWT mã hóa | Bắt buộc |
| expires_at | timestamp | Thời điểm token hết hạn | Bắt buộc |
| created_at | timestamp | Thời điểm khởi tạo chuỗi token | Mặc định now() |

---

### 5.1.20 Bảng thanh_toan (Chi tiết các giao dịch thanh toán hóa đơn)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | uuid | Khóa chính tự sinh (UUID) | Bắt buộc |
| ma_giao_dich | varchar(50) | Mã giao dịch ngân hàng / POS | Bắt buộc |
| hoa_don_id | uuid | ID hóa đơn liên kết (FK tới hoa_don.id) | Bắt buộc |
| so_tien | bigint | Số tiền giao dịch thực hiện | Bắt buộc |
| phuong_thuc | varchar(20) | Phương thức thanh toán (tien_mat, chuyen_khoan) | Bắt buộc |
| trang_thai | varchar(20) | Trạng thái thanh toán (thanh_cong, that_bai) | Mặc định cho_xu_ly |
| ma_tham_chieu | varchar(100) | Số tham chiếu giao dịch ngoài | Không bắt buộc |
| nguoi_thu_tien_id | uuid | Kế toán / lễ tân thu tiền (FK tới nguoi_dung.id) | Không bắt buộc |
| thoi_gian_giao_dich | timestamp | Thời điểm ghi nhận giao dịch | Mặc định now() |
| ghi_chu | text | Ghi chú chi tiết giao dịch | Không bắt buộc |

---

### 5.1.21 Bảng thiet_bi_y_te (Quản lý chi tiết từng máy móc / thiết bị y tế thực tế)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | uuid | Khóa chính tự sinh (UUID) | Bắt buộc |
| ma_thiet_bi | varchar(20) | Mã số tài sản thiết bị (Ví dụ: TB-001) | Bắt buộc, Duy nhất |
| ten_thiet_bi | varchar(100) | Tên model máy móc thực tế | Bắt buộc |
| ngay_mua | date | Ngày mua sắm thiết bị về phòng khám | Không bắt buộc |
| trang_thai | varchar(20) | Trạng thái thiết bị (san_sang, dang_dung, hong) | Mặc định san_sang |
| phong_id_hien_tai | bigint | Phòng đang bố trí đặt thiết bị (FK tới phong.id) | Không bắt buộc |
| ghi_chu | text | Ghi chú lịch sử hỏng hóc, bảo dưỡng máy | Không bắt buộc |
| thoi_gian_tao | timestamp | Thời điểm tạo bản ghi thiết bị | Mặc định now() |
| danh_muc_thiet_bi_id | integer | Danh mục nhóm thiết bị lớn (FK tới danh_muc_thiet_bi.id) | Không bắt buộc |

---

### 5.1.22 Bảng danh_muc_thiet_bi (Quản lý 6 nhóm danh mục thiết bị chính)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | integer | Khóa chính tự tăng | Bắt buộc |
| ten_danh_muc | varchar(100) | Mã nhóm danh mục lớn (dien, nhiet, co_hoc...) | Bắt buộc |
| ten_thiet_bi | varchar(100) | Tên hiển thị nhóm thiết bị (Cơ học, Điện...) | Bắt buộc |
| thoi_gian_tao | timestamp | Ngày giờ tạo nhóm danh mục | Mặc định now() |

---

### 5.1.23 Bảng vai_tro (Quản lý danh sách vai trò phân quyền người dùng)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | integer | Khóa chính tự tăng | Bắt buộc |
| ma_vai_tro | varchar(20) | Mã vai trò (Ví dụ: admin, receptionist...) | Bắt buộc |
| ten_hien_thi | varchar(50) | Tên vai trò hiển thị (Ví dụ: Lễ tân, Bác sĩ) | Bắt buộc |
| mo_ta_quyen | text | Mô tả chi tiết các quyền hạn tương ứng | Không bắt buộc |

---

### 5.1.24 Bảng voucher (Hệ thống mã giảm giá áp dụng khi thanh toán hóa đơn)

| Field | Type value | Description | Require and default value |
| :--- | :--- | :--- | :--- |
| id | uuid | Khóa chính tự sinh (UUID) | Bắt buộc |
| ma_voucher | varchar(50) | Mã code nhập giảm giá (Ví dụ: PHYSIO100) | Bắt buộc |
| ten_chien_dich | varchar(200) | Tên chiến dịch ưu đãi | Không bắt buộc |
| loai_giam | varchar(20) | Hình thức giảm (phan_tram, tien_mat) | Bắt buộc |
| gia_tri_giam | bigint | Số lượng giảm (phần trăm hoặc số tiền) | Bắt buộc |
| giam_toi_da | bigint | Giới hạn số tiền giảm tối đa (khi giảm theo %) | Không bắt buộc |
| don_hang_toi_thieu | bigint | Giá trị hóa đơn tối thiểu để áp dụng | Mặc định 0 |
| so_luong_toi_da | integer | Số lượng mã phát hành tối đa | Không bắt buộc |
| so_luong_da_dung | integer | Số lượng mã khách hàng đã dùng | Mặc định 0 |
| ngay_bat_dau | date | Ngày bắt đầu kích hoạt voucher | Bắt buộc |
| ngay_het_han | date | Ngày kết thúc chiến dịch voucher | Không bắt buộc |
| tao_boi | uuid | Tài khoản quản lý tạo mã (FK tới nguoi_dung.id) | Bắt buộc |
| trang_thai | varchar(20) | Trạng thái hoạt động (hoat_dong, het_han) | Mặc định hoat_dong |
| thoi_gian_tao | timestamp | Thời điểm khởi tạo voucher | Mặc định now() |
| yeu_cau_thanh_toan | varchar(30) | Quy định thanh toán (tat_ca, tien_mat, online) | Mặc định tat_ca |

---
