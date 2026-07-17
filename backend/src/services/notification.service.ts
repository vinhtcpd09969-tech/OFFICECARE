import prisma from '../config/prisma';

class NotificationService {
  /**
   * Tạo thông báo mới cho người dùng hoặc khách hàng
   */
  async createNotification(
    id: string, 
    tieu_de: string, 
    noi_dung: string, 
    loai: string = 'he_thong', 
    isCustomer: boolean = false,
    lien_ket?: string,
    tham_chieu_id?: string,
    tham_chieu_loai?: string
  ) {
    try {
      return await prisma.thong_bao.create({
        data: {
          nguoi_dung_id: isCustomer ? null : parseInt(id, 10),
          khach_hang_id: isCustomer ? id : null,
          tieu_de,
          noi_dung,
          loai,
          da_doc: false,
          lien_ket: lien_ket || null,
          tham_chieu_id: tham_chieu_id || null,
          tham_chieu_loai: tham_chieu_loai || null
        }
      });
    } catch (error) {
      console.error('Lỗi khi tạo thông báo:', error);
      // Fail silently to prevent interrupting main clinical flows
      return null;
    }
  }

  /**
   * Lấy danh sách 50 thông báo gần nhất của người dùng hoặc khách hàng
   */
  async getNotifications(id: string, isCustomer: boolean = false) {
    return prisma.thong_bao.findMany({
      where: isCustomer ? { khach_hang_id: id } : { nguoi_dung_id: parseInt(id, 10) },
      orderBy: { thoi_gian_tao: 'desc' },
      take: 50
    });
  }

  /**
   * Đánh dấu 1 thông báo cụ thể là đã đọc
   */
  async markAsRead(id: string, userId: string, isCustomer: boolean = false) {
    const notification = await prisma.thong_bao.findFirst({
      where: isCustomer ? { id, khach_hang_id: userId } : { id, nguoi_dung_id: parseInt(userId, 10) }
    });

    if (!notification) {
      throw new Error('Thông báo không tồn tại hoặc không thuộc quyền sở hữu của bạn.');
    }

    return prisma.thong_bao.update({
      where: { id },
      data: { da_doc: true }
    });
  }

  /**
   * Đánh dấu toàn bộ thông báo của người dùng là đã đọc
   */
  async markAllAsRead(userId: string, isCustomer: boolean = false) {
    return prisma.thong_bao.updateMany({
      where: isCustomer ? { khach_hang_id: userId, da_doc: false } : { nguoi_dung_id: parseInt(userId, 10), da_doc: false },
      data: { da_doc: true }
    });
  }

  /**
   * Trigger thông báo tự động từ lịch hẹn sang người dùng (khách hàng)
   */
  async triggerAppointmentNotification(lich_dat_id: string, trang_thai: string, raw_appointment?: any) {
    try {
      let appointment = raw_appointment;
      
      // Nếu không truyền dữ liệu lịch hẹn, tiến hành fetch từ DB
      if (!appointment) {
        appointment = await prisma.cuoc_hen.findUnique({
          where: { id: lich_dat_id },
          include: {
            khach_hang: true,
            dich_vu: true,
            nguoi_dung: true
          }
        });
      }

      if (!appointment || !appointment.khach_hang) return;

      const customerId = appointment.khach_hang.id;
      const ma_lich_dat = 'LH-' + appointment.id.substring(0, 6).toUpperCase();
      const ten_dich_vu = appointment.dich_vu?.ten_dich_vu || 'Khám Lâm sàng & Lượng giá';

      let tieu_de = 'Cập nhật trạng thái lịch khám';
      let noi_dung = '';

      switch (trang_thai) {
        case 'da_xac_nhan':
          const doctorName = appointment.nguoi_dung?.ho_ten || 'Đang chờ phân công';
          noi_dung = `Lịch khám "${ten_dich_vu}" (Mã: ${ma_lich_dat}) của bạn đã được Lễ tân duyệt thành công. Bác sĩ/KTV phụ trách: ${doctorName}.`;
          break;
        case 'da_checkin':
        case 'check_in':
        case 'cho_kham':
          noi_dung = `Bạn đã hoàn tất thủ tục check-in cho lịch khám ${ma_lich_dat}. Vui lòng chuẩn bị để vào trị liệu.`;
          break;
        case 'hoan_thanh':
          noi_dung = `Buổi khám lượng giá ${ma_lich_dat} của bạn đã hoàn thành. Chúc bạn một ngày tốt lành và nhiều sức khỏe!`;
          break;
        case 'da_huy':
        case 'huy':
          noi_dung = `Lịch hẹn khám ${ma_lich_dat} của bạn đã bị hủy bỏ.`;
          break;
        default:
          return;
      }

      await this.createNotification(customerId, tieu_de, noi_dung, 'lich_hen', true, '/appointments', appointment.id, 'cuoc_hen');
    } catch (error) {
      console.error('Lỗi khi trigger thông báo lịch hẹn:', error);
    }
  }

  /**
   * Gửi thông báo cho toàn bộ người dùng theo vai trò
   */
  async notifyRole(
    vai_tro_id: number, 
    tieu_de: string, 
    noi_dung: string, 
    loai: string = 'he_thong',
    lien_ket?: string,
    tham_chieu_id?: string,
    tham_chieu_loai?: string
  ) {
    try {
      const users = await prisma.nguoi_dung.findMany({
        where: { vai_tro_id }
      });
      const promises = users.map(user => 
        this.createNotification(String(user.id), tieu_de, noi_dung, loai, false, lien_ket, tham_chieu_id, tham_chieu_loai)
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Lỗi khi gửi thông báo theo vai trò:', error);
    }
  }

  /**
   * Helper to get customer name from appointment ID
   */
  private async getCustomerNameByAppt(appointmentId: string): Promise<string> {
    const appt = await prisma.cuoc_hen.findUnique({
      where: { id: appointmentId },
      include: { khach_hang: true }
    });
    return appt?.khach_hang?.ho_ten || 'Khách hàng';
  }

  /**
   * Trigger gửi thông báo cho nhóm Lễ tân (role = 2) khi bệnh nhân đặt lịch mới từ web
   */
  async triggerNewBookingToReceptionists(appointmentId: string) {
    try {
      const customerName = await this.getCustomerNameByAppt(appointmentId);
      const tieu_de = '🔔 Có ca đặt lịch mới';
      const noi_dung = `Bệnh nhân ${customerName} vừa đặt một lịch hẹn mới. Vui lòng liên hệ xác nhận.`;
      const lien_ket = `/receptionist/appointments?highlight=${appointmentId}`;
      await this.notifyRole(2, tieu_de, noi_dung, 'lich_hen', lien_ket, appointmentId, 'cuoc_hen');
    } catch (err) {
      console.error('Lỗi khi trigger thông báo đặt lịch mới:', err);
    }
  }

  /**
   * Trigger gửi thông báo cho nhóm Lễ tân (role = 2) khi bệnh nhân hủy lịch
   */
  async triggerCancellationToReceptionists(appointmentId: string) {
    try {
      const customerName = await this.getCustomerNameByAppt(appointmentId);
      const tieu_de = '❌ Ca hẹn bị hủy';
      const noi_dung = `Bệnh nhân ${customerName} đã hủy lịch hẹn của họ.`;
      const lien_ket = `/receptionist/appointments?highlight=${appointmentId}`;
      await this.notifyRole(2, tieu_de, noi_dung, 'lich_hen', lien_ket, appointmentId, 'cuoc_hen');
    } catch (err) {
      console.error('Lỗi khi trigger thông báo hủy lịch:', err);
    }
  }

  /**
   * Trigger gửi thông báo cho nhóm Lễ tân (role = 2) khi ca điều trị hoàn thành cần checkout thanh toán
   */
  async triggerCheckoutRequiredToReceptionists(appointmentId: string) {
    try {
      const customerName = await this.getCustomerNameByAppt(appointmentId);
      const tieu_de = '💰 Ca hẹn hoàn thành cần thanh toán';
      const noi_dung = `Bệnh nhân ${customerName} đã hoàn thành ca trị liệu. Vui lòng thanh toán hóa đơn.`;
      const lien_ket = `/receptionist/billing`;
      await this.notifyRole(2, tieu_de, noi_dung, 'tai_chinh', lien_ket, appointmentId, 'cuoc_hen');
    } catch (err) {
      console.error('Lỗi khi trigger thông báo thanh toán:', err);
    }
  }

  /**
   * Trigger gửi thông báo cho Bác sĩ/KTV khi được phân công ca mới
   */
  async triggerAssignmentToDoctor(appointmentId: string, doctorId: string) {
    try {
      const customerName = await this.getCustomerNameByAppt(appointmentId);
      const tieu_de = '📋 Phân công ca khám mới';
      const noi_dung = `Bạn được phân công phụ trách ca khám cho bệnh nhân ${customerName}.`;
      const lien_ket = `/doctor/appointments?highlight=${appointmentId}`;
      await this.createNotification(doctorId, tieu_de, noi_dung, 'lich_hen', false, lien_ket, appointmentId, 'cuoc_hen');
    } catch (err) {
      console.error('Lỗi khi trigger thông báo phân công:', err);
    }
  }

  /**
   * Trigger gửi thông báo cho Bác sĩ/KTV khi bệnh nhân check-in phòng chờ
   */
  async triggerCheckinToDoctor(appointmentId: string, doctorId: string) {
    try {
      const customerName = await this.getCustomerNameByAppt(appointmentId);
      const tieu_de = '🏃 Bệnh nhân đã check-in';
      const noi_dung = `Bệnh nhân ${customerName} của bạn đã check-in và sẵn sàng trị liệu.`;
      const lien_ket = `/doctor/appointments?highlight=${appointmentId}`;
      await this.createNotification(doctorId, tieu_de, noi_dung, 'lich_hen', false, lien_ket, appointmentId, 'cuoc_hen');
    } catch (err) {
      console.error('Lỗi khi trigger thông báo check-in:', err);
    }
  }

  /**
   * Trigger gửi thông báo cho Admin & Manager (role = 5 và 6) khi bệnh nhân có điểm uy tín < 50
   */
  async triggerLowReputationToAdmins(customerId: string, score: number) {
    try {
      const clientObj = await prisma.khach_hang.findUnique({ where: { id: customerId } });
      const customerName = clientObj?.ho_ten || 'Khách hàng';
      const tieu_de = '⚠️ Điểm uy tín bệnh nhân thấp';
      const noi_dung = `Bệnh nhân ${customerName} có điểm uy tín giảm còn ${score}/100. Nguy cơ khóa tài khoản.`;
      const lien_ket = `/admin/customers`;
      
      // Gửi cho Admin (role 5) và Manager (role 6)
      await this.notifyRole(5, tieu_de, noi_dung, 'he_thong', lien_ket, customerId, 'khach_hang');
      await this.notifyRole(6, tieu_de, noi_dung, 'he_thong', lien_ket, customerId, 'khach_hang');
    } catch (err) {
      console.error('Lỗi khi trigger thông báo điểm uy tín thấp:', err);
    }
  }

  /**
   * Trigger gửi thông báo cho Admin & Manager (role = 5 và 6) khi có yêu cầu duyệt hoàn tiền
   */
  async triggerRefundRequestToAdmins(phacDoId: string, amount: number, createdBy: string) {
    try {
      const pd = await prisma.phac_do_dieu_tri.findUnique({
        where: { id: phacDoId },
        include: { khach_hang: true }
      });
      const customerName = pd?.khach_hang?.ho_ten || 'Khách hàng';
      const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
      const tieu_de = '💸 Yêu cầu hoàn tiền cần duyệt';
      const noi_dung = `Bệnh nhân ${customerName} yêu cầu hoàn trả số tiền ${formattedAmount} cho gói phác đồ. Tạo bởi: ${createdBy}.`;
      const lien_ket = `/admin/finance`;
      
      await this.notifyRole(5, tieu_de, noi_dung, 'tai_chinh', lien_ket, phacDoId, 'phac_do');
      await this.notifyRole(6, tieu_de, noi_dung, 'tai_chinh', lien_ket, phacDoId, 'phac_do');
    } catch (err) {
      console.error('Lỗi khi trigger thông báo hoàn tiền:', err);
    }
  }

  /**
   * Trigger gửi thông báo cho Admin & Manager (role = 5 và 6) khi nhận đánh giá tệ (1-2 sao)
   */
  async triggerLowRatingToAdmins(appointmentId: string, stars: number, comment: string) {
    try {
      const appt = await prisma.cuoc_hen.findUnique({
        where: { id: appointmentId },
        include: { nguoi_dung: true }
      });
      const doctorName = appt?.nguoi_dung?.ho_ten || 'Bác sĩ/KTV';
      const tieu_de = '🚨 Nhận đánh giá chất lượng kém';
      const noi_dung = `Bệnh nhân chấm ${stars} sao cho Bác sĩ/KTV ${doctorName}. Nhận xét: "${comment || 'Không có bình luận'}".`;
      const lien_ket = `/admin/feedback`;
      
      await this.notifyRole(5, tieu_de, noi_dung, 'chat_luong', lien_ket, appointmentId, 'cuoc_hen');
      await this.notifyRole(6, tieu_de, noi_dung, 'chat_luong', lien_ket, appointmentId, 'cuoc_hen');
    } catch (err) {
      console.error('Lỗi khi trigger thông báo đánh giá thấp:', err);
    }
  }

  /**
   * Trigger gửi thông báo cho Lễ tân khi bệnh nhân đã xác thực OTP thành công (tránh hiện tượng thông báo sớm khi chưa xác thực)
   */
  async triggerConfirmedBookingToReceptionists(appointmentId: string) {
    try {
      const customerName = await this.getCustomerNameByAppt(appointmentId);
      const tieu_de = '✅ Ca đặt lịch mới đã xác thực';
      const noi_dung = `Bệnh nhân ${customerName} đã xác thực OTP thành công. Lịch hẹn đang chờ bạn xác nhận.`;
      const lien_ket = `/receptionist/appointments?highlight=${appointmentId}`;
      await this.notifyRole(2, tieu_de, noi_dung, 'lich_hen', lien_ket, appointmentId, 'cuoc_hen');
    } catch (err) {
      console.error('Lỗi khi trigger thông báo xác thực lịch hẹn:', err);
    }
  }
}

export default new NotificationService();
