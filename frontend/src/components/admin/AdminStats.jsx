import React, { useState, useEffect } from 'react'
import { 
  FaUsers, FaCalendarAlt, FaTicketAlt, FaDollarSign, 
  FaChartLine, FaChartBar, FaDownload, FaEye,
  FaUserPlus, FaShoppingCart, FaStar, FaHeart
} from 'react-icons/fa'
import { motion } from 'framer-motion'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import toast from 'react-hot-toast'
import axios from '../../api/axios'
import LoadingSpinner from '../common/LoadingSpinner'

const AdminStats = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('month')

  useEffect(() => {
    fetchStats()
  }, [timeRange])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/admin/dashboard', {
        params: { range: timeRange }
      })
      setStats(response.data)
    } catch (error) {
      toast.error('Failed to load statistics')
    } finally {
      setLoading(false)
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
      icon: FaUsers, 
      label: 'Total Users', 
      value: stats.total_users || 0,
      change: '+12%',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      icon: FaCalendarAlt, 
      label: 'Total Events', 
      value: stats.total_events || 0,
      change: '+8%',
      color: 'from-green-500 to-green-600'
    },
    { 
      icon: FaTicketAlt, 
      label: 'Total Bookings', 
      value: stats.total_bookings || 0,
      change: '+15%',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      icon: FaDollarSign, 
      label: 'Revenue', 
      value: `$${(stats.revenue || 0).toLocaleString()}`,
      change: '+22%',
      color: 'from-yellow-500 to-yellow-600'
    }
  ]

  const chartOptions = {
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
        beginAtZero: true,
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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Statistics</h1>
          <p className="text-gray-500 dark:text-gray-400">Detailed analytics and insights</p>
        </div>
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-r ${card.color} rounded-xl p-6 text-white`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-90">{card.label}</p>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-sm opacity-80">{card.change}</p>
              </div>
              <card.icon className="text-3xl opacity-50" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Monthly Bookings</h3>
          <Line data={{
            labels: stats.monthly_bookings?.map(b => b.month) || [],
            datasets: [{
              label: 'Bookings',
              data: stats.monthly_bookings?.map(b => b.count) || [],
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              fill: true,
              tension: 0.4
            }]
          }} options={chartOptions} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Revenue Trend</h3>
          <Line data={{
            labels: stats.monthly_revenue?.map(r => r.month) || [],
            datasets: [{
              label: 'Revenue ($)',
              data: stats.monthly_revenue?.map(r => r.revenue) || [],
              borderColor: '#22c55e',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              fill: true,
              tension: 0.4
            }]
          }} options={chartOptions} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Event Categories</h3>
          <Doughnut data={{
            labels: stats.category_stats?.map(c => c.name) || [],
            datasets: [{
              data: stats.category_stats?.map(c => c.count) || [],
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
            }]
          }} options={chartOptions} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">User Growth</h3>
          <Bar data={{
            labels: stats.user_growth?.map(u => u.month) || [],
            datasets: [{
              label: 'New Users',
              data: stats.user_growth?.map(u => u.count) || [],
              backgroundColor: '#6366f1',
              borderRadius: 8
            }]
          }} options={chartOptions} />
        </div>
      </div>
    </div>
  )
}

export default AdminStats