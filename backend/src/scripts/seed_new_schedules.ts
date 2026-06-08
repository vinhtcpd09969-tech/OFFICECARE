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

    // 3. Tạo danh sách các ngày trong 30 ngày tới bắt đầu từ 2026-06-01
    const generateDays = (startDateStr: string, count: number): string[] => {
      const days = [];
      const start = new Date(startDateStr);
      for (let i = 0; i < count; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        days.push(`${y}-${m}-${day}`);
      }
      return days;
    };
    const days = generateDays('2026-06-01', 30);

    // 4. Định nghĩa các ca trực chuẩn cho Bác sĩ, Lễ tân và KTV
    const SHIFTS = {
      morning: { gio_bat_dau: '07:00', gio_ket_thuc: '16:00', trang_thai: 'hoat_dong' },
      afternoon: { gio_bat_dau: '11:00', gio_ket_thuc: '20:00', trang_thai: 'hoat_dong' },
      le_tan_morning: { gio_bat_dau: '07:00', gio_ket_thuc: '12:00', trang_thai: 'hoat_dong' },
      le_tan_afternoon: { gio_bat_dau: '12:00', gio_ket_thuc: '20:00', trang_thai: 'hoat_dong' },
      dayoff: { gio_bat_dau: '00:00', gio_ket_thuc: '00:00', trang_thai: 'tam_nghi' }
    };

    // 5. Phân bổ lịch trực luân phiên
    let scheduleCount = 0;

    // Tìm danh sách lễ tân và sắp xếp theo ho_ten/id
    const receptionists = staff.filter(s => s.ma_vai_tro === 'le_tan').sort((a, b) => a.ho_ten.localeCompare(b.ho_ten));

    for (const member of staff) {
      console.log(`Setting schedule for: ${member.ho_ten} (${member.vai_tro})`);
      
      days.forEach((day, index) => {
        const dateObj = new Date(day);
        const dayOfWeek = (dateObj.getDay() + 6) % 7; // 0 = T2, 1 = T3, ..., 5 = T7, 6 = CN
        
        // Mặc định chủ nhật được nghỉ
        if (dayOfWeek === 6) {
          return;
        }

        let shift = SHIFTS.morning;

        if (member.ma_vai_tro === 'bac_si') {
          // Bác sĩ làm xen kẽ sáng chiều
          shift = dayOfWeek % 2 === 0 ? SHIFTS.morning : SHIFTS.afternoon;
        } else if (member.ma_vai_tro === 'le_tan') {
          // Lễ tân: xoay ca xen kẽ sáng chiều và so le ca nghỉ giữa Lễ tân 1 và Lễ tân 2
          const repIndex = receptionists.findIndex(r => r.id === member.id);
          if (repIndex === 0) {
            // Lễ tân 1: Nghỉ phép thứ 4 (dayOfWeek = 2)
            if (dayOfWeek === 2) {
              shift = SHIFTS.dayoff;
            } else {
              shift = dayOfWeek % 2 === 0 ? SHIFTS.le_tan_morning : SHIFTS.le_tan_afternoon;
            }
          } else {
            // Lễ tân 2: Nghỉ phép thứ 5 (dayOfWeek = 3)
            if (dayOfWeek === 3) {
              shift = SHIFTS.dayoff;
            } else {
              shift = dayOfWeek % 2 === 0 ? SHIFTS.le_tan_afternoon : SHIFTS.le_tan_morning;
            }
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
