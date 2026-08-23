import { pool } from '../config/db';
import { updateCompletedSessionsCount } from './appointment.repository';
import doctorRepository from './doctor.repository';

// UPSERT nhật ký buổi điều trị — dùng chung cho saveTreatmentRecord (hoàn thành, trong transaction)
// và saveTreatmentDraft (lưu nháp, ngoài transaction) để không lệch 2 bản sao của cùng 1 câu lệnh.
const UPSERT_NHAT_KY_SQL = `
  INSERT INTO nhat_ky_buoi_dieu_tri (cuoc_hen_id, nguoi_tao_id, ghi_chu, vas_truoc, vas_sau, du_lieu_tri_lieu)
  VALUES ($1, $2, $3, $4, $5, $6::jsonb)
  ON CONFLICT (cuoc_hen_id)
  DO UPDATE SET
    nguoi_tao_id = EXCLUDED.nguoi_tao_id,
    ghi_chu = EXCLUDED.ghi_chu,
    vas_truoc = EXCLUDED.vas_truoc,
    vas_sau = EXCLUDED.vas_sau,
    du_lieu_tri_lieu = EXCLUDED.du_lieu_tri_lieu
  RETURNING id;
`;

class TechnicianRepository {
  // 1. Lấy danh sách ca trị liệu chờ thực hiện hôm nay của KTV (hợp nhất với doctorRepository)
  async getTechnicianQueue(userId: string) {
    return await doctorRepository.getDoctorQueue(userId, 3);
  }

  // 2. Lấy danh sách lịch hẹn điều trị của KTV (hỗ trợ filter thời gian)
  async getTechnicianAppointments(userId: string, startDate?: string, endDate?: string) {
    const queryStr = `
      SELECT 
        ch.id,
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.trang_thai, ch.ghi_chu_khach_hang as ly_do_kham,
        ch.khach_hang_id, ch.phac_do_dieu_tri_id,
        kh.ho_ten as ten_khach_hang,
        kh.so_dien_thoai as so_dien_thoai,
        COALESCE(g.ten_goi, gpd.ten_goi) as ten_dich_vu,
        COALESCE(ch.thoi_luong_phut, g.thoi_luong_phut, gpd.thoi_luong_phut, 30) as thoi_luong_phut,
        nk.id as ho_so_dieu_tri_id, nk.id as ho_so_benh_an_id, nk.chan_doan, nk.chong_chi_dinh,
        ch.nhan_su_id as ky_thuat_vien_id,
        nk.ngay_tao as nhat_ky_ngay_tao
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN phac_do_dieu_tri pd ON ch.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu gpd ON pd.goi_dich_vu_id = gpd.id
      WHERE ch.nhan_su_id = $1::integer
        AND ch.loai = 'DIEU_TRI'
        AND ($2::timestamp IS NULL OR ch.ngay_gio_bat_dau >= $2::timestamp)
        AND ($3::timestamp IS NULL OR ch.ngay_gio_bat_dau <= $3::timestamp)
      ORDER BY ch.ngay_gio_bat_dau DESC;
    `;
    const { rows } = await pool.query(queryStr, [userId, startDate || null, endDate || null]);
    return rows;
  }

  // 2.4. Danh sách TOÀN BỘ ca trị liệu khác đang mở dở (trang_thai='dang_kham') của 1 nhân sự — A1b
  // cho KTV mở tối đa 2 "bàn trị liệu" song song (Chuyên viên vẫn 1, xem doctor.repository.ts riêng,
  // KHÔNG dùng chung hàm này). Trả về MẢNG (có thể rỗng/1/2 phần tử) để service tự đếm và quyết định,
  // không giới hạn LIMIT 1 ở tầng query nữa.
  async getActiveSessionForStaff(staffId: number, excludeAppointmentId: string | null) {
    const { rows } = await pool.query(
      `SELECT ch.id, 'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat, kh.ho_ten as ten_khach_hang
       FROM cuoc_hen ch
       LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
       WHERE ch.nhan_su_id = $1 AND ch.trang_thai = 'dang_kham' AND ($2::uuid IS NULL OR ch.id != $2::uuid)
       ORDER BY ch.thoi_gian_bat_dau ASC NULLS LAST`,
      [staffId, excludeAppointmentId || null]
    );
    return rows;
  }

  // 2.4b. Giờ tan ca HÔM NAY của nhân sự, CHỈ khi đang trong ca trực bao trùm thời điểm hiện tại —
  // dùng để cảnh báo MỀM (không chặn cứng) khi KTV mở bàn trị liệu thứ 2, xem "Ba lớp kiểm soát sức
  // chứa" trong kế hoạch. Không có ca trực nào bao trùm NOW() → trả null, bỏ qua cảnh báo (không suy
  // đoán).
  async getCurrentShiftEndForStaff(staffId: number): Promise<string | null> {
    const { rows } = await pool.query(
      `SELECT to_char(gio_ket_thuc, 'HH24:MI') as gio_ket_thuc
       FROM lich_truc_nhan_su
       WHERE nhan_su_id = $1::integer
         AND ngay_truc = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
         AND trang_thai = 'hoat_dong'
         AND gio_bat_dau <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::time
         AND gio_ket_thuc >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::time
       LIMIT 1`,
      [staffId]
    );
    return rows[0]?.gio_ket_thuc || null;
  }

  // 2.4c. Ghi vết "mở bàn 2 ngoài giờ ca, KTV đã xác nhận" vào ghi_chu_noi_bo (cột có sẵn) — biến
  // hành vi lách cảnh báo mềm thành dữ liệu quản trị cho Quản lý xem lại, không chặn thao tác.
  async appendGhiChuNoiBo(appointmentId: string, note: string) {
    await pool.query(
      `UPDATE cuoc_hen SET ghi_chu_noi_bo = TRIM(BOTH E'\n' FROM COALESCE(ghi_chu_noi_bo || E'\n', '') || $2) WHERE id = $1::uuid`,
      [appointmentId, note]
    );
  }

  // 2.5. Bắt đầu ca khám / điều trị (Cập nhật trạng thái đang khám, gán nhân sự nếu chưa gán, và tạo nhật ký)
  async startSession(appointmentId: string, staffId: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. Cập nhật trạng thái cuộc hẹn thành 'dang_kham', gán nhân sự (nếu đang Bất kỳ/NULL), và ghi mốc thoi_gian_bat_dau
      await client.query(`
        UPDATE cuoc_hen
        SET trang_thai = 'dang_kham',
            nhan_su_id = COALESCE(nhan_su_id, $2::integer),
            gan_qua_hang_doi = CASE WHEN nhan_su_id IS NULL THEN TRUE ELSE gan_qua_hang_doi END,
            thoi_gian_bat_dau = COALESCE(thoi_gian_bat_dau, NOW())
        WHERE id = $1::uuid;
      `, [appointmentId, staffId]);

      // 2. Đảm bảo phien_lam_viec có mốc thoi_gian_goi_vao
      await client.query(`
        UPDATE phien_lam_viec
        SET thoi_gian_goi_vao = COALESCE(thoi_gian_goi_vao, NOW())
        WHERE id = (
          SELECT id FROM phien_lam_viec 
          WHERE cuoc_hen_id = $1::uuid 
          ORDER BY lan_thu DESC, thoi_gian_tao DESC 
          LIMIT 1
        );
      `, [appointmentId]);

      await client.query(`
        INSERT INTO phien_lam_viec (cuoc_hen_id, lan_thu, thoi_gian_goi_vao, so_lan_goi_khong_co_mat, thoi_gian_tao)
        SELECT $1::uuid, 1, NOW(), 0, NOW()
        WHERE NOT EXISTS (SELECT 1 FROM phien_lam_viec WHERE cuoc_hen_id = $1::uuid);
      `, [appointmentId]);

      // 3. Tạo nhật ký buổi điều trị (nếu chưa có)
      await client.query(`
        INSERT INTO nhat_ky_buoi_dieu_tri (cuoc_hen_id, nguoi_tao_id, chan_doan, chong_chi_dinh, ghi_chu)
        VALUES ($1::uuid, $2::integer, '', '', '')
        ON CONFLICT (cuoc_hen_id) DO NOTHING;
      `, [appointmentId, staffId]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 3. Lấy chi tiết lịch trị liệu hiện tại (bao gồm cả chẩn đoán/chống chỉ định của Bác sĩ)
  // Chỉ SELECT thuần — việc chuyển trạng thái sang 'dang_kham' (startSession) phải đi qua guard
  // getActiveSessionForStaff ở service layer, không tự ý UPDATE ở đây (trước đây làm vậy khiến KTV
  // mở được nhiều "bàn trị liệu" cùng lúc vì guard không kịp chặn).
  async getAppointmentDetail(appointmentId: string) {
    const queryStr = `
      SELECT 
        ch.id, 
        'LH-' || UPPER(SUBSTRING(ch.id::text FROM 1 FOR 6)) as ma_lich_dat,
        kh.ho_ten as ho_ten_khach, kh.so_dien_thoai as so_dien_thoai, kh.gioi_tinh as gioi_tinh_khach,
        ch.ngay_gio_bat_dau, ch.ngay_gio_ket_thuc, ch.ghi_chu_khach_hang as ly_do_kham, ch.trang_thai, ch.anh_dinh_kem_url,
        ch.thoi_gian_tao, ch.thoi_gian_checkin, ch.thoi_gian_bat_dau, ch.thoi_gian_hoan_thanh,
        kh.id as khach_hang_id, kh.ngay_sinh, kh.gioi_tinh,
        kh.ho_ten as ten_khach_hang, kh.so_dien_thoai as sdt_khach_hang, NULL::text as avatar_url,
        nk.id as ho_so_dieu_tri_id, nk.id as ho_so_benh_an_id, nk.chan_doan, nk.chong_chi_dinh, nk.ghi_chu,
        nk.vas_truoc, nk.vas_sau, nk.du_lieu_tri_lieu,
        COALESCE(ch.goi_dich_vu_id, pd.goi_dich_vu_id, cd.goi_dich_vu_id) as goi_dich_vu_id,
        ch.phac_do_dieu_tri_id,
        ch.so_thu_tu_buoi,
        COALESCE(g.ten_goi, gpd.ten_goi) as ten_dich_vu,
        COALESCE(g.ten_goi, gpd.ten_goi) as ten_goi,
        COALESCE(g.quy_trinh, gpd.quy_trinh) as quy_trinh,
        COALESCE(g.muc_tieu, gpd.muc_tieu) as mo_ta_goi,
        COALESCE(ch.thoi_luong_phut, g.thoi_luong_phut, gpd.thoi_luong_phut, 30) as thoi_luong_phut,
        COALESCE(g.tong_so_buoi, pd.tong_so_buoi) as tong_so_buoi,
        pd.tong_so_buoi as pd_tong_so_buoi,
        nk.ngay_tao as nhat_ky_ngay_tao
      FROM cuoc_hen ch
      JOIN khach_hang kh ON ch.khach_hang_id = kh.id
      LEFT JOIN nhat_ky_buoi_dieu_tri nk ON nk.cuoc_hen_id = ch.id
      LEFT JOIN chi_dinh_buoi cd ON cd.nhat_ky_id = nk.id
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN phac_do_dieu_tri pd ON ch.phac_do_dieu_tri_id = pd.id
      LEFT JOIN goi_dich_vu gpd ON pd.goi_dich_vu_id = gpd.id
      WHERE ch.id = $1::uuid;
    `;
    const { rows } = await pool.query(queryStr, [appointmentId]);
    return rows[0] || null;
  }

  // 4. Lưu lượng giá VAS, nhật ký thao tác và ghi chú của KTV (Chạy trong transaction bảo toàn chẩn đoán của Bác sĩ)
  async saveTreatmentRecord(data: {
    lich_dat_id: string;
    ktv_id: string;
    vas_truoc: number;
    vas_sau: number;
    ghi_chu?: string | null;
    du_lieu_tri_lieu?: any;
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Chặn hoàn thành lại 1 ca đã ở trạng thái kết thúc (hoàn thành/hủy/không đến).
      const currentRes = await client.query('SELECT trang_thai FROM cuoc_hen WHERE id = $1', [data.lich_dat_id]);
      if (currentRes.rows.length === 0) {
        throw new Error('Không tìm thấy cuộc hẹn.');
      }
      if (['hoan_thanh', 'da_huy', 'khong_den'].includes(currentRes.rows[0].trang_thai)) {
        throw new Error('Ca trị liệu này đã kết thúc (hoàn thành/hủy/không đến), không thể chỉnh sửa hoặc hoàn thành lại.');
      }

      const duLieuTriLieuJson = data.du_lieu_tri_lieu ? JSON.stringify(data.du_lieu_tri_lieu) : null;

      // 1. Tạo hoặc cập nhật nhật ký buổi điều trị (UPSERT)
      const nkRes = await client.query(UPSERT_NHAT_KY_SQL, [
        data.lich_dat_id,
        parseInt(data.ktv_id, 10),
        data.ghi_chu || null,
        data.vas_truoc,
        data.vas_sau,
        duLieuTriLieuJson
      ]);
      const nhatKyId = nkRes.rows[0].id;

      // 2. Lấy thông tin phác đồ điều trị liên kết
      const getPdRes = await client.query('SELECT phac_do_dieu_tri_id FROM cuoc_hen WHERE id = $1', [data.lich_dat_id]);
      const phacDoId = getPdRes.rows[0]?.phac_do_dieu_tri_id;

      // 3. Cập nhật trạng thái cuộc hẹn thành 'hoan_thanh', bảo đảm mốc thoi_gian_bat_dau và thoi_gian_hoan_thanh
      const updateLdQuery = `
        UPDATE cuoc_hen 
        SET trang_thai = 'hoan_thanh',
            thoi_gian_bat_dau = COALESCE(thoi_gian_bat_dau, thoi_gian_checkin, NOW()),
            thoi_gian_hoan_thanh = COALESCE(thoi_gian_hoan_thanh, NOW())
        WHERE id = $1;
      `;
      await client.query(updateLdQuery, [data.lich_dat_id]);

      // 4. Nếu ca trị liệu thuộc 1 Phác đồ (gói liệu trình), đếm lại & tự chuyển trang_thai —
      // dùng đúng hàm dùng chung (khóa hàng, chặn race với receptionist/appointment repository
      // cùng đụng 1 phác đồ), không tự chép lại công thức ở đây nữa.
      if (phacDoId) {
        await updateCompletedSessionsCount(client, phacDoId);
      }

      await client.query('COMMIT');
      return { success: true, medicalRecordId: nhatKyId };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // 4b. Lưu NHÁP VAS/nhật ký/ghi chú — KHÔNG đổi trang_thai cuộc hẹn (vẫn 'dang_kham'), KHÔNG đếm lại
  // buổi phác đồ. Gọi định kỳ (debounce) từ bàn trị liệu trong lúc KTV đang làm, để rời trang giữa
  // chừng (qua Hàng đợi, "Bàn làm việc", F5...) vẫn khôi phục lại đúng dữ liệu khi mở lại đúng bàn đó
  // — thay cho việc chỉ giữ 2 bàn "mounted ẩn" trong 1 phiên trang (không sống sót qua điều hướng
  // route khác hẳn). Không chặn ca đã kết thúc bằng transaction riêng — nếu KTV bấm nháp đúng lúc ca
  // vừa hoàn thành ở tab khác thì UPSERT vẫn chạy vô hại (ghi đè nhật ký của chính ca đó), không có gì
  // để mất.
  async saveTreatmentDraft(data: {
    lich_dat_id: string;
    ktv_id: string;
    vas_truoc?: number | null;
    vas_sau?: number | null;
    ghi_chu?: string | null;
    du_lieu_tri_lieu?: any;
  }) {
    const duLieuTriLieuJson = data.du_lieu_tri_lieu ? JSON.stringify(data.du_lieu_tri_lieu) : null;
    await pool.query(UPSERT_NHAT_KY_SQL, [
      data.lich_dat_id,
      parseInt(data.ktv_id, 10),
      data.ghi_chu || null,
      data.vas_truoc ?? null,
      data.vas_sau ?? null,
      duLieuTriLieuJson,
    ]);
    return { success: true };
  }

  // 5. Lấy danh sách lịch trực của KTV
  async getTechnicianSchedules(userId: string) {
    const queryStr = `
      SELECT 
        id, nhan_su_id as nguoi_dung_id, to_char(ngay_truc, 'YYYY-MM-DD') as ngay, 
        to_char(gio_bat_dau, 'HH24:MI') as gio_bat_dau, to_char(gio_ket_thuc, 'HH24:MI') as gio_ket_thuc,
        trang_thai
      FROM lich_truc_nhan_su
      WHERE nhan_su_id = $1::integer AND ngay_truc >= CURRENT_DATE
      ORDER BY ngay_truc ASC;
    `;
    const { rows } = await pool.query(queryStr, [userId]);
    return rows;
  }

  // 6. Lấy thông tin phòng làm việc & danh sách thiết bị y tế thuộc phòng đó của nhân sự
  async getRoomAndEquipmentForStaff(staffId: number, appointmentId?: string | null) {
    const { rows: shiftRows } = await pool.query(
      `SELECT 
         COALESCE(ch.phong_id, lt.phong_id) as phong_id,
         p.ten_phong,
         p.ma_phong,
         p.loai_phong,
         to_char(COALESCE(lt.gio_bat_dau, '07:00'::time), 'HH24:MI') as gio_bat_dau,
         to_char(COALESCE(lt.gio_ket_thuc, '16:00'::time), 'HH24:MI') as gio_ket_thuc
       FROM nguoi_dung u
       LEFT JOIN cuoc_hen ch ON ch.id = $2 AND (ch.nhan_su_id = u.id OR ch.nhan_su_id IS NULL)
       LEFT JOIN LATERAL (
         SELECT lt_sub.phong_id, lt_sub.gio_bat_dau, lt_sub.gio_ket_thuc
         FROM lich_truc_nhan_su lt_sub
         WHERE lt_sub.nhan_su_id = u.id
           AND lt_sub.trang_thai = 'hoat_dong'
         ORDER BY 
           (CASE WHEN ch.id IS NOT NULL AND lt_sub.ngay_truc = DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') THEN 0 ELSE 1 END) ASC,
           ABS(lt_sub.ngay_truc - (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) ASC
         LIMIT 1
       ) lt ON TRUE
       LEFT JOIN phong_lam_viec p ON p.id = COALESCE(ch.phong_id, lt.phong_id)
       WHERE u.id = $1::integer`,
      [staffId, appointmentId || null]
    );

    if (shiftRows.length === 0 || !shiftRows[0].phong_id) {
      return {
        phong: null,
        thiet_bi: []
      };
    }

    const phongInfo = shiftRows[0];
    const { rows: equipRows } = await pool.query(
      `SELECT 
         id,
         ma_thiet_bi,
         ten_thiet_bi,
         trang_thai,
         ghi_chu
       FROM thiet_bi
       WHERE phong_id = $1::integer
       ORDER BY ten_thiet_bi ASC`,
      [phongInfo.phong_id]
    );

    return {
      phong: phongInfo,
      thiet_bi: equipRows
    };
  }
}

export default new TechnicianRepository();
