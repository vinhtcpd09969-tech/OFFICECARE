// Nguồn sự thật duy nhất cho việc gộp trạng thái lịch hẹn (cuoc_hen.trang_thai) — dùng chung
// giữa Admin, Lễ tân, Bác sĩ, KTV để 4 actor nhìn cùng 1 con số cho cùng 1 khái niệm.
export const UNCONFIRMED_STATUSES = ['chua_xac_nhan', 'cho_xac_nhan'];
export const CHECKED_IN_STATUSES = ['da_checkin', 'check_in'];
export const CANCELLED_STATUSES = ['da_huy'];
export const NO_SHOW_STATUSES = ['khong_den'];

export interface AppointmentKpiBuckets {
  total: number;
  choXacNhan: number;
  daXacNhan: number;
  daCheckin: number;
  dangKham: number;
  hoanThanh: number;
  daHuy: number;
  khongDen: number;
}

/** Map từ tên bucket KPI sang danh sách trang_thai thật — dùng để lọc danh sách lịch hẹn khi
 * bấm 1 thẻ KPI (AppointmentKpiCards.tsx) thay vì chỉ hiển thị số. Không có "total" vì thẻ Tổng
 * ca không dùng để lọc. */
export const KPI_BUCKET_STATUSES: Record<Exclude<keyof AppointmentKpiBuckets, 'total'>, string[]> = {
  choXacNhan: UNCONFIRMED_STATUSES,
  daXacNhan: ['da_xac_nhan'],
  daCheckin: CHECKED_IN_STATUSES,
  dangKham: ['dang_kham'],
  hoanThanh: ['hoan_thanh'],
  daHuy: CANCELLED_STATUSES,
  khongDen: NO_SHOW_STATUSES,
};

/** Nhãn hiển thị cho chip "Đang lọc: ..." — dùng chung cho cả 4 trang Lịch hẹn thay vì mỗi trang
 * tự viết lại. */
export const KPI_BUCKET_LABELS: Record<Exclude<keyof AppointmentKpiBuckets, 'total'>, string> = {
  choXacNhan: 'Chờ xác nhận',
  daXacNhan: 'Đã xác nhận',
  daCheckin: 'Đã check-in',
  dangKham: 'Đang khám/điều trị',
  hoanThanh: 'Hoàn thành',
  daHuy: 'Đã hủy',
  khongDen: 'Không đến',
};

/** Tính đủ 8 nhóm từ 1 danh sách lịch hẹn đã lọc sẵn theo khoảng ngày/loại đang xem — mỗi actor
 * (AppointmentKpiCards.tsx) tự chọn hiển thị bao nhiêu trong số 8 field này. */
export function computeAppointmentKpiBuckets(appointments: Array<{ trang_thai?: string | null }>): AppointmentKpiBuckets {
  const list = appointments.filter((a) => a.trang_thai !== 'giu_cho');
  const count = (statuses: string[]) => list.filter((a) => statuses.includes(a.trang_thai || '')).length;

  return {
    total: list.length,
    choXacNhan: count(UNCONFIRMED_STATUSES),
    daXacNhan: count(['da_xac_nhan']),
    daCheckin: count(CHECKED_IN_STATUSES),
    dangKham: count(['dang_kham']),
    hoanThanh: count(['hoan_thanh']),
    daHuy: count(CANCELLED_STATUSES),
    khongDen: count(NO_SHOW_STATUSES),
  };
}
