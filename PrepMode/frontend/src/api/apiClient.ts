import axios from 'axios'

export const TOKEN_KEY = 'prepmode_token'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string } } | undefined
    if (data?.error?.message) return data.error.message
    if (error.code === 'ERR_NETWORK') return 'Cannot reach the PrepMode server. Is the backend running?'
  }
  return 'Something went wrong. Please try again.'
}

export function getApiErrorStatus(error: unknown): number | null {
  if (axios.isAxiosError(error)) return error.response?.status ?? null
  return null
}
