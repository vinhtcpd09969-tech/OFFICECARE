import { pool } from '../config/db';

async function profileQueries() {
  console.log("=== Profiling Optimized Queries with EXPLAIN ANALYZE ===");

  const queries = [
    {
      name: "getPackages (AdminRepository)",
      sql: `
        EXPLAIN ANALYZE
        SELECT g.*, g.gia_goi as gia_tien, dm.ten_danh_muc,
               COALESCE(
                 JSON_AGG(
                   JSON_BUILD_OBJECT(
                     'dich_vu_id', ct.dich_vu_id,
                     'thu_tu_thuc_hien', ct.thu_tu_thuc_hien,
                     'ten_dich_vu', dv.ten_dich_vu,
                     'don_gia', dv.don_gia
                   ) ORDER BY ct.thu_tu_thuc_hien ASC
                 ) FILTER (WHERE ct.dich_vu_id IS NOT NULL),
                 '[]'::json
               ) as chi_tiet_dich_vu
        FROM goi_dich_vu g
        LEFT JOIN danh_muc_dich_vu dm ON g.danh_muc_id = dm.id
        LEFT JOIN goi_dich_vu_chi_tiet ct ON g.id = ct.goi_dich_vu_id
        LEFT JOIN dich_vu dv ON ct.dich_vu_id = dv.id
        GROUP BY g.id, dm.ten_danh_muc
        ORDER BY g.thoi_gian_tao DESC
      `
    },
    {
      name: "getActivePackages (ReceptionistRepository)",
      sql: `
        EXPLAIN ANALYZE
        SELECT g.id, g.ten_goi, g.ma_goi, g.mo_ta, g.tong_so_buoi, g.gia_goi, g.gia_goc, g.han_dung_thang,
               COALESCE(
                 JSON_AGG(
                   JSON_BUILD_OBJECT(
                     'dich_vu_id', ct.dich_vu_id,
                     'thu_tu_thuc_hien', ct.thu_tu_thuc_hien,
                     'ten_dich_vu', dv.ten_dich_vu,
                     'don_gia', dv.don_gia
                   ) ORDER BY ct.thu_tu_thuc_hien ASC
                 ) FILTER (WHERE ct.dich_vu_id IS NOT NULL),
                 '[]'::json
               ) as chi_tiet_dich_vu
        FROM goi_dich_vu g
        LEFT JOIN goi_dich_vu_chi_tiet ct ON g.id = ct.goi_dich_vu_id
        LEFT JOIN dich_vu dv ON ct.dich_vu_id = dv.id
        WHERE g.trang_thai = 'hoat_dong'
        GROUP BY g.id
        ORDER BY g.ten_goi ASC
      `
    }
  ];

  try {
    for (const q of queries) {
      console.log(`\n--- Profiling query: ${q.name} ---`);
      const { rows } = await pool.query(q.sql);
      rows.forEach((row: any) => {
        console.log(row['QUERY PLAN']);
      });
    }
  } catch (err) {
    console.error("Profiling failed:", err);
  } finally {
    await pool.end();
  }
}

profileQueries();
