import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  FaTicketAlt, FaCalendar, FaStar, FaHeart, FaClock, 
  FaCheckCircle, FaTimesCircle, FaArrowRight
} from 'react-icons/fa'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import axios from '../../api/axios'
import LoadingSpinner from '../common/LoadingSpinner'
import EmptyState from '../common/EmptyState'

const UserDashboard = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingEvents: 0,
    pastEvents: 0,
    totalReviews: 0,
    wishlistCount: 0
  })
  const [upcomingBookings, setUpcomingBookings] = useState([])
  const [recentActivities, setRecentActivities] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [statsRes, bookingsRes, activitiesRes] = await Promise.all([
        axios.get('/users/stats'),
        axios.get('/users/bookings', { params: { status: 'confirmed', limit: 5 } }),
        axios.get('/users/activity', { params: { limit: 5 } })
      ])
      
      setStats(statsRes.data)
      setUpcomingBookings(bookingsRes.data.bookings || [])
      setRecentActivities(activitiesRes.data.activities || [])
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { 
      icon: FaTicketAlt, 
      label: 'Total Bookings', 
      value: stats.totalBookings,
      color: 'from-blue-500 to-blue-600',
      link: '/bookings'
    },
    { 
      icon: FaCalendar, 
      label: 'Upcoming Events', 
      value: stats.upcomingEvents,
      color: 'from-green-500 to-green-600',
      link: '/bookings?status=confirmed'
    },
    { 
      icon: FaStar, 
      label: 'Reviews', 
      value: stats.totalReviews,
      color: 'from-yellow-500 to-yellow-600',
      link: '/profile?tab=reviews'
    },
    { 
      icon: FaHeart, 
      label: 'Wishlist', 
      value: stats.wishlistCount,
      color: 'from-red-500 to-red-600',
      link: '/wishlist'
    },
  ]

  if (loading) {
    return <LoadingSpinner size="lg" />
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.username}! 👋
        </h1>
        <p className="text-white/80 mt-2">
          Here's what's happening with your events and bookings.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-r ${stat.color} rounded-xl p-4 text-white hover:shadow-lg transition-shadow`}
          >
            <Link to={stat.link} className="block">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className="text-3xl opacity-50" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <FaClock className="text-primary-500" />
              Upcoming Events
            </h3>
            <Link to="/bookings" className="text-sm text-primary-500 hover:text-primary-600 transition-colors flex items-center gap-1">
              View All
              <FaArrowRight className="text-xs" />
            </Link>
          </div>

          {upcomingBookings.length === 0 ? (
            <EmptyState
              icon="📅"
              title="No Upcoming Events"
              description="You don't have any upcoming events. Start exploring!"
              actionText="Browse Events"
              actionLink="/events"
            />
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <Link
                  key={booking.id}
                  to={`/bookings/${booking.id}`}
                  className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-white">
                        {booking.event?.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(booking.event?.date).toLocaleDateString()} • {booking.event?.venue}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {booking.quantity} tickets • ${booking.total_amount}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs">
                      {booking.booking_status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <FaClock className="text-primary-500" />
              Recent Activity
            </h3>
          </div>

          {recentActivities.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No Recent Activity"
              description="Your recent activities will appear here."
            />
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    {activity.type === 'booking' ? (
                      <FaCheckCircle className="text-primary-500" />
                    ) : activity.type === 'cancellation' ? (
                      <FaTimesCircle className="text-red-500" />
                    ) : (
                      <FaStar className="text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 dark:text-white">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserDashboard