import React, { createContext, useState, useContext, useEffect } from 'react'
import axios from '../api/axios'
import toast from 'react-hot-toast'
import { jwtDecode } from 'jwt-decode'

// Create context
const AuthContext = createContext()

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('access_token'))
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refresh_token'))

  // Check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true
    try {
      const decoded = jwtDecode(token)
      return decoded.exp < Date.now() / 1000
    } catch {
      return true
    }
  }

  // Set auth token in axios headers
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }

  // Load user from token
  const loadUser = async () => {
    const storedToken = localStorage.getItem('access_token')
    
    if (!storedToken || isTokenExpired(storedToken)) {
      setLoading(false)
      return
    }

    setToken(storedToken)
    setAuthToken(storedToken)

    try {
      const response = await axios.get('/users/profile')
      setUser(response.data)
    } catch (error) {
      console.error('Failed to load user:', error)
      if (error.response?.status === 401) {
        logout()
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [])

  // Login function
  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password })
      const { access_token, refresh_token, user } = response.data

      // Store tokens
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      
      setToken(access_token)
      setRefreshToken(refresh_token)
      setUser(user)
      setAuthToken(access_token)

      return { success: true, user }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed'
      return { success: false, error: errorMessage }
    }
  }

  // Register function
  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData)
      return { success: true, data: response.data }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed'
      return { success: false, error: errorMessage }
    }
  }

  // Logout function
  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setToken(null)
    setRefreshToken(null)
    setUser(null)
    setAuthToken(null)
  }

  // Update profile
  const updateProfile = async (data) => {
    try {
      const response = await axios.put('/users/profile', data)
      setUser(response.data.user)
      return { success: true, user: response.data.user }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Update failed'
      return { success: false, error: errorMessage }
    }
  }

  // Change password
  const changePassword = async (data) => {
    try {
      await axios.put('/users/profile/password', data)
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Password change failed'
      return { success: false, error: errorMessage }
    }
  }

  // Refresh token
  const refreshAuthToken = async () => {
    try {
      const response = await axios.post('/auth/refresh', {
        refresh_token: refreshToken
      })
      const { access_token } = response.data
      localStorage.setItem('access_token', access_token)
      setToken(access_token)
      setAuthToken(access_token)
      return true
    } catch (error) {
      logout()
      return false
    }
  }

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role
  }

  // Check if user is admin
  const isAdmin = user?.role === 'admin'

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshAuthToken,
    hasRole,
    isAdmin,
    isAuthenticated: !!user,
    isTokenExpired: isTokenExpired(token)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}