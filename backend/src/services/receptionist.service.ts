import receptionistRepository from '../repositories/receptionist.repository';
import appointmentRepository, { assertTraGopDot2PaidBeforeCheckin } from '../repositories/appointment.repository';
import { pool } from '../config/db';
import {
  DEFAULT_DISCOUNT_PERCENT,
  describePaymentTransaction,
  getMinPaymentRequired,
  getTungBuoiSessionDue,
  isExamWaived as isExamWaivedDomain,
  resolvePackageBasePrice,
} from '../domain/billing';
import { checkReceptionistTransition, isReceptionistLockedStatus } from '../domain/appointmentStatus';
import { needsFollowUp } from '../domain/customerFollowUp';
import { HinhThucThanhToanGoi, LoaiGoi } from '../domain/types';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  tra_thang: 'Trả thẳng 100%',
  tra_gop: 'Trả góp',
  tung_buoi: 'Trả từng buổi',
};

class ReceptionistService {
  async getTodayAppointments() {
    const rows = await receptionistRepository.getTodayAppointments();
    return {
      cho_xac_nhan: rows.filter(r => r.trang_thai === 'cho_xac_nhan'),
      da_xac_nhan: rows.filter(r => r.trang_thai === 'da_xac_nhan'),
      da_checkin: rows.filter(r => r.trang_thai === 'da_checkin'),
      hoan_thanh: rows.filter(r => r.trang_thai === 'hoan_thanh'),
    };
  }

  async getDashboardData() {
    const rows = await receptionistRepository.getTodayAppointments();
    const appointments = rows.map(r => {
      let frontendStatus = '';
      if (r.loai_lich === 'KHAM' || r.loai_lich === 'kham_moi') {
        if (['cho_xac_nhan', 'da_xac_nhan', 'da_checkin'].includes(r.trang_thai)) {
          frontendStatus = 'Cho khao sat';
        } else if (r.trang_thai === 'hoan_thanh') {
          frontendStatus = 'Hoan thanh';
        }
      } else {
        if (['dang_thuc_hien', 'da_checkin', 'dang_dieu_tri'].includes(r.trang_thai)) {
          frontendStatus = 'Dang dieu tri';
        } else if (r.trang_thai === 'hoan_thanh') {
          frontendStatus = 'Hoan thanh';
        }
      }

      const formatTime = (isoString: string | Date) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
      };

      const start = formatTime(r.ngay_gio_bat_dau);
      const end = formatTime(r.ngay_gio_ket_thuc);
      const gio = start && end ? `${start} - ${end}` : start;

      return {
        id: r.id,
        ma_lich_dat: r.ma_lich_dat,
        ten_khach_hang: r.ten_khach_hang,
        sdt_khach_hang: r.sdt_khach_hang,
        ten_dich_vu: r.ten_dich_vu,
        bac_si: r.ten_ky_thuat_vien,
        gio,
        trang_thai: frontendStatus,
      };
    }).filter(appt => appt.trang_thai !== '');

    const pending = appointments.filter(a => a.trang_thai === 'Cho khao sat').length;
    const active = appointments.filter(a => a.trang_thai === 'Dang dieu tri').length;
    const completed = appointments.filter(a => a.trang_thai === 'Hoan thanh').length;

    return {
      appointments,
      stats: { pending, active, completed }
    };
  }

  async updateAppointmentStatus(id: string, trang_thai: string, ghi_chu_noi_bo?: string) {
    const currentApt = await pool.query('SELECT trang_thai, nhan_su_id, ngay_gio_bat_dau FROM cuoc_hen WHERE id = $1', [id]);
    if (currentApt.rows.length === 0) throw new Error('Không tìm thấy lịch hẹn');
    const currentStatus = currentApt.rows[0].trang_thai;

    // "Khóa toàn bộ form" phải là bất biến ở SERVER — nếu không, gửi thẳng đúng trang_thai hiện
    // tại (không đổi) kèm ghi_chu_noi_bo mới vẫn lọt qua nhánh dưới và sửa được ghi chú của 1
    // lịch đã check-in/hoàn thành/hủy.
    if (isReceptionistLockedStatus(currentStatus)) {
      const err = new Error(
        'Không thể thay đổi lịch hẹn đang tiến hành, đã hoàn thành, đã hủy hoặc đã kết thúc.'
      ) as any;
      err.statusCode = 403;
      throw err;
    }

    if (trang_thai !== currentStatus) {
      const check = checkReceptionistTransition(currentStatus, trang_thai, !!currentApt.rows[0].nhan_su_id, currentApt.rows[0].ngay_gio_bat_dau);
      if (!check.allowed) {
        const err = new Error(check.reason) as any;
        err.statusCode = 403;
        throw err;
      }
    }

    if (trang_thai === 'da_checkin' || trang_thai === 'check_in') {
      await assertTraGopDot2PaidBeforeCheckin(pool, id);
    }

    const appointment = await receptionistRepository.updateAppointmentStatus(id, trang_thai, ghi_chu_noi_bo);
    if (!appointment) throw new Error('Không tìm thấy lịch hẹn');

    return appointment;
  }

  async getReceptionistStats() {
    const stats = await receptionistRepository.getReceptionistStats();
    return {
      checkin: parseInt(stats.checkin_count),
      waiting: parseInt(stats.waiting_count),
      total: parseInt(stats.total_today)
    };
  }

  async handleWalkInBooking(data: any) {
    const goi_dich_vu_id = data.goi_dich_vu_id || data.dich_vu_id;
    const { sdt, ho_ten, gioi_tinh, ngay_sinh, gio_bat_dau } = data;
    const bac_si_id = data.bac_si_id || data.chuyen_gia_id || data.ky_thuat_vien_id;

    let khachHangId = data.khach_hang_id;
    if (!khachHangId) {
      const existCust = await receptionistRepository.findCustomerByPhone(sdt);
      if (existCust) {
        khachHangId = existCust.khach_hang_id;
      } else {
        khachHangId = await receptionistRepository.createWalkInCustomer(ho_ten, sdt, gioi_tinh, ngay_sinh);
      }
    }

    const duration = await receptionistRepository.getServiceDuration(goi_dich_vu_id);
    const startTime = new Date(gio_bat_dau);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    const maLichDat = `LD${Math.floor(100000 + Math.random() * 900000)}`;

    const lich_dat_id = await receptionistRepository.createAppointment(maLichDat, khachHangId, goi_dich_vu_id, bac_si_id, startTime, endTime, sdt);

    return { lich_dat_id };
  }

  async createBillingFromAppointment(lich_dat_id: string) {
    const lich = await receptionistRepository.getAppointmentForBilling(lich_dat_id);
    if (!lich) throw new Error('Lịch hẹn không hợp lệ hoặc chưa hoàn thành');

    const maHoaDon = `HD${Math.floor(100000 + Math.random() * 900000)}`;
    const result = await receptionistRepository.createBilling(maHoaDon, lich.khach_hang_id, lich_dat_id, lich.don_gia, lich.goi_dich_vu_id);
    
    const { hoa_don } = result;

    return hoa_don;
  }

  async calculateBilling(data: any) {
    let { item_type, item_id, loai_thanh_toan, ma_voucher, lich_dat_id, khach_hang_id } = data;
    // Mặc định TRUE: giữ đúng liệu trình + giá bác sĩ đã tư vấn cho khách. Lễ tân chỉ chuyển sang
    // cấu hình mới khi chủ động bấm (xem `canh_bao_lech_cau_hinh` trả về bên dưới).
    const giuTheoTuVan = data.giu_theo_tu_van !== false;

    // Resolve item_id if booking session is for a service/package and not provided
    if (lich_dat_id && !item_id && !data.goi_id && !data.goi_dich_vu_id) {
      const { rows: apptRows } = await pool.query(
        'SELECT goi_dich_vu_id FROM cuoc_hen WHERE id = $1',
        [lich_dat_id]
      );
      if (apptRows.length > 0 && apptRows[0].goi_dich_vu_id) {
        item_type = 'dich_vu';
        item_id = apptRows[0].goi_dich_vu_id;
      }
    }

    // Backward compatibility for old frontend payloads
    if (!item_type) {
      if (data.goi_id || data.goi_dich_vu_id) {
        item_type = 'goi';
        item_id = data.goi_id || data.goi_dich_vu_id;
      } else {
        item_type = 'dich_vu';
        item_id = null;
      }
    }

    let gia_goc_goi = 0;
    let ten_item = '';
    let so_buoi_goi = 1;
    const phan_tram_giam_tra_thang = DEFAULT_DISCOUNT_PERCENT.tra_thang;
    const phan_tram_giam_tra_gop = DEFAULT_DISCOUNT_PERCENT.tra_gop;
    let don_gia_theo_buoi = 0;
    let loai_goi_db = '';

    // Cấu hình gói bác sĩ đã tư vấn ≠ cấu hình gói hiện tại (admin sửa gói sau khi chỉ định).
    // null = không có gì bất thường, luồng chạy y như cũ.
    let canh_bao_lech_cau_hinh: {
      tu_van: { tong_so_buoi: number; don_gia: number };
      hien_tai: { tong_so_buoi: number; don_gia: number };
      dang_ap_dung: 'tu_van' | 'hien_tai';
    } | null = null;

    if (item_type === 'goi') {
      const pkg = await receptionistRepository.getPackageById(item_id);
      if (!pkg) throw new Error('Không tìm thấy gói dịch vụ');
      gia_goc_goi = Number(pkg.gia_goi);
      ten_item = pkg.ten_goi;
      so_buoi_goi = pkg.tong_so_buoi;
      don_gia_theo_buoi = Number(pkg.don_gia_theo_buoi || 0);
      loai_goi_db = pkg.loai_goi || '';

      // Gói đến từ chỉ định của bác sĩ: đối chiếu snapshot lúc tư vấn với cấu hình đang sống.
      if (lich_dat_id) {
        const quote = await receptionistRepository.getPrescriptionQuote(lich_dat_id, item_id);
        if (
          quote &&
          (quote.tong_so_buoi_tu_van !== quote.tong_so_buoi_hien_tai ||
            quote.don_gia_tu_van !== quote.don_gia_hien_tai)
        ) {
          canh_bao_lech_cau_hinh = {
            tu_van: { tong_so_buoi: quote.tong_so_buoi_tu_van, don_gia: quote.don_gia_tu_van },
            hien_tai: { tong_so_buoi: quote.tong_so_buoi_hien_tai, don_gia: quote.don_gia_hien_tai },
            dang_ap_dung: giuTheoTuVan ? 'tu_van' : 'hien_tai',
          };

          // Giữ nguyên cặp (số buổi + giá) đã tư vấn — không trộn số buổi cũ với giá mới.
          if (giuTheoTuVan) {
            gia_goc_goi = quote.don_gia_tu_van;
            so_buoi_goi = quote.tong_so_buoi_tu_van;
            don_gia_theo_buoi = so_buoi_goi > 0 ? Math.round(gia_goc_goi / so_buoi_goi) : 0;
          }
        }
      }
    } else if (item_type === 'dich_vu') {
      if (item_id) {
        const svc = await receptionistRepository.getServiceById(item_id);
        if (!svc) throw new Error('Không tìm thấy dịch vụ');
        gia_goc_goi = Number(svc.don_gia);
        ten_item = svc.ten_dich_vu;
      } else {
        gia_goc_goi = 0;
        ten_item = 'Khám lâm sàng';
      }
    } else {
      throw new Error('Loại vật phẩm thanh toán không hợp lệ');
    }

    // 1. Calculate payment method discount (so_tien_giam_phuong_thuc) on package price only (not for single services)
    let so_tien_giam_phuong_thuc = 0;
    if (item_type === 'goi' && loai_goi_db === 'LIEU_TRINH') {
      if (loai_thanh_toan === 'tra_thang') {
        so_tien_giam_phuong_thuc = Math.round(gia_goc_goi * phan_tram_giam_tra_thang / 100);
      } else if (loai_thanh_toan === 'tra_gop') {
        so_tien_giam_phuong_thuc = Math.round(gia_goc_goi * phan_tram_giam_tra_gop / 100);
      } else if (loai_thanh_toan === 'tung_buoi') {
        so_tien_giam_phuong_thuc = 0;
      }
    }

    // 2. Calculate manual voucher discount on package price only
    let voucher_id: string | null = null;
    let so_tien_giam_voucher = 0;

    if (ma_voucher) {
      const voucher = await receptionistRepository.getVoucherByCode(ma_voucher);
      await this.assertVoucherUsable(voucher, loai_thanh_toan, khach_hang_id);

      // Check minimum order value
      if (gia_goc_goi < Number(voucher.don_hang_toi_thieu)) {
        throw new Error(`Đơn hàng chưa đạt giá trị tối thiểu (${Number(voucher.don_hang_toi_thieu).toLocaleString()}đ) để áp dụng mã này`);
      }

      // Calculate voucher discount on original package price (mutual exclusivity)
      if (voucher.loai_giam === 'phan_tram' || voucher.loai_giam === 'percentage') {
        so_tien_giam_voucher = Math.round(gia_goc_goi * (Number(voucher.gia_tri_giam) / 100));
        if (voucher.giam_toi_da && so_tien_giam_voucher > Number(voucher.giam_toi_da)) {
          so_tien_giam_voucher = Number(voucher.giam_toi_da);
        }
      } else {
        so_tien_giam_voucher = Number(voucher.gia_tri_giam);
      }

      // Ensure discount does not exceed package price
      if (so_tien_giam_voucher > gia_goc_goi) {
        so_tien_giam_voucher = gia_goc_goi;
      }

      // Mã giảm giá được khách chủ động áp dụng luôn thắng ưu đãi mặc định theo hình thức thanh toán
      // (10% trả thẳng / 5% trả góp) — không so sánh bên nào giảm nhiều hơn.
      so_tien_giam_phuong_thuc = 0;
      voucher_id = voucher.id;
    }

    // Clamp final package total at 0đ minimum
    const tong_tien_goi_sau_giam = Math.max(0, gia_goc_goi - so_tien_giam_phuong_thuc - so_tien_giam_voucher);

    // Fetch clinical assessment fee from DB dynamically if appointment is selected
    let chi_phi_kham = 0; // In the new design, chi_phi_kham is always 0 on the package invoice
    let giam_tru_kham_truoc_do = 0;
    let mien_phi_kham_chua_dong = 0;
    let ngay_thanh_toan_kham_str = '';
    let ma_hoa_don_kham_str = '';
    let ngay_kham_str = '';
    let hasPaidExam = true;
    let appt_price = 150000;
    // Số tiền THỰC ĐÃ THU trên hóa đơn khám (khác appt_price/giá niêm yết nếu ca khám đó từng áp
    // voucher/giảm giá riêng) — dùng để khấu trừ đúng số khách đã trả, không khấu trừ khống phần
    // họ chưa từng đóng. Xem receptionistRepository.getPaidInvoiceAmountForAppointment.
    let paidAmount = 0;

    // Dịch vụ lẻ (LE) không có phác đồ điều trị đi kèm — không tham gia bất kỳ liên kết/miễn phí
    // khám nào, dù giá cao tới đâu (chỉ gói LIỆU_TRÌNH mới được xét miễn phí khám, xem
    // billing.ts isExamWaived). Trước đây có nhánh riêng cho LE giá cao mượn phí khám của ca khám
    // đã chỉ định nó (qua chi_dinh_buoi), nhưng tính năng bác sĩ chỉ định gói LE từ ca khám đã bị
    // bỏ — nhánh đó thành lỗi (LE vẫn được miễn phí khám y như liệu trình), nay bỏ hẳn.
    const isSingleService = item_type === 'goi' && loai_goi_db === 'LE';
    const isExcludeExam = isSingleService;

    let targetLichDatId = lich_dat_id;
    if (!targetLichDatId && data.khach_hang_id && !isExcludeExam) {
      // Find the last clinical exam appointment for this customer that has a paid invoice!
      const { rows: apptRows } = await pool.query(`
        SELECT ch.id
        FROM cuoc_hen ch
        JOIN hoa_don hd ON hd.cuoc_hen_id = ch.id
        WHERE ch.khach_hang_id = $1
          AND ch.loai IN ('KHAM', 'KHAM_MOI')
          AND hd.trang_thai = 'da_thanh_toan'
        ORDER BY ch.ngay_gio_bat_dau DESC LIMIT 1
      `, [data.khach_hang_id]);
      if (apptRows.length > 0) {
        targetLichDatId = apptRows[0].id;
      }
    }

    if (targetLichDatId && !isExcludeExam) {
      const appt = await receptionistRepository.getAppointmentWithServicePrice(targetLichDatId);
      appt_price = appt ? Number(appt.don_gia) : 150000;
      if (appt && appt.ngay_kham) {
        const dk = new Date(appt.ngay_kham);
        ngay_kham_str = `${String(dk.getDate()).padStart(2, '0')}/${String(dk.getMonth() + 1).padStart(2, '0')}/${dk.getFullYear()}`;
      }

      paidAmount = await receptionistRepository.getPaidInvoiceAmountForAppointment(targetLichDatId);
      hasPaidExam = paidAmount > 0;
      if (hasPaidExam) {
        const paidInvoice = await pool.query(
          "SELECT ngay_tao, 'HD-' || UPPER(SUBSTRING(id::text FROM 1 FOR 6)) as ma_hoa_don FROM hoa_don WHERE cuoc_hen_id = $1 AND trang_thai = 'da_thanh_toan' LIMIT 1",
          [targetLichDatId]
        );
        if (paidInvoice.rows.length > 0 && paidInvoice.rows[0].ngay_tao) {
          const d = new Date(paidInvoice.rows[0].ngay_tao);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          ngay_thanh_toan_kham_str = `${day}/${month}/${year}`;
          ma_hoa_don_kham_str = paidInvoice.rows[0].ma_hoa_don || '';
        }
      }

      // Miễn phí khám: xem docs/BUSINESS_RULES.md mục 5 / backend/src/domain/billing.ts isExamWaived()
      // — CHỈ áp dụng cho gói LIỆU_TRÌNH, dịch vụ lẻ (LE) không bao giờ được miễn dù giá cao.
      const isExamWaived = isExamWaivedDomain(loai_thanh_toan, gia_goc_goi, loai_goi_db as LoaiGoi);

      if (isExamWaived) {
        if (hasPaidExam) {
          // Exam already paid separately — khấu trừ đúng số tiền THỰC ĐÃ THU (paidAmount), không
          // phải giá niêm yết (appt_price): ca khám có thể đã áp voucher/giảm giá riêng nên số
          // thực thu thấp hơn giá gốc, dùng giá gốc sẽ khấu trừ khống phần khách chưa từng trả.
          giam_tru_kham_truoc_do = paidAmount;
          mien_phi_kham_chua_dong = 0;
        } else {
          // Exam not paid separately yet (will be marked paid with 0đ at checkout)
          giam_tru_kham_truoc_do = 0;
          mien_phi_kham_chua_dong = appt_price;
        }
      } else {
        if (!hasPaidExam) {
          chi_phi_kham = appt_price;
        }
      }
    }

    // Total display values (gia_goc on package invoice is always gia_goc_goi)
    const gia_goc = gia_goc_goi;
    // Total to pay before deduction
    let tong_tien_thanh_toan = tong_tien_goi_sau_giam;

    // Apply the deduction if applicable
    if (giam_tru_kham_truoc_do > 0) {
      tong_tien_thanh_toan = Math.max(0, tong_tien_thanh_toan - giam_tru_kham_truoc_do);
    }

    let so_tien_dot_1 = tong_tien_thanh_toan;
    let so_tien_dot_2 = 0;

    if (item_type === 'goi') {
      if (loai_thanh_toan === 'tra_gop') {
        const packageDot1 = Math.round(tong_tien_goi_sau_giam / 2);
        // Note: For tra_gop, first payment is: (50% of package) - (deduction if prepaid exam)
        so_tien_dot_1 = Math.max(0, packageDot1 - giam_tru_kham_truoc_do);
        if (!hasPaidExam && mien_phi_kham_chua_dong === 0) {
          so_tien_dot_1 += appt_price;
        }
        so_tien_dot_2 = tong_tien_goi_sau_giam - packageDot1;
      } else if (loai_thanh_toan === 'tung_buoi') {
        so_tien_dot_1 = hasPaidExam ? 0 : appt_price;
        so_tien_dot_2 = tong_tien_goi_sau_giam;
      } else { // tra_thang
        if (!hasPaidExam && mien_phi_kham_chua_dong === 0) {
          so_tien_dot_1 += appt_price;
        }
      }
      // Always calculate don_gia_theo_buoi dynamically from the package value to ensure consistency:
      don_gia_theo_buoi = Math.round(tong_tien_goi_sau_giam / so_buoi_goi);
    }

    return {
      gia_goc,
      gia_goc_goi,
      tong_tien_goi_sau_giam,
      ten_item,
      so_buoi_goi,
      voucher_id,
      so_tien_giam_voucher,
      uu_dai_thanh_toan_id: null,
      so_tien_giam_phuong_thuc,
      tong_tien_thanh_toan,
      so_tien_dot_1,
      so_tien_dot_2,
      loai_thanh_toan,
      chi_phi_kham,
      giam_tru_kham_truoc_do,
      mien_phi_kham_chua_dong,
      // Phí khám thực tế áp cho hóa đơn gói này (miễn hoặc khấu trừ) — snapshot để lúc hủy gói
      // truy thu đúng số đã miễn, không phụ thuộc giá khám hiện hành (xem admin.repository refund).
      // Khi ca khám đã đóng riêng trước đó (hasPaidExam), dùng đúng số THỰC ĐÃ THU (paidAmount) —
      // phải khớp với giam_tru_kham_truoc_do ở trên, nếu không lúc hủy gói sẽ truy thu sai (nhiều
      // hơn số thực sự đã miễn cho khách, do ca khám có thể đã áp voucher riêng).
      phi_kham_ap_dung: (targetLichDatId && !isExcludeExam) ? (hasPaidExam ? paidAmount : appt_price) : 0,
      don_gia_theo_buoi,
      ngay_thanh_toan_kham: ngay_thanh_toan_kham_str,
      ma_hoa_don_kham: ma_hoa_don_kham_str,
      ngay_kham: ngay_kham_str,
      canh_bao_lech_cau_hinh
    };
  }

  /**
   * Kiểm tra mã giảm giá còn hiệu lực (tồn tại, trong hạn, đang kích hoạt, chưa hết lượt dùng,
   * đúng hình thức thanh toán yêu cầu nếu có giới hạn).
   */
  private async assertVoucherUsable(voucher: any, loai_thanh_toan?: string, khach_hang_id?: string) {
    if (!voucher) {
      throw new Error('Mã giảm giá không tồn tại');
    }

    const now = new Date();
    const startDate = new Date(voucher.ngay_bat_dau);
    const endDate = voucher.ngay_het_han ? new Date(voucher.ngay_het_han) : null;
    if (now < startDate || (endDate && now > endDate)) {
      throw new Error('Mã giảm giá đã hết hạn hoặc chưa được kích hoạt');
    }

    if (voucher.trang_thai !== 'hoat_dong') {
      throw new Error('Mã giảm giá không hoạt động');
    }

    // Giới hạn số lượt dùng tính RIÊNG theo từng khách hàng, không phải tổng toàn hệ thống — nếu
    // có giới hạn mà thiếu khach_hang_id thì KHÔNG được coi là "chưa dùng lần nào" (đếm sẽ luôn ra
    // 0 vì "khach_hang_id = NULL" không bao giờ đúng trong SQL), phải chặn cứng thay vì bỏ qua.
    if (voucher.so_luong_toi_da !== null && !khach_hang_id) {
      throw new Error('Thiếu thông tin khách hàng để kiểm tra lượt dùng mã giảm giá');
    }
    const usageCount = await receptionistRepository.countVoucherUsage(voucher.id, khach_hang_id);
    if (voucher.so_luong_toi_da !== null && usageCount >= voucher.so_luong_toi_da) {
      throw new Error('Bạn đã dùng hết lượt sử dụng mã giảm giá này');
    }

    const yeuCauThanhToan: string[] = Array.isArray(voucher.yeu_cau_thanh_toan)
      ? voucher.yeu_cau_thanh_toan
      : (voucher.yeu_cau_thanh_toan ? [voucher.yeu_cau_thanh_toan] : []);
    // Có giới hạn hình thức thanh toán mà KHÔNG biết loai_thanh_toan là gì thì phải chặn (fail
    // closed), không được coi là hợp lệ — khớp hành vi cũ khi so sánh scalar (undefined !== giá
    // trị yêu cầu luôn throw).
    const hasPaymentRestriction = yeuCauThanhToan.length > 0 && !yeuCauThanhToan.includes('tat_ca');
    if (hasPaymentRestriction && (!loai_thanh_toan || !yeuCauThanhToan.includes(loai_thanh_toan))) {
      const labels = yeuCauThanhToan.map((v) => PAYMENT_METHOD_LABELS[v] || v).join(', ');
      throw new Error(`Mã giảm giá này chỉ áp dụng cho hình thức thanh toán: ${labels}`);
    }
  }

  async getActiveVouchers(khach_hang_id: string) {
    return receptionistRepository.getActiveVouchers(khach_hang_id);
  }

  async applyVoucher(ma_voucher: string, loai_thanh_toan?: string, khach_hang_id?: string) {
    const voucher = await receptionistRepository.getVoucherByCode(ma_voucher);
    await this.assertVoucherUsable(voucher, loai_thanh_toan, khach_hang_id);
    return voucher;
  }

  async createBillingDirect(data: any) {
    const { khach_hang_id, item_type, item_id, loai_thanh_toan, ma_voucher, lich_dat_id, ho_ten_khach, so_dien_thoai, lich_dieu_tri_id, dang_ky_goi } = data;

    // If dang_ky_goi is false and we have an appointment (lich_dat_id), bill only the appointment fee!
    if (dang_ky_goi === false && lich_dat_id) {
      const appt = await receptionistRepository.getAppointmentWithServicePrice(lich_dat_id);
      if (!appt) throw new Error('Không tìm thấy cuộc hẹn khám');
      
      const calc = await this.calculateBilling({
        item_type: 'dich_vu',
        item_id: appt.goi_dich_vu_id,
        loai_thanh_toan: 'tra_thang', // default for services
        ma_voucher: ma_voucher || null,
        lich_dat_id: null,
        khach_hang_id: appt.khach_hang_id
      });

      const invoiceData = {
        khach_hang_id: appt.khach_hang_id,
        item_type: 'dich_vu',
        item_id: appt.goi_dich_vu_id,
        loai_thanh_toan: 'tra_thang',
        voucher_id: calc.voucher_id,
        so_tien_giam_voucher: calc.so_tien_giam_voucher,
        uu_dai_thanh_toan_id: null,
        so_tien_giam_phuong_thuc: calc.so_tien_giam_phuong_thuc,
        tong_tien_truoc_giam: calc.gia_goc,
        tong_tien_thanh_toan: calc.tong_tien_thanh_toan,
        lich_dat_id,
        ten_item: calc.ten_item,
        so_buoi_goi: 1,
        ho_ten_khach: ho_ten_khach || null,
        so_dien_thoai: so_dien_thoai || null
      };

      return receptionistRepository.createInvoiceDirect(invoiceData);
    }

    // Enforce y khoa constraint: Receptionist cannot sell packages directly to walk-in customers
    if (item_type === 'goi' && !lich_dat_id && !lich_dieu_tri_id) {
      throw new Error('Lễ tân không được phép bán gói trị liệu trực tiếp cho khách vãng lai. Gói trị liệu phải được chỉ định bởi bác sĩ sau khi khám lâm sàng.');
    }

    let finalLdtId = lich_dieu_tri_id;

    if (!finalLdtId && lich_dat_id) {
      const resolvedLdtId = await receptionistRepository.getTreatmentPlanBySessionId(lich_dat_id);
      if (resolvedLdtId) {
        finalLdtId = resolvedLdtId;
      }
    }

    if (finalLdtId && dang_ky_goi !== false) {
      const ldt = await receptionistRepository.getTreatmentPlanById(finalLdtId);
      if (!ldt) throw new Error('Không tìm thấy lịch điều trị');

      // Hạn sử dụng CHỐT CỨNG (snapshot) đúng 1 lần tại thời điểm kích hoạt đầu tiên — lấy từ cấu
      // hình gói (goi_dich_vu.han_su_dung_mac_dinh_ngay), KHÔNG nhận từ client, KHÔNG cho sửa tay ở
      // hóa đơn nữa (đã bỏ ô nhập ở frontend). "WHERE han_su_dung IS NULL" đảm bảo chỉ set 1 lần —
      // nếu sau này admin đổi cấu hình gói hoặc plan này nhận thêm hóa đơn khác (vd đợt 2 trả góp),
      // hạn sử dụng đã chốt vẫn giữ nguyên, không bị ghi đè lại.
      if (['tra_thang', 'tra_gop', 'tung_buoi'].includes(loai_thanh_toan)) {
        const { rows: pkgRows } = await pool.query(
          'SELECT han_su_dung_mac_dinh_ngay FROM goi_dich_vu WHERE id = $1',
          [ldt.goi_dich_vu_id]
        );
        const soNgayHieuLuc = pkgRows[0]?.han_su_dung_mac_dinh_ngay;
        if (soNgayHieuLuc) {
          await pool.query(
            `UPDATE phac_do_dieu_tri
             SET han_su_dung = CURRENT_DATE + $1 * INTERVAL '1 day'
             WHERE id = $2 AND han_su_dung IS NULL`,
            [Number(soNgayHieuLuc), finalLdtId]
          );
        }
      }

      const calc = await this.calculateBilling({
        item_type: 'goi',
        item_id: ldt.goi_dich_vu_id,
        loai_thanh_toan,
        ma_voucher,
        lich_dat_id, // Fetch and add dynamic clinical assessment fee!
        giu_theo_tu_van: data.giu_theo_tu_van,
        khach_hang_id: ldt.khach_hang_id
      });

      // Phác đồ đã tồn tại từ trước (đặt lịch trước, thu tiền sau): chốt lại số buổi theo đúng
      // cấu hình vừa tính tiền, nếu khách chưa dùng buổi nào — tránh hóa đơn 13 buổi mà phác đồ 12.
      if (calc.so_buoi_goi > 0) {
        await pool.query(
          `UPDATE phac_do_dieu_tri
           SET tong_so_buoi = $1
           WHERE id = $2 AND so_buoi_da_dung = 0 AND tong_so_buoi <> $1`,
          [calc.so_buoi_goi, finalLdtId]
        );
      }

      const invoiceData = {
        lich_dieu_tri_id: finalLdtId,
        phi_kham_ap_dung: calc.phi_kham_ap_dung,
        khach_hang_id: ldt.khach_hang_id,
        item_type: 'goi',
        tong_tien_truoc_giam: calc.gia_goc,
        so_tien_giam_voucher: calc.so_tien_giam_voucher,
        uu_dai_thanh_toan_id: calc.uu_dai_thanh_toan_id,
        so_tien_giam_phuong_thuc: calc.so_tien_giam_phuong_thuc,
        tong_tien_thanh_toan: calc.tong_tien_thanh_toan,
        loai_thanh_toan,
        voucher_id: calc.voucher_id,
        cuoc_hen_id: lich_dat_id || null,
        ghi_chu: calc.giam_tru_kham_truoc_do > 0
          ? `Gói trị liệu chỉ định từ ca khám ngày ${calc.ngay_thanh_toan_kham || ''} đã thanh toán. Miễn phí khám được khấu trừ vào gói.`
          : (calc.mien_phi_kham_chua_dong > 0
              ? `Gói trị liệu chỉ định từ ca khám ngày ${calc.ngay_kham || ''}. Được miễn phí khám lâm sàng (Ưu đãi mua gói trị liệu > 1.000.000đ).`
              : `Gói trị liệu chỉ định từ ca khám.`)
      };

      const invoice = await receptionistRepository.createInvoiceForTreatmentPlan(invoiceData);
      if (loai_thanh_toan === 'tung_buoi') {
        await receptionistRepository.updateTreatmentPlanStatus(finalLdtId, 'dang_dieu_tri');
      }
      return invoice;
    }

    const calc = await this.calculateBilling({
      item_type,
      item_id,
      loai_thanh_toan,
      ma_voucher,
      lich_dat_id,
      giu_theo_tu_van: data.giu_theo_tu_van,
      khach_hang_id
    });

    // Fetch customer info if not supplied
    let tenKhach = ho_ten_khach;
    let sdtKhach = so_dien_thoai;

    if (!tenKhach || !sdtKhach) {
      const customer = await receptionistRepository.getCustomerContactInfo(khach_hang_id);
      if (customer) {
        if (!tenKhach) tenKhach = customer.ho_ten;
        if (!sdtKhach) sdtKhach = customer.so_dien_thoai;
      }
    }

    const invoiceData = {
      khach_hang_id,
      item_type,
      item_id,
      loai_thanh_toan,
      voucher_id: calc.voucher_id,
      so_tien_giam_voucher: calc.so_tien_giam_voucher,
      uu_dai_thanh_toan_id: calc.uu_dai_thanh_toan_id,
      so_tien_giam_phuong_thuc: calc.so_tien_giam_phuong_thuc,
      tong_tien_truoc_giam: calc.gia_goc,
      tong_tien_thanh_toan: calc.tong_tien_thanh_toan,
      lich_dat_id,
      ten_item: calc.ten_item,
      so_buoi_goi: calc.so_buoi_goi,
      phi_kham_ap_dung: calc.phi_kham_ap_dung,
      ho_ten_khach: tenKhach,
      so_dien_thoai: sdtKhach,
      ghi_chu: calc.giam_tru_kham_truoc_do > 0
        ? `Đã khấu trừ ${calc.giam_tru_kham_truoc_do.toLocaleString()}đ phí khám lâm sàng đã đóng trước đó (ca khám ngày ${calc.ngay_thanh_toan_kham || ''}).`
        : (calc.mien_phi_kham_chua_dong > 0
            ? `Được miễn phí khám lâm sàng cho ca khám ngày ${calc.ngay_kham || ''} (Ưu đãi mua gói trị liệu > 1.000.000đ).`
            : null)
    };

    const invoice = await receptionistRepository.createInvoiceDirect(invoiceData);
    return invoice;
  }

  /**
   * Số tiền TỐI THIỂU cần thu cho lần thanh toán hiện tại của 1 hóa đơn (đăng ký lần đầu hay
   * đợt/buổi tiếp theo) — nguồn chung DUY NHẤT cho cả `processPayment` (tiền mặt) và
   * `createPayOSPaymentLink` (PayOS), để 2 kênh không bao giờ yêu cầu 2 số tiền khác nhau cho
   * cùng 1 hóa đơn ở cùng thời điểm (từng xảy ra: PayOS đăng ký nhầm cả số dư còn lại của gói
   * thay vì đúng phần của buổi/đợt hiện tại — xem lịch sử sửa `so_thu_tu_buoi`/`getTungBuoiSessionDue`).
   */
  private async computeRequiredPayment(hd: any, so_thu_tu_buoi?: number): Promise<{ requiredAmount: number; giaGocGoi: number }> {
    const tong_tien = Number(hd.tong_tien_thanh_toan);
    const da_thanh_toan_truoc = Number(hd.da_thanh_toan);
    const loai_thanh_toan = hd.loai_thanh_toan;
    const so_buoi_goi = Number(hd.so_buoi_goi) || 1;

    let chi_phi_kham = 0;
    let giam_tru = 0;
    let paidExam = 0;
    let giaGocGoi = Number(hd.tong_tien_goc);

    if (hd.cuoc_hen_id) {
      const appt = await receptionistRepository.getAppointmentWithServicePrice(hd.cuoc_hen_id);
      if (appt) {
        chi_phi_kham = Number(appt.don_gia);
      }

      paidExam = await receptionistRepository.getPaidInvoiceAmountForAppointment(hd.cuoc_hen_id);
      const hasPaidSeparateExam = paidExam > 0;
      giaGocGoi = resolvePackageBasePrice(Number(hd.tong_tien_goc), chi_phi_kham, hasPaidSeparateExam);

      // Miễn phí khám: xem docs/BUSINESS_RULES.md mục 5 / backend/src/domain/billing.ts isExamWaived()
      // — chỉ hóa đơn gói LIỆU_TRÌNH (có phac_do_dieu_tri_id) mới được xét miễn, dịch vụ lẻ (LE)
      // không có phác đồ đi kèm nên không bao giờ đủ điều kiện.
      const loaiGoiForWaiver: LoaiGoi | null = hd.phac_do_dieu_tri_id ? 'LIEU_TRINH' : null;
      if (hasPaidSeparateExam && isExamWaivedDomain(loai_thanh_toan, giaGocGoi, loaiGoiForWaiver)) {
        giam_tru = paidExam;
      }
    }

    let requiredAmount: number;
    if (hd.trang_thai === 'chua_thanh_toan') {
      // First payment
      if (loai_thanh_toan === 'tra_gop') {
        const totalPackage = tong_tien + giam_tru;
        requiredAmount = Math.round(totalPackage / 2) - giam_tru;
      } else if (loai_thanh_toan === 'tung_buoi') {
        requiredAmount = paidExam > 0 ? 0 : chi_phi_kham;
      } else {
        requiredAmount = tong_tien;
      }
    } else if (loai_thanh_toan === 'tung_buoi') {
      // Subsequent session — ưu tiên buổi thứ mấy do caller gửi lên (biết chính xác từ lịch hẹn),
      // chỉ suy ngược từ số đã đóng khi không có (chỉ đúng khi mọi buổi trước thu đúng đơn giá
      // tĩnh — không còn đúng ở buổi cuối cần đòi lệch để khớp tổng, xem getTungBuoiSessionDue).
      const perSessionPrice = so_buoi_goi > 0 ? Math.round(tong_tien / so_buoi_goi) : tong_tien;
      const soBuoiThuTu = Number(so_thu_tu_buoi) || (perSessionPrice > 0 ? Math.floor(da_thanh_toan_truoc / perSessionPrice) + 1 : 1);
      requiredAmount = getTungBuoiSessionDue(tong_tien, so_buoi_goi, soBuoiThuTu, da_thanh_toan_truoc);
    } else {
      // Subsequent payment (remaining/installment 2)
      requiredAmount = tong_tien - da_thanh_toan_truoc;
    }

    return { requiredAmount, giaGocGoi };
  }

  async processPayment(data: any) {
    const { hoa_don_id, phuong_thuc, so_tien_nhan, so_thu_tu_buoi } = data;
    const hd = await receptionistRepository.getInvoiceById(hoa_don_id);
    if (!hd) throw new Error('Không tìm thấy hóa đơn');

    const tong_tien = Number(hd.tong_tien_thanh_toan);
    const da_thanh_toan_truoc = Number(hd.da_thanh_toan);
    const tien_nhan = Number(so_tien_nhan);
    const loai_thanh_toan = hd.loai_thanh_toan;
    const so_buoi_goi = Number(hd.so_buoi_goi) || 1;

    let da_thanh_toan_moi = 0;
    let trang_thai_moi = '';
    const loaiHoaDonForDetail: LoaiGoi | null = hd.phac_do_dieu_tri_id ? 'LIEU_TRINH' : null;
    let chiTiet: ReturnType<typeof describePaymentTransaction> | null = null;

    const { requiredAmount: requiredDot1, giaGocGoi } = await this.computeRequiredPayment(hd, so_thu_tu_buoi);

    if (hd.trang_thai === 'chua_thanh_toan') {
      // First payment
      if (loai_thanh_toan === 'tra_gop') {
        if (tien_nhan < requiredDot1) {
          throw new Error(`Số tiền nhận không đủ cho đợt 1 (tối thiểu ${requiredDot1.toLocaleString()}đ)`);
        }

        if (tien_nhan >= tong_tien) {
          da_thanh_toan_moi = tong_tien;
          trang_thai_moi = 'da_thanh_toan';
          chiTiet = describePaymentTransaction({ loaiHoaDon: loaiHoaDonForDetail, hinhThuc: 'tra_gop', dot: 'tron_goi' });
        } else {
          da_thanh_toan_moi = requiredDot1;
          trang_thai_moi = 'dang_tra_gop';
          chiTiet = describePaymentTransaction({ loaiHoaDon: loaiHoaDonForDetail, hinhThuc: 'tra_gop', dot: 'dot_1' });
        }
      } else if (loai_thanh_toan === 'tung_buoi') {
        if (tien_nhan < requiredDot1) {
          throw new Error(`Số tiền nhận không đủ cho buổi khám lâm sàng (tối thiểu ${requiredDot1.toLocaleString()}đ)`);
        }

        if (tien_nhan >= tong_tien) {
          da_thanh_toan_moi = tong_tien;
          trang_thai_moi = 'da_thanh_toan';
          chiTiet = describePaymentTransaction({ loaiHoaDon: loaiHoaDonForDetail, hinhThuc: 'tung_buoi', dot: 'tron_goi' });
        } else {
          // Under tung_buoi, the initial payment at checkout (requiredDot1) pays for the exam invoice,
          // so the package invoice itself receives 0đ today.
          da_thanh_toan_moi = 0;
          trang_thai_moi = 'dang_tra_tung_buoi';
          chiTiet = describePaymentTransaction({ loaiHoaDon: loaiHoaDonForDetail, hinhThuc: 'tung_buoi', dot: 'phi_kham' });
        }
      } else {
        if (tien_nhan < tong_tien) {
          throw new Error(`Số tiền nhận không đủ (yêu cầu ${tong_tien.toLocaleString()}đ)`);
        }
        da_thanh_toan_moi = tong_tien;
        trang_thai_moi = 'da_thanh_toan';
        chiTiet = describePaymentTransaction({ loaiHoaDon: loaiHoaDonForDetail, hinhThuc: loai_thanh_toan || null, dot: 'tron_goi' });
      }
    } else {
      // Subsequent payment (e.g. paying remaining/installment 2 or subsequent sessions)
      if (loai_thanh_toan === 'tung_buoi') {
        const requiredAmount = requiredDot1; // computeRequiredPayment đã tính đúng theo getTungBuoiSessionDue
        if (tien_nhan < requiredAmount) {
          throw new Error(`Số tiền nhận không đủ thanh toán cho buổi tiếp theo (yêu cầu tối thiểu ${requiredAmount.toLocaleString()}đ)`);
        }
        da_thanh_toan_moi = da_thanh_toan_truoc + requiredAmount;
        trang_thai_moi = da_thanh_toan_moi >= tong_tien ? 'da_thanh_toan' : 'dang_tra_tung_buoi';
        const perSessionPrice = so_buoi_goi > 0 ? Math.round(tong_tien / so_buoi_goi) : tong_tien;
        const soBuoiThuTu = Number(so_thu_tu_buoi) || (perSessionPrice > 0 ? Math.floor(da_thanh_toan_truoc / perSessionPrice) + 1 : 1);
        chiTiet = describePaymentTransaction({
          loaiHoaDon: loaiHoaDonForDetail,
          hinhThuc: 'tung_buoi',
          dot: 'buoi_le',
          soBuoiThuTu,
          tongSoBuoi: so_buoi_goi,
        });
      } else {
        const remaining = requiredDot1; // computeRequiredPayment đã tính = tong_tien - da_thanh_toan_truoc
        if (tien_nhan < remaining) {
          throw new Error(`Số tiền nhận không đủ thanh toán nợ (yêu cầu ${remaining.toLocaleString()}đ)`);
        }
        da_thanh_toan_moi = da_thanh_toan_truoc + remaining;
        trang_thai_moi = 'da_thanh_toan';
        chiTiet = describePaymentTransaction({
          loaiHoaDon: loaiHoaDonForDetail,
          hinhThuc: loai_thanh_toan || null,
          dot: loai_thanh_toan === 'tra_gop' ? 'dot_2' : 'con_lai',
        });
      }
    }

    const actualPaymentAmount = da_thanh_toan_moi - da_thanh_toan_truoc;

    const maGiaoDich = `GD${Math.floor(10000000 + Math.random() * 90000000)}`;
    await receptionistRepository.processPaymentPartial(
      hoa_don_id,
      maGiaoDich,
      actualPaymentAmount,
      da_thanh_toan_moi,
      trang_thai_moi,
      phuong_thuc,
      chiTiet || undefined
    );

    // Update linked treatment plan status on first payment
    if (hd.lich_dieu_tri_id && da_thanh_toan_truoc === 0) {
      const statusToSet = hd.loai_hoa_don === 'dich_vu_don' ? 'da_thanh_toan' : 'dang_dieu_tri';
      await receptionistRepository.updateTreatmentPlanStatus(hd.lich_dieu_tri_id, statusToSet);
    }

    // Mark any pending original exam invoice for this client/appointment as Paid (0đ due) to link it to the package promotion
    const isExamWaived = isExamWaivedDomain(
      hd.loai_thanh_toan || '',
      giaGocGoi,
      hd.phac_do_dieu_tri_id ? 'LIEU_TRINH' : null
    );
    if (isExamWaived) {
      const maHoaDonGoi = `HD-${hoa_don_id.substring(0, 6).toUpperCase()}`;
      const promoNote = `Được miễn phí khám lâm sàng theo chương trình ưu đãi của hóa đơn gói ${maHoaDonGoi}.`;

      if (hd.cuoc_hen_id) {
        // CHỈ đánh dấu miễn phí cho hóa đơn KHÁM (phac_do_dieu_tri_id IS NULL). Trước đây nhánh
        // `cuoc_hen_id = $2` không lọc điều kiện này, nên một hóa đơn GÓI khác chưa thanh toán của
        // cùng ca khám (vd lễ tân lập lại hóa đơn) bị ghi đè thành 0đ kèm ghi chú "miễn phí khám".
        await pool.query(`
          UPDATE hoa_don
          SET trang_thai = 'da_thanh_toan',
              tong_tien_phai_tra = 0,
              so_tien_da_tra = 0,
              ghi_chu = $1
          WHERE phac_do_dieu_tri_id IS NULL
            AND id <> $4
            AND (cuoc_hen_id = $2 OR (khach_hang_id = $3 AND tong_tien_phai_tra = (SELECT don_gia FROM goi_dich_vu WHERE loai_goi = 'KHAM' LIMIT 1)))
            AND trang_thai = 'chua_thanh_toan'
        `, [promoNote, hd.cuoc_hen_id, hd.khach_hang_id, hoa_don_id]);
      } else {
        await pool.query(`
          UPDATE hoa_don
          SET trang_thai = 'da_thanh_toan',
              tong_tien_phai_tra = 0,
              so_tien_da_tra = 0,
              ghi_chu = $1
          WHERE khach_hang_id = $2 
            AND phac_do_dieu_tri_id IS NULL 
            AND tong_tien_phai_tra = (SELECT don_gia FROM goi_dich_vu WHERE loai_goi = 'KHAM' LIMIT 1)
            AND trang_thai = 'chua_thanh_toan'
        `, [promoNote, hd.khach_hang_id]);
      }
    }

    // Mark the original exam invoice as Paid if it is paid now under tung_buoi
    if (hd.loai_thanh_toan === 'tung_buoi' && hd.cuoc_hen_id) {
      const paidExam = await receptionistRepository.getPaidInvoiceAmountForAppointment(hd.cuoc_hen_id);
      if (paidExam === 0) {
        const examInvRes = await pool.query(`
          SELECT id, tong_tien_phai_tra
          FROM hoa_don
          WHERE cuoc_hen_id = $1
            AND phac_do_dieu_tri_id IS NULL
            AND trang_thai = 'chua_thanh_toan'
          LIMIT 1
        `, [hd.cuoc_hen_id]);

        let examInvId: string | null = null;
        let examInvAmount = 0;

        if (examInvRes.rows.length > 0) {
          const examInv = examInvRes.rows[0];
          examInvId = examInv.id;
          examInvAmount = Number(examInv.tong_tien_phai_tra);

          await pool.query(`
            UPDATE hoa_don
            SET trang_thai = 'da_thanh_toan',
                so_tien_da_tra = tong_tien_phai_tra,
                ghi_chu = $1
            WHERE id = $2
          `, [`Đã thanh toán cùng lúc với đăng ký gói trả theo từng buổi.`, examInv.id]);
        } else {
          // Chưa từng có hóa đơn khám riêng nào được tạo trước (lễ tân đăng ký gói trả từng buổi
          // ngay từ đầu, thu phí khám trong CHÍNH lần thanh toán này) — trước đây code chỉ biết
          // CẬP NHẬT hóa đơn khám có sẵn, không tạo mới khi không tìm thấy, nên tiền phí khám đã
          // thu (yêu cầu tối thiểu = requiredDot1 ở nhánh tung_buoi phía trên) bị "biến mất" hoàn
          // toàn: không hóa đơn, không giao dịch, khiến lịch hẹn vẫn hiện "chưa thanh toán". Giờ
          // tạo thật 1 hóa đơn khám mới, đánh dấu đã thanh toán ngay.
          const appt = await receptionistRepository.getAppointmentWithServicePrice(hd.cuoc_hen_id);
          const chiPhiKham = appt ? Number(appt.don_gia) : 0;
          if (chiPhiKham > 0) {
            const { rows: newExamRows } = await pool.query(`
              INSERT INTO hoa_don (khach_hang_id, cuoc_hen_id, tong_tien_goc, tong_tien_phai_tra, so_tien_da_tra, trang_thai, ghi_chu)
              VALUES ($1, $2, $3, $3, $3, 'da_thanh_toan', $4)
              RETURNING id
            `, [hd.khach_hang_id, hd.cuoc_hen_id, chiPhiKham, 'Phí khám lâm sàng — thu cùng lúc đăng ký gói trả theo từng buổi.']);
            examInvId = newExamRows[0].id;
            examInvAmount = chiPhiKham;
          }
        }

        if (examInvId && examInvAmount > 0) {
          // Create payment transaction for the exam invoice
          const maGiaoDichExam = `GD${Math.floor(10000000 + Math.random() * 90000000)}`;
          const chiTietExam = describePaymentTransaction({ loaiHoaDon: 'KHAM', hinhThuc: null, dot: 'phi_kham' });
          await pool.query(`
            INSERT INTO giao_dich_thanh_toan (hoa_don_id, so_tien, loai_giao_dich, phuong_thuc, ma_tham_chieu, nhan_vien_thuc_hien_id, ngay_giao_dich, chi_tiet)
            VALUES ($1, $2, 'THANH_TOAN', $3, $4, 1, NOW(), $5)
          `, [examInvId, examInvAmount, phuong_thuc || 'tien_mat', maGiaoDichExam, JSON.stringify(chiTietExam)]);
        }
      }
    }
    const displayPaymentAmount = (hd.loai_thanh_toan === 'tung_buoi' && da_thanh_toan_truoc === 0 && actualPaymentAmount === 0)
      ? requiredDot1
      : actualPaymentAmount;

    return { 
      success: true, 
      trang_thai_moi, 
      da_thanh_toan_moi,
      actualPaymentAmount: displayPaymentAmount,
      changeAmount: phuong_thuc === 'tien_mat' ? Math.max(0, tien_nhan - displayPaymentAmount) : 0
    };
  }

  /**
   * Số tiền cần thu ĐÚNG NGAY LÚC NÀY cho 1 hóa đơn — dùng cho các kênh thanh toán không trực
   * tiếp qua `processPayment` (vd đăng ký link PayOS), để không tự tính ra 1 số khác với số tiền
   * mặt sẽ yêu cầu. Không mutate gì, chỉ đọc.
   */
  async getRequiredPaymentAmount(hoa_don_id: string, so_thu_tu_buoi?: number) {
    const hd = await receptionistRepository.getInvoiceById(hoa_don_id);
    if (!hd) throw new Error('Không tìm thấy hóa đơn');
    const { requiredAmount } = await this.computeRequiredPayment(hd, so_thu_tu_buoi);
    return { hd, requiredAmount };
  }

  async getActivePackages() {
    return receptionistRepository.getActivePackages();
  }

  async searchCustomers(query: string) {
    return receptionistRepository.searchCustomers(query);
  }

  async getCustomerTreatmentPlans(customerId: string) {
    return receptionistRepository.getCustomerTreatmentPlans(customerId);
  }

  async getCustomerRoster(filters: {
    page: number;
    pageSize: number;
    search: string;
    trangThaiGoi: string;
    canLienHe: boolean;
    staleDays: number;
  }) {
    return receptionistRepository.getCustomerRoster(filters);
  }

  async getCustomerHistory(customerId: string, staleDays: number) {
    const record: any = await receptionistRepository.getCustomerHistory(customerId);
    if (!record) throw new Error('Không tìm thấy khách hàng');

    const activePlan = record.plans.find((p: any) => p.trang_thai === 'dang_dieu_tri');
    let canLienHe = false;
    if (activePlan) {
      const sessions = record.appointments.filter((a: any) => a.phac_do_dieu_tri_id === activePlan.id);
      const completedTimes = sessions
        .filter((a: any) => a.trang_thai === 'hoan_thanh')
        .map((a: any) => new Date(a.ngay_gio_bat_dau).getTime());
      const lastCompletedAt = completedTimes.length ? new Date(Math.max(...completedTimes)) : null;
      const hasUpcoming = sessions.some((a: any) =>
        new Date(a.ngay_gio_bat_dau) > new Date() && !['da_huy', 'huy'].includes(a.trang_thai)
      );
      canLienHe = needsFollowUp({
        trangThaiGoi: activePlan.trang_thai,
        soBuoiDaDung: activePlan.so_buoi_da_dung,
        lastCompletedAt,
        hasUpcomingAppointment: hasUpcoming,
        staleDays
      });
    }

    const completedAny = record.appointments
      .filter((a: any) => a.trang_thai === 'hoan_thanh')
      .map((a: any) => new Date(a.ngay_gio_bat_dau).getTime());
    const lastUsedAt = completedAny.length ? new Date(Math.max(...completedAny)).toISOString() : null;

    return { ...record, can_lien_he: canLienHe, last_used_at: lastUsedAt };
  }

  async getBillingInfoByPackage(customerId: string, packageId: string) {
    return receptionistRepository.getBillingInfoByPackage(customerId, packageId);
  }


  async getAppointmentBillingInfo(id: string) {
    return receptionistRepository.getAppointmentBillingInfo(id);
  }
}

export default new ReceptionistService();
