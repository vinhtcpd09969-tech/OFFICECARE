import doctorRepository from '../repositories/doctor.repository';
import { pool } from '../config/db';

class DoctorService {
  // Lấy doctorId (chuyen_gia_y_te.id) từ userId (nguoi_dung.id)
  async getDoctorIdByUserId(userId: string): Promise<string> {
    const queryStr = 'SELECT id FROM chuyen_gia_y_te WHERE nguoi_dung_id = $1 LIMIT 1;';
    const { rows } = await pool.query(queryStr, [userId]);
    if (rows.length === 0) {
      throw new Error('Tài khoản này không liên kết với thông tin chuyên gia y tế (Bác sĩ).');
    }
    return rows[0].id;
  }

  // 1. Lấy danh sách hàng đợi khám bệnh hôm nay của bác sĩ
  async getQueue(userId: string) {
    const doctorId = await this.getDoctorIdByUserId(userId);
    const queue = await doctorRepository.getDoctorQueue(doctorId);
    return queue;
  }

  // 2. Lấy danh sách lịch hẹn của bác sĩ
  async getAppointments(userId: string, startDate?: string, endDate?: string) {
    const doctorId = await this.getDoctorIdByUserId(userId);
    const appointments = await doctorRepository.getDoctorAppointments(doctorId, startDate, endDate);
    return appointments;
  }

  // 3. Tổng hợp hồ sơ y tế toàn diện của bệnh nhân (lịch sử khám + phác đồ + chi tiết buổi trị liệu)
  async getPatientMedicalProfile(patientId: string) {
    // Lấy lịch sử khám lâm sàng
    const medicalRecords = await doctorRepository.getPatientHistory(patientId);

    // Lấy danh sách lịch điều trị
    const rawTreatments = await doctorRepository.getPatientTreatments(patientId);

    // Ghép chi tiết từng buổi trị liệu vào các lịch điều trị tương ứng
    const treatmentPlans = [];
    for (const treatment of rawTreatments) {
      const sessions = await doctorRepository.getTreatmentSessions(treatment.id);
      treatmentPlans.push({
        ...treatment,
        sessions,
      });
    }

    return {
      medicalRecords,
      treatmentPlans,
    };
  }

  // 4. Lấy thông tin chi tiết một ca khám cụ thể
  async getAppointmentDetail(appointmentId: string) {
    const detail = await doctorRepository.getAppointmentDetail(appointmentId);
    if (!detail) {
      throw new Error('Không tìm thấy chi tiết ca khám.');
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
      dich_vu_id?: string | null;
      ghi_chu?: string | null;
    }
  ) {
    const doctorId = await this.getDoctorIdByUserId(userId);
    
    // Gọi repository để thực hiện transaction lưu bệnh án và đóng lịch hẹn
    const result = await doctorRepository.saveClinicalAssessment({
      lich_dat_id: data.lich_dat_id,
      bac_si_id: doctorId,
      chan_doan: data.chan_doan,
      chong_chi_dinh: data.chong_chi_dinh,
      goi_dich_vu_id: data.goi_dich_vu_id,
      dich_vu_id: data.dich_vu_id,
      ghi_chu: data.ghi_chu,
    });

    return result;
  }

  // 6. Lấy danh sách lịch trực của bác sĩ
  async getSchedules(userId: string) {
    const schedules = await doctorRepository.getDoctorSchedules(userId);
    return schedules;
  }
}

export default new DoctorService();
