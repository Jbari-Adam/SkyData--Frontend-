import apiClient from "./apiClient";

export const authApi = {
    getCsrfCookie: () => apiClient.get('/sanctum/csrf-cookie'),
    register: (userData) => apiClient.post('/api/register', userData),
    login: (credential) => apiClient.post('/api/login', credential),
    logout: () => apiClient.post('/api/logout'),
    verifyMail: (email, code) => apiClient.post('/api/verifyMail', { email, code }),
};