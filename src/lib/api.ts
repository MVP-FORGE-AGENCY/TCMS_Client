import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
})

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized (e.g., redirect to login)
        if (error.response?.status === 401) {
            console.error("Unauthorized access")
            // window.location.href = "/login"
        }
        return Promise.reject(error)
    }
)

export interface ApiError {
    message: string
    code?: string
    details?: Record<string, unknown>
}
