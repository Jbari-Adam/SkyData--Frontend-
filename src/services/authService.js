import { authApi } from "../api/authApi";

export const authService = {
    async handleLogin(credential) {
        try {
            await authApi.getCsrfCookie();

            //send login data to the server
            const response = await authApi.login(credential);

            if (response.data.user) {
                return response.data.user.email;
            }

        } catch (error) {
            throw error;
        }
    },

    async handleRegister(userData) {
        try {
            await authApi.getCsrfCookie();

            //send register data to the server
            const response = await authApi.register(userData)

            if (response.data.user) {
                return response.data.user.email;
            }

        } catch (error) {
            throw error;
        }
    },

    async handleLogout() {
        try {
            await authApi.getCsrfCookie();

            const response = await authApi.logout();

            if (response.status === 200 || response.status === 204) {
                localStorage.clear();
                return true
            }

        } catch (error) {
            throw error;
        }
    },

    async handleVerifyMail(email, code) {
        try {
            await authApi.getCsrfCookie();

            const response = await authApi.verifyMail(email, code);

            if (response.data.user) {
                localStorage.setItem('userName', response.data.user.name);
                return true
            }

        } catch (error) {
            // Log the full error for debugging
            console.error('Verify mail error:', error.response?.data || error.message);
            throw error;
        }
    },

    handleGoogleLogin() {
        // OAuth requires a full page redirect, so we don't use Axios here.
        // We directly navigate the user's browser to the Laravel Google redirect endpoint.
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        window.location.href = `${apiUrl}/api/auth/google/redirect`;
    }
}