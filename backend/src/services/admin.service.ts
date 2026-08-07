import adminRepository from '../repositories/admin.repository';
import bcrypt from 'bcryptjs';
import { SentimentService } from './sentiment.service';

class AdminService {
  // --- QUẢN LÝ PHÒNG KHÁM ---
  async getRooms() {
    return adminRepository.getRooms();
  }

  async createRoom(data: any) {
    return adminRepository.createRoom(data);
  }

  async updateRoom(id: string | number, data: any) {
    return adminRepository.updateRoom(id, data);
  }

  async deleteRoom(id: string | number) {
    return adminRepository.deleteRoom(id);
  }

  // --- QUẢN LÝ GÓI ĐIỀU TRỊ ---
  async getPackages() {
    return adminRepository.getPackages();
  }

  async createPackage(data: any) {
    return adminRepository.createPackage(data);
  }

  async updatePackage(id: string, data: any) {
    return adminRepository.updatePackage(id, data);
  }

  async deletePackage(id: string) {
    return adminRepository.deletePackage(id);
  }

  // --- QUẢN LÝ NHÂN SỰ ---
  async getStaff() {
    return adminRepository.getStaff();
  }

  async createStaff(data: any) {
    const existing = await adminRepository.findUserByEmail(data.email);
    if (existing) throw new Error('Email đã được sử dụng');

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(data.mat_khau, salt);

    return adminRepository.createStaff(data, hash);
  }

  async updateStaffStatus(id: string, status: string) {
    const user = await adminRepository.updateStaffStatus(id, status);
    if (!user) throw new Error('Không tìm thấy nhân sự');
    return user;
  }

  async updateStaffDetails(id: string, data: any) {
    const user = await adminRepository.updateStaffDetails(id, data);
    if (!user) throw new Error('Không tìm thấy nhân sự');
    return user;
  }

  async deleteStaffAvatar(id: string) {
    const user = await adminRepository.deleteStaffAvatar(id);
    if (!user) throw new Error('Không tìm thấy nhân sự');
    return user;
  }

  async updateStaffPassword(id: string, password: string) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await adminRepository.updateStaffPassword(id, hash);
    if (!user) throw new Error('Không tìm thấy nhân sự');
    return user;
  }

  // --- QUẢN LÝ KHÁCH HÀNG ---
  async getCustomers() {
    return adminRepository.getCustomers();
  }

  async updateCustomer(id: string, data: any) {
    return adminRepository.updateCustomer(id, data);
  }

  async updateCustomerLock(id: string, isLocked: boolean) {
    return adminRepository.updateCustomerLock(id, isLocked);
  }

  async getCustomerLockImpact(id: string) {
    return adminRepository.getCustomerLockImpact(id);
  }

  async getCustomersOverview(filters: { page: number; pageSize: number; search: string; status: string[]; repTier?: 'low' | 'mid' | 'high' }) {
    return adminRepository.getCustomersOverview(filters);
  }

  async getTreatmentPlansOverview(filters: { page: number; pageSize: number; search: string; status?: string }) {
    return adminRepository.getTreatmentPlansOverview(filters);
  }

  async getCompletedSingleVisits(params: { page: number; pageSize: number }) {
    return adminRepository.getCompletedSingleVisits(params);
  }

  async getCustomerEmr(id: string) {
    const record: any = await adminRepository.getCustomerEmr(id);
    if (!record) throw new Error('Không tìm thấy khách hàng');
    const { reminder_raw, ...rest } = record;
    return { ...rest, reminder: this.formatCustomerReminder(reminder_raw) };
  }

  // Banner nhắc nhở ở trang chi tiết khách hàng — ưu tiên "gói chờ kích hoạt còn hạn", sau đó mới tới
  // "buổi gần nhất của gói đang điều trị"; không có gì thì trả null (ẩn hẳn banner).
  private formatCustomerReminder(raw: any): { type: string; message: string } | null {
    if (raw?.pending_activation?.han_kich_hoat) {
      const diffMs = new Date(raw.pending_activation.han_kich_hoat).getTime() - Date.now();
      if (diffMs > 0) {
        // Tự chọn đơn vị theo độ lớn còn lại — hạn thật (3 ngày) hiện "ngày+giờ" là đủ, nhưng cửa
        // sổ bị rút ngắn lúc test (vài phút) mà vẫn cố định "ngày+giờ" sẽ ra "0 ngày 0 giờ" vô nghĩa.
        const days = Math.floor(diffMs / 86400000);
        const hours = Math.floor((diffMs % 86400000) / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        const conLai = days >= 1 ? `${days} ngày ${hours} giờ` : hours >= 1 ? `${hours} giờ ${minutes} phút` : `${Math.max(1, minutes)} phút`;
        return {
          type: 'pending_activation',
          message: `Gói "${raw.pending_activation.ten_goi}" còn ${conLai} để kích hoạt`
        };
      }
    }
    if (raw?.last_active_session_at) {
      const days = Math.max(0, Math.floor((Date.now() - new Date(raw.last_active_session_at).getTime()) / 86400000));
      return {
        type: 'in_treatment',
        message: `Buổi điều trị gần nhất của gói "${raw.active_plan_name}" cách đây ${days} ngày`
      };
    }
    return null;
  }

  // --- QUẢN LÝ THIẾT BỊ Y TẾ ---
  async getEquipment() {
    return adminRepository.getEquipment();
  }

  async createEquipment(data: any) {
    return adminRepository.createEquipment('', data);
  }

  async updateEquipment(id: string, data: any) {
    return adminRepository.updateEquipment(id, data);
  }

  async deleteEquipment(id: string) {
    return adminRepository.deleteEquipment(id);
  }


  // --- QUẢN LÝ LỊCH LÀM VIỆC ---
  async getSchedules() {
    return adminRepository.getSchedules();
  }

  async createSchedule(data: any) {
    return adminRepository.createSchedule(data);
  }

  async updateSchedule(id: string, data: any) {
    return adminRepository.updateSchedule(id, data);
  }

  async deleteSchedule(id: string) {
    return adminRepository.deleteSchedule(id);
  }

  // --- QUẢN LÝ HỒ SƠ ĐIỀU TRỊ ---
  async getMedicalRecords() {
    return adminRepository.getMedicalRecords();
  }

  // --- QUẢN LÝ TÀI CHÍNH ---
  async getInvoices() {
    return adminRepository.getInvoices();
  }

  async getPayments() {
    return adminRepository.getPayments();
  }

  async handleRefund(id: string, data: any) {
    const result = await adminRepository.handleRefund(id, data.ly_do_hoan_tien);
    if (result.error) {
      const err = new Error(result.error) as any;
      err.code = result.code;
      throw err;
    }
    return result;
  }

  async handlePackageRefund(id: string, data: any, userId: number) {
    // A15b — tỉ lệ phạt không còn nhận từ request (đọc snapshot ti_le_phat_huy_goi trong repository).
    const result = await adminRepository.handlePackageRefund(
      id,
      Number(data.so_buoi_dung || 0),
      data.ly_do || 'Hủy gói theo yêu cầu của Admin',
      userId
    );
    if (result.error) {
      const err = new Error(result.error) as any;
      err.code = result.code;
      throw err;
    }
    return result;
  }

  async expirePackageNoRefund(id: string, data: any, userId: number) {
    const result = await adminRepository.expirePackageNoRefund(id, data.ly_do, userId);
    if (result.error) {
      const err = new Error(result.error) as any;
      err.code = result.code;
      throw err;
    }
    return result;
  }

  // --- QUẢN LÝ MARKETING ---
  async getVouchers() {
    return adminRepository.getVouchers();
  }

  async createVoucher(data: any, userId: string) {
    const existing = await adminRepository.getVoucherByCode(data.ma_voucher);
    if (existing) throw new Error('Mã voucher đã tồn tại');

    return adminRepository.createVoucher(data, userId);
  }

  async updateVoucher(id: string, data: any) {
    const voucher = await adminRepository.updateVoucher(id, data);
    if (!voucher) throw new Error('Không tìm thấy voucher');
    return voucher;
  }

  async deleteVoucher(id: string) {
    const voucher = await adminRepository.deleteVoucher(id);
    if (!voucher) throw new Error('Không tìm thấy voucher');
    return voucher;
  }

  // --- QUẢN LÝ ĐÁNH GIÁ ---
  async getFeedback() {
    return adminRepository.getFeedback();
  }

  async replyServiceFeedback(id: string, phanHoi: string, staffId: number) {
    return adminRepository.replyServiceFeedback(id, phanHoi, staffId);
  }

  async replyStaffFeedback(id: string, phanHoi: string, staffId: number) {
    return adminRepository.replyStaffFeedback(id, phanHoi, staffId);
  }

  async analyzeFeedback(type: 'service' | 'staff', id: string) {
    const review = await adminRepository.getFeedbackReviewText(id);
    if (!review) throw new Error('Không tìm thấy đánh giá');
    if (!review.nhan_xet || !review.nhan_xet.trim()) {
      throw new Error('Đánh giá này không có nội dung nhận xét để AI phân tích');
    }

    const result = type === 'service'
      ? await SentimentService.classifyAndSaveServiceReview(id, review.nhan_xet, review.so_sao)
      : await SentimentService.classifyAndSaveStaffReview(id, review.nhan_xet, review.so_sao);

    if (!result) {
      throw new Error('AI hiện không thể phân tích (có thể đã hết lượt gọi miễn phí trong hôm nay). Vui lòng thử lại sau.');
    }
    return result;
  }

  // --- BÁO CÁO & THỐNG KÊ ---
  async getDashboardSummary(range?: string, startDate?: string, endDate?: string) {
    return adminRepository.getDashboardSummary(range, startDate, endDate);
  }

  async getRevenueStats(range?: string, startDate?: string, endDate?: string, bucket?: string) {
    return adminRepository.getRevenueStats(range, startDate, endDate, bucket);
  }

  async getStaffPerformance() {
    return adminRepository.getStaffPerformance();
  }

  async getTopPackages() {
    return adminRepository.getTopPackages();
  }

  async getTopVipCustomers() {
    return adminRepository.getTopVipCustomers();
  }

  async getAvailableStaff(dich_vu_id: string | null, dang_ky_goi_id: string | null, ngay: string, gio_bat_dau: string) {
    return adminRepository.getAvailableStaff(dich_vu_id, dang_ky_goi_id, ngay, gio_bat_dau);
  }
}

export default new AdminService();
