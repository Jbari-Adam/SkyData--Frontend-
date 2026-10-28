import axios from 'axios'

const url = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

const apiClient = axios.create({
    baseURL: url,
    withCredentials: true,
    withXSRFToken: true,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
})

const authEndpoints = [
    '/sanctum/csrf-cookie',
    '/api/login',
    '/api/register',
    '/api/verifyMail',
    '/api/resendVerification',
    '/api/forgot-password',
    '/api/reset-password',
    '/api/logout',
    '/api/user',
    '/api/profile',
]

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const { status } = error.response || {}
        const requestUrl = error.config?.url || ''
        const isAuthRequest = authEndpoints.some((endpoint) => requestUrl.includes(endpoint))

        if (status === 401 && !isAuthRequest && window.location.pathname !== '/login') {
            localStorage.removeItem('userName')
            window.location.href = '/login'
        }

        return Promise.reject(error)
    }
)

export default apiClient
