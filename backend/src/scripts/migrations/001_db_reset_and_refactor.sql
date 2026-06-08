-- SQL Migration: Reset and Refactor Database for PhysioFlow
-- Author: Database Architect

-- 1. Truncate all transactional tables to clean up old demo data
TRUNCATE TABLE thanh_toan CASCADE;
TRUNCATE TABLE hoa_don CASCADE;
TRUNCATE TABLE buoi_dich_vu_su_dung CASCADE;
TRUNCATE TABLE buoi_tri_lieu_dich_vu CASCADE;
TRUNCATE TABLE buoi_tri_lieu CASCADE;
TRUNCATE TABLE lich_dieu_tri CASCADE;
TRUNCATE TABLE lich_dat CASCADE;
TRUNCATE TABLE danh_gia_dich_vu CASCADE;

-- 2. Drop old clinical fields from lich_dat
ALTER TABLE lich_dat DROP COLUMN IF EXISTS chan_doan;
ALTER TABLE lich_dat DROP COLUMN IF EXISTS chong_chi_dinh;
ALTER TABLE lich_dat DROP COLUMN IF EXISTS khuyen_nghi_dich_vu_id;
ALTER TABLE lich_dat DROP COLUMN IF EXISTS khuyen_nghi_goi_id;

-- 3. Create the new ho_so_benh_an table (1:1 with lich_dat)
CREATE TABLE IF NOT EXISTS ho_so_benh_an (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lich_dat_id           UUID UNIQUE NOT NULL,
  bac_si_id             UUID,
  chan_doan             TEXT,
  chong_chi_dinh        TEXT,
  goi_dich_vu_id        UUID,
  dich_vu_id            UUID,
  ghi_chu               TEXT,
  thoi_gian_tao         TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_hsba_lich_dat FOREIGN KEY (lich_dat_id) REFERENCES lich_dat(id) ON DELETE CASCADE,
  CONSTRAINT fk_hsba_bac_si FOREIGN KEY (bac_si_id) REFERENCES chuyen_gia_y_te(id) ON DELETE SET NULL,
  CONSTRAINT fk_hsba_goi_dich_vu FOREIGN KEY (goi_dich_vu_id) REFERENCES goi_dich_vu(id) ON DELETE SET NULL,
  CONSTRAINT fk_hsba_dich_vu FOREIGN KEY (dich_vu_id) REFERENCES dich_vu(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_hsba_lich_dat ON ho_so_benh_an(lich_dat_id);

-- 4. Update lich_dieu_tri table to reference ho_so_benh_an
ALTER TABLE lich_dieu_tri ADD COLUMN IF NOT EXISTS ho_so_benh_an_id UUID;

-- Drop foreign key constraint if it exists and recreate
ALTER TABLE lich_dieu_tri DROP CONSTRAINT IF EXISTS fk_ldt_hsba;
ALTER TABLE lich_dieu_tri ADD CONSTRAINT fk_ldt_hsba FOREIGN KEY (ho_so_benh_an_id) REFERENCES ho_so_benh_an(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ldt_hsba ON lich_dieu_tri(ho_so_benh_an_id);

-- 5. Merge buoi_dich_vu_su_dung into buoi_tri_lieu_dich_vu and drop the former
-- Add approval columns to buoi_tri_lieu_dich_vu
ALTER TABLE buoi_tri_lieu_dich_vu ADD COLUMN IF NOT EXISTS ktv_id UUID;
ALTER TABLE buoi_tri_lieu_dich_vu DROP CONSTRAINT IF EXISTS fk_btldv_ktv;
ALTER TABLE buoi_tri_lieu_dich_vu ADD CONSTRAINT fk_btldv_ktv FOREIGN KEY (ktv_id) REFERENCES chuyen_gia_y_te(id) ON DELETE SET NULL;

ALTER TABLE buoi_tri_lieu_dich_vu ADD COLUMN IF NOT EXISTS loai_dich_vu_su_dung VARCHAR(20) DEFAULT 'trong_goi';
ALTER TABLE buoi_tri_lieu_dich_vu ADD COLUMN IF NOT EXISTS trang_thai VARCHAR(20) DEFAULT 'da_duyet';
ALTER TABLE buoi_tri_lieu_dich_vu ADD COLUMN IF NOT EXISTS ghi_chu_ly_do TEXT;

ALTER TABLE buoi_tri_lieu_dich_vu ADD COLUMN IF NOT EXISTS duyet_boi UUID;
ALTER TABLE buoi_tri_lieu_dich_vu DROP CONSTRAINT IF EXISTS fk_btldv_duyet_boi;
ALTER TABLE buoi_tri_lieu_dich_vu ADD CONSTRAINT fk_btldv_duyet_boi FOREIGN KEY (duyet_boi) REFERENCES nguoi_dung(id) ON DELETE SET NULL;

ALTER TABLE buoi_tri_lieu_dich_vu ADD COLUMN IF NOT EXISTS duyet_luc TIMESTAMPTZ;

-- Drop the old table completely
DROP TABLE IF EXISTS buoi_dich_vu_su_dung CASCADE;
