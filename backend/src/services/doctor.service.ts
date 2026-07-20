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

  // 3. Tổng hợp hồ sơ y tế toàn diện của bệnh nhân: 2 danh sách TÁCH BIỆT — visits (khám lâm sàng +
  // dịch vụ lẻ độc lập, gộp chung 1 dòng thời gian) và treatmentPlans (chỉ phác đồ/liệu trình thật,
  // mỗi phác đồ kèm sessions + liên kết ngược về đúng ca khám đã chỉ định ra nó). Trộn lẫn dịch vụ lẻ
  // vào treatmentPlans như bản cũ gây rối mắt cho Bác sĩ/KTV khi xem — đã tách theo góp ý người dùng.
  async getPatientMedicalProfile(patientId: string) {
    const [medicalRecords, rawTreatments, standaloneVisits] = await Promise.all([
      doctorRepository.getPatientHistory(patientId),
      doctorRepository.getPatientTreatments(patientId),
      doctorRepository.getStandaloneServiceVisits(patientId),
    ]);

    const treatmentPlans = await Promise.all(
      rawTreatments.map(async (treatment: any) => ({
        ...treatment,
        sessions: await doctorRepository.getTreatmentSessions(treatment.id),
      }))
    );

    // Map ca khám -> phác đồ mà nó đã chỉ định ra (nếu có và đã được kích hoạt), để visits phía dưới
    // gắn được prescribed_plan_id cho đúng banner liên kết "Ca khám này đã chỉ định phác đồ...".
    const planByOriginExamId = new Map<string, any>();
    for (const plan of treatmentPlans) {
      if (plan.goc_kham_id) planByOriginExamId.set(plan.goc_kham_id, plan);
    }

    const examVisits = medicalRecords.map((r: any) => ({
      id: r.lich_dat_id,
      loai: 'KHAM' as const,
      thoi_gian: r.thoi_gian_tao,
      ma_lich_dat: r.ma_lich_dat,
      trang_thai: 'hoan_thanh',
      chan_doan: r.chan_doan,
      chong_chi_dinh: r.chong_chi_dinh,
      ly_do_kham: r.ly_do_kham,
      anh_dinh_kem_url: r.anh_dinh_kem_url,
      ghi_chu: r.ghi_chu,
      khuyen_nghi_goi: r.khuyen_nghi_goi,
      ten_nhan_su: r.ten_bac_si,
      anh_nhan_su: r.anh_bac_si,
      prescribed_plan_id: planByOriginExamId.get(r.lich_dat_id)?.id || null,
    }));

    const serviceVisits = standaloneVisits.map((v: any) => ({
      id: v.id,
      loai: 'DICH_VU_LE' as const,
      thoi_gian: v.thoi_gian_tao,
      ma_lich_dat: v.ma_lich_dat,
      trang_thai: v.trang_thai,
      ten_dich_vu: v.ten_dich_vu,
      ghi_chu: v.ghi_chu,
      ten_nhan_su: v.ten_nhan_su,
      anh_nhan_su: v.anh_nhan_su,
      prescribed_plan_id: null,
    }));

    const visits = [...examVisits, ...serviceVisits].sort((a, b) => {
      const timeA = a.thoi_gian ? new Date(a.thoi_gian).getTime() : 0;
      const timeB = b.thoi_gian ? new Date(b.thoi_gian).getTime() : 0;
      return timeB - timeA;
    });

    // Gói/dịch vụ gần nhất lên đầu — frontend mặc định chọn phần tử đầu tiên trong dải chip.
    treatmentPlans.sort((a: any, b: any) => {
      const timeA = a.thoi_gian_tao ? new Date(a.thoi_gian_tao).getTime() : 0;
      const timeB = b.thoi_gian_tao ? new Date(b.thoi_gian_tao).getTime() : 0;
      return timeB - timeA;
    });

    return {
      visits,
      treatmentPlans,
    };
  }

  // 4. Lấy thông tin chi tiết một ca khám cụ thể
  async getAppointmentDetail(appointmentId: string, userId?: string) {
    let detail = await doctorRepository.getAppointmentDetail(appointmentId);
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
      detail = await doctorRepository.getAppointmentDetail(appointmentId);
    }

    // Cho Bác sĩ biết NGAY lúc mở ca khám (không đợi tới lúc lưu mới báo) nếu khách đang có chỉ
    // định/phác đồ liệu trình khác đang chặn — dùng lại đúng check ở saveAssessment, để trang bàn
    // khám hiện banner cảnh báo sớm giống cách Admin đang thấy ở PatientEmrDetail.
    const packageConflict = await doctorRepository.getBlockingLieuTrinh(appointmentId);

    return { ...detail, package_conflict: packageConflict };
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
      resolvePendingConflict?: boolean;
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
        // Phác đồ đang điều trị thật (đã thu tiền) — chặn cứng tuyệt đối, không có lối thoát qua
        // màn hình khám; muốn hủy phải đi đúng luồng hủy gói/hoàn tiền hiện có.
        if (blockCheck.type === 'active_plan') {
          const err: any = new Error(blockCheck.reason);
          err.errorCode = 'ACTIVE_LIEU_TRINH_CONFLICT';
          throw err;
        }
        // Chỉ định cũ CHƯA kích hoạt — cho Bác sĩ chọn xóa hẳn rồi dùng gói mới, nếu chưa xác nhận
        // thì báo lỗi kèm errorCode để frontend hiện modal 3 lựa chọn thay vì chặn cứng luôn.
        if (data.resolvePendingConflict && blockCheck.chi_dinh_buoi_id) {
          await doctorRepository.deletePendingChiDinh(blockCheck.chi_dinh_buoi_id);
        } else {
          const err: any = new Error(blockCheck.reason);
          err.errorCode = 'PENDING_LIEU_TRINH_CONFLICT';
          throw err;
        }
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
