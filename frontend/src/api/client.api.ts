import api from './axios';

// Public endpoints to fetch services, packages, and categories
export const getPublicServices = () => api.get('/client/services');
export const getPublicPackages = () => api.get('/client/packages');
export const getPublicCategories = () => api.get('/client/categories');
