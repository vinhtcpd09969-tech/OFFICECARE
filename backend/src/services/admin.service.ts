import adminRepository from '../repositories/admin.repository';
import bcrypt from 'bcryptjs';

class AdminService {
  // --- QUẢN LÝ DỊCH VỤ & DANH MỤC ---
  async getCategories() {
    return adminRepository.getCategories();
  }

  async getRooms() {
    return adminRepository.getRooms();
  }

  async createRoom(data: any) {
    let ma_phong = data.ma_phong;
    if (!ma_phong || String(ma_phong).trim() === '') {
      const { rows: existingRooms } = await adminRepository.getRawPool().query(
        `SELECT ma_phong FROM phong 
         WHERE ma_phong ~ '^P\\d+$' 
         ORDER BY length(ma_phong) DESC, ma_phong DESC`
      );
      
      let maxNum = 0;
      let maxDigits = 3;
      
      for (const r of existingRooms) {
        const code = r.ma_phong;
        const numPart = code.substring(1);
        const num = parseInt(numPart, 10);
        if (num > maxNum) {
          maxNum = num;
          maxDigits = Math.max(3, numPart.length);
        }
      }
      
      const nextNum = maxNum > 0 ? maxNum + 1 : 201;
      ma_phong = `P${String(nextNum).padStart(maxDigits, '0')}`;
    }
    return adminRepository.createRoom({ ...data, ma_phong });
  }

  async updateRoom(id: string | number, data: any) {
    return adminRepository.updateRoom(id, data);
  }

  async deleteRoom(id: string | number) {
    return adminRepository.deleteRoom(id);
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

  async getServices() {
    return adminRepository.getServices();
  }

  async createService(data: any) {
    return adminRepository.createService(data);
  }

  async updateService(id: string, data: any) {
    return adminRepository.updateService(id, data);
  }

  async deleteService(id: string) {
    return adminRepository.deleteService(id);
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

  // --- QUẢN LÝ KHÁCH HÀNG ---
  async getCustomers() {
    return adminRepository.getCustomers();
  }

  // --- QUẢN LÝ THIẾT BỊ Y TẾ ---
  async getEquipment() {
    return adminRepository.getEquipment();
  }

  async createEquipment(data: any) {
    const count = data.so_luong || 1;
    const phongId = data.phong_id_hien_tai ? Number(data.phong_id_hien_tai) : null;
    
    // Resolve loai_thiet_bi from loai_thiet_bi_id if provided
    let resolvedLoaiText = data.loai_thiet_bi || '';
    if (data.loai_thiet_bi_id) {
      const typeRecord = await adminRepository.getEquipmentTypeById(Number(data.loai_thiet_bi_id));
      if (typeRecord) {
        resolvedLoaiText = typeRecord.ten_loai;
      }
    }
    
    const resolvedData = {
      ...data,
      loai_thiet_bi: resolvedLoaiText
    };

    // Bỏ qua kiểm tra tương thích phòng và sức chứa phòng do tài nguyên thiết bị đã được đưa về bể dùng chung (Pool-based)
    
    // 3. Tự động xác định tiền tố mã thiết bị
    const getCodePrefix = (type: string): string => {
      const typeLower = (type || '').toLowerCase().trim();
      if (typeLower.includes('nén ép')) return 'EQP-COM';
      if (typeLower.includes('kéo giãn cổ') || typeLower.includes('keo gian co')) return 'EQP-CST';
      if (typeLower.includes('giường kéo giãn') || typeLower.includes('giuong keo gian')) return 'EQP-DTS';
      if (typeLower.includes('điện xung') || typeLower.includes('dien xung')) return 'EQP-ELT';
      if (typeLower.includes('hồng ngoại') || typeLower.includes('hong ngoai')) return 'EQP-IR';
      if (typeLower.includes('laser')) return 'EQP-LAS';
      if (typeLower.includes('từ trường') || typeLower.includes('tu truong')) return 'EQP-SIS';
      if (typeLower.includes('shockwave') || typeLower.includes('xung kích')) return 'EQP-SW';
      if (typeLower.includes('siêu âm') || typeLower.includes('sieu am')) return 'EQP-US';
      if (typeLower.includes('giường') || typeLower.includes('giuong')) return 'EQP-BED';
      return 'EQP-GEN';
    };

    const prefix = getCodePrefix(resolvedLoaiText);
    
    // 4. Lấy mã lớn nhất hiện tại để tự động tăng
    const { rows: existingCodes } = await adminRepository.getRawPool().query(
      `SELECT ma_thiet_bi FROM thiet_bi_y_te 
       WHERE ma_thiet_bi LIKE $1 
       ORDER BY length(ma_thiet_bi) DESC, ma_thiet_bi DESC`,
      [`${prefix}%`]
    );
    
    let maxNum = 0;
    let maxDigits = 2; // Độ dài mặc định cho chữ số (ví dụ: 01)
    
    for (const r of existingCodes) {
      const code = r.ma_thiet_bi;
      const numPart = code.substring(prefix.length);
      if (/^\d+$/.test(numPart)) {
        const num = parseInt(numPart, 10);
        if (num > maxNum) {
          maxNum = num;
          maxDigits = numPart.length;
        }
      }
    }
    
    // 5. Tạo danh sách thiết bị
    const results = [];
    let currentNum = maxNum + 1;
    
    for (let i = 0; i < count; i++) {
      const code = `${prefix}${String(currentNum).padStart(maxDigits, '0')}`;
      
      // Auto-append sequence suffix to the name if count > 1
      let baseName = (resolvedData.ten_thiet_bi || '').trim();
      if (count > 1) {
        baseName = baseName.replace(/\s+(s[ốo]|no\.?)?\s*\d+$/i, '');
      }
      const suffix = count > 1 ? ` ${String(currentNum).padStart(maxDigits, '0')}` : '';
      const customData = {
        ...resolvedData,
        ten_thiet_bi: `${baseName}${suffix}`
      };
      
      currentNum++;
      
      const singleEq = await adminRepository.createEquipment(code, customData);
      results.push(singleEq);
    }
    
    // Trả về thiết bị đầu tiên để tương thích đầu ra API cũ
    return results[0];
  }

  async updateEquipment(id: string, data: any) {
    let resolvedLoaiText = data.loai_thiet_bi;
    if (data.loai_thiet_bi_id) {
      const typeRecord = await adminRepository.getEquipmentTypeById(Number(data.loai_thiet_bi_id));
      if (typeRecord) {
        resolvedLoaiText = typeRecord.ten_loai;
      }
    }
    const resolvedData = {
      ...data,
      loai_thiet_bi: resolvedLoaiText !== undefined ? resolvedLoaiText : undefined
    };
    return adminRepository.updateEquipment(id, resolvedData);
  }

  async deleteEquipment(id: string) {
    return adminRepository.deleteEquipment(id);
  }

  // --- QUẢN LÝ PHÂN LOẠI THIẾT BỊ ---
  async getEquipmentTypes() {
    return adminRepository.getEquipmentTypes();
  }

  async createEquipmentType(data: { ten_loai: string; nhom_thiet_bi: string }) {
    return adminRepository.createEquipmentType(data);
  }

  async updateEquipmentType(id: number, data: { ten_loai: string; nhom_thiet_bi: string }) {
    return adminRepository.updateEquipmentType(id, data);
  }

  async deleteEquipmentType(id: number) {
    return adminRepository.deleteEquipmentType(id);
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

  async getRevenueStats() {
    return adminRepository.getRevenueStats();
  }

  async getStaffPerformance() {
    return adminRepository.getStaffPerformance();
  }

  async getAvailableStaff(dich_vu_id: string | null, dang_ky_goi_id: string | null, ngay: string, gio_bat_dau: string) {
    return adminRepository.getAvailableStaff(dich_vu_id, dang_ky_goi_id, ngay, gio_bat_dau);
  }
}

export default new AdminService();

