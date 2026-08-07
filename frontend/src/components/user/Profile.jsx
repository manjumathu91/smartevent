import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  FaUser, FaEnvelope, FaPhone, FaCalendar, FaEdit, FaCamera,
  FaTicketAlt, FaStar, FaHeart, FaCog, FaSignOutAlt
} from 'react-icons/fa'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import axios from '../../api/axios'
import LoadingSpinner from '../common/LoadingSpinner'
import EmptyState from '../common/EmptyState'
import ProfileEdit from './ProfileEdit'
import ChangePassword from './ChangePassword'

const Profile = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalReviews: 0,
    totalWishlist: 0
  })
  const [recentBookings, setRecentBookings] = useState([])

  useEffect(() => {
    if (user) {
      fetchUserStats()
      fetchRecentBookings()
    }
  }, [user])

  const fetchUserStats = async () => {
    try {
      const response = await axios.get('/users/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchRecentBookings = async () => {
    try {
      const response = await axios.get('/users/bookings', {
        params: { limit: 3 }
      })
      setRecentBookings(response.data.bookings || [])
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  const statCards = [
    { icon: FaTicketAlt, label: 'Total Bookings', value: stats.totalBookings, color: 'from-blue-500 to-blue-600' },
    { icon: FaStar, label: 'Reviews', value: stats.totalReviews, color: 'from-yellow-500 to-yellow-600' },
    { icon: FaHeart, label: 'Wishlist', value: stats.totalWishlist, color: 'from-red-500 to-red-600' },
  ]

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'edit', label: 'Edit Profile', icon: FaEdit },
    { id: 'password', label: 'Change Password', icon: FaCog },
  ]

  if (!user) {
    return <LoadingSpinner size="lg" />
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white mb-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <img
              src={user.profile_image || `https://ui-avatars.com/api/?name=${user.username}&size=128&background=6366f1&color=fff`}
              alt={user.username}
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
            />
            <button
              onClick={() => document.getElementById('avatarInput').click()}
              className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <FaCamera className="text-primary-500" />
            </button>
            <input
              id="avatarInput"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files[0]
                if (!file) return
                const formData = new FormData()
                formData.append('avatar', file)
                try {
                  await axios.post('/users/profile/avatar', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                  })
                  toast.success('Profile picture updated!')
                  window.location.reload()
                } catch (error) {
                  toast.error('Failed to update profile picture')
                }
              }}
            />
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl font-bold">{user.username}</h1>
            <p className="text-white/80 text-sm">{user.email}</p>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-white/90">
              <span className="flex items-center gap-1">
                <FaCalendar />
                Joined {formatDate(user.created_at)}
              </span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs">
                {user.role.toUpperCase()}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-r ${stat.color} rounded-xl p-4 text-white`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className="text-3xl opacity-50" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="border-b dark:border-gray-700">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Personal Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">Username</span>
                      <span className="font-medium text-gray-800 dark:text-white">{user.username}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">Email</span>
                      <span className="font-medium text-gray-800 dark:text-white">{user.email}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">Phone</span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {user.phone || 'Not provided'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">Role</span>
                      <span className="font-medium text-gray-800 dark:text-white capitalize">
                        {user.role}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500 dark:text-gray-400">Member Since</span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {formatDate(user.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Recent Bookings</h3>
                  {recentBookings.length === 0 ? (
                    <EmptyState
                      icon="🎫"
                      title="No Bookings"
                      description="You haven't made any bookings yet"
                      actionText="Browse Events"
                      actionLink="/events"
                    />
                  ) : (
                    <div className="space-y-3">
                      {recentBookings.map((booking) => (
                        <Link
                          key={booking.id}
                          to={`/bookings/${booking.id}`}
                          className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-800 dark:text-white">
                                {booking.event?.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {booking.quantity} tickets • {formatDate(booking.booking_date)}
                              </p>
                            </div>
                            <span className="text-sm font-bold text-primary-500">
                              ${booking.total_amount}
                            </span>
                          </div>
                        </Link>
                      ))}
                      <Link
                        to="/bookings"
                        className="block text-center text-sm text-primary-500 hover:text-primary-600 transition-colors"
                      >
                        View All Bookings →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'edit' && <ProfileEdit />}
          {activeTab === 'password' && <ChangePassword />}
        </div>
      </div>
    </div>
  )
}

export default Profile