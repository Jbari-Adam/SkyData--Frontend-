import { authApi } from '../api/authApi'

export const authService = {
    async handleLogin(credential) {
        await authApi.getCsrfCookie()
        const response = await authApi.login(credential)
        return response.data.user ?? null
    },

    async handleRegister(userData) {
        await authApi.getCsrfCookie()
        const response = await authApi.register(userData)
        return response.data.user ?? null
    },

    async handleLogout() {
        await authApi.getCsrfCookie()
        const response = await authApi.logout()
        localStorage.removeItem('userName')
        return response.status === 200 || response.status === 204
    },

    async handleVerifyMail(email, code) {
        await authApi.getCsrfCookie()
        const response = await authApi.verifyMail(email, code)
        return response.data.user ?? null
    },

    async handleResendVerification(email) {
        await authApi.getCsrfCookie()
        const response = await authApi.resendVerification(email)
        return response.data
    },

    async handleUpdateProfile(profile) {
        await authApi.getCsrfCookie()
        const response = await authApi.updateProfile(profile)
        return response.data
    },

    async handleForgotPassword(email) {
        await authApi.getCsrfCookie()
        const response = await authApi.forgotPassword(email)
        return response.data
    },

    async handleResetPassword(data) {
        await authApi.getCsrfCookie()
        const response = await authApi.resetPassword(data)
        return response.data
    },

    handleGoogleLogin() {
        // OAuth requires a full page redirect, so we don't use Axios here.
        // We directly navigate the user's browser to the Laravel Google redirect endpoint.
        const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
        window.location.href = `${apiUrl}/api/auth/google/redirect`
    }
}
