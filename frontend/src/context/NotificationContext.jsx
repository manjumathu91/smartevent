import React, { createContext, useState, useContext, useEffect } from 'react'
import { useAuth } from './AuthContext'
import axios from '../api/axios'
import toast from 'react-hot-toast'

// Create context
const NotificationContext = createContext()

// Custom hook to use notification context
export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [socket, setSocket] = useState(null)

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated) return

    setLoading(true)
    try {
      const response = await axios.get('/users/notifications', {
        params: { limit: 50 }
      })
      setNotifications(response.data.notifications || [])
      const unread = response.data.notifications?.filter(n => n.status === 'unread').length || 0
      setUnreadCount(unread)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications()
      // Setup WebSocket for real-time notifications
      // setupWebSocket()
    }
    return () => {
      if (socket) {
        socket.close()
      }
    }
  }, [isAuthenticated])

  // Setup WebSocket (optional - for real-time notifications)
  const setupWebSocket = () => {
    // This is a placeholder for WebSocket implementation
    // In production, you would connect to your WebSocket server
    /*
    const ws = new WebSocket(`ws://localhost:5000/ws/notifications`)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setNotifications(prev => [data, ...prev])
      if (data.status === 'unread') {
        setUnreadCount(prev => prev + 1)
        toast.info(data.title)
      }
    }
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
    setSocket(ws)
    */
  }

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/users/notifications/${notificationId}/read`)
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, status: 'read' } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await axios.put('/users/notifications/read-all')
      setNotifications(prev =>
        prev.map(n => ({ ...n, status: 'read' }))
      )
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`/users/notifications/${notificationId}`)
      const deleted = notifications.find(n => n.id === notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      if (deleted?.status === 'unread') {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  // Add notification (for real-time updates)
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev])
    if (notification.status === 'unread') {
      setUnreadCount(prev => prev + 1)
    }
  }

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}