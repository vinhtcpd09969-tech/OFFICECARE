const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const before = await client.query(`
      SELECT (SELECT COUNT(*) FROM danh_gia_goi_dich_vu) AS goi,
             (SELECT COUNT(*) FROM danh_gia_nhan_su) AS nhansu
    `);
    const expectedTotal = Number(before.rows[0].goi) + Number(before.rows[0].nhansu);
    console.log(`Trước migrate: danh_gia_goi_dich_vu=${before.rows[0].goi}, danh_gia_nhan_su=${before.rows[0].nhansu}, tổng=${expectedTotal}`);

    await client.query(`
      CREATE TABLE danh_gia (
        id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        loai_danh_gia      VARCHAR(20) NOT NULL,
        khach_hang_id      UUID NOT NULL REFERENCES khach_hang(id) ON DELETE CASCADE,
        goi_dich_vu_id     UUID REFERENCES goi_dich_vu(id) ON DELETE CASCADE,
        nhan_su_id         INT REFERENCES nguoi_dung(id) ON DELETE CASCADE,
        cuoc_hen_id        UUID REFERENCES cuoc_hen(id) ON DELETE SET NULL,
        so_sao             INT NOT NULL,
        nhan_xet           TEXT,
        ngay_tao           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ngay_cap_nhat      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        phan_hoi_nhan_xet  TEXT,
        nguoi_phan_hoi_id  INT REFERENCES nguoi_dung(id) ON DELETE SET NULL,
        ngay_phan_hoi      TIMESTAMPTZ,
        cam_xuc            VARCHAR(20),
        do_tin_cay         DOUBLE PRECISION,
        ly_do_cam_xuc      TEXT,
        de_xuat_hanh_dong  TEXT,
        de_xuat_phan_hoi   TEXT,
        CONSTRAINT chk_danh_gia_loai CHECK (
          (loai_danh_gia = 'GOI_DICH_VU' AND goi_dich_vu_id IS NOT NULL AND nhan_su_id IS NULL)
          OR
          (loai_danh_gia = 'NHAN_SU' AND nhan_su_id IS NOT NULL AND goi_dich_vu_id IS NULL)
        )
      )
    `);

    await client.query(`
      CREATE UNIQUE INDEX danh_gia_khach_goi_uniq ON danh_gia (khach_hang_id, goi_dich_vu_id) WHERE loai_danh_gia = 'GOI_DICH_VU'
    `);
    await client.query(`
      CREATE UNIQUE INDEX danh_gia_khach_nhansu_uniq ON danh_gia (khach_hang_id, nhan_su_id) WHERE loai_danh_gia = 'NHAN_SU'
    `);

    await client.query(`
      INSERT INTO danh_gia (
        id, loai_danh_gia, khach_hang_id, goi_dich_vu_id, nhan_su_id, cuoc_hen_id,
        so_sao, nhan_xet, ngay_tao, ngay_cap_nhat, phan_hoi_nhan_xet, nguoi_phan_hoi_id,
        ngay_phan_hoi, cam_xuc, do_tin_cay, ly_do_cam_xuc, de_xuat_hanh_dong, de_xuat_phan_hoi
      )
      SELECT
        id, 'GOI_DICH_VU', khach_hang_id, goi_dich_vu_id, NULL, cuoc_hen_id,
        so_sao, nhan_xet, ngay_tao, ngay_cap_nhat, phan_hoi_nhan_xet, nguoi_phan_hoi_id,
        ngay_phan_hoi, cam_xuc, do_tin_cay, ly_do_cam_xuc, de_xuat_hanh_dong, de_xuat_phan_hoi
      FROM danh_gia_goi_dich_vu
    `);

    await client.query(`
      INSERT INTO danh_gia (
        id, loai_danh_gia, khach_hang_id, goi_dich_vu_id, nhan_su_id, cuoc_hen_id,
        so_sao, nhan_xet, ngay_tao, ngay_cap_nhat, phan_hoi_nhan_xet, nguoi_phan_hoi_id,
        ngay_phan_hoi, cam_xuc, do_tin_cay, ly_do_cam_xuc, de_xuat_hanh_dong, de_xuat_phan_hoi
      )
      SELECT
        id, 'NHAN_SU', khach_hang_id, NULL, nhan_su_id, cuoc_hen_id,
        so_sao, nhan_xet, ngay_tao, ngay_cap_nhat, phan_hoi_nhan_xet, nguoi_phan_hoi_id,
        ngay_phan_hoi, cam_xuc, do_tin_cay, ly_do_cam_xuc, de_xuat_hanh_dong, de_xuat_phan_hoi
      FROM danh_gia_nhan_su
    `);

    const after = await client.query('SELECT COUNT(*) AS total FROM danh_gia');
    const actualTotal = Number(after.rows[0].total);
    console.log(`Sau migrate: danh_gia=${actualTotal} (kỳ vọng ${expectedTotal})`);

    if (actualTotal !== expectedTotal) {
      throw new Error(`SỐ DÒNG KHÔNG KHỚP: kỳ vọng ${expectedTotal}, thực tế ${actualTotal} — rollback.`);
    }

    // Đổi tên 2 bảng cũ thành _old thay vì xóa ngay, để có thể đối chiếu/khôi phục nếu cần.
    await client.query('ALTER TABLE danh_gia_goi_dich_vu RENAME TO danh_gia_goi_dich_vu_old');
    await client.query('ALTER TABLE danh_gia_nhan_su RENAME TO danh_gia_nhan_su_old');

    await client.query('COMMIT');
    console.log('✅ Migrate thành công. 2 bảng cũ đã đổi tên thành *_old (chưa xóa dữ liệu).');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Lỗi, đã rollback toàn bộ:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
