import api from './axios';

// Public endpoints to fetch services, packages, and categories
export const getPublicServices = () => api.get('/client/services');
export const getPublicPackages = () => api.get('/client/packages');
export const getPublicCategories = () => api.get('/client/categories');
export const getPublicSpecialists = () => api.get('/client/specialists');
export const getPublicSpecialistById = (id: string | number) => api.get(`/client/specialists/${id}`);
export const getPublicTestimonials = () => api.get('/client/testimonials');
export const getPublicTopServices = () => api.get('/client/top-services');

// Authenticated rating endpoints
export const getPendingRatingAppointments = () => api.get('/client/appointments/pending-rating');
export const rateAppointment = (id: string, data: { so_sao: number; nhan_xet: string }) => api.post(`/client/appointments/${id}/rate`, data);
