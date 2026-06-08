import { pool } from '../config/db';

async function main() {
  try {
    console.log('=== TRACING ROLE AND DOCTOR DATA ===');
    const { rows: roles } = await pool.query('SELECT id, ma_vai_tro, ten_hien_thi FROM vai_tro');
    console.log('Roles:');
    console.table(roles);

    const { rows: doctors } = await pool.query(`
      SELECT cg.id AS doctor_id, cg.nguoi_dung_id, nd.ho_ten, nd.vai_tro_id, cg.trang_thai
      FROM chuyen_gia_y_te cg
      JOIN nguoi_dung nd ON cg.nguoi_dung_id = nd.id
    `);
    console.log('\nChuyen gia y te:');
    console.table(doctors);

    const { rows: rooms } = await pool.query("SELECT id, ten_phong, trang_thai FROM phong");
    console.log('\nRooms:');
    console.table(rooms);

    console.log('\n=== TRACING GET_BOOKED_SLOTS LOGIC FOR TODAY ===');
    const dateStr = new Date().toISOString().split('T')[0];
    console.log(`Target Date: ${dateStr}`);

    // 1. Get active doctors (vai_tro_id = 4)
    const docQuery = `
      SELECT cg.id AS doctor_id, cg.nguoi_dung_id, nd.ho_ten
      FROM chuyen_gia_y_te cg
      JOIN nguoi_dung nd ON cg.nguoi_dung_id = nd.id
      WHERE nd.vai_tro_id = 4 AND cg.trang_thai = 'hoat_dong'
    `;
    const docRes = await pool.query(docQuery);
    console.log('Query active doctors with role_id = 4 result:', docRes.rows);

    // Let's also check if doctor role_id in database is actually 4 or something else
    const doctorRole = roles.find(r => r.ma_vai_tro === 'bac_si');
    console.log(`Doctor Role in Database has ID: ${doctorRole ? doctorRole.id : 'NOT FOUND'}`);

    // 2. Query schedules
    const schedQuery = `
      SELECT id, nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai
      FROM lich_lam_viec
      WHERE DATE(ngay) = $1::date AND trang_thai = 'hoat_dong'
    `;
    const schedRes = await pool.query(schedQuery, [dateStr]);
    console.log('\nSchedules found in database for today:', schedRes.rows);

    // 3. Test slot tracing
    const timeSlots = ['08:00', '09:00', '14:00'];
    for (const slot of timeSlots) {
      console.log(`\n--- Tracing Slot ${slot} ---`);
      
      // Filter scheduled doctors
      const scheduledDoctors = docRes.rows.filter(doc => {
        const docScheds = schedRes.rows.filter(s => s.nguoi_dung_id === doc.nguoi_dung_id);
        console.log(`  Doctor ${doc.ho_ten} schedules:`, docScheds);
        
        // Find if any covers the slot
        const docSched = schedRes.rows.find(s => s.nguoi_dung_id === doc.nguoi_dung_id);
        if (!docSched) return false;
        const dutyStart = docSched.gio_bat_dau.substring(0, 5);
        const dutyEnd = docSched.gio_ket_thuc.substring(0, 5);
        const covers = dutyStart <= slot && dutyEnd >= slot;
        console.log(`  Does it cover slot? ${covers} (dutyStart: ${dutyStart}, dutyEnd: ${dutyEnd})`);
        return covers;
      });

      console.log(`  Scheduled doctors for slot ${slot}:`, scheduledDoctors);
      console.log(`  Free rooms count: ${rooms.filter(r => r.trang_thai === 'san_sang').length}`);
    }

  } catch (err) {
    console.error('Error during tracing:', err);
  } finally {
    await pool.end();
  }
}

main();
