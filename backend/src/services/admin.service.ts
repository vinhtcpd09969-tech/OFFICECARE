import adminRepository from '../repositories/admin.repository';
import bcrypt from 'bcryptjs';

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

  // --- QUẢN LÝ DANH MỤC GÓI ---
  async getCategories() {
    return adminRepository.getCategories();
  }

  async createCategory(data: any) {
    return adminRepository.createCategory(data);
  }

  async updateCategory(id: string, data: any) {
    return adminRepository.updateCategory(id, data);
  }

  async deleteCategory(id: string) {
    return adminRepository.deleteCategory(id);
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
    const result = await adminRepository.handlePackageRefund(
      id,
      Number(data.so_buoi_dung || 0),
      Number(data.phi_phat || 0),
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

  // --- BÁO CÁO & THỐNG KÊ ---
  async getDashboardSummary() {
    return adminRepository.getDashboardSummary();
  }

  async getRevenueStats(type?: string, startDate?: string, endDate?: string) {
    return adminRepository.getRevenueStats(type, startDate, endDate);
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

  async getReviews() {
    return adminRepository.getReviews();
  }

  async getAvailableStaff(dich_vu_id: string | null, dang_ky_goi_id: string | null, ngay: string, gio_bat_dau: string) {
    return adminRepository.getAvailableStaff(dich_vu_id, dang_ky_goi_id, ngay, gio_bat_dau);
  }
}

export default new AdminService();
