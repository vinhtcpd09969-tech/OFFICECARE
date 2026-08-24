import api from '../../../api/axios';

export const resendEmail = (id: string) => api.post(`/receptionist/appointments/${id}/resend-email`);

// Appointments
export const getAppointments = () => api.get('/admin/appointments');
export const createAppointment = (data: any) => api.post('/admin/appointments', data);
export const updateAppointmentStatus = (id: string, data: any) => 
  api.patch(`/receptionist/appointments/${id}/status`, data);
export const keepAliveAppointment = (id: string) => 
  api.post(`/receptionist/appointments/${id}/keep-alive`);

// Available staff & resources
export const getStaff = () => api.get('/admin/staff');
export const getPackages = () => api.get('/admin/packages');
export const getRooms = () => api.get('/admin/rooms');
export const getSchedules = () => api.get('/admin/schedules');
export const getCustomers = () => api.get('/admin/customers');

// Customer directory (rút gọn cho Lễ tân — xem lịch sử, không xem lâm sàng, không sửa/khóa)
export const getCustomerRoster = (params: {
  page: number;
  pageSize: number;
  search?: string;
  canLienHe?: boolean;
  staleDays?: number;
}) => api.get('/receptionist/customers/roster', { params });

export const getCustomerHistory = (id: string, staleDays?: number) =>
  api.get(`/receptionist/customers/${id}/history`, { params: { staleDays } });

export interface StaffWorkloadItem {
  nhan_su_id: number;
  ho_ten: string;
  vai_tro_id: number;
  ten_vai_tro: string;
  so_khach_song_song: number;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  ten_phong: string | null;
  so_ca_dang_lam: number;
  so_ca_cho?: number;
  so_ca_cho_tai_luong_gia?: number;
  thoi_gian_xong_du_kien_muon_nhat: string | null;
}

export const getStaffWorkload = (date?: string) => api.get<StaffWorkloadItem[]>('/receptionist/staff-workload', { params: { date } });
export const unassignAppointmentStaff = (id: string) => api.post(`/receptionist/appointments/${id}/unassign`, {});
