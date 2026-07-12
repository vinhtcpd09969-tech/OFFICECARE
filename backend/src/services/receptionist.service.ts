import receptionistRepository from '../repositories/receptionist.repository';
import appointmentRepository from '../repositories/appointment.repository';
import notificationService from './notification.service';
import { pool } from '../config/db';
import {
  DEFAULT_DISCOUNT_PERCENT,
  describePaymentTransaction,
  isExamWaived as isExamWaivedDomain,
  resolvePackageBasePrice,
} from '../domain/billing';
import { LoaiGoi } from '../domain/types';


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
    if (trang_thai === 'da_checkin' || trang_thai === 'check_in') {
      const appt = await pool.query(
        'SELECT phac_do_dieu_tri_id, so_thu_tu_buoi, loai FROM cuoc_hen WHERE id = $1',
        [id]
      );
      if (appt.rows.length > 0) {
        const { phac_do_dieu_tri_id, so_thu_tu_buoi, loai } = appt.rows[0];
        if (loai === 'DIEU_TRI' && phac_do_dieu_tri_id) {
          const pdRes = await pool.query('SELECT tong_so_buoi FROM phac_do_dieu_tri WHERE id = $1', [phac_do_dieu_tri_id]);
          const tong_so_buoi = pdRes.rows[0]?.tong_so_buoi || 10;
          const checkLimitSession = Math.floor(tong_so_buoi / 2);

          if (so_thu_tu_buoi === checkLimitSession) {
            const hdRes = await pool.query(
              'SELECT tong_tien_phai_tra, so_tien_da_tra, trang_thai FROM hoa_don WHERE phac_do_dieu_tri_id = $1',
              [phac_do_dieu_tri_id]
            );
            if (hdRes.rows.length > 0) {
              const hd = hdRes.rows[0];
              const isFullyPaid = hd.trang_thai === 'da_thanh_toan' || Number(hd.so_tien_da_tra) >= Number(hd.tong_tien_phai_tra);
              if (!isFullyPaid) {
                const err = new Error(`Khách hàng bắt buộc phải đóng nốt 50% còn lại của gói trước khi check-in Buổi ${checkLimitSession}.`) as any;
                err.statusCode = 400;
                throw err;
              }
            }
          }
        }
      }
    }

    const appointment = await receptionistRepository.updateAppointmentStatus(id, trang_thai, ghi_chu_noi_bo);
    if (!appointment) throw new Error('Không tìm thấy lịch hẹn');

    // Kích hoạt gửi thông báo tự động cho khách hàng
    notificationService.triggerAppointmentNotification(id, trang_thai).catch(err => {
      console.error('Lỗi khi trigger thông báo từ le_tan service:', err);
    });

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

    let khachHangId;
    const existCust = await receptionistRepository.findCustomerByPhone(sdt);
    
    if (existCust) {
      khachHangId = existCust.khach_hang_id;
    } else {
      khachHangId = await receptionistRepository.createWalkInCustomer(ho_ten, sdt, gioi_tinh, ngay_sinh);
    }

    const duration = await receptionistRepository.getServiceDuration(goi_dich_vu_id);
    const startTime = new Date(gio_bat_dau);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    const maLichDat = `LD${Math.floor(100000 + Math.random() * 900000)}`;

    const lich_dat_id = await receptionistRepository.createAppointment(maLichDat, khachHangId, goi_dich_vu_id, bac_si_id, startTime, endTime);
    return { lich_dat_id };
  }

  async createBillingFromAppointment(lich_dat_id: string) {
    const lich = await receptionistRepository.getAppointmentForBilling(lich_dat_id);
    if (!lich) throw new Error('Lịch hẹn không hợp lệ hoặc chưa hoàn thành');

    const maHoaDon = `HD${Math.floor(100000 + Math.random() * 900000)}`;
    const result = await receptionistRepository.createBilling(maHoaDon, lich.khach_hang_id, lich_dat_id, lich.don_gia, lich.goi_dich_vu_id);
    
    const { hoa_don, doctorUserId, customerName } = result;

    if (doctorUserId) {
      try {
        await notificationService.createNotification(
          doctorUserId,
          'Đồng bộ hồ sơ điều trị',
          `Bệnh nhân ${customerName} đã chuyển sang thanh toán lẻ 1 buổi sau buổi trải nghiệm.`,
          'he_thong'
        );
      } catch (err) {
        console.error('Lỗi gửi thông báo cho bác sĩ khi hạ cấp gói:', err);
      }
    }

    return hoa_don;
  }

  async calculateBilling(data: any) {
    let { item_type, item_id, loai_thanh_toan, ma_voucher, lich_dat_id } = data;

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

    if (item_type === 'goi') {
      const pkg = await receptionistRepository.getPackageById(item_id);
      if (!pkg) throw new Error('Không tìm thấy gói dịch vụ');
      gia_goc_goi = Number(pkg.gia_goi);
      ten_item = pkg.ten_goi;
      so_buoi_goi = pkg.tong_so_buoi;
      don_gia_theo_buoi = Number(pkg.don_gia_theo_buoi || 0);
      loai_goi_db = pkg.loai_goi || '';
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
      if (!voucher) {
        throw new Error('Mã giảm giá không tồn tại');
      }

      // Check date range
      const now = new Date();
      const startDate = new Date(voucher.ngay_bat_dau);
      const endDate = voucher.ngay_het_han ? new Date(voucher.ngay_het_han) : null;
      if (now < startDate || (endDate && now > endDate)) {
        throw new Error('Mã giảm giá đã hết hạn hoặc chưa được kích hoạt');
      }

      // Check status
      if (voucher.trang_thai !== 'hoat_dong') {
        throw new Error('Mã giảm giá không hoạt động');
      }

      // Check usage count
      const usageCount = await receptionistRepository.countVoucherUsage(voucher.id);
      if (voucher.so_luong_toi_da !== null && usageCount >= voucher.so_luong_toi_da) {
        throw new Error('Mã giảm giá đã hết lượt sử dụng');
      }

      // Check minimum order value
      if (gia_goc_goi < Number(voucher.don_hang_toi_thieu)) {
        throw new Error(`Đơn hàng chưa đạt giá trị tối thiểu (${Number(voucher.don_hang_toi_thieu).toLocaleString()}đ) để áp dụng mã này`);
      }

      // Check payment requirements
      if (voucher.yeu_cau_thanh_toan === 'tra_thang' && loai_thanh_toan !== 'tra_thang') {
        throw new Error('Mã giảm giá này chỉ áp dụng cho hình thức thanh toán trả thẳng');
      }
      if (voucher.yeu_cau_thanh_toan === 'tra_gop' && loai_thanh_toan !== 'tra_gop') {
        throw new Error('Mã giảm giá này chỉ áp dụng cho hình thức thanh toán trả góp');
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

      // Mutual exclusivity comparison: Pick the one that reduces more money
      if (so_tien_giam_voucher > so_tien_giam_phuong_thuc) {
        so_tien_giam_phuong_thuc = 0;
        voucher_id = voucher.id;
      } else {
        so_tien_giam_voucher = 0;
        voucher_id = null;
      }
    }

    // Clamp final package total at 0đ minimum
    const tong_tien_goi_sau_giam = Math.max(0, gia_goc_goi - so_tien_giam_phuong_thuc - so_tien_giam_voucher);

    // Fetch clinical assessment fee from DB dynamically if appointment is selected
    let chi_phi_kham = 0; // In the new design, chi_phi_kham is always 0 on the package invoice
    let giam_tru_kham_truoc_do = 0;
    let mien_phi_kham_chua_dong = 0;
    let ngay_thanh_toan_kham_str = '';
    let ngay_kham_str = '';
    let hasPaidExam = true;
    let appt_price = 150000;

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

      const paidAmount = await receptionistRepository.getPaidInvoiceAmountForAppointment(targetLichDatId);
      hasPaidExam = paidAmount > 0;
      if (hasPaidExam) {
        const paidInvoice = await pool.query(
          "SELECT ngay_tao FROM hoa_don WHERE cuoc_hen_id = $1 AND trang_thai = 'da_thanh_toan' LIMIT 1",
          [targetLichDatId]
        );
        if (paidInvoice.rows.length > 0 && paidInvoice.rows[0].ngay_tao) {
          const d = new Date(paidInvoice.rows[0].ngay_tao);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          ngay_thanh_toan_kham_str = `${day}/${month}/${year}`;
        }
      }

      // Miễn phí khám: xem docs/BUSINESS_RULES.md mục 5 / backend/src/domain/billing.ts isExamWaived()
      const isExamWaived = isExamWaivedDomain(loai_thanh_toan, gia_goc_goi);

      if (isExamWaived) {
        if (hasPaidExam) {
          // Exam already paid separately
          giam_tru_kham_truoc_do = appt_price;
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
      don_gia_theo_buoi,
      ngay_thanh_toan_kham: ngay_thanh_toan_kham_str,
      ngay_kham: ngay_kham_str
    };
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
        ma_voucher: null,
        lich_dat_id: null
      });

      const invoiceData = {
        khach_hang_id: appt.khach_hang_id,
        item_type: 'dich_vu',
        item_id: appt.goi_dich_vu_id,
        loai_thanh_toan: 'tra_thang',
        voucher_id: null,
        so_tien_giam_voucher: 0,
        uu_dai_thanh_toan_id: null,
        so_tien_giam_phuong_thuc: 0,
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

      // Update package expiration date if custom validity duration is supplied
      const so_ngay_hieu_luc = data.so_ngay_hieu_luc;
      if (so_ngay_hieu_luc && ['tra_thang', 'tra_gop'].includes(loai_thanh_toan)) {
        await pool.query(
          `UPDATE phac_do_dieu_tri 
           SET han_su_dung = CURRENT_DATE + $1 * INTERVAL '1 day'
           WHERE id = $2`,
          [Number(so_ngay_hieu_luc), finalLdtId]
        );
      }

      const calc = await this.calculateBilling({ 
        item_type: 'goi', 
        item_id: ldt.goi_dich_vu_id, 
        loai_thanh_toan, 
        ma_voucher,
        lich_dat_id // Fetch and add dynamic clinical assessment fee!
      });

      const invoiceData = {
        lich_dieu_tri_id: finalLdtId,
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

    const calc = await this.calculateBilling({ item_type, item_id, loai_thanh_toan, ma_voucher, lich_dat_id });

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

  async processPayment(data: any) {
    const { hoa_don_id, phuong_thuc, so_tien_nhan } = data;
    const hd = await receptionistRepository.getInvoiceById(hoa_don_id);
    if (!hd) throw new Error('Không tìm thấy hóa đơn');

    const tong_tien = Number(hd.tong_tien_thanh_toan);
    const da_thanh_toan_truoc = Number(hd.da_thanh_toan);
    const tien_nhan = Number(so_tien_nhan);
    const loai_thanh_toan = hd.loai_thanh_toan;
    const so_buoi_goi = Number(hd.so_buoi_goi) || 1;

    let da_thanh_toan_moi = 0;
    let trang_thai_moi = '';
    let chi_phi_kham = 0;
    let giam_tru = 0;
    let requiredDot1 = 0;
    let hasPaidSeparateExam = false;
    let giaGocGoi = Number(hd.tong_tien_goc);
    const loaiHoaDonForDetail: LoaiGoi | null = hd.phac_do_dieu_tri_id ? 'LIEU_TRINH' : null;
    let chiTiet: ReturnType<typeof describePaymentTransaction> | null = null;

    if (hd.cuoc_hen_id) {
      const appt = await receptionistRepository.getAppointmentWithServicePrice(hd.cuoc_hen_id);
      if (appt) {
        chi_phi_kham = Number(appt.don_gia);
      }

      const paidExam = await receptionistRepository.getPaidInvoiceAmountForAppointment(hd.cuoc_hen_id);
      hasPaidSeparateExam = paidExam > 0;
      giaGocGoi = resolvePackageBasePrice(Number(hd.tong_tien_goc), chi_phi_kham, hasPaidSeparateExam);

      // Miễn phí khám: xem docs/BUSINESS_RULES.md mục 5 / backend/src/domain/billing.ts isExamWaived()
      if (hasPaidSeparateExam && isExamWaivedDomain(loai_thanh_toan, giaGocGoi)) {
        giam_tru = paidExam;
      }
    }

    if (hd.trang_thai === 'chua_thanh_toan') {
      // First payment
      if (loai_thanh_toan === 'tra_gop') {
        const totalPackage = tong_tien + giam_tru;
        requiredDot1 = Math.round(totalPackage / 2) - giam_tru;
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
        const paidExam = await receptionistRepository.getPaidInvoiceAmountForAppointment(hd.cuoc_hen_id);
        requiredDot1 = paidExam > 0 ? 0 : chi_phi_kham;
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
        requiredDot1 = tong_tien;
        if (tien_nhan < tong_tien) {
          throw new Error(`Số tiền nhận không đủ (yêu cầu ${tong_tien.toLocaleString()}đ)`);
        }
        da_thanh_toan_moi = tong_tien;
        trang_thai_moi = 'da_thanh_toan';
        chiTiet = describePaymentTransaction({ loaiHoaDon: loaiHoaDonForDetail, hinhThuc: loai_thanh_toan || null, dot: 'tron_goi' });
      }
    } else {
      // Subsequent payment (e.g. paying remaining/installment 2 or subsequent sessions)
      const remaining = tong_tien - da_thanh_toan_truoc;
      if (loai_thanh_toan === 'tung_buoi') {
        const perSessionPrice = Math.round(tong_tien / so_buoi_goi);
        const requiredAmount = Math.min(perSessionPrice, remaining);
        if (tien_nhan < requiredAmount) {
          throw new Error(`Số tiền nhận không đủ thanh toán cho buổi tiếp theo (yêu cầu tối thiểu ${requiredAmount.toLocaleString()}đ)`);
        }
        da_thanh_toan_moi = da_thanh_toan_truoc + requiredAmount;
        trang_thai_moi = da_thanh_toan_moi >= tong_tien ? 'da_thanh_toan' : 'dang_tra_tung_buoi';
        const soBuoiThuTu = perSessionPrice > 0 ? Math.floor(da_thanh_toan_truoc / perSessionPrice) + 1 : null;
        chiTiet = describePaymentTransaction({
          loaiHoaDon: loaiHoaDonForDetail,
          hinhThuc: 'tung_buoi',
          dot: 'buoi_le',
          soBuoiThuTu,
          tongSoBuoi: so_buoi_goi,
        });
      } else {
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
    const isExamWaived = !!hd.phac_do_dieu_tri_id && isExamWaivedDomain(hd.loai_thanh_toan || '', giaGocGoi);
    if (isExamWaived) {
      const maHoaDonGoi = `HD-${hoa_don_id.substring(0, 6).toUpperCase()}`;
      const promoNote = `Được miễn phí khám lâm sàng theo chương trình ưu đãi của hóa đơn gói ${maHoaDonGoi}.`;

      if (hd.cuoc_hen_id) {
        await pool.query(`
          UPDATE hoa_don
          SET trang_thai = 'da_thanh_toan',
              tong_tien_phai_tra = 0,
              so_tien_da_tra = 0,
              ghi_chu = $1
          WHERE (cuoc_hen_id = $2 OR (khach_hang_id = $3 AND phac_do_dieu_tri_id IS NULL AND tong_tien_phai_tra = (SELECT don_gia FROM goi_dich_vu WHERE loai_goi = 'KHAM' LIMIT 1)))
            AND trang_thai = 'chua_thanh_toan'
        `, [promoNote, hd.cuoc_hen_id, hd.khach_hang_id]);
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
        if (examInvRes.rows.length > 0) {
          const examInv = examInvRes.rows[0];
          
          await pool.query(`
            UPDATE hoa_don
            SET trang_thai = 'da_thanh_toan',
                so_tien_da_tra = tong_tien_phai_tra,
                ghi_chu = $1
            WHERE id = $2
          `, [`Đã thanh toán cùng lúc với đăng ký gói trả theo từng buổi.`, examInv.id]);

          // Create payment transaction for the exam invoice
          const maGiaoDichExam = `GD${Math.floor(10000000 + Math.random() * 90000000)}`;
          const chiTietExam = describePaymentTransaction({ loaiHoaDon: 'KHAM', hinhThuc: null, dot: 'phi_kham' });
          await pool.query(`
            INSERT INTO giao_dich_thanh_toan (hoa_don_id, so_tien, loai_giao_dich, phuong_thuc, ma_tham_chieu, nhan_vien_thuc_hien_id, ngay_giao_dich, chi_tiet)
            VALUES ($1, $2, 'THANH_TOAN', $3, $4, 1, NOW(), $5)
          `, [examInv.id, Number(examInv.tong_tien_phai_tra), phuong_thuc || 'tien_mat', maGiaoDichExam, JSON.stringify(chiTietExam)]);
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

  async getActivePackages() {
    return receptionistRepository.getActivePackages();
  }

  async searchCustomers(query: string) {
    return receptionistRepository.searchCustomers(query);
  }

  async getCustomerTreatmentPlans(customerId: string) {
    return receptionistRepository.getCustomerTreatmentPlans(customerId);
  }

  async getBillingInfoByPackage(customerId: string, packageId: string) {
    return receptionistRepository.getBillingInfoByPackage(customerId, packageId);
  }

  async getPendingPackageActivations(customerId: string) {
    return receptionistRepository.getPendingPackageActivations(customerId);
  }

  async getAppointmentBillingInfo(id: string) {
    return receptionistRepository.getAppointmentBillingInfo(id);
  }
}

export default new ReceptionistService();
