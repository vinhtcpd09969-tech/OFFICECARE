-- =====================================================
-- PHYSIOFLOW - SEED DỮ LIỆU TEST WEBSITE
-- Mật khẩu tất cả tài khoản: 123456
-- =====================================================

SET session_replication_role = 'replica';

-- =====================================================
-- BẢNG: nguoi_dung
-- Vai trò: 1=KH, 2=LT, 3=KTV, 4=BS, 5=Admin, 6=QL
-- =====================================================
TRUNCATE TABLE nguoi_dung, khach_hang, voucher CASCADE;

INSERT INTO nguoi_dung (id, ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, trang_thai, da_xac_thuc_email, thoi_gian_tao) VALUES
-- Admin
('00000000-0000-0000-0000-000000000001', 'Nguyễn Admin Hệ Thống', 'admin@physioflow.vn', '0901000001', '$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S', 5, 'hoat_dong', true, now()),
-- Quản lý
('00000000-0000-0000-0000-000000000002', 'Trần Minh Quản Lý', 'quanly@physioflow.vn', '0901000002', '$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S', 6, 'hoat_dong', true, now()),
-- Lễ tân
('00000000-0000-0000-0000-000000000003', 'Lê Thị Hoa', 'letan1@physioflow.vn', '0901000003', '$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S', 2, 'hoat_dong', true, now()),
('00000000-0000-0000-0000-000000000004', 'Phạm Ngọc Mai', 'letan2@physioflow.vn', '0901000004', '$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S', 2, 'hoat_dong', true, now()),
-- Bác sĩ
('00000000-0000-0000-0000-000000000005', 'BS. Nguyễn Văn Khoa', 'bacsi1@physioflow.vn', '0901000005', '$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S', 4, 'hoat_dong', true, now()),
('00000000-0000-0000-0000-000000000006', 'BS. Trần Thị Lan Anh', 'bacsi2@physioflow.vn', '0901000006', '$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S', 4, 'hoat_dong', true, now()),
-- Kỹ thuật viên
('00000000-0000-0000-0000-000000000007', 'KTV. Đỗ Thanh Tùng', 'ktv1@physioflow.vn', '0901000007', '$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S', 3, 'hoat_dong', true, now()),
('00000000-0000-0000-0000-000000000008', 'KTV. Nguyễn Thị Bích', 'ktv2@physioflow.vn', '0901000008', '$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S', 3, 'hoat_dong', true, now()),
('00000000-0000-0000-0000-000000000009', 'KTV. Hoàng Văn Minh', 'ktv3@physioflow.vn', '0901000009', '$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S', 3, 'hoat_dong', true, now()),
('00000000-0000-0000-0000-000000000010', 'KTV. Vũ Thị Thanh', 'ktv4@physioflow.vn', '0901000010', '$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S', 3, 'hoat_dong', true, now());

-- =====================================================
-- BẢNG: khach_hang
-- =====================================================
INSERT INTO khach_hang (id, ho_ten, email, so_dien_thoai, mat_khau_hash, da_xac_thuc_email, ngay_sinh, gioi_tinh, dia_chi, thoi_gian_tao) VALUES
('10000000-0000-0000-0000-000000000011', 'Nguyễn Văn An', 'kh1@gmail.com', '0912000011', '$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S', true, '1988-03-15', 'nam', '12 Nguyễn Huệ, Q1, TP.HCM', now()),
('10000000-0000-0000-0000-000000000012', 'Trần Thị Bảo', 'kh2@gmail.com', '0912000012', '$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S', true, '1992-07-22', 'nu', '45 Lê Lợi, Q1, TP.HCM', now()),
('10000000-0000-0000-0000-000000000013', 'Lê Quang Cường', 'kh3@gmail.com', '0912000013', '$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S', true, '1985-11-08', 'nam', '78 Trần Hưng Đạo, Q5, TP.HCM', now()),
('10000000-0000-0000-0000-000000000014', 'Phạm Thị Dung', 'kh4@gmail.com', '0912000014', '$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S', true, '1995-04-30', 'nu', '23 Điện Biên Phủ, Q3, TP.HCM', now()),
('10000000-0000-0000-0000-000000000015', 'Hoàng Văn Đức', 'kh5@gmail.com', '0912000015', '$2b$10$fmDzCTKr9D/J1LPUHTiVROE3Zoa4wASi4gho4xPNpJCOJM0sU0z.S', true, '1990-09-17', 'nam', '56 Võ Văn Tần, Q3, TP.HCM', now());

-- =====================================================
-- BẢNG: chuyen_gia_y_te (Bác sĩ + KTV)
-- =====================================================
INSERT INTO chuyen_gia_y_te (id, nguoi_dung_id, ma_nhan_vien, chuyen_mon_chinh, so_nam_kinh_nghiem, chung_chi, mo_ta_ban_than, trang_thai, ngay_vao_lam, luong_cung_ca, luong_kpi_ca) VALUES
-- Bác sĩ
('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 'BS-001', 'Vật lý trị liệu & Phục hồi chức năng', 8, 'Chứng chỉ VLTL - Bộ Y Tế', 'Chuyên gia điều trị đau cơ xương khớp, phục hồi sau chấn thương thể thao.', 'hoat_dong', '2020-01-15', 300000, 100000),
('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', 'BS-002', 'Y học cổ truyền & Phục hồi chức năng', 6, 'Chứng chỉ YHCT - Bộ Y Tế', 'Chuyên trị liệu cột sống, chỉnh tư thế và điều trị bệnh lý nghề nghiệp.', 'hoat_dong', '2021-03-01', 300000, 100000),
-- KTV
('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000007', 'KTV-001', 'Massage trị liệu & Giải phóng cơ', 5, 'Chứng chỉ KTV VLTL', 'Có kinh nghiệm massage trị liệu cổ vai gáy, lưng và các bệnh nghề nghiệp.', 'hoat_dong', '2021-06-01', 150000, 50000),
('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000008', 'KTV-002', 'Kéo giãn & Điện trị liệu', 4, 'Chứng chỉ KTV VLTL', 'Chuyên sử dụng các thiết bị kéo giãn, điện xung và nhiệt trị liệu.', 'hoat_dong', '2022-01-10', 150000, 50000),
('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000009', 'KTV-003', 'Chỉnh tư thế & Vận động trị liệu', 3, 'Chứng chỉ KTV VLTL', 'Có kinh nghiệm chỉnh tư thế, hướng dẫn bài tập phục hồi.', 'hoat_dong', '2022-08-15', 150000, 50000),
('20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000010', 'KTV-004', 'Massage & Liệu pháp tinh dầu', 3, 'Chứng chỉ KTV Massage', 'Chuyên các liệu pháp thư giãn, massage tinh dầu và giảm stress.', 'hoat_dong', '2023-02-01', 150000, 50000);

-- =====================================================
-- BẢNG: lich_lam_viec (Ca làm 7 ngày cho KTV & BS)
-- =====================================================
INSERT INTO lich_lam_viec (id, nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai, phong_id, giuong_so) VALUES
-- BS 1 - Tuần này
('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', CURRENT_DATE, '08:00', '17:00', 'hoat_dong', 1, NULL),
('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', CURRENT_DATE + 1, '08:00', '17:00', 'hoat_dong', 1, NULL),
('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', CURRENT_DATE + 2, '08:00', '17:00', 'hoat_dong', 1, NULL),
('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', CURRENT_DATE + 3, '08:00', '17:00', 'hoat_dong', 1, NULL),
('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', CURRENT_DATE + 4, '08:00', '17:00', 'hoat_dong', 1, NULL),
-- BS 2 - Tuần này
('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', CURRENT_DATE, '08:00', '17:00', 'hoat_dong', 2, NULL),
('30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000006', CURRENT_DATE + 1, '08:00', '17:00', 'hoat_dong', 2, NULL),
('30000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000006', CURRENT_DATE + 2, '08:00', '17:00', 'hoat_dong', 2, NULL),
-- KTV 1
('30000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000007', CURRENT_DATE, '08:00', '17:00', 'hoat_dong', 4, 1),
('30000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000007', CURRENT_DATE + 1, '08:00', '17:00', 'hoat_dong', 4, 1),
('30000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000007', CURRENT_DATE + 2, '08:00', '17:00', 'hoat_dong', 4, 1),
('30000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000007', CURRENT_DATE + 3, '08:00', '17:00', 'hoat_dong', 4, 1),
('30000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000007', CURRENT_DATE + 4, '08:00', '17:00', 'hoat_dong', 4, 1),
-- KTV 2
('30000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000008', CURRENT_DATE, '08:00', '17:00', 'hoat_dong', 4, 2),
('30000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000008', CURRENT_DATE + 1, '08:00', '17:00', 'hoat_dong', 4, 2),
('30000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000008', CURRENT_DATE + 2, '08:00', '17:00', 'hoat_dong', 4, 2),
('30000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000008', CURRENT_DATE + 3, '08:00', '17:00', 'hoat_dong', 5, 1),
('30000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000008', CURRENT_DATE + 4, '08:00', '17:00', 'hoat_dong', 5, 1),
-- KTV 3
('30000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000009', CURRENT_DATE, '08:00', '17:00', 'hoat_dong', 5, 2),
('30000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000009', CURRENT_DATE + 1, '08:00', '17:00', 'hoat_dong', 5, 2),
('30000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000009', CURRENT_DATE + 2, '08:00', '17:00', 'hoat_dong', 5, 2),
('30000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000009', CURRENT_DATE + 3, '08:00', '17:00', 'hoat_dong', 6, 1),
('30000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000009', CURRENT_DATE + 4, '08:00', '17:00', 'hoat_dong', 6, 1),
-- KTV 4
('30000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000010', CURRENT_DATE, '08:00', '17:00', 'hoat_dong', 6, 2),
('30000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000010', CURRENT_DATE + 1, '08:00', '17:00', 'hoat_dong', 6, 2),
('30000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000010', CURRENT_DATE + 2, '08:00', '17:00', 'hoat_dong', 6, 2),
('30000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000010', CURRENT_DATE + 3, '08:00', '17:00', 'hoat_dong', 7, 1),
('30000000-0000-0000-0000-000000000045', '00000000-0000-0000-0000-000000000010', CURRENT_DATE + 4, '08:00', '17:00', 'hoat_dong', 7, 1);

-- =====================================================
-- BẢNG: lich_dat (Lịch hẹn mẫu - nhiều trạng thái)
-- Dich_vu_id lấy từ danh sách đã có trong DB
-- =====================================================
INSERT INTO lich_dat (id, ma_lich_dat, khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, dich_vu_id, bac_si_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ly_do_kham, trang_thai, nguoi_tao, thoi_gian_tao) VALUES
-- Hôm nay - chờ xác nhận
('40000000-0000-0000-0000-000000000001', 'LD-TEST01', '10000000-0000-0000-0000-000000000011', 'Nguyễn Văn An', '0912000011', 'nam',
 (SELECT id FROM dich_vu WHERE ten_dich_vu LIKE '%Massage trị liệu cơ sâu%' LIMIT 1),
 '20000000-0000-0000-0000-000000000005', 1,
 NOW() + INTERVAL '2 hours', NOW() + INTERVAL '2 hours 30 minutes',
 'Đau mỏi cổ vai gáy do ngồi máy tính nhiều', 'cho_xac_nhan', 'khach_hang', now()),
-- Hôm nay - đã xác nhận  
('40000000-0000-0000-0000-000000000002', 'LD-TEST02', '10000000-0000-0000-0000-000000000012', 'Trần Thị Bảo', '0912000012', 'nu',
 (SELECT id FROM dich_vu WHERE ten_dich_vu LIKE '%Nhiệt trị liệu%' LIMIT 1),
 '20000000-0000-0000-0000-000000000006', 2,
 NOW() + INTERVAL '3 hours', NOW() + INTERVAL '3 hours 15 minutes',
 'Đau lưng dưới, khó ngồi lâu', 'da_xac_nhan', 'khach_hang', now()),
-- Ngày mai
('40000000-0000-0000-0000-000000000003', 'LD-TEST03', '10000000-0000-0000-0000-000000000013', 'Lê Quang Cường', '0912000013', 'nam',
 (SELECT id FROM dich_vu WHERE ten_dich_vu LIKE '%Điện xung giảm đau%' LIMIT 1),
 '20000000-0000-0000-0000-000000000005', 1,
 NOW() + INTERVAL '1 day 2 hours', NOW() + INTERVAL '1 day 2 hours 15 minutes',
 'Cứng cổ, đau vai phải', 'da_xac_nhan', 'admin', now()),
-- Hôm nay - đã check-in
('40000000-0000-0000-0000-000000000004', 'LD-TEST04', '10000000-0000-0000-0000-000000000014', 'Phạm Thị Dung', '0912000014', 'nu',
 (SELECT id FROM dich_vu WHERE ten_dich_vu LIKE '%Kéo giãn vùng cổ%' LIMIT 1),
 '20000000-0000-0000-0000-000000000006', 2,
 NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '30 minutes',
 'Đau đầu do căng cơ cổ', 'da_checkin', 'le_tan', now()),
-- Hôm qua - đã hoàn thành
('40000000-0000-0000-0000-000000000005', 'LD-TEST05', '10000000-0000-0000-0000-000000000015', 'Hoàng Văn Đức', '0912000015', 'nam',
 (SELECT id FROM dich_vu WHERE ten_dich_vu LIKE '%Cân chỉnh tư thế%' LIMIT 1),
 '20000000-0000-0000-0000-000000000005', 1,
 NOW() - INTERVAL '1 day 4 hours', NOW() - INTERVAL '1 day 3 hours 30 minutes',
 'Lệch vai, gù lưng nhẹ', 'hoan_thanh', 'khach_hang', NOW() - INTERVAL '1 day 5 hours');

-- =====================================================
-- BẢNG: voucher (Mã giảm giá mẫu)
-- =====================================================
INSERT INTO voucher (id, ma_voucher, ten_chien_dich, loai_giam, gia_tri_giam, giam_toi_da, don_hang_toi_thieu, so_luong_toi_da, so_luong_da_dung, ngay_bat_dau, ngay_het_han, tao_boi, trang_thai, yeu_cau_thanh_toan) VALUES
('50000000-0000-0000-0000-000000000001', 'WELCOME10', 'Chào mừng khách mới - Giảm 10%', 'phan_tram', 10, 200000, 500000, 100, 0, CURRENT_DATE, CURRENT_DATE + 90, '00000000-0000-0000-0000-000000000001', 'hoat_dong', 'tat_ca'),
('50000000-0000-0000-0000-000000000002', 'SUMMER200', 'Khuyến mãi mùa hè - Giảm 200k', 'co_dinh', 200000, 200000, 1000000, 50, 0, CURRENT_DATE, CURRENT_DATE + 30, '00000000-0000-0000-0000-000000000001', 'hoat_dong', 'tat_ca'),
('50000000-0000-0000-0000-000000000003', 'LOYAL15', 'Khách hàng thân thiết - Giảm 15%', 'phan_tram', 15, 500000, 2000000, 200, 0, CURRENT_DATE, CURRENT_DATE + 180, '00000000-0000-0000-0000-000000000001', 'hoat_dong', 'tat_ca');

SET session_replication_role = 'origin';
