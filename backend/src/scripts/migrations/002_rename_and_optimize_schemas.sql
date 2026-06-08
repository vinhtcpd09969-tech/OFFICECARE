-- PostgreSQL Migration: 002_rename_and_optimize_schemas.sql
-- Goal: Rename ho_so_benh_an to ho_so_dieu_tri, rename bac_si_id to chuyen_gia_id, and remove duplicate columns in lich_dieu_tri.

BEGIN;

-- 1. Rename table ho_so_benh_an to ho_so_dieu_tri
ALTER TABLE ho_so_benh_an RENAME TO ho_so_dieu_tri;

-- Rename primary key constraint
ALTER TABLE ho_so_dieu_tri RENAME CONSTRAINT ho_so_benh_an_pkey TO ho_so_dieu_tri_pkey;
ALTER TABLE ho_so_dieu_tri RENAME CONSTRAINT ho_so_benh_an_lich_dat_id_key TO ho_so_dieu_tri_lich_dat_id_key;

-- Rename index
ALTER INDEX IF EXISTS idx_hsba_lich_dat RENAME TO idx_hsdt_lich_dat;

-- 2. Rename bac_si_id to chuyen_gia_id in ho_so_dieu_tri
ALTER TABLE ho_so_dieu_tri RENAME COLUMN bac_si_id TO chuyen_gia_id;

-- Recreate foreign key constraints of the renamed table with clean names
ALTER TABLE ho_so_dieu_tri RENAME CONSTRAINT fk_hsba_bac_si TO fk_hsdt_chuyen_gia;
ALTER TABLE ho_so_dieu_tri RENAME CONSTRAINT fk_hsba_dich_vu TO fk_hsdt_dich_vu;
ALTER TABLE ho_so_dieu_tri RENAME CONSTRAINT fk_hsba_goi_dich_vu TO fk_hsdt_goi_dich_vu;
ALTER TABLE ho_so_dieu_tri RENAME CONSTRAINT fk_hsba_lich_dat TO fk_hsdt_lich_dat;

-- 3. Update lich_dieu_tri to reference ho_so_dieu_tri instead of ho_so_benh_an
ALTER TABLE lich_dieu_tri RENAME COLUMN ho_so_benh_an_id TO ho_so_dieu_tri_id;
ALTER TABLE lich_dieu_tri RENAME CONSTRAINT fk_ldt_hsba TO fk_ldt_hsdt;
ALTER INDEX IF EXISTS idx_ldt_hsba RENAME TO idx_ldt_hsdt;

-- 4. Remove duplicate attributes in lich_dieu_tri
ALTER TABLE lich_dieu_tri DROP COLUMN IF EXISTS ho_ten_khach;
ALTER TABLE lich_dieu_tri DROP COLUMN IF EXISTS so_dien_thoai;
ALTER TABLE lich_dieu_tri DROP COLUMN IF EXISTS goi_dich_vu_id;
ALTER TABLE lich_dieu_tri DROP COLUMN IF EXISTS dich_vu_id;
ALTER TABLE lich_dieu_tri DROP COLUMN IF EXISTS lich_dat_id;

COMMIT;
