import doctorRepository from '../repositories/doctor.repository';

class DoctorService {
  // 1. Lấy danh sách hàng đợi khám bệnh hôm nay của bác sĩ
  async getQueue(userId: string, roleId: number = 4) {
    const queue = await doctorRepository.getDoctorQueue(userId, roleId);
    return queue;
  }

  // 2. Lấy danh sách lịch hẹn của bác sĩ
  async getAppointments(userId: string, roleId: number = 4, startDate?: string, endDate?: string) {
    const appointments = await doctorRepository.getDoctorAppointments(userId, roleId, startDate, endDate);
    return appointments;
  }

  // 3. Tổng hợp hồ sơ y tế toàn diện của bệnh nhân (lịch sử khám + phác đồ + chi tiết buổi trị liệu)
  async getPatientMedicalProfile(patientId: string) {
    // Lấy lịch sử khám lâm sàng
    const medicalRecords = await doctorRepository.getPatientHistory(patientId);

    // Lấy danh sách lịch điều trị
    const rawTreatments = await doctorRepository.getPatientTreatments(patientId);

    // Ghép chi tiết từng buổi trị liệu vào các lịch điều trị tương ứng
    const treatmentPlans: any[] = [];
    for (const treatment of rawTreatments) {
      const sessions = await doctorRepository.getTreatmentSessions(treatment.id);
      treatmentPlans.push({
        ...treatment,
        sessions,
      });
    }

    // Dịch vụ lẻ độc lập (không có phác đồ) — mỗi cuoc_hen tự nó là 1 "phác đồ 1 buổi" hoàn chỉnh,
    // không cần gọi getTreatmentSessions vì dòng trả về đã mang sẵn đủ dữ liệu buổi đó.
    const standaloneVisits = await doctorRepository.getStandaloneServiceVisits(patientId);
    for (const visit of standaloneVisits) {
      treatmentPlans.push({
        id: visit.id,
        loai_dieu_tri: visit.loai_dieu_tri,
        tong_so_buoi: visit.tong_so_buoi,
        so_buoi_da_dung: visit.so_buoi_da_dung,
        trang_thai: visit.trang_thai,
        thoi_gian_tao: visit.thoi_gian_tao,
        ma_lich_dieu_tri: visit.ma_lich_dieu_tri,
        ten_dich_vu: visit.ten_dich_vu,
        ten_goi: visit.ten_goi,
        chan_doan: visit.chan_doan,
        sessions: [{
          id: visit.id,
          so_thu_tu_buoi: visit.so_thu_tu_buoi,
          trang_thai: visit.session_trang_thai,
          thoi_gian_bat_dau: visit.thoi_gian_bat_dau,
          thoi_gian_ket_thuc: visit.thoi_gian_ket_thuc,
          danh_gia_truoc_buoi: visit.danh_gia_truoc_buoi,
          danh_gia_sau_buoi: visit.danh_gia_sau_buoi,
          danh_gia_hieu_qua: visit.danh_gia_hieu_qua,
          canh_bao_dac_biet: visit.canh_bao_dac_biet,
          ten_ky_thuat_vien: visit.ten_ky_thuat_vien,
          anh_ky_thuat_vien: visit.anh_ky_thuat_vien,
        }],
      });
    }

    // Gói/dịch vụ gần nhất lên đầu — frontend mặc định chọn phần tử đầu tiên trong dải chip.
    treatmentPlans.sort((a, b) => {
      const timeA = a.thoi_gian_tao ? new Date(a.thoi_gian_tao).getTime() : 0;
      const timeB = b.thoi_gian_tao ? new Date(b.thoi_gian_tao).getTime() : 0;
      return timeB - timeA;
    });

    return {
      medicalRecords,
      treatmentPlans,
    };
  }

  // 4. Lấy thông tin chi tiết một ca khám cụ thể
  async getAppointmentDetail(appointmentId: string, userId?: string) {
    const detail = await doctorRepository.getAppointmentDetail(appointmentId);
    if (!detail) {
      throw new Error('Không tìm thấy chi tiết ca khám.');
    }
    
    // Tự động chuyển trạng thái sang 'dang_kham' nếu lịch đang ở 'da_checkin' hoặc 'cho_kham'
    if (['da_checkin', 'cho_kham'].includes(detail.trang_thai) && userId) {
      const staffId = parseInt(userId, 10);
      // 1 bác sĩ chỉ được mở 1 "bàn khám" tại 1 thời điểm — chặn nếu còn ca khác đang dang_kham
      // (vd quên bấm hoàn thành ca trước).
      const otherOpenSession = await doctorRepository.getActiveSessionForStaff(staffId, appointmentId);
      if (otherOpenSession) {
        throw new Error(`Bạn đang có ca khám ${otherOpenSession.ma_lich_dat} (${otherOpenSession.ten_khach_hang}) chưa hoàn thành. Vui lòng hoàn thành ca đó trước khi mở ca khám mới.`);
      }
      await doctorRepository.startSession(appointmentId, staffId);
      return await doctorRepository.getAppointmentDetail(appointmentId);
    }

    return detail;
  }

  // 5. Lưu chẩn đoán lâm sàng và hoàn thành ca khám
  async saveAssessment(
    userId: string,
    data: {
      lich_dat_id: string;
      chan_doan: string;
      chong_chi_dinh: string;
      goi_dich_vu_id?: string | null;
      ghi_chu?: string | null;
    }
  ) {
    // Chỉ còn 1 loại chỉ định duy nhất: gói liệu trình — chặn cứng ở server (không chỉ ẩn UI)
    // trường hợp lọt lên 1 gói lẻ, và 1 khách tối đa 1 liệu trình tại 1 thời điểm nên phải kiểm
    // tra trước khi cho chỉ định thêm (xem getBlockingLieuTrinh).
    if (data.goi_dich_vu_id) {
      const isLieuTrinh = await doctorRepository.isPackageLieuTrinh(data.goi_dich_vu_id);
      if (!isLieuTrinh) {
        throw new Error('Bác sĩ chỉ được chỉ định gói liệu trình, không được chỉ định dịch vụ lẻ.');
      }
      const blockCheck = await doctorRepository.getBlockingLieuTrinh(data.lich_dat_id);
      if (blockCheck.blocked) {
        throw new Error(blockCheck.reason);
      }
    }

    // Gọi repository để thực hiện transaction lưu bệnh án và đóng lịch hẹn
    const result = await doctorRepository.saveClinicalAssessment({
      lich_dat_id: data.lich_dat_id,
      bac_si_id: userId,
      chan_doan: data.chan_doan,
      chong_chi_dinh: data.chong_chi_dinh,
      goi_dich_vu_id: data.goi_dich_vu_id,
      ghi_chu: data.ghi_chu,
    });

    return result;
  }

  // 6. Lấy danh sách lịch trực của bác sĩ
  async getSchedules(userId: string) {
    const schedules = await doctorRepository.getDoctorSchedules(userId);
    return schedules;
  }

  // 7. Lấy danh sách bệnh nhân cho bác sĩ (kèm has_chong_chi_dinh và filter theo bác sĩ)
  async getPatients(userId: string) {
    const patients = await doctorRepository.getPatients(userId);
    return patients;
  }
}

export default new DoctorService();
