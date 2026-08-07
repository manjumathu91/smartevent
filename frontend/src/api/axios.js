
/**
 * Axios Configuration - Complete Updated Version
 * Handles all API requests with proper CORS handling
 */

import axios from 'axios'
import toast from 'react-hot-toast'

// ==================== HELPER: Get Token ====================

const getToken = () => {
  // ✅ Check both possible token storage names
  return localStorage.getItem('access_token') || localStorage.getItem('token') || null
}

// ==================== CREATE AXIOS INSTANCE ====================

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
})

// ==================== REQUEST INTERCEPTOR ====================

axiosInstance.interceptors.request.use(
  (config) => {
    // ✅ Get token from either storage key
    const token = getToken()
    
    console.log('🔑 Token found:', token ? 'Yes' : 'No')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('✅ Token added to request headers')
    } else {
      console.warn('⚠️ No token found in localStorage')
    }
    
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    }
    
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// ==================== RESPONSE INTERCEPTOR ====================

axiosInstance.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.url}`, response.data)
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // ==================== HANDLE 401 UNAUTHORIZED ====================
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }
        
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/auth/refresh`,
          { refresh_token: refreshToken }
        )
        
        const { access_token } = response.data
        
        // ✅ Save in both formats
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('token', access_token)
        
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        
        return axiosInstance(originalRequest)
        
      } catch (refreshError) {
        // ✅ Clear both token formats
        localStorage.removeItem('access_token')
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        
        if (window.location.pathname !== '/login') {
          toast.error('Session expired. Please login again.')
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
        }
        
        return Promise.reject(refreshError)
      }
    }
    
    // ==================== HANDLE OTHER ERRORS ====================
    
    if (!error.response) {
      console.error('🌐 Network Error:', error.message)
      toast.error('Network error. Please check your connection.')
      return Promise.reject(error)
    }
    
    // ✅ Extract error message safely
    const errorMessage = getErrorMessage(error)
    
    const { status } = error.response
    
    switch (status) {
      case 400:
        toast.error(errorMessage || 'Bad request')
        break
      case 403:
        toast.error(errorMessage || 'You do not have permission')
        break
      case 404:
        toast.error(errorMessage || 'Resource not found')
        break
      case 409:
        toast.error(errorMessage || 'Conflict occurred')
        break
      case 422:
        toast.error(errorMessage || 'Validation failed')
        break
      case 429:
        toast.error('Too many requests. Please try again later.')
        break
      case 500:
        console.error('Server Error:', error.response.data)
        toast.error(errorMessage || 'Server error. Please try again later.')
        break
      default:
        toast.error(errorMessage || 'Something went wrong')
    }
    
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: status,
      data: error.response?.data,
      message: error.message
    })
    
    return Promise.reject(error)
  }
)

// ==================== HELPER: Get Error Message ====================

const getErrorMessage = (error) => {
  if (!error) return 'An error occurred'
  if (typeof error === 'string') return error
  
  if (error.response?.data) {
    const data = error.response.data
    
    if (data.message && typeof data.message === 'string') return data.message
    if (data.error && typeof data.error === 'string') return data.error
    if (data.error?.message && typeof data.error.message === 'string') return data.error.message
    if (data.detail && typeof data.detail === 'string') return data.detail
    
    // Handle specific error format from your backend
    if (data.code && data.message) return data.message
    if (data.status_code && data.message) return data.message
    
    if (typeof data === 'string') return data
  }
  
  if (error.message) return error.message
  return 'An error occurred'
}

// ==================== API HELPER FUNCTIONS ====================

export const get = (url, params = {}) => {
  return axiosInstance.get(url, { params })
}

export const post = (url, data = {}) => {
  return axiosInstance.post(url, data)
}

export const put = (url, data = {}) => {
  return axiosInstance.put(url, data)
}

export const del = (url, data = {}) => {
  return axiosInstance.delete(url, { data })
}

export const patch = (url, data = {}) => {
  return axiosInstance.patch(url, data)
}

export const uploadFile = (url, file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return axiosInstance.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percentCompleted)
      }
    },
  })
}

export const downloadFile = async (url, filename) => {
  try {
    const response = await axiosInstance.get(url, {
      responseType: 'blob',
    })
    
    const blob = new Blob([response.data])
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = filename || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(link.href)
    
    toast.success('File downloaded successfully!')
    return { success: true }
  } catch (error) {
    console.error('Download error:', error)
    toast.error(getErrorMessage(error) || 'Failed to download file')
    return { success: false, error }
  }
}

export default axiosInstance