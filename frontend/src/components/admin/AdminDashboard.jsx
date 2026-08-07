import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FaUsers, FaCalendarAlt, FaTicketAlt, FaDollarSign, 
  FaChartLine, FaChartBar, FaDownload, FaEye, 
  FaCheckCircle, FaTimesCircle, FaClock, FaArrowRight,
  FaStar, FaHeart, FaShoppingCart, FaUserPlus
} from 'react-icons/fa'
import { motion } from 'framer-motion'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import toast from 'react-hot-toast'
import axios from '../../api/axios'
import LoadingSpinner from '../common/LoadingSpinner'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('month')
  const [recentUsers, setRecentUsers] = useState([])
  const [recentBookings, setRecentBookings] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [timeRange])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/admin/dashboard', {
        params: { range: timeRange }
      })
      setStats(response.data)
      setRecentUsers(response.data.recent_users || [])
      setRecentBookings(response.data.recent_bookings || [])
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type) => {
    try {
      const response = await axios.get(`/admin/export/${type}`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `dashboard_${type}_${new Date().toISOString().split('T')[0]}.${type === 'csv' ? 'csv' : 'xlsx'}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success(`Exported ${type.toUpperCase()} successfully!`)
    } catch (error) {
      toast.error('Export failed')
    }
  }

  if (loading) {
    return <LoadingSpinner size="lg" />
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    )
  }

  const statCards = [
    { 
      title: 'Total Users', 
      value: stats.total_users || 0, 
      icon: <FaUsers />, 
      color: 'bg-blue-500',
      change: '+12%',
      link: '/admin/users'
    },
    { 
      title: 'Total Events', 
      value: stats.total_events || 0, 
      icon: <FaCalendarAlt />, 
      color: 'bg-green-500',
      change: '+8%',
      link: '/admin/events'
    },
    { 
      title: 'Total Bookings', 
      value: stats.total_bookings || 0, 
      icon: <FaTicketAlt />, 
      color: 'bg-purple-500',
      change: '+15%',
      link: '/admin/bookings'
    },
    { 
      title: 'Revenue', 
      value: `$${(stats.revenue || 0).toLocaleString()}`, 
      icon: <FaDollarSign />, 
      color: 'bg-yellow-500',
      change: '+22%',
      link: '/admin/revenue'
    }
  ]

  // Chart data
  const monthlyBookingsData = {
    labels: stats.monthly_bookings?.map(b => b.month) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Bookings',
        data: stats.monthly_bookings?.map(b => b.count) || [0, 0, 0, 0, 0, 0],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  }

  const revenueData = {
    labels: stats.monthly_revenue?.map(r => r.month) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue ($)',
        data: stats.monthly_revenue?.map(r => r.revenue) || [0, 0, 0, 0, 0, 0],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  }

  const categoryData = {
    labels: stats.category_stats?.map(c => c.name) || [],
    datasets: [
      {
        data: stats.category_stats?.map(c => c.count) || [],
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#FF6384', '#36A2EB'
        ]
      }
    ]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#fff' : '#333'
        }
      }
    },
    scales: {
      y: {
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#fff' : '#333'
        }
      },
      x: {
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#fff' : '#333'
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Overview of your event management system</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
            <FaDownload />
            CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FaDownload />
            Excel
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all"
          >
            <Link to={card.link} className="block">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                    {card.value}
                  </p>
                  <p className="text-sm text-green-500 mt-1">{card.change}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.color} text-white`}>
                  {card.icon}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Event Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center gap-4">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <FaCheckCircle className="text-green-500 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Events</p>
            <p className="text-2xl font-bold">{stats.active_events || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <FaClock className="text-blue-500 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed Events</p>
            <p className="text-2xl font-bold">{stats.completed_events || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <FaTimesCircle className="text-red-500 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cancelled Events</p>
            <p className="text-2xl font-bold">{stats.cancelled_events || 0}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Monthly Bookings</h3>
          <Line data={monthlyBookingsData} options={options} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Revenue Trend</h3>
          <Line data={revenueData} options={options} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Event Categories</h3>
          <Doughnut data={categoryData} options={options} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Popular Events</h3>
          <div className="space-y-3">
            {stats.popular_events?.slice(0, 5).map((event, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    #{index + 1}
                  </span>
                  <span className="text-gray-800 dark:text-white">{event.title}</span>
                </div>
                <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-xs">
                  {event.booking_count} bookings
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Users</h3>
            <Link to="/admin/users" className="text-sm text-primary-500 hover:text-primary-600 transition-colors flex items-center gap-1">
              View All
              <FaArrowRight className="text-xs" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentUsers.slice(0, 5).map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <img
                  src={user.profile_image || `https://ui-avatars.com/api/?name=${user.username}&size=32&background=6366f1&color=fff`}
                  alt={user.username}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{user.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Bookings</h3>
            <Link to="/admin/bookings" className="text-sm text-primary-500 hover:text-primary-600 transition-colors flex items-center gap-1">
              View All
              <FaArrowRight className="text-xs" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentBookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {booking.event?.title || 'Event'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {booking.user?.username || 'User'} • {booking.quantity} tickets
                  </p>
                </div>
                <span className="text-sm font-bold text-primary-500">
                  ${booking.total_amount}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminDashboard