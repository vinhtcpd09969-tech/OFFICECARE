-- =============================================
-- OFFICE CARE DATABASE SCHEMA - SYNCED
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. vai_tro
CREATE TABLE vai_tro (
    id SERIAL PRIMARY KEY,
    ma_vai_tro VARCHAR(20) UNIQUE NOT NULL,
    ten_hien_thi VARCHAR(50) NOT NULL,
    mo_ta_quyen TEXT
);

-- Seed vai_tro
INSERT INTO vai_tro (ma_vai_tro, ten_hien_thi, mo_ta_quyen) VALUES
    ('khach_hang',    'Khách hàng',    'Xem lịch của mình, đặt lịch, xem gói, gửi feedback'),
    ('le_tan',        'Lễ tân',        'Quản lý lịch hẹn, check-in, tạo hóa đơn, thu tiền'),
    ('ky_thuat_vien', 'Kỹ thuật viên', 'Xem lịch của mình, tạo đánh giá, ghi chú buổi, đề xuất gói'),
    ('bac_si',        'Bác sĩ',        'Khám lượng giá, tạo hồ sơ y tế, chỉ định phác đồ & gói điều trị'),
    ('admin',         'Quản trị viên', 'Toàn quyền: quản lý người dùng, dịch vụ, gói, báo cáo');

-- 2. nguoi_dung
CREATE TABLE nguoi_dung (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ho_ten VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    so_dien_thoai VARCHAR(20) UNIQUE,
    mat_khau_hash VARCHAR(255) NOT NULL,
    vai_tro_id SMALLINT NOT NULL REFERENCES vai_tro(id),
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'hoat_dong',
    da_xac_thuc_email BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_url TEXT,
    thoi_gian_tao TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    lan_dang_nhap_cuoi TIMESTAMP WITHOUT TIME ZONE,
    deleted_at TIMESTAMP WITHOUT TIME ZONE
);

-- 3. khach_hang
CREATE TABLE khach_hang (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nguoi_dung_id UUID NOT NULL REFERENCES nguoi_dung(id),
    ngay_sinh DATE,
    gioi_tinh VARCHAR(10),
    dia_chi TEXT,
    hang_khach_hang VARCHAR(20) NOT NULL DEFAULT 'thuong',
    preferred_ktv_id UUID,
    thoi_gian_tao TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    so_cccd VARCHAR(20)
);

-- 4. chuyen_gia_y_te
CREATE TABLE chuyen_gia_y_te (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nguoi_dung_id UUID NOT NULL REFERENCES nguoi_dung(id),
    ma_nhan_vien VARCHAR(20) NOT NULL,
    chuyen_mon_chinh VARCHAR(200) NOT NULL,
    so_nam_kinh_nghiem INTEGER,
    chung_chi TEXT,
    mo_ta_ban_than TEXT,
    anh_dai_dien_url TEXT,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'hoat_dong',
    ngay_vao_lam DATE
);

-- 5. danh_muc_dich_vu
CREATE TABLE danh_muc_dich_vu (
    id BIGSERIAL PRIMARY KEY,
    ten_danh_muc VARCHAR(100) NOT NULL,
    mo_ta TEXT,
    thu_tu_hien_thi INTEGER NOT NULL DEFAULT 0,
    an_hien BOOLEAN NOT NULL DEFAULT TRUE
);

-- 6. dich_vu
CREATE TABLE dich_vu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    danh_muc_id BIGINT NOT NULL REFERENCES danh_muc_dich_vu(id),
    ten_dich_vu VARCHAR(200) NOT NULL,
    mo_ta_ngan VARCHAR(500),
    mo_ta_chi_tiet TEXT,
    thoi_luong_phut INTEGER NOT NULL,
    don_gia BIGINT NOT NULL,
    hinh_anh_url TEXT,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'hoat_dong',
    loai_dich_vu VARCHAR(20) NOT NULL DEFAULT 'chinh',
    thu_tu_hien_thi INTEGER NOT NULL DEFAULT 0,
    thiet_bi_yeu_cau VARCHAR(100)
);

-- 7. phong
CREATE TABLE phong (
    id BIGSERIAL PRIMARY KEY,
    ten_phong VARCHAR(100) NOT NULL,
    ma_phong VARCHAR(20) NOT NULL,
    loai_phong VARCHAR(100),
    loai_dich_vu_ho_tro JSONB,
    thiet_bi JSONB,
    mo_ta TEXT,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'san_sang',
    tang VARCHAR(20)
);

-- 8. phong_dich_vu
CREATE TABLE phong_dich_vu (
    id BIGSERIAL PRIMARY KEY,
    phong_id BIGINT NOT NULL REFERENCES phong(id),
    danh_muc_id BIGINT NOT NULL REFERENCES danh_muc_dich_vu(id)
);

-- 9. lich_dat
CREATE TABLE lich_dat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_lich_dat VARCHAR(20) NOT NULL,
    khach_hang_id UUID REFERENCES khach_hang(id),
    ho_ten_khach VARCHAR(150),
    so_dien_thoai VARCHAR(20),
    gioi_tinh_khach VARCHAR(10),
    dich_vu_id UUID REFERENCES dich_vu(id),
    ky_thuat_vien_id UUID REFERENCES chuyen_gia_y_te(id),
    phong_id BIGINT REFERENCES phong(id),
    ngay_gio_bat_dau TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    ngay_gio_ket_thuc TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    ly_do_kham TEXT,
    anh_dinh_kem_url TEXT,
    trang_thai VARCHAR(30) NOT NULL DEFAULT 'cho_xac_nhan',
    dang_ky_goi_id UUID,
    ghi_chu_dat_lich TEXT,
    ghi_chu_noi_bo TEXT,
    thoi_gian_checkin TIMESTAMP WITHOUT TIME ZONE,
    thoi_gian_huy TIMESTAMP WITHOUT TIME ZONE,
    ly_do_huy TEXT,
    nguoi_tao VARCHAR(20) NOT NULL DEFAULT 'khach_hang',
    thoi_gian_tao TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    chan_doan TEXT,
    chong_chi_dinh TEXT,
    khuyen_nghi_dich_vu_id UUID REFERENCES dich_vu(id),
    khuyen_nghi_goi_id UUID
);

-- 10. lich_lam_viec
CREATE TABLE lich_lam_viec (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nguoi_dung_id UUID NOT NULL REFERENCES nguoi_dung(id),
    ngay DATE NOT NULL,
    gio_bat_dau TIME NOT NULL,
    gio_ket_thuc TIME NOT NULL,
    trang_thai VARCHAR(20) DEFAULT 'hoat_dong'
);

-- 11. goi_dich_vu
CREATE TABLE goi_dich_vu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ten_goi VARCHAR(200) NOT NULL,
    ma_goi VARCHAR(30) UNIQUE NOT NULL,
    mo_ta TEXT,
    tong_so_buoi INTEGER NOT NULL,
    gia_goi BIGINT NOT NULL,
    gia_goc BIGINT,
    han_dung_thang INTEGER NOT NULL DEFAULT 6,
    hien_thi_website BOOLEAN NOT NULL DEFAULT TRUE,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'hoat_dong',
    chi_tiet_dich_vu JSONB DEFAULT '[]'::JSONB,
    thoi_gian_tao TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    danh_muc_id BIGINT REFERENCES danh_muc_dich_vu(id)
);

-- 12. goi_dich_vu_chi_tiet
CREATE TABLE goi_dich_vu_chi_tiet (
    id SERIAL PRIMARY KEY,
    goi_dich_vu_id UUID REFERENCES goi_dich_vu(id) ON DELETE CASCADE,
    dich_vu_id UUID REFERENCES dich_vu(id),
    so_buoi_trong_goi INTEGER DEFAULT 1
);

-- Add reference for khuyen_nghi_goi_id in lich_dat now that goi_dich_vu is created
ALTER TABLE lich_dat ADD CONSTRAINT lich_dat_khuyen_nghi_goi_id_fkey FOREIGN KEY (khuyen_nghi_goi_id) REFERENCES goi_dich_vu(id);

-- 13. lich_dieu_tri
CREATE TABLE lich_dieu_tri (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    khach_hang_id UUID NOT NULL REFERENCES khach_hang(id),
    loai_dieu_tri VARCHAR(20) NOT NULL,
    dich_vu_id UUID REFERENCES dich_vu(id),
    goi_dich_vu_id UUID REFERENCES goi_dich_vu(id),
    tong_so_buoi INTEGER NOT NULL,
    so_buoi_da_dung INTEGER NOT NULL DEFAULT 0,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'dang_dieu_tri',
    thoi_gian_tao TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    ma_lich_dieu_tri VARCHAR(20) UNIQUE,
    phong_id BIGINT REFERENCES phong(id),
    ho_ten_khach VARCHAR(150),
    so_dien_thoai VARCHAR(20),
    ghi_chu_noi_bo TEXT,
    lich_dat_id UUID REFERENCES lich_dat(id),
    ngay_bat_dau TIMESTAMP WITHOUT TIME ZONE,
    ngay_ket_thuc TIMESTAMP WITHOUT TIME ZONE
);

-- 14. buoi_tri_lieu
CREATE TABLE buoi_tri_lieu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lich_dieu_tri_id UUID NOT NULL REFERENCES lich_dieu_tri(id),
    khach_hang_id UUID NOT NULL REFERENCES khach_hang(id),
    ky_thuat_vien_id UUID NOT NULL REFERENCES chuyen_gia_y_te(id),
    phong_id BIGINT REFERENCES phong(id),
    dich_vu_id UUID REFERENCES dich_vu(id),
    thoi_gian_bat_dau TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    thoi_gian_ket_thuc TIMESTAMP WITHOUT TIME ZONE,
    danh_gia_truoc_buoi INTEGER,
    danh_gia_sau_buoi INTEGER,
    danh_gia_hieu_qua INTEGER,
    so_thu_tu_buoi INTEGER,
    danh_gia_id UUID,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'dang_thuc_hien',
    canh_bao_dac_biet TEXT,
    ai_tom_tat_ngan VARCHAR(300),
    thoi_gian_ghi_chu TIMESTAMP WITHOUT TIME ZONE
);

-- 15. danh_gia_dich_vu
CREATE TABLE danh_gia_dich_vu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buoi_tri_lieu_id UUID NOT NULL REFERENCES buoi_tri_lieu(id),
    khach_hang_id UUID NOT NULL REFERENCES khach_hang(id),
    ky_thuat_vien_id UUID NOT NULL REFERENCES chuyen_gia_y_te(id),
    so_sao_tong INTEGER NOT NULL,
    so_sao_ktv INTEGER,
    nhan_xet TEXT,
    hieu_qua_dieu_tri VARCHAR(30),
    se_quay_lai BOOLEAN,
    hien_thi_cong_khai BOOLEAN NOT NULL DEFAULT FALSE,
    thoi_gian_danh_gia TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- 16. hoa_don
CREATE TABLE hoa_don (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_hoa_don VARCHAR(20) NOT NULL,
    khach_hang_id UUID NOT NULL REFERENCES khach_hang(id),
    loai_hoa_don VARCHAR(20) NOT NULL,
    lich_dat_id UUID REFERENCES lich_dat(id),
    dang_ky_goi_id UUID,
    tong_tien_truoc_giam BIGINT NOT NULL DEFAULT 0,
    so_tien_giam BIGINT NOT NULL DEFAULT 0,
    tong_tien_thanh_toan BIGINT NOT NULL,
    da_thanh_toan BIGINT NOT NULL DEFAULT 0,
    trang_thai VARCHAR(30) NOT NULL DEFAULT 'chua_thanh_toan',
    ghi_chu TEXT,
    ngay_tao TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    ngay_thanh_toan TIMESTAMP WITHOUT TIME ZONE,
    thu_boi UUID
);

-- 17. thanh_toan
CREATE TABLE thanh_toan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_giao_dich VARCHAR(50) NOT NULL,
    hoa_don_id UUID NOT NULL REFERENCES hoa_don(id),
    so_tien BIGINT NOT NULL,
    phuong_thuc VARCHAR(20) NOT NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'cho_xu_ly',
    ma_tham_chieu VARCHAR(100),
    nguoi_thu_tien_id UUID,
    thoi_gian_giao_dich TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    ghi_chu TEXT
);

-- 18. voucher
CREATE TABLE voucher (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_voucher VARCHAR(50) NOT NULL,
    ten_chien_dich VARCHAR(200),
    loai_giam VARCHAR(20) NOT NULL,
    gia_tri_giam BIGINT NOT NULL,
    giam_toi_da BIGINT,
    don_hang_toi_thieu BIGINT NOT NULL DEFAULT 0,
    ap_dung_cho VARCHAR(30) NOT NULL DEFAULT 'tat_ca',
    so_luong_toi_da INTEGER,
    so_luong_da_dung INTEGER NOT NULL DEFAULT 0,
    ngay_bat_dau DATE NOT NULL,
    ngay_het_han DATE,
    tao_boi UUID NOT NULL REFERENCES nguoi_dung(id),
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'hoat_dong',
    thoi_gian_tao TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- 19. otp_codes
CREATE TABLE otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 20. refresh_tokens
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    nguoi_dung_id UUID NOT NULL REFERENCES nguoi_dung(id),
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 21. hoa_don_chi_tiet
CREATE TABLE hoa_don_chi_tiet (
    id BIGSERIAL PRIMARY KEY,
    hoa_don_id UUID NOT NULL REFERENCES hoa_don(id),
    mo_ta VARCHAR(300) NOT NULL,
    don_gia BIGINT NOT NULL,
    so_luong INTEGER NOT NULL DEFAULT 1,
    thanh_tien BIGINT NOT NULL,
    dich_vu_id UUID REFERENCES dich_vu(id)
);

-- 22. thiet_bi_y_te
CREATE TABLE thiet_bi_y_te (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_thiet_bi VARCHAR(20) UNIQUE NOT NULL,
    ten_thiet_bi VARCHAR(100) NOT NULL,
    loai_thiet_bi VARCHAR(100),
    ngay_mua DATE,
    ngay_bao_tri_tiep_theo DATE,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'san_sang',
    phong_id_hien_tai BIGINT,
    ghi_chu TEXT,
    thoi_gian_tao TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- 23. system_audit_log
CREATE TABLE system_audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES nguoi_dung(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    payload TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);
