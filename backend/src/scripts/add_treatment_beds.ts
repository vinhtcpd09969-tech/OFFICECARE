import { pool } from '../config/db';

async function addTreatmentBeds() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 6);
    const dateStr = nextDate.toISOString().split('T')[0];

    const beds = [
      { ma: 'EQP-BED01', ten: 'Giường trị liệu điện chỉnh cao thấp Gharieni', phong: 'P201' },
      { ma: 'EQP-BED02', ten: 'Giường trị liệu điện chỉnh cao thấp Gharieni', phong: 'P202' },
      { ma: 'EQP-BED03', ten: 'Giường trị liệu điện chỉnh cao thấp Gharieni', phong: 'P203' },
      { ma: 'EQP-BED04', ten: 'Giường trị liệu điện chỉnh cao thấp Gharieni', phong: 'P204' },
    ];

    const { rows: rooms } = await client.query('SELECT id, ma_phong FROM phong');
    const roomMap = new Map<string, string>(rooms.map(r => [r.ma_phong, r.id]));

    for (const b of beds) {
      const phongId = roomMap.get(b.phong);
      await client.query(
        `INSERT INTO thiet_bi_y_te (ma_thiet_bi, ten_thiet_bi, loai_thiet_bi, ngay_mua, ngay_bao_tri_tiep_theo, trang_thai, phong_id_hien_tai, ghi_chu)
         VALUES ($1, $2, 'Giường trị liệu', NOW() - INTERVAL '1 year', $3, 'san_sang', $4, 'Giường điều chỉnh độ cao bằng điện, có nhám chống trượt, bọc da y tế cao cấp.')`,
        [b.ma, b.ten, dateStr, phongId ? Number(phongId) : null]
      );
      console.log(`- Đã thêm: [${b.ma}] "${b.ten}" -> Phòng ${b.phong}`);
    }

    await client.query('COMMIT');
    console.log('\n✅ Đã thêm 4 giường trị liệu vào hệ thống!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Lỗi:', e);
  } finally {
    client.release();
    await pool.end();
  }
}

addTreatmentBeds();
