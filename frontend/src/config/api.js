// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const api = {
  baseURL: API_BASE_URL,
  endpoints: {
    deploy: `${API_BASE_URL}/api/deploy`,
    services: `${API_BASE_URL}/api/services`,
    health: `${API_BASE_URL}/api/health`
  }
}

export default api
