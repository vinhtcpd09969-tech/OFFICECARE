import { pool } from '../config/db';

async function migrateEquipmentMaintenance() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Add new columns
    await client.query(`
      ALTER TABLE thiet_bi_y_te
        ADD COLUMN IF NOT EXISTS co_the_di_chuyen BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS so_lan_su_dung INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS nguong_canh_bao INTEGER DEFAULT 80,
        ADD COLUMN IF NOT EXISTS nguong_bat_buoc_bao_tri INTEGER DEFAULT 100,
        ADD COLUMN IF NOT EXISTS tan_suat_bao_tri_ngay INTEGER DEFAULT 45,
        ADD COLUMN IF NOT EXISTS ngay_bao_tri_gan_nhat DATE,
        ADD COLUMN IF NOT EXISTS cap_rui_ro VARCHAR(20) DEFAULT 'trung_binh'
    `);
    console.log('✅ Đã thêm 7 cột mới vào thiet_bi_y_te');

    // 2. Giường trị liệu: cố định, rủi ro thấp, bảo trì 90 ngày
    const bedRes = await client.query(`
      UPDATE thiet_bi_y_te
      SET co_the_di_chuyen = false,
          cap_rui_ro       = 'thap',
          tan_suat_bao_tri_ngay = 90,
          nguong_canh_bao        = NULL,
          nguong_bat_buoc_bao_tri = NULL,
          ngay_bao_tri_gan_nhat  = CURRENT_DATE
      WHERE ma_thiet_bi IN ('EQP-BED01','EQP-BED02','EQP-BED03','EQP-BED04')
      RETURNING ma_thiet_bi
    `);
    console.log(`✅ Giường trị liệu cố định (${bedRes.rowCount} máy): rủi ro thấp, 90 ngày`);

    // 3. Máy cố định P205: rủi ro trung bình, 60 ngày, 150/200 lần
    const fixedRes = await client.query(`
      UPDATE thiet_bi_y_te
      SET co_the_di_chuyen = false,
          cap_rui_ro       = 'trung_binh',
          tan_suat_bao_tri_ngay = 60,
          nguong_canh_bao        = 150,
          nguong_bat_buoc_bao_tri = 200,
          ngay_bao_tri_gan_nhat  = CURRENT_DATE
      WHERE ma_thiet_bi IN ('EQP-DTS01','EQP-CST01','EQP-SIS01')
      RETURNING ma_thiet_bi
    `);
    console.log(`✅ Máy cố định P205 (${fixedRes.rowCount} máy): rủi ro trung bình, 60 ngày`);

    // 4. Thiết bị điện di động (rủi ro cao): 30 ngày, 80/100 lần
    const highRiskRes = await client.query(`
      UPDATE thiet_bi_y_te
      SET co_the_di_chuyen = true,
          cap_rui_ro       = 'cao',
          tan_suat_bao_tri_ngay = 30,
          nguong_canh_bao        = 80,
          nguong_bat_buoc_bao_tri = 100,
          ngay_bao_tri_gan_nhat  = CURRENT_DATE
      WHERE ma_thiet_bi IN ('EQP-LAS01','EQP-SW01','EQP-US01','EQP-ELT01','EQP-US02')
      RETURNING ma_thiet_bi
    `);
    console.log(`✅ Thiết bị điện cao cấp (${highRiskRes.rowCount} máy): rủi ro cao, 30 ngày`);

    // 5. Thiết bị di động rủi ro trung bình: 45 ngày, 120/150 lần
    const midRiskRes = await client.query(`
      UPDATE thiet_bi_y_te
      SET co_the_di_chuyen = true,
          cap_rui_ro       = 'trung_binh',
          tan_suat_bao_tri_ngay = 45,
          nguong_canh_bao        = 120,
          nguong_bat_buoc_bao_tri = 150,
          ngay_bao_tri_gan_nhat  = CURRENT_DATE
      WHERE ma_thiet_bi IN ('EQP-IR01','EQP-COM01')
      RETURNING ma_thiet_bi
    `);
    console.log(`✅ Hồng ngoại & Lymphastim (${midRiskRes.rowCount} máy): rủi ro trung bình, 45 ngày`);

    await client.query('COMMIT');
    console.log('\n🎉 Migration hoàn tất!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Migration thất bại:', e);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateEquipmentMaintenance();
