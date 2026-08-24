import axios from "axios";

const url = import.meta.env.VITE_API_URL

const apiClient = axios.create({
    baseURL: url,
    withCredentials: true,
    withXSRFToken: true,
    headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    }
);

//layers

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const { status } = error.response || {}

        if (status === 419) {
            console.log("CSRF Mismatch, status : 419")
        } else if (status === 401) {
            console.log("Unauthorized, status : 401")
            // Automatically log out if session expired
            localStorage.clear();
            window.location.href = '/login';
        } else if (status === 404) {
            console.log("Page not Found, status : 404")
        } else if (status === 500) {
            console.log("Server error, status : 500")
        } else if (!status) {
            console.log("Network error - the server didn't even respond, status : null")
        }

        return Promise.reject(error);
    }
);

export default apiClient;