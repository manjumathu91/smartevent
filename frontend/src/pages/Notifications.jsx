// frontend/src/pages/Notifications.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaBell, FaCheck, FaTimes, FaTrash, FaCheckDouble,
  FaCalendar, FaTicketAlt, FaCreditCard, FaInfoCircle,
  FaExclamationCircle, FaCheckCircle, FaClock
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import Breadcrumb from '../components/common/Breadcrumb'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import toast from 'react-hot-toast'
import axios from '../api/axios'

const Notifications = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, read

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/notifications')
      setNotifications(response.data.notifications || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/notifications/${notificationId}/read`)
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, status: 'read', read_at: new Date().toISOString() }
            : notif
        )
      )
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await axios.put('/notifications/read-all')
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, status: 'read', read_at: new Date().toISOString() }))
      )
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`/notifications/${notificationId}`)
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const getNotificationIcon = (type) => {
    const icons = {
      'booking_confirmation': FaCheckCircle,
      'booking_cancelled': FaTimes,
      'payment_success': FaCreditCard,
      'payment_failed': FaExclamationCircle,
      'event_reminder': FaCalendar,
      'new_booking': FaTicketAlt,
      'refund_processed': FaCreditCard,
      'refund_failed': FaExclamationCircle,
      'general': FaInfoCircle
    }
    const Icon = icons[type] || FaBell
    return Icon
  }

  const getNotificationColor = (type) => {
    const colors = {
      'booking_confirmation': 'text-green-500 bg-green-100 dark:bg-green-900/30',
      'booking_cancelled': 'text-red-500 bg-red-100 dark:bg-red-900/30',
      'payment_success': 'text-green-500 bg-green-100 dark:bg-green-900/30',
      'payment_failed': 'text-red-500 bg-red-100 dark:bg-red-900/30',
      'event_reminder': 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
      'new_booking': 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
      'refund_processed': 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
      'refund_failed': 'text-red-500 bg-red-100 dark:bg-red-900/30',
      'general': 'text-gray-500 bg-gray-100 dark:bg-gray-700'
    }
    return colors[type] || 'text-gray-500 bg-gray-100 dark:bg-gray-700'
  }

  const getTimeAgo = (date) => {
    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString()
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return notif.status === 'unread'
    if (filter === 'read') return notif.status === 'read'
    return true
  })

  const unreadCount = notifications.filter(n => n.status === 'unread').length

  if (loading) {
    return <LoadingSpinner size="lg" />
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FaBell className="text-primary-500" />
            Notifications
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
            >
              <FaCheckDouble />
              Mark All as Read
            </button>
          )}
          <div className="flex gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                filter === 'unread'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              Unread
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon="🔔"
          title={filter === 'all' ? 'No Notifications' : `No ${filter} Notifications`}
          description={filter === 'all' 
            ? "You don't have any notifications yet. Check back later for updates."
            : `You don't have any ${filter} notifications.`
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification, index) => {
            const Icon = getNotificationIcon(notification.type)
            const colorClass = getNotificationColor(notification.type)
            const isUnread = notification.status === 'unread'

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden ${
                  isUnread ? 'border-l-4 border-primary-500' : ''
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="text-lg" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className={`font-semibold ${isUnread ? 'text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {getTimeAgo(notification.created_at)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-3">
                        {notification.link && (
                          <Link
                            to={notification.link}
                            className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                          >
                            View Details →
                          </Link>
                        )}
                        {isUnread && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-sm text-red-400 hover:text-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Notifications