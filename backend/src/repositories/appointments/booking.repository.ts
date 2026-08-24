import { pool } from '../../config/db';
import bcrypt from 'bcryptjs';
import { getMinPaymentRequired } from '../../domain/billing';
import { TERMINAL_STATUSES } from '../../domain/appointmentStatus';
import { HinhThucThanhToanGoi, LoaiCuocHen } from '../../domain/types';
import {
  Buoi,
  GIO_NHAN_KHACH,
  KetQuaKiemTraDatLich,
  NhanSuTrucCa,
  NhomVaiTro,
  PhutDaDat,
  VAI_TRO_ID_KTV,
  kiemTraDatBatKy,
  kiemTraDatChoNhanSuCuThe,
  parseGioThanhPhut,
  resolveNhomVaiTro,
  tinhNganSachChung,
  tinhNganSachRieng,
  vaiTroIdCuaNhom,
} from '../../domain/capacity';

/**
 * Kiểm tra tính hợp lệ khi đặt buổi tiếp theo của gói liệu trình:
 * 1. Chặn nếu có ca hẹn đang hoạt động thuộc phác đồ này (chống đặt chồng chéo)
 * 2. Chặn nếu gói đã bị hủy hoặc hoàn tiền
 * 3. Chặn nếu gói đã quá hạn sử dụng
 * 4. Kiểm tra điều kiện số tiền đã trả tối thiểu theo hình thức thanh toán (tra_thang vs tung_buoi)
 */
export async function assertTreatmentPlanCanBookSession(
  phac_do_dieu_tri_id: string,
  so_thu_tu_buoi?: number,
  isClientFacing: boolean = false
): Promise<void> {
  const activeApptRes = await pool.query(
    `SELECT id, so_thu_tu_buoi, trang_thai 
     FROM cuoc_hen 
     WHERE phac_do_dieu_tri_id = $1 
       AND trang_thai IN ('da_xac_nhan', 'da_checkin', 'dang_kham', 'cho_tai_luong_gia')
     LIMIT 1`,
    [phac_do_dieu_tri_id]
  );
  if (activeApptRes.rows.length > 0) {
    const activeAppt = activeApptRes.rows[0];
    const who = isClientFacing ? 'Bạn' : 'Khách hàng';
    throw new Error(`${who} đã có lịch đặt cho buổi số ${activeAppt.so_thu_tu_buoi} đang hoạt động. Vui lòng hoàn thành hoặc hủy lịch hẹn cũ trước khi đặt buổi tiếp theo.`);
  }

  const invRes = await pool.query(
    `SELECT hd.hinh_thuc_thanh_toan_goi, hd.tong_tien_phai_tra, hd.so_tien_da_tra, hd.tong_tien_goc,
            hd.so_tien_giam_voucher, hd.trang_thai as hd_trang_thai,
            pd.tong_so_buoi, pd.trang_thai as pd_trang_thai, g.loai_goi,
            (pd.trang_thai = 'dang_dieu_tri' AND pd.han_su_dung IS NOT NULL AND pd.han_su_dung < CURRENT_DATE) as qua_han,
            pd.han_su_dung
     FROM hoa_don hd
     JOIN phac_do_dieu_tri pd ON pd.id = hd.phac_do_dieu_tri_id
     JOIN goi_dich_vu g ON pd.goi_dich_vu_id = g.id
     WHERE hd.phac_do_dieu_tri_id = $1
     LIMIT 1`,
    [phac_do_dieu_tri_id]
  );
  if (invRes.rows.length > 0) {
    const {
      hinh_thuc_thanh_toan_goi, tong_tien_phai_tra, so_tien_da_tra, tong_so_buoi, loai_goi,
      tong_tien_goc, so_tien_giam_voucher,
      pd_trang_thai, hd_trang_thai, qua_han, han_su_dung
    } = invRes.rows[0];

    if (['huy', 'da_huy'].includes(String(pd_trang_thai)) || hd_trang_thai === 'da_hoan_tien') {
      throw new Error('Gói trị liệu này đã bị hủy và hoàn tiền. Không thể đặt thêm buổi điều trị cho gói đã hủy.');
    }

    if (qua_han) {
      const hanStr = new Date(han_su_dung).toLocaleDateString('vi-VN');
      const contactWho = isClientFacing ? 'phòng khám để được hỗ trợ' : 'Admin để xử lý';
      throw new Error(`Gói trị liệu này đã quá hạn sử dụng (hạn ${hanStr}). Vui lòng liên hệ ${contactWho} trước khi đặt thêm buổi điều trị.`);
    }

    if (loai_goi !== 'LE') {
      const M = Number(so_thu_tu_buoi) || 1;
      const grossBeforeExamDeduction = Number(tong_tien_goc || 0) - Number(so_tien_giam_voucher || 0);
      const minRequired = getMinPaymentRequired(
        hinh_thuc_thanh_toan_goi,
        Number(tong_tien_phai_tra),
        Number(tong_so_buoi || 10),
        M,
        grossBeforeExamDeduction
      );
      if (Number(so_tien_da_tra) < minRequired) {
        const who = isClientFacing ? 'Bạn' : 'Khách hàng';
        if (hinh_thuc_thanh_toan_goi === 'tra_thang') {
          throw new Error(`${who} chưa hoàn tất thanh toán cho gói trị liệu này. Vui lòng thanh toán trước khi thực hiện buổi số ${M}!`);
        } else {
          throw new Error(`${who} chưa hoàn tất thanh toán cho buổi điều trị trước đó. Vui lòng thanh toán trước khi đặt lịch cho buổi số ${M}!`);
        }
      }
    }
  }
}

export function calculateConfirmationDeadline(now: Date, appointmentStart: Date): Date {
  const durationMs = 30 * 60 * 1000;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: 'numeric',
    hour12: false
  });
  const localHour = parseInt(formatter.format(now), 10);
  let baseDeadline: Date;

  if (localHour >= 20 || localHour < 8) {
    let openingDate = now;
    if (localHour >= 20) {
      openingDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
    const openingTime = new Date(getVnDateString(openingDate, 8, 0, 0));
    baseDeadline = new Date(openingTime.getTime() + durationMs);
  } else {
    const standardDeadline = new Date(now.getTime() + durationMs);
    const closingTime = new Date(getVnDateString(now, 20, 0, 0));

    if (standardDeadline.getTime() > closingTime.getTime()) {
      const overflowMs = standardDeadline.getTime() - closingTime.getTime();
      const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextOpeningTime = new Date(getVnDateString(nextDay, 8, 0, 0));
      baseDeadline = new Date(nextOpeningTime.getTime() + overflowMs);
    } else {
      baseDeadline = standardDeadline;
    }
  }

  return baseDeadline < appointmentStart ? baseDeadline : appointmentStart;
}

export function getVnDateString(date: Date, hour: number, minute: number, second: number): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value;
  const day = parts.find(p => p.type === 'day')!.value;

  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  const s = String(second).padStart(2, '0');
  return `${year}-${month}-${day}T${h}:${m}:${s}+07:00`;
}

/** "YYYY-MM-DD" + giờ hiện tại theo giờ VN — dùng để so ngày/giờ mà không lệch múi giờ server. */
export function getVnNowParts(): { dateStr: string; minutesOfDay: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: 'numeric', hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  const get = (t: string) => parts.find(p => p.type === t)!.value;
  const dateStr = `${get('year')}-${get('month')}-${get('day')}`;
  const minutesOfDay = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);
  return { dateStr, minutesOfDay };
}

/** Thời gian ngắt nhận lịch trước khi kết thúc buổi (phút) — mặc định 45 phút */
const CUTOFF_LEAD_MINUTES = 45;

export function isBuoiDaQua(ngay: string, buoi: Buoi): boolean {
  const { dateStr: todayStr, minutesOfDay } = getVnNowParts();
  if (ngay < todayStr) return true;
  if (ngay > todayStr) return false;
  const endMinutes = parseGioThanhPhut(GIO_NHAN_KHACH[buoi].ketThuc);
  return minutesOfDay >= (endMinutes - CUTOFF_LEAD_MINUTES);
}

/** Ghép buổi (sáng/chiều) + ngày thành mốc TIMESTAMPTZ NOMINAL của buổi. */
export function resolveKhungGioNominalBuoi(ngay: string, buoi: Buoi): { batDau: string; ketThuc: string } {
  const { batDau, ketThuc } = GIO_NHAN_KHACH[buoi];
  return {
    batDau: `${ngay}T${batDau}:00+07:00`,
    ketThuc: `${ngay}T${ketThuc}:00+07:00`
  };
}

export class AppointmentBookingRepository {
  /** Nhân sự đúng nhóm vai trò đang trực trong ngày, kèm ca trực + số khách song song (A1). */
  async getNhanSuTrucCaTheoBuoi(dateStr: string, nhom: NhomVaiTro): Promise<NhanSuTrucCa[]> {
    const roleId = vaiTroIdCuaNhom(nhom);
    const { rows } = await pool.query(
      `SELECT lt.nhan_su_id as "nhanSuId", lt.gio_bat_dau::text as "gioBatDau", lt.gio_ket_thuc::text as "gioKetThuc",
              CASE WHEN nd.vai_tro_id = ${VAI_TRO_ID_KTV} THEN 2 ELSE 1 END as "soKhachSongSong"
       FROM lich_truc_nhan_su lt
       JOIN nguoi_dung nd ON nd.id = lt.nhan_su_id
       WHERE lt.ngay_truc = $1::date AND lt.trang_thai = 'hoat_dong'
         AND nd.vai_tro_id = $2 AND nd.trang_thai = 'hoat_dong'`,
      [dateStr, roleId]
    );
    return rows.map((r: any) => ({ ...r, soKhachSongSong: Number(r.soKhachSongSong) }));
  }

  /** Phút đã đặt trong buổi, quy về đúng nhóm vai trò (Lượng giá vs Trị liệu — 2 túi độc lập, A1). */
  async getPhutDaDatTheoBuoi(dateStr: string, nhom: NhomVaiTro, buoi: Buoi, excludeApptId?: string): Promise<PhutDaDat[]> {
    const loaiList = nhom === 'chuyen_vien' ? ['KHAM', 'KHAM_MOI'] : ['DIEU_TRI', 'DICH_VU_LE'];
    const { rows } = await pool.query(
      `SELECT ch.nhan_su_id as "nhanSuId",
              COALESCE(gdv1.thoi_luong_phut, gdv2.thoi_luong_phut, 60) as "soPhut"
       FROM cuoc_hen ch
       LEFT JOIN goi_dich_vu gdv1 ON gdv1.id = ch.goi_dich_vu_id
       LEFT JOIN phac_do_dieu_tri pd ON pd.id = ch.phac_do_dieu_tri_id
       LEFT JOIN goi_dich_vu gdv2 ON gdv2.id = pd.goi_dich_vu_id
       WHERE ch.buoi = $1
         AND DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = $2::date
         AND UPPER(ch.loai) = ANY($3::text[])
         AND ch.trang_thai NOT IN ('da_huy', 'huy', 'khong_den', 'khach_khong_den')
         AND ($4::uuid IS NULL OR ch.id != $4::uuid)`,
      [buoi, dateStr, loaiList, excludeApptId || null]
    );
    return rows.map((r: any) => ({ nhanSuId: r.nhanSuId, soPhut: Number(r.soPhut) }));
  }

  /**
   * Điểm gọi DUY NHẤT để kiểm tra ngân sách phút khi đặt lịch (A1).
   */
  async checkBuoiCapacity(params: {
    ngay: string; buoi: Buoi; loaiCuocHen: LoaiCuocHen | string; thoiLuongPhut: number;
    nhanSuId?: number | null; excludeApptId?: string;
  }): Promise<KetQuaKiemTraDatLich> {
    const nhom = resolveNhomVaiTro(params.loaiCuocHen);
    const [nhanSu, daDat] = await Promise.all([
      this.getNhanSuTrucCaTheoBuoi(params.ngay, nhom),
      this.getPhutDaDatTheoBuoi(params.ngay, nhom, params.buoi, params.excludeApptId)
    ]);
    return params.nhanSuId
      ? kiemTraDatChoNhanSuCuThe(params.nhanSuId, nhanSu, daDat, params.thoiLuongPhut, params.buoi)
      : kiemTraDatBatKy(nhanSu, daDat, params.thoiLuongPhut, params.buoi);
  }

  /**
   * Sức chứa cả 2 buổi trong ngày cho 1 dịch vụ cụ thể.
   */
  async getBuoiAvailability(dateStr: string, dichVuId?: string, userId?: string, phone?: string): Promise<{
    sang: { conLaiChung: number; choPhep: boolean; trungDichVu: boolean };
    chieu: { conLaiChung: number; choPhep: boolean; trungDichVu: boolean };
    nhanSu: Array<{ id: number; ho_ten: string; anh_dai_dien: string | null; caTruc: string; conLaiSang: number; conLaiChieu: number }>;
    hasExistingClinicalExam: boolean;
    buoc_thanh_toan_online: boolean;
  }> {
    let khach_hang_id: string | null = null;
    if (userId) {
      const khRes = await pool.query('SELECT id FROM khach_hang WHERE id = $1::uuid', [userId]);
      if (khRes.rows.length > 0) khach_hang_id = khRes.rows[0].id;
    }

    let isExam = true;
    let thoiLuongPhut = 60;
    if (dichVuId) {
      const dvRes = await pool.query('SELECT loai_goi, thoi_luong_phut FROM goi_dich_vu WHERE id = $1', [dichVuId]);
      if (dvRes.rows.length > 0) {
        isExam = dvRes.rows[0].loai_goi === 'KHAM';
        thoiLuongPhut = Number(dvRes.rows[0].thoi_luong_phut) || 60;
      }
    }
    const nhom: NhomVaiTro = isExam ? 'chuyen_vien' : 'ktv';
    const hasExistingClinicalExam = false;

    let trungDichVuSang = false;
    let trungDichVuChieu = false;
    if (!isExam && dichVuId && (khach_hang_id || phone)) {
      [trungDichVuSang, trungDichVuChieu] = await Promise.all([
        this.checkCustomerHasSameServiceInBuoi(khach_hang_id, phone || null, dichVuId, dateStr, 'sang'),
        this.checkCustomerHasSameServiceInBuoi(khach_hang_id, phone || null, dichVuId, dateStr, 'chieu')
      ]);
    }

    const roleId = vaiTroIdCuaNhom(nhom);
    const [nhanSuTruc, staffInfoRes, daDatSang, daDatChieu] = await Promise.all([
      this.getNhanSuTrucCaTheoBuoi(dateStr, nhom),
      pool.query(`SELECT id, ho_ten, anh_dai_dien FROM nguoi_dung WHERE vai_tro_id = $1 AND trang_thai = 'hoat_dong'`, [roleId]),
      this.getPhutDaDatTheoBuoi(dateStr, nhom, 'sang'),
      this.getPhutDaDatTheoBuoi(dateStr, nhom, 'chieu')
    ]);

    const conLaiRieng = (ns: NhanSuTrucCa, buoi: Buoi, daDat: PhutDaDat[]) => {
      const nganSach = tinhNganSachRieng(ns, buoi);
      const daDung = daDat.filter(d => d.nhanSuId === ns.nhanSuId).reduce((tong, d) => tong + d.soPhut, 0);
      return Math.max(0, nganSach - daDung);
    };

    const nhanSuOut = staffInfoRes.rows
      .map((s: any) => {
        const ns = nhanSuTruc.find(n => n.nhanSuId === s.id);
        if (!ns) return null;
        return {
          id: s.id,
          ho_ten: s.ho_ten,
          anh_dai_dien: s.anh_dai_dien,
          caTruc: `${ns.gioBatDau.substring(0, 5)}-${ns.gioKetThuc.substring(0, 5)}`,
          gioBatDau: ns.gioBatDau.substring(0, 5),
          gioKetThuc: ns.gioKetThuc.substring(0, 5),
          conLaiSang: conLaiRieng(ns, 'sang', daDatSang),
          conLaiChieu: conLaiRieng(ns, 'chieu', daDatChieu)
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    const conLaiChungBuoi = (daDat: PhutDaDat[], buoi: Buoi) =>
      Math.max(0, tinhNganSachChung(nhanSuTruc, buoi) - daDat.reduce((tong, d) => tong + d.soPhut, 0));

    let buoc_thanh_toan_online = false;
    if (khach_hang_id) {
      const noShowRes = await pool.query(
        `SELECT COUNT(*)::int as count
         FROM cuoc_hen
         WHERE khach_hang_id = $1
           AND trang_thai = 'khong_den'
           AND (thoi_gian_khong_den IS NULL OR thoi_gian_khong_den >= NOW() - INTERVAL '60 days')`,
        [khach_hang_id]
      );
      if ((noShowRes.rows[0]?.count || 0) >= 2) {
        buoc_thanh_toan_online = true;
      }
    }

    return {
      sang: { conLaiChung: conLaiChungBuoi(daDatSang, 'sang'), choPhep: kiemTraDatBatKy(nhanSuTruc, daDatSang, thoiLuongPhut, 'sang').choPhep, trungDichVu: trungDichVuSang },
      chieu: { conLaiChung: conLaiChungBuoi(daDatChieu, 'chieu'), choPhep: kiemTraDatBatKy(nhanSuTruc, daDatChieu, thoiLuongPhut, 'chieu').choPhep, trungDichVu: trungDichVuChieu },
      nhanSu: nhanSuOut,
      hasExistingClinicalExam,
      buoc_thanh_toan_online
    };
  }

  /**
   * B15 — ngân sách phút CÒN LẠI của từng nhân sự cùng túi vai trò.
   */
  async getStaffBudgetForBuoi(dateStr: string, buoi: Buoi, loaiCuocHen: LoaiCuocHen | string, excludeApptId?: string): Promise<Array<{ nhanSuId: number; conLai: number; soKhachSongSong: number }>> {
    const nhom = resolveNhomVaiTro(loaiCuocHen);
    const [nhanSuTruc, daDat] = await Promise.all([
      this.getNhanSuTrucCaTheoBuoi(dateStr, nhom),
      this.getPhutDaDatTheoBuoi(dateStr, nhom, buoi, excludeApptId)
    ]);
    return nhanSuTruc.map(ns => {
      const nganSach = tinhNganSachRieng(ns, buoi);
      const daDung = daDat.filter(d => d.nhanSuId === ns.nhanSuId).reduce((tong, d) => tong + d.soPhut, 0);
      return { nhanSuId: ns.nhanSuId, conLai: Math.max(0, nganSach - daDung), soKhachSongSong: ns.soKhachSongSong };
    });
  }

  /** A12 — tối đa 3 lịch hẹn ĐANG HOẠT ĐỘNG cùng lúc cho 1 khách hàng. */
  async checkCustomerActiveLimit(khach_hang_id: string | null, so_dien_thoai: string | null): Promise<boolean> {
    if (!khach_hang_id && !so_dien_thoai) return false;
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int as count FROM cuoc_hen ch
       LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
       WHERE (
         ($1::uuid IS NOT NULL AND ch.khach_hang_id = $1::uuid)
         OR ($2::text IS NOT NULL AND kh.so_dien_thoai = $2::text)
       )
       AND ch.trang_thai NOT IN (${TERMINAL_STATUSES.map((_, i) => `$${i + 3}`).join(', ')}, 'hoan_thanh')`,
      [khach_hang_id || null, so_dien_thoai || null, ...TERMINAL_STATUSES]
    );
    return (rows[0].count || 0) >= 3;
  }

  /** A12 — chặn đặt buổi Lượng giá mới khi khách đang có lịch treo `cho_tai_luong_gia`. */
  async checkCoLichChoTaiLuongGia(khach_hang_id: string | null, so_dien_thoai: string | null): Promise<boolean> {
    if (!khach_hang_id && !so_dien_thoai) return false;
    const { rows } = await pool.query(
      `SELECT 1 FROM cuoc_hen ch
       LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
       WHERE (
         ($1::uuid IS NOT NULL AND ch.khach_hang_id = $1::uuid)
         OR ($2::text IS NOT NULL AND kh.so_dien_thoai = $2::text)
       )
       AND ch.trang_thai = 'cho_tai_luong_gia'
       LIMIT 1`,
      [khach_hang_id || null, so_dien_thoai || null]
    );
    return rows.length > 0;
  }

  /** Cảnh báo MỀM (không chặn) khi khách đã có 1 lịch ĐANG HOẠT ĐỘNG với ĐÚNG dịch vụ này trong CÙNG buổi/ngày. */
  async checkCustomerHasSameServiceInBuoi(
    khach_hang_id: string | null,
    so_dien_thoai: string | null,
    dichVuId: string,
    dateStr: string,
    buoi: 'sang' | 'chieu'
  ): Promise<boolean> {
    if (!khach_hang_id && !so_dien_thoai) return false;
    if (!dichVuId) return false;
    const { rows } = await pool.query(
      `SELECT 1 FROM cuoc_hen ch
       LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
       WHERE (
         ($1::uuid IS NOT NULL AND ch.khach_hang_id = $1::uuid)
         OR ($2::text IS NOT NULL AND kh.so_dien_thoai = $2::text)
       )
       AND ch.goi_dich_vu_id = $3::uuid
       AND ch.ngay_gio_bat_dau::date = $4::date
       AND ch.buoi = $5
       AND ch.trang_thai NOT IN (${TERMINAL_STATUSES.map((_, i) => `$${i + 6}`).join(', ')}, 'hoan_thanh')
       LIMIT 1`,
      [khach_hang_id || null, so_dien_thoai || null, dichVuId, dateStr, buoi, ...TERMINAL_STATUSES]
    );
    return rows.length > 0;
  }

  /** Tối đa 1 buổi Lượng giá (KHAM/KHAM_MOI) / ngày cho 1 khách hàng. */
  async checkCustomerHasClinicalExamOnDate(khach_hang_id: string | null, so_dien_thoai: string | null, dateStr: string): Promise<boolean> {
    if (!khach_hang_id && !so_dien_thoai) return false;

    let effectivePhone: string | null = so_dien_thoai;
    if (khach_hang_id && so_dien_thoai && so_dien_thoai.trim()) {
      const otherRes = await pool.query(
        'SELECT id FROM khach_hang WHERE so_dien_thoai = $1 AND id != $2::uuid',
        [so_dien_thoai.trim(), khach_hang_id]
      );
      if (otherRes.rows.length > 0) {
        effectivePhone = null;
      }
    }

    const { rows } = await pool.query(
      `SELECT 1 FROM cuoc_hen ch
       LEFT JOIN khach_hang kh ON ch.khach_hang_id = kh.id
       WHERE (
         ($1::uuid IS NOT NULL AND ch.khach_hang_id = $1::uuid)
         OR ($2::text IS NOT NULL AND kh.so_dien_thoai = $2::text)
       )
       AND UPPER(ch.loai) IN ('KHAM', 'KHAM_MOI')
       AND ch.trang_thai NOT IN ('da_huy', 'huy', 'khong_den', 'khach_khong_den')
       AND DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = $3::date
       LIMIT 1`,
      [khach_hang_id || null, effectivePhone || null, dateStr]
    );
    return rows.length > 0;
  }

  async checkPhoneTakenByOther(phone: string, excludeUserId: string): Promise<boolean> {
    if (!phone || !excludeUserId) return false;
    const res = await pool.query(
      'SELECT id FROM khach_hang WHERE so_dien_thoai = $1 AND id != $2::uuid',
      [phone.trim(), excludeUserId]
    );
    return res.rows.length > 0;
  }

  async createAppointment(ma_lich_dat: string, data: any) {
    const { khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, email, goi_dich_vu_id, ngay, buoi, ghi_chu_dat_lich, ly_do_kham, loai_lich, dang_ky_goi_id, phong_id } = data;
    let phac_do_dieu_tri_id = data.phac_do_dieu_tri_id;
    let so_thu_tu_buoi = data.so_thu_tu_buoi;
    const bac_si_id = data.bac_si_id || data.chuyen_gia_id || data.ky_thuat_vien_id;
    const finalGoiId = goi_dich_vu_id || data.dich_vu_id;
    const finalLoai: LoaiCuocHen = (loai_lich === 'dieu_tri' || loai_lich === 'DIEU_TRI') ? 'DIEU_TRI' : ((loai_lich === 'kham_moi' || loai_lich === 'KHAM') ? 'KHAM' : 'DICH_VU_LE');

    if (!buoi || (buoi !== 'sang' && buoi !== 'chieu')) {
      throw new Error('Thiếu thông tin buổi (sáng/chiều).');
    }
    if (!ngay || !/^\d{4}-\d{2}-\d{2}$/.test(ngay)) {
      throw new Error('Thiếu hoặc sai định dạng ngày đặt lịch (YYYY-MM-DD).');
    }
    const { batDau: ngayGioBatDauNominal, ketThuc: ngayGioKetThucNominal } = resolveKhungGioNominalBuoi(ngay, buoi as Buoi);

    let thoiLuongPhut = 60;
    if (finalGoiId) {
      const dvRes = await pool.query('SELECT thoi_luong_phut FROM goi_dich_vu WHERE id = $1', [finalGoiId]);
      if (dvRes.rows.length > 0) thoiLuongPhut = Number(dvRes.rows[0].thoi_luong_phut) || 60;
    } else if (phac_do_dieu_tri_id) {
      const dvRes = await pool.query(
        'SELECT gdv.thoi_luong_phut FROM phac_do_dieu_tri pd JOIN goi_dich_vu gdv ON gdv.id = pd.goi_dich_vu_id WHERE pd.id = $1',
        [phac_do_dieu_tri_id]
      );
      if (dvRes.rows.length > 0) thoiLuongPhut = Number(dvRes.rows[0].thoi_luong_phut) || 60;
    }

    if (isBuoiDaQua(ngay, buoi as Buoi)) {
      throw new Error('Buổi này đã qua giờ nhận khách, vui lòng chọn buổi khác.');
    }
    const capacityCheck = await this.checkBuoiCapacity({
      ngay, buoi: buoi as Buoi, loaiCuocHen: finalLoai, thoiLuongPhut,
      nhanSuId: bac_si_id ? Number(bac_si_id) : null
    });
    if (!capacityCheck.choPhep) {
      throw new Error(capacityCheck.lyDo || 'Buổi này đã hết chỗ.');
    }

    if (khach_hang_id || so_dien_thoai) {
      if (finalLoai === 'KHAM') {
        const hasPendingReExam = await this.checkCoLichChoTaiLuongGia(khach_hang_id, so_dien_thoai || null);
        if (hasPendingReExam) {
          throw new Error('Khách hàng đang có lịch chờ tái lượng giá — vui lòng quay lại dùng lịch đó thay vì đặt lịch Lượng giá mới.');
        }
      }
      const overActiveLimit = await this.checkCustomerActiveLimit(khach_hang_id, so_dien_thoai || null);
      if (overActiveLimit) {
        throw new Error('Khách hàng đang có tối đa 3 lịch chưa hoàn thành/chưa hủy — cần hoàn thành hoặc hủy bớt trước khi đặt thêm.');
      }
    }

    let final_khach_hang_id = khach_hang_id;

    if (so_dien_thoai && so_dien_thoai.trim() !== '') {
      const cleanPhone = so_dien_thoai.trim();
      const checkPhoneCust = await pool.query(
        'SELECT id FROM khach_hang WHERE so_dien_thoai = $1 AND ($2::uuid IS NULL OR id != $2::uuid)',
        [cleanPhone, final_khach_hang_id || null]
      );
      const checkPhoneStaff = await pool.query('SELECT id FROM nguoi_dung WHERE so_dien_thoai = $1', [cleanPhone]);
      if (checkPhoneCust.rows.length > 0 || checkPhoneStaff.rows.length > 0) {
        throw new Error('Số điện thoại liên hệ này đã được đăng ký cho một tài khoản khác trong hệ thống.');
      }
    }

    if (!final_khach_hang_id && (email || so_dien_thoai)) {
      if (!ho_ten_khach || ho_ten_khach.trim().length < 2) {
        throw new Error('Họ tên khách hàng phải có ít nhất 2 ký tự.');
      }
      const nameRegex = /^[\p{L}\s']{2,}$/u;
      if (!nameRegex.test(ho_ten_khach.trim())) {
        throw new Error('Họ tên khách hàng chỉ được chứa chữ cái và khoảng trắng.');
      }

      if (!so_dien_thoai) {
        throw new Error('Số điện thoại khách hàng là bắt buộc.');
      }
      const phoneRegex = /^(03|05|07|08|09)[0-9]{8}$/;
      if (!phoneRegex.test(so_dien_thoai.trim())) {
        throw new Error('Số điện thoại không hợp lệ (phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09).');
      }

      if (!email || email.trim() === '') {
        throw new Error('Email khách hàng là bắt buộc.');
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error('Địa chỉ email không đúng định dạng.');
      }

      if (email && email.trim() !== '') {
        const checkEmailCust = await pool.query('SELECT id FROM khach_hang WHERE email = $1', [email.trim()]);
        const checkEmailStaff = await pool.query('SELECT id FROM nguoi_dung WHERE email = $1', [email.trim()]);
        if (checkEmailCust.rows.length > 0 || checkEmailStaff.rows.length > 0) {
          throw new Error('Địa chỉ email này đã được đăng ký cho một tài khoản khác.');
        }
      }

      const targetEmail = email.trim();
      const defaultPassword = '123456';
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(defaultPassword, salt);

      const { rows: newKh } = await pool.query(`
        INSERT INTO khach_hang (ho_ten, so_dien_thoai, email, mat_khau_hash, gioi_tinh, trang_thai, phai_doi_mat_khau)
        VALUES ($1, $2, $3, $4, $5, 'hoat_dong', true) RETURNING id
      `, [ho_ten_khach.trim(), so_dien_thoai.trim(), targetEmail, hash, gioi_tinh_khach || 'khac']);
      final_khach_hang_id = newKh[0].id;
    }

    const targetGoiId = dang_ky_goi_id || phac_do_dieu_tri_id || finalGoiId;

    if (final_khach_hang_id && targetGoiId) {
      let loaiGoi = null;
      let tenGoi = 'Gói dịch vụ';

      let resolvedPdId = phac_do_dieu_tri_id || null;
      if (resolvedPdId) {
        const pdInfo = await pool.query(`
          SELECT pd.goi_dich_vu_id, gdv.loai_goi, gdv.ten_goi 
          FROM phac_do_dieu_tri pd
          JOIN goi_dich_vu gdv ON pd.goi_dich_vu_id = gdv.id
          WHERE pd.id = $1
        `, [resolvedPdId]);
        if (pdInfo.rows.length > 0) {
          loaiGoi = pdInfo.rows[0].loai_goi;
          tenGoi = pdInfo.rows[0].ten_goi;
        }
      } else {
        const gdvInfo = await pool.query('SELECT loai_goi, ten_goi FROM goi_dich_vu WHERE id = $1', [targetGoiId]);
        if (gdvInfo.rows.length > 0) {
          loaiGoi = gdvInfo.rows[0].loai_goi;
          tenGoi = gdvInfo.rows[0].ten_goi;
        }
      }

      const isTreatment = loai_lich === 'dieu_tri' || loai_lich === 'DIEU_TRI' || loaiGoi === 'LIEU_TRINH';

      if (isTreatment && loaiGoi === 'LIEU_TRINH') {
        const invoiceQuery = `
          SELECT hd.tong_tien_phai_tra, hd.so_tien_da_tra, hd.hinh_thuc_thanh_toan_goi, hd.trang_thai, pd.id as phac_do_id, pd.tong_so_buoi,
                 hd.tong_tien_goc, hd.so_tien_giam_voucher
          FROM phac_do_dieu_tri pd
          JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
          WHERE pd.khach_hang_id = $1 AND (pd.id = $2 OR pd.goi_dich_vu_id = $3)
          ORDER BY hd.ngay_tao DESC LIMIT 1
        `;
        const invRes = await pool.query(invoiceQuery, [final_khach_hang_id, resolvedPdId, targetGoiId]);

        if (invRes.rows.length === 0) {
          throw new Error(`Bệnh nhân chưa thanh toán/đăng ký gói trị liệu "${tenGoi}". Vui lòng thanh toán trước khi lên lịch hẹn!`);
        }

        const invoiceObj = invRes.rows[0];
        const tongTien = Number(invoiceObj.tong_tien_phai_tra || 0);
        const daThanhToan = Number(invoiceObj.so_tien_da_tra || 0);
        const hinhThuc: HinhThucThanhToanGoi = invoiceObj.hinh_thuc_thanh_toan_goi || 'tra_thang';
        const tongSoBuoiGoi = Number(invoiceObj.tong_so_buoi || 10);
        const sessionNumForCheck = Number(so_thu_tu_buoi) || 1;
        const grossBeforeExamDeduction = Number(invoiceObj.tong_tien_goc || 0)
          - Number(invoiceObj.so_tien_giam_voucher || 0);

        const minRequired = getMinPaymentRequired(hinhThuc, tongTien, tongSoBuoiGoi, sessionNumForCheck, grossBeforeExamDeduction);
        if (daThanhToan < minRequired) {
          const formattedPaid = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(daThanhToan);
          const formattedRequired = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(minRequired);
          const label = hinhThuc === 'tung_buoi' ? 'Trả từng buổi' : 'Trả thẳng 100%';
          throw new Error(`Gói trị liệu "${tenGoi}" (${label}) yêu cầu thanh toán tối thiểu trước khi đặt lịch. Bệnh nhân mới đóng ${formattedPaid} / ${formattedRequired}.`);
        }

        if (!phac_do_dieu_tri_id && invoiceObj.phac_do_id) {
          phac_do_dieu_tri_id = invoiceObj.phac_do_id;
          data.phac_do_dieu_tri_id = invoiceObj.phac_do_id;
        }
      }
    }

    const finalPhacDoId = phac_do_dieu_tri_id || data.phac_do_dieu_tri_id;
    if (finalPhacDoId) {
      if (!phac_do_dieu_tri_id) {
        phac_do_dieu_tri_id = finalPhacDoId;
      }
      
      const countRes = await pool.query(
        "SELECT COALESCE(MAX(so_thu_tu_buoi), 0)::int as max_session FROM cuoc_hen WHERE phac_do_dieu_tri_id = $1 AND trang_thai != 'da_huy'",
        [finalPhacDoId]
      );
      const expectedNextSession = (countRes.rows[0].max_session || 0) + 1;
      so_thu_tu_buoi = expectedNextSession;
      data.so_thu_tu_buoi = expectedNextSession;

      await assertTreatmentPlanCanBookSession(finalPhacDoId, so_thu_tu_buoi, false);
    }

    let defaultTrangThaiThanhToan = data.trang_thai_thanh_toan || 'chua_thanh_toan';
    if (finalPhacDoId) {
      const invCheck = await pool.query(
        `SELECT hd.hinh_thuc_thanh_toan_goi, hd.so_tien_da_tra, hd.tong_tien_phai_tra, hd.tong_tien_goc,
                hd.so_tien_giam_voucher, pd.tong_so_buoi
         FROM hoa_don hd
         JOIN phac_do_dieu_tri pd ON pd.id = hd.phac_do_dieu_tri_id
         WHERE hd.phac_do_dieu_tri_id = $1 LIMIT 1`,
        [finalPhacDoId]
      );
      if (invCheck.rows.length > 0) {
        const { hinh_thuc_thanh_toan_goi, so_tien_da_tra, tong_tien_phai_tra, tong_so_buoi } = invCheck.rows[0];
        if (hinh_thuc_thanh_toan_goi === 'tra_thang') {
          defaultTrangThaiThanhToan = 'da_thanh_toan';
        } else if (hinh_thuc_thanh_toan_goi === 'tung_buoi') {
          const M = Number(so_thu_tu_buoi) || 1;
          const totalSessions = Number(tong_so_buoi || 10);
          const totalAmount = Number(tong_tien_phai_tra || 0);
          const perSession = totalSessions > 0 ? Math.round(totalAmount / totalSessions) : totalAmount;
          const reqForThisSession = M >= totalSessions ? totalAmount : M * perSession;
          defaultTrangThaiThanhToan = Number(so_tien_da_tra) >= reqForThisSession ? 'da_thanh_toan' : 'chua_thanh_toan';
        }
      }
    }

    const trang_thai = data.trang_thai || 'da_xac_nhan';
    const trang_thai_thanh_toan = defaultTrangThaiThanhToan;

    let resolvedPhongId = phong_id ? Number(phong_id) : null;
    if (!resolvedPhongId && bac_si_id) {
      const { rows: shiftRows } = await pool.query(`
        SELECT phong_id FROM lich_truc_nhan_su
        WHERE nhan_su_id = $1
          AND ngay_truc = $2::date
          AND trang_thai = 'hoat_dong'
          AND gio_bat_dau <= $3::time
          AND gio_ket_thuc > $3::time
        LIMIT 1
      `, [bac_si_id, ngay, GIO_NHAN_KHACH[buoi as Buoi].batDau]);
      if (shiftRows.length > 0 && shiftRows[0].phong_id) {
        resolvedPhongId = shiftRows[0].phong_id;
      }
    }

    const isCheckedInState = ['da_checkin', 'dang_kham', 'hoan_thanh'].includes(trang_thai);
    const isInProgressState = ['dang_kham', 'hoan_thanh'].includes(trang_thai);
    const isCompletedState = trang_thai === 'hoan_thanh';
    const thoi_gian_checkin_val = isCheckedInState ? new Date() : null;
    const thoi_gian_bat_dau_val = isInProgressState ? new Date() : null;
    const thoi_gian_hoan_thanh_val = isCompletedState ? new Date() : null;

    let snapshotThoiLuong = 30;
    if (finalGoiId) {
      const { rows: gRows } = await pool.query('SELECT thoi_luong_phut FROM goi_dich_vu WHERE id = $1', [finalGoiId]);
      if (gRows.length > 0 && gRows[0].thoi_luong_phut) {
        snapshotThoiLuong = gRows[0].thoi_luong_phut;
      }
    }

    const query = `
      INSERT INTO cuoc_hen (
        khach_hang_id, nhan_su_id, goi_dich_vu_id, phac_do_dieu_tri_id, so_thu_tu_buoi,
        ngay_gio_bat_dau, ngay_gio_ket_thuc, buoi, loai, trang_thai, trang_thai_thanh_toan,
        ghi_chu_khach_hang, phong_id, nguoi_tao_id, thoi_gian_tao,
        thoi_gian_checkin, thoi_gian_bat_dau, thoi_gian_hoan_thanh, thoi_luong_phut
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), $15, $16, $17, $18
      )
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      final_khach_hang_id,
      bac_si_id || null,
      finalGoiId || null,
      phac_do_dieu_tri_id || null,
      so_thu_tu_buoi || null,
      ngayGioBatDauNominal,
      ngayGioKetThucNominal,
      buoi,
      finalLoai,
      trang_thai,
      trang_thai_thanh_toan,
      ghi_chu_dat_lich || null,
      resolvedPhongId,
      data.nguoi_tao_id || null,
      thoi_gian_checkin_val,
      thoi_gian_bat_dau_val,
      thoi_gian_hoan_thanh_val,
      snapshotThoiLuong
    ]);

    const createdAppointment = rows[0];

    if (data.hoa_don_id) {
      await pool.query(
        'UPDATE hoa_don SET cuoc_hen_id = $1 WHERE id = $2',
        [createdAppointment.id, data.hoa_don_id]
      );
    }

    if (createdAppointment.trang_thai === 'da_checkin') {
      const isKham = String(createdAppointment.loai || '').toUpperCase().includes('KHAM');
      await pool.query(`
        INSERT INTO phien_lam_viec (cuoc_hen_id, lan_thu, so_thu_tu_hang_doi, thoi_gian_tao)
        VALUES (
          $1,
          COALESCE((SELECT MAX(lan_thu) FROM phien_lam_viec WHERE cuoc_hen_id = $1), 0) + 1,
          COALESCE(
            (
              SELECT MAX(p.so_thu_tu_hang_doi)
              FROM phien_lam_viec p
              JOIN cuoc_hen c ON p.cuoc_hen_id = c.id
              WHERE DATE(p.thoi_gian_tao AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE
                AND (
                  CASE
                    WHEN $2::boolean THEN c.loai IN ('KHAM', 'kham', 'kham_moi')
                    ELSE c.loai NOT IN ('KHAM', 'kham', 'kham_moi')
                  END
                )
            ),
            0
          ) + 1,
          NOW()
        )
      `, [createdAppointment.id, isKham]);
    }

    return createdAppointment;
  }

  async createPublicAppointment(ma_lich_dat: string, data: any) {
    const goi_dich_vu_id = data.goi_dich_vu_id || data.dich_vu_id;
    const { khach_hang_id, nhan_su_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, ngay, buoi, ly_do_kham, trang_thai, trieu_chung, anh_dinh_kem_url } = data;
    const phac_do_dieu_tri_id = data.phac_do_dieu_tri_id;
    const so_thu_tu_buoi = data.so_thu_tu_buoi;

    if (!buoi || (buoi !== 'sang' && buoi !== 'chieu')) {
      throw new Error('Thiếu thông tin buổi (sáng/chiều).');
    }
    if (!ngay || !/^\d{4}-\d{2}-\d{2}$/.test(ngay)) {
      throw new Error('Thiếu hoặc sai định dạng ngày đặt lịch (YYYY-MM-DD).');
    }
    if (isBuoiDaQua(ngay, buoi as Buoi)) {
      throw new Error('Buổi này đã qua giờ nhận khách, vui lòng chọn buổi khác.');
    }
    const { batDau: ngayGioBatDauNominal, ketThuc: ngayGioKetThucNominal } = resolveKhungGioNominalBuoi(ngay, buoi as Buoi);

    const final_khach_hang_id_input = khach_hang_id || null;

    if (phac_do_dieu_tri_id) {
      await assertTreatmentPlanCanBookSession(phac_do_dieu_tri_id, so_thu_tu_buoi, true);
    }

    let isExamService = false;
    let thoiLuongPhut = 30;
    if (goi_dich_vu_id) {
      const dvRes = await pool.query("SELECT loai_goi, thoi_luong_phut FROM goi_dich_vu WHERE id = $1", [goi_dich_vu_id]);
      if (dvRes.rows.length > 0) {
        isExamService = dvRes.rows[0].loai_goi === 'KHAM';
        thoiLuongPhut = Number(dvRes.rows[0].thoi_luong_phut) || 30;
      }
    }
    const finalLoaiForCapacity: LoaiCuocHen = phac_do_dieu_tri_id ? 'DIEU_TRI' : (isExamService ? 'KHAM' : 'DICH_VU_LE');

    const capacityCheck = await this.checkBuoiCapacity({
      ngay, buoi: buoi as Buoi, loaiCuocHen: finalLoaiForCapacity, thoiLuongPhut,
      nhanSuId: nhan_su_id ? Number(nhan_su_id) : (data.nguoi_dung_id ? Number(data.nguoi_dung_id) : null)
    });
    if (!capacityCheck.choPhep) {
      throw new Error(capacityCheck.lyDo || 'Buổi này đã hết chỗ, vui lòng chọn buổi khác.');
    }

    if (final_khach_hang_id_input || so_dien_thoai) {
      if (finalLoaiForCapacity === 'KHAM') {
        const hasExam = await this.checkCustomerHasClinicalExamOnDate(final_khach_hang_id_input, so_dien_thoai || null, ngay);
        if (hasExam) {
          throw new Error('Bạn đã có một buổi Lượng giá trong ngày này.');
        }
        const hasPendingReExam = await this.checkCoLichChoTaiLuongGia(final_khach_hang_id_input, so_dien_thoai || null);
        if (hasPendingReExam) {
          throw new Error('Bạn đang có lịch chờ tái lượng giá — vui lòng quay lại dùng lịch đó thay vì đặt lịch Lượng giá mới.');
        }
      }
      const overActiveLimit = await this.checkCustomerActiveLimit(final_khach_hang_id_input, so_dien_thoai || null);
      if (overActiveLimit) {
        throw new Error('Bạn đang có tối đa 3 lịch chưa hoàn thành/chưa hủy — vui lòng hoàn thành hoặc hủy bớt lịch hiện có trước khi đặt thêm.');
      }
    }

    if (final_khach_hang_id_input && so_dien_thoai && so_dien_thoai.trim() !== '') {
      const cleanPhone = so_dien_thoai.trim();
      const checkPhoneCust = await pool.query(
        'SELECT id FROM khach_hang WHERE so_dien_thoai = $1 AND id != $2::uuid',
        [cleanPhone, final_khach_hang_id_input]
      );
      const checkPhoneStaff = await pool.query('SELECT id FROM nguoi_dung WHERE so_dien_thoai = $1', [cleanPhone]);
      if (checkPhoneCust.rows.length > 0 || checkPhoneStaff.rows.length > 0) {
        throw new Error('Số điện thoại liên hệ này đã được đăng ký cho một tài khoản khác trong hệ thống.');
      }
    }

    let final_khach_hang_id = final_khach_hang_id_input;
    if (!final_khach_hang_id && so_dien_thoai) {
      const res = await pool.query('SELECT id FROM khach_hang WHERE so_dien_thoai = $1', [so_dien_thoai]);
      if (res.rows.length > 0) {
        final_khach_hang_id = res.rows[0].id;
      } else {
        const targetEmail = `${so_dien_thoai}@officecare.placeholder`;
        const defaultPassword = '123456';
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(defaultPassword, salt);

        const { rows: newKh } = await pool.query(`
          INSERT INTO khach_hang (ho_ten, so_dien_thoai, email, mat_khau_hash, gioi_tinh, phai_doi_mat_khau)
          VALUES ($1, $2, $3, $4, $5, true) RETURNING id
        `, [ho_ten_khach || 'Khách vãng lai', so_dien_thoai, targetEmail, hash, gioi_tinh_khach || 'khac']);
        final_khach_hang_id = newKh[0].id;
      }
    }

    let final_nhan_su_id = nhan_su_id ? Number(nhan_su_id) : (data.nguoi_dung_id ? Number(data.nguoi_dung_id) : null);

    let resolvedPhongId = null;
    if (final_nhan_su_id) {
      const { rows: shiftRows } = await pool.query(`
        SELECT phong_id FROM lich_truc_nhan_su
        WHERE nhan_su_id = $1
          AND ngay_truc = $2::date
          AND phong_id IS NOT NULL
        LIMIT 1
      `, [final_nhan_su_id, ngay]);
      if (shiftRows.length > 0 && shiftRows[0].phong_id) {
        resolvedPhongId = shiftRows[0].phong_id;
      }
    }

    let snapshotThoiLuongPublic = 30;
    if (goi_dich_vu_id) {
      const { rows: gPublicRows } = await pool.query('SELECT thoi_luong_phut FROM goi_dich_vu WHERE id = $1', [goi_dich_vu_id]);
      if (gPublicRows.length > 0 && gPublicRows[0].thoi_luong_phut) {
        snapshotThoiLuongPublic = gPublicRows[0].thoi_luong_phut;
      }
    }

    const query = `
      INSERT INTO cuoc_hen (
        khach_hang_id, goi_dich_vu_id, nhan_su_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, buoi,
        loai, trang_thai, trang_thai_thanh_toan, ghi_chu_khach_hang, phong_id, anh_dinh_kem_url,
        phac_do_dieu_tri_id, so_thu_tu_buoi, thoi_gian_tao, thoi_luong_phut
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), $15)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      final_khach_hang_id,
      goi_dich_vu_id || null,
      final_nhan_su_id,
      ngayGioBatDauNominal,
      ngayGioKetThucNominal,
      buoi,
      finalLoaiForCapacity,
      trang_thai || 'da_xac_nhan',
      data.trang_thai_thanh_toan || 'chua_thanh_toan',
      trieu_chung || ly_do_kham || null,
      resolvedPhongId,
      anh_dinh_kem_url || null,
      phac_do_dieu_tri_id || null,
      so_thu_tu_buoi || null,
      snapshotThoiLuongPublic
    ]);

    return rows[0];
  }
}

export default new AppointmentBookingRepository();
