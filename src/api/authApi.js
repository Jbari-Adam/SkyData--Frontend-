import apiClient from './apiClient'

export const authApi = {
    getCsrfCookie: () => apiClient.get('/sanctum/csrf-cookie'),
    register: (userData) => apiClient.post('/api/register', userData),
    login: (credential) => apiClient.post('/api/login', credential),
    logout: () => apiClient.post('/api/logout'),
    verifyMail: (email, code) => apiClient.post('/api/verifyMail', { email, code }),
    resendVerification: (email) => apiClient.post('/api/resendVerification', { email }),
    user: () => apiClient.get('/api/user'),
    profile: () => apiClient.get('/api/profile'),
    updateProfile: (profile) => apiClient.patch('/api/profile', profile),
    forgotPassword: (email) => apiClient.post('/api/forgot-password', { email }),
    resetPassword: (data) => apiClient.post('/api/reset-password', data),
}
