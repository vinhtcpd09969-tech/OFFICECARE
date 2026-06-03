import { pool } from '../config/db';

async function seedNewSchedules() {
  console.log('--- START SEEDING NEW SCHEDULES (2-SHIFT MODEL) ---');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Xóa toàn bộ lịch trực cũ
    console.log('Cleaning old schedules...');
    await client.query('DELETE FROM lich_lam_viec');

    // 2. Lấy danh sách nhân viên có vai trò Bác sĩ (4), Lễ tân (2), Kỹ thuật viên (3)
    console.log('Fetching staff list...');
    const { rows: staff } = await client.query(`
      SELECT nd.id, nd.ho_ten, vt.ma_vai_tro, vt.ten_hien_thi as vai_tro
      FROM nguoi_dung nd
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      WHERE nd.vai_tro_id IN (2, 3, 4) AND nd.deleted_at IS NULL
    `);

    console.log(`Found ${staff.length} staff members.`);

    // 3. Tạo danh sách các ngày của tuần hiện tại và tuần tới
    // Tuần hiện tại: 25-05-2026 đến 31-05-2026
    // Tuần tới: 01-06-2026 đến 07-06-2026
    const days = [
      // Tuần này
      '2026-05-25', '2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30', '2026-05-31',
      // Tuần sau
      '2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06', '2026-06-07'
    ];

    // 4. Định nghĩa các ca trực chuẩn
    const SHIFTS = {
      morning: { gio_bat_dau: '07:00', gio_ket_thuc: '15:30', trang_thai: 'hoat_dong' },
      afternoon: { gio_bat_dau: '11:30', gio_ket_thuc: '20:00', trang_thai: 'hoat_dong' },
      dayoff: { gio_bat_dau: '00:00', gio_ket_thuc: '00:00', trang_thai: 'tam_nghi' }
    };

    // 5. Phân bổ lịch trực luân phiên
    let scheduleCount = 0;

    for (const member of staff) {
      console.log(`Setting schedule for: ${member.ho_ten} (${member.vai_tro})`);
      
      days.forEach((day, index) => {
        const dayOfWeek = (index % 7); // 0 = T2, 1 = T3, ..., 5 = T7, 6 = CN
        
        // Mặc định chủ nhật được nghỉ
        if (dayOfWeek === 6) {
          return;
        }

        let shift = SHIFTS.morning;

        if (member.ma_vai_tro === 'bac_si') {
          // Bác sĩ làm xen kẽ sáng chiều
          shift = dayOfWeek % 2 === 0 ? SHIFTS.morning : SHIFTS.afternoon;
        } else if (member.ma_vai_tro === 'le_tan') {
          // Lễ tân: T4 nghỉ phép, các ngày khác làm sáng/chiều xen kẽ
          if (dayOfWeek === 2) {
            shift = SHIFTS.dayoff; // Nghỉ phép
          } else {
            shift = dayOfWeek % 2 === 0 ? SHIFTS.morning : SHIFTS.afternoon;
          }
        } else if (member.ma_vai_tro === 'ky_thuat_vien') {
          // Kỹ thuật viên: chia ca theo ID để luôn có người trực sáng và chiều
          const offset = parseInt(member.id.replace(/[^0-9]/g, '') || '0') % 2;
          shift = (dayOfWeek + offset) % 2 === 0 ? SHIFTS.morning : SHIFTS.afternoon;
          
          // Thỉnh thoảng có ngày nghỉ phép
          if (dayOfWeek === 4 && offset === 1) {
            shift = SHIFTS.dayoff;
          }
        }

        // Chèn vào bảng lich_lam_viec
        client.query(`
          INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai)
          VALUES ($1, $2, $3, $4, $5)
        `, [member.id, day, shift.gio_bat_dau, shift.gio_ket_thuc, shift.trang_thai]);
        
        scheduleCount++;
      });
    }

    await client.query('COMMIT');
    console.log(`--- SEED SUCCESS: Generated ${scheduleCount} new schedules! ---`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding schedules:', error);
  } finally {
    client.release();
  }
}

seedNewSchedules().then(() => process.exit(0));
