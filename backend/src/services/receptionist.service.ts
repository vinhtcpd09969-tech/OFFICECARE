import receptionistRepository from '../repositories/receptionist.repository';
import appointmentRepository, { assertTraGopDot2PaidBeforeCheckin } from '../repositories/appointment.repository';
import { pool } from '../config/db';
import {
  describePaymentTransaction,
  getMinPaymentRequired,
  getTungBuoiSessionDue,
} from '../domain/billing';
import { checkReceptionistTransition, isReceptionistLockedStatus } from '../domain/appointmentStatus';
import { needsFollowUp } from '../domain/customerFollowUp';
import { HinhThucThanhToanGoi, LoaiGoi } from '../domain/types';
import { sendPaymentReceiptEmail } from '../utils/mailer';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  tra_thang: 'Trả thẳng 100%',
  tung_buoi: 'Trả từng buổi',
};

class ReceptionistService {
  async updateAppointmentStatus(id: string, trang_thai: string, ghi_chu_noi_bo?: string) {
    const currentApt = await pool.query('SELECT trang_thai, nhan_su_id FROM cuoc_hen WHERE id = $1', [id]);
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
      const check = checkReceptionistTransition(currentStatus, trang_thai, !!currentApt.rows[0].nhan_su_id);
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
    let don_gia_theo_buoi = 0;

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
        if (svc) {
          gia_goc_goi = Number(svc.don_gia);
          ten_item = svc.ten_dich_vu;
        } else {
          gia_goc_goi = 200000;
          ten_item = 'Buổi Lượng Giá PHCN (Chuyên sâu)';
        }
      } else {
        gia_goc_goi = 200000;
        ten_item = 'Buổi Lượng Giá PHCN (Chuyên sâu)';
      }
    } else {
      throw new Error('Loại vật phẩm thanh toán không hợp lệ');
    }

    // "Bỏ logic hardcode trong thanh toán" — không còn giảm giá tự động theo hình thức thanh toán
    // (trước đây 10% trả thẳng / 5% trả góp). Mọi ưu đãi từ nay CHỈ đi qua voucher (B13, xem
    // so_tien_giam_voucher bên dưới) — DEFAULT_DISCOUNT_PERCENT trong billing.ts chỉ còn dùng làm
    // fallback hiển thị % cho hóa đơn CŨ đã ghi giá trị này trước khi đổi, không dùng để tính mới.
    const so_tien_giam_phuong_thuc = 0;

    // 2. Calculate manual voucher discount on package price only
    let voucher_id: string | null = null;
    let so_tien_giam_voucher = 0;

    if (ma_voucher) {
      const voucher = await receptionistRepository.getVoucherByCode(ma_voucher);
      let currentLoaiGoi: 'KHAM' | 'LE' | 'LIEU_TRINH' = 'KHAM';
      if (item_type === 'goi') {
        const pkg = await receptionistRepository.getPackageById(item_id);
        currentLoaiGoi = pkg?.loai_goi === 'LE' ? 'LE' : (pkg?.loai_goi === 'KHAM' ? 'KHAM' : 'LIEU_TRINH');
      } else {
        currentLoaiGoi = 'KHAM';
      }
      await this.assertVoucherUsable(voucher, loai_thanh_toan, khach_hang_id, 'tai_quay', currentLoaiGoi);

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

      voucher_id = voucher.id;
    }

    // Clamp final package total at 0đ minimum
    const tong_tien_goi_sau_giam = Math.max(0, gia_goc_goi - so_tien_giam_phuong_thuc - so_tien_giam_voucher);

    // A19 — hóa đơn gói từ nay ĐỘC LẬP HOÀN TOÀN với hóa đơn khám: buổi Lượng giá luôn được thu
    // tiền riêng và thu TRƯỚC (A8b khóa cứng "Bắt đầu khám" tới khi thanh toán xong), nên không còn
    // khoản "nợ khám" nào để khấu trừ/miễn vào hóa đơn gói nữa. Đã xóa toàn bộ cơ chế tra cứu ca
    // khám gần nhất + isExamWaived/resolvePackageBasePrice — không tham chiếu, không khấu trừ qua
    // lại. `chi_phi_kham`/`giam_tru_kham_truoc_do`/`mien_phi_kham_chua_dong` giữ tên field trong
    // response (một số nơi gọi vẫn đọc) nhưng luôn = 0 từ nay (ngừng ghi mới, xem C11).
    const chi_phi_kham = 0;
    const giam_tru_kham_truoc_do = 0;
    const mien_phi_kham_chua_dong = 0;
    const ngay_thanh_toan_kham_str = '';
    const ma_hoa_don_kham_str = '';
    const ngay_kham_str = '';

    // Total display values (gia_goc on package invoice is always gia_goc_goi)
    const gia_goc = gia_goc_goi;
    const tong_tien_thanh_toan = tong_tien_goi_sau_giam;

    let so_tien_dot_1 = tong_tien_thanh_toan;
    let so_tien_dot_2 = 0;

    if (item_type === 'goi') {
      if (loai_thanh_toan === 'tung_buoi') {
        so_tien_dot_1 = 0;
        so_tien_dot_2 = tong_tien_goi_sau_giam;
      }
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
      ma_hoa_don_kham: ma_hoa_don_kham_str,
      ngay_kham: ngay_kham_str,
      canh_bao_lech_cau_hinh
    };
  }

  /**
   * Kiểm tra mã giảm giá còn hiệu lực (tồn tại, trong hạn, đang kích hoạt, chưa hết lượt dùng,
   * đúng hình thức thanh toán yêu cầu nếu có giới hạn).
   */
  private async assertVoucherUsable(
    voucher: any,
    loai_thanh_toan?: string,
    khach_hang_id?: string,
    kenh?: 'online' | 'tai_quay',
    loai_goi?: 'KHAM' | 'LE' | 'LIEU_TRINH'
  ) {
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
    const hasPaymentRestriction = yeuCauThanhToan.length > 0 && !yeuCauThanhToan.includes('tat_ca');
    if (hasPaymentRestriction && loai_goi === 'LIEU_TRINH' && (!loai_thanh_toan || !yeuCauThanhToan.includes(loai_thanh_toan))) {
      const labels = yeuCauThanhToan.map((v) => PAYMENT_METHOD_LABELS[v] || v).join(', ');
      throw new Error(`Mã giảm giá này chỉ áp dụng cho hình thức thanh toán gói: ${labels}`);
    }



    const loaiGoiApDung: string[] = Array.isArray(voucher.loai_goi_ap_dung)
      ? voucher.loai_goi_ap_dung
      : (voucher.loai_goi_ap_dung ? [voucher.loai_goi_ap_dung] : []);
    const hasLoaiGoiRestriction = loaiGoiApDung.length > 0 && !loaiGoiApDung.includes('tat_ca');
    if (hasLoaiGoiRestriction && loai_goi && !loaiGoiApDung.includes(loai_goi)) {
      const goiLabel = loaiGoiApDung.map(l => l === 'LIEU_TRINH' ? 'Gói liệu trình' : l === 'KHAM' ? 'Buổi lượng giá/Khám' : l === 'LE' ? 'Dịch vụ lẻ' : l).join(', ');
      throw new Error(`Mã giảm giá này chỉ áp dụng cho loại dịch vụ: ${goiLabel}`);
    }
  }

  async getActiveVouchers(khach_hang_id?: string) {
    return receptionistRepository.getActiveVouchers(khach_hang_id);
  }

  async applyVoucher(ma_voucher: string, loai_thanh_toan?: string, khach_hang_id?: string, kenh?: 'online' | 'tai_quay', loai_goi?: 'KHAM' | 'LE' | 'LIEU_TRINH') {
    const voucher = await receptionistRepository.getVoucherByCode(ma_voucher);
    await this.assertVoucherUsable(voucher, loai_thanh_toan, khach_hang_id, kenh, loai_goi);
    return voucher;
  }

  // Hạn sử dụng CHỐT CỨNG (snapshot) đúng 1 lần tại thời điểm kích hoạt đầu tiên — lấy từ cấu hình
  // gói (goi_dich_vu.han_su_dung_mac_dinh_ngay), KHÔNG nhận từ client, KHÔNG cho sửa tay ở hóa đơn.
  // "WHERE han_su_dung IS NULL" đảm bảo chỉ set 1 lần — nếu sau này admin đổi cấu hình gói hoặc plan
  // này nhận thêm hóa đơn khác (vd đợt 2 trả góp), hạn sử dụng đã chốt vẫn giữ nguyên, không bị ghi đè.
  // Dùng chung cho cả 2 luồng kích hoạt: tạo hóa đơn mới thu tiền ngay (createBillingDirect) và thu
  // tiền cho hóa đơn đã tồn tại sẵn từ trước, vd bác sĩ chỉ định gói rồi lễ tân thu tiền sau (processPayment).
  private async snapshotTreatmentPlanExpiry(treatmentPlanId: string) {
    const ldt = await receptionistRepository.getTreatmentPlanById(treatmentPlanId);
    if (!ldt) return;

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
        [Number(soNgayHieuLuc), treatmentPlanId]
      );
    }
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

      if (['tra_thang', 'tung_buoi'].includes(loai_thanh_toan)) {
        await this.snapshotTreatmentPlanExpiry(finalLdtId);
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
        ghi_chu: `Gói trị liệu chỉ định từ ca khám.`
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
      ho_ten_khach: tenKhach,
      so_dien_thoai: sdtKhach,
      ghi_chu: null
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

    // A19 — hóa đơn gói độc lập hoàn toàn với hóa đơn khám (xem calculateBilling): không còn
    // resolvePackageBasePrice/isExamWaivedDomain nào để tính khấu trừ, giaGocGoi lấy thẳng gốc.
    const giaGocGoi = Number(hd.tong_tien_goc);

    let requiredAmount: number;
    if (hd.trang_thai === 'chua_thanh_toan') {
      // First payment
      if (loai_thanh_toan === 'tung_buoi') {
        requiredAmount = 0;
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

  async markPayOSLinkCreated(hoa_don_id: string) {
    return receptionistRepository.markPayOSLinkCreated(hoa_don_id);
  }

  async revertPayOSPending(hoa_don_id: string) {
    return receptionistRepository.revertPayOSPending(hoa_don_id);
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

    const { requiredAmount: requiredDot1 } = await this.computeRequiredPayment(hd, so_thu_tu_buoi);

    if (hd.trang_thai === 'chua_thanh_toan') {
      // First payment
      if (loai_thanh_toan === 'tung_buoi') {
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
          dot: 'con_lai',
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
      if (statusToSet === 'dang_dieu_tri') {
        // Hóa đơn này được tạo sẵn từ trước (vd bác sĩ chỉ định gói) rồi mới thu tiền ở đây, khác với
        // luồng createBillingDirect tạo hóa đơn + thu tiền cùng lúc — vẫn cần chốt hạn sử dụng tại đây.
        await this.snapshotTreatmentPlanExpiry(hd.lich_dieu_tri_id);
      }
      await receptionistRepository.updateTreatmentPlanStatus(hd.lich_dieu_tri_id, statusToSet);
    }

    // A19 — đã bỏ cơ chế "tặng miễn phí khám" (isExamWaived) từng chạy ở đây: điều kiện tiên quyết
    // của nó (hóa đơn khám khác đang chua_thanh_toan) không còn xảy ra được trong luồng chuẩn nữa,
    // vì A8b khóa cứng "Bắt đầu khám" tới khi thanh toán xong — hóa đơn gói và hóa đơn khám từ nay
    // độc lập hoàn toàn, không còn UPDATE chéo nào giữa hai loại hóa đơn.

    // Sync appointment status if this invoice has a direct appointment link
    if (hd.cuoc_hen_id) {
      await pool.query(`
        UPDATE cuoc_hen
        SET trang_thai_thanh_toan = 'da_thanh_toan'
        WHERE id = $1
      `, [hd.cuoc_hen_id]);
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

          await pool.query(`
            UPDATE cuoc_hen
            SET trang_thai_thanh_toan = 'da_thanh_toan'
            WHERE id = $1
          `, [hd.cuoc_hen_id]);
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

            await pool.query(`
              UPDATE cuoc_hen
              SET trang_thai_thanh_toan = 'da_thanh_toan'
              WHERE id = $1
            `, [hd.cuoc_hen_id]);
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

    // Tự động gửi email biên lai thanh toán thành công tới Gmail khách hàng (chạy ngầm, không block response)
    (async () => {
      try {
        const customerInfo = await pool.query(`
          SELECT kh.ho_ten, kh.email, g.ten_goi, g.so_buoi
          FROM hoa_don hd
          JOIN khach_hang kh ON hd.khach_hang_id = kh.id
          LEFT JOIN goi_dich_vu g ON hd.goi_dich_vu_id = g.id
          WHERE hd.id = $1
        `, [hoa_don_id]);

        if (customerInfo.rows.length > 0 && customerInfo.rows[0].email) {
          const cust = customerInfo.rows[0];
          await sendPaymentReceiptEmail({
            toEmail: cust.email,
            userName: cust.ho_ten || 'Quý khách',
            maHoaDon: hd.ma_hoa_don || `HD-${hoa_don_id.slice(0, 6).toUpperCase()}`,
            tenDichVu: cust.ten_goi || hd.ten_dich_vu || 'Dịch vụ phục hồi chức năng',
            soTienThanhToan: actualPaymentAmount || displayPaymentAmount,
            tongTienHoaDon: tong_tien,
            daThanhToan: da_thanh_toan_moi,
            conLai: Math.max(0, tong_tien - da_thanh_toan_moi),
            phuongThuc: phuong_thuc || 'tien_mat',
            hinhThucGoi: loai_thanh_toan || undefined,
            soBuoi: cust.so_buoi || undefined,
            ngayThanhToan: new Date()
          });
        }
      } catch (err) {
        console.error('Không thể gửi email biên lai thanh toán tự động:', err);
      }
    })();

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
    canLienHe: boolean;
    staleDays: number;
  }) {
    return receptionistRepository.getCustomerRoster(filters);
  }

  async getCustomerHistory(customerId: string, staleDays: number) {
    const record: any = await receptionistRepository.getCustomerHistory(customerId);
    if (!record) throw new Error('Không tìm thấy khách hàng');

    // "Lý do cần liên hệ" hợp nhất — suy ra thuần từ dữ liệu vừa tải, không lưu DB (chỉ gợi ý
    // hiển thị). Ưu tiên gói chờ kích hoạt (luật "1 khách 1 liệu trình tại 1 thời điểm" đảm bảo
    // không bao giờ trùng với trường hợp đang điều trị lâu chưa quay lại).
    const pendingPlan = record.plans.find((p: any) => p.trang_thai === 'cho_kich_hoat');
    const activePlan = record.plans.find((p: any) => p.trang_thai === 'dang_dieu_tri');
    let lyDoLienHe: any = null;

    if (pendingPlan) {
      // A19 — không còn hạn kích hoạt, chỉ còn "chờ kích hoạt" thuần túy (bất kể đã bao lâu).
      lyDoLienHe = { type: 'cho_kich_hoat' };
    } else if (activePlan) {
      const sessions = record.appointments.filter((a: any) => a.phac_do_dieu_tri_id === activePlan.id);
      const completedTimes = sessions
        .filter((a: any) => a.trang_thai === 'hoan_thanh')
        .map((a: any) => new Date(a.ngay_gio_bat_dau).getTime());
      const lastCompletedAt = completedTimes.length ? new Date(Math.max(...completedTimes)) : null;
      const hasUpcoming = sessions.some((a: any) =>
        new Date(a.ngay_gio_bat_dau) > new Date() && !['da_huy', 'huy'].includes(a.trang_thai)
      );
      const canLienHe = needsFollowUp({
        trangThaiGoi: activePlan.trang_thai,
        soBuoiDaDung: activePlan.so_buoi_da_dung,
        lastCompletedAt,
        hasUpcomingAppointment: hasUpcoming,
        staleDays
      });
      if (canLienHe) lyDoLienHe = { type: 'lau_chua_quay_lai' };
    }

    const completedAny = record.appointments
      .filter((a: any) => a.trang_thai === 'hoan_thanh')
      .map((a: any) => new Date(a.ngay_gio_bat_dau).getTime());
    const lastUsedAt = completedAny.length ? new Date(Math.max(...completedAny)).toISOString() : null;

    return { ...record, ly_do_lien_he: lyDoLienHe, last_used_at: lastUsedAt };
  }

  async getBillingInfoByPackage(customerId: string, packageId: string) {
    return receptionistRepository.getBillingInfoByPackage(customerId, packageId);
  }


  async getAppointmentBillingInfo(id: string) {
    return receptionistRepository.getAppointmentBillingInfo(id);
  }
}

export default new ReceptionistService();
