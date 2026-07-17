import api from '../../../api/axios';

export interface RatePayload {
  cuoc_hen_id: string;
  diem_so: number;
  nhan_xet?: string;
}

// Logged-in Customer APIs
export const getPendingRatingAppointments = () => 
  api.get('/client/appointments/pending-rating');

export const rateAppointment = (id: string, data: { 
  so_sao?: number; 
  nhan_xet?: string;
  rating_dich_vu?: number; 
  comment_dich_vu?: string; 
  rating_ktv?: number; 
  comment_ktv?: string; 
}) => 
  api.post(`/client/appointments/${id}/rate`, data);

export const getMyReviews = () => api.get('/client/reviews/my-reviews');

export const updateServiceReview = (id: string, data: { rating: number; comment?: string }) => 
  api.put(`/client/reviews/service/${id}`, data);

export const updateStaffReview = (id: string, data: { rating: number; comment?: string }) => 
  api.put(`/client/reviews/staff/${id}`, data);

export const deleteServiceReview = (id: string) => 
  api.delete(`/client/reviews/service/${id}`);

export const deleteStaffReview = (id: string) => 
  api.delete(`/client/reviews/staff/${id}`);

export const updateProfile = (data: {
  ho_ten: string;
  so_dien_thoai: string;
  anh_dai_dien?: string;
  so_nam_kinh_nghiem?: number;
  bang_cap_chung_chi?: string;
  mo_ta?: string;
  the_manh?: string[];
  gioi_tinh?: string;
  dia_chi?: string;
}) => api.put('/auth/profile', data);

export const changePassword = (data: { oldPassword: string; newPassword: string }) =>
  api.put('/auth/change-password', data);

export const getMe = () => api.get('/auth/me');

export const getCustomerMedicalRecord = () => 
  api.get('/client/medical-record');

export const agreeTerms = () => api.post('/client/agree-terms');
