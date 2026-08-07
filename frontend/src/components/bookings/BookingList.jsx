
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'  // ✅ Add useNavigate
import { useAuth } from '../../context/AuthContext'
import { FaTicketAlt, FaCalendar, FaMapMarkerAlt, FaSearch, FaFilter, FaDownload, FaTimes, FaEye, FaCreditCard } from 'react-icons/fa'  // ✅ Add FaCreditCard
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import axios from '../../api/axios'
import LoadingSpinner from '../common/LoadingSpinner'
import EmptyState from '../common/EmptyState'
import Pagination from '../common/Pagination'
import BookingCard from './BookingCard'

const BookingList = () => {
  const { user } = useAuth()
  const navigate = useNavigate()  // ✅ Add navigate
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    per_page: 10
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [pagination.page, statusFilter])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/bookings', {
        params: {
          page: pagination.page,
          per_page: 10,
          status: statusFilter
        }
      })
      setBookings(response.data.bookings || [])
      setPagination({
        total: response.data.total || 0,
        page: response.data.page || 1,
        pages: response.data.pages || 1,
        per_page: response.data.per_page || 10
      })
    } catch (error) {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  // ✅ CANCEL HANDLER
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return
    }
    
    setCancellingId(bookingId)
    
    try {
      const response = await axios.put(`/bookings/${bookingId}/cancel`)
      
      if (response.data.success) {
        toast.success('Booking cancelled successfully!')
        fetchBookings()
      } else {
        const errorMsg = response.data.error || 'Failed to cancel booking'
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error('Cancel error:', error)
      let errorMessage = 'Failed to cancel booking'
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      toast.error(errorMessage)
    } finally {
      setCancellingId(null)
    }
  }

  // ✅ PAY NOW HANDLER
  const handlePayNow = (booking) => {
    navigate(`/bookings/${booking.id}`, { 
      state: { openPayment: true }
    })
  }

  const handleDownloadTicket = async (booking) => {
    try {
      const response = await axios.get(`/bookings/${booking.id}/pdf`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `ticket_${booking.ticket_number}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Ticket downloaded!')
    } catch (error) {
      toast.error('Failed to download ticket')
    }
  }

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filteredBookings = bookings.filter(booking => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      booking.event?.title?.toLowerCase().includes(search) ||
      booking.event?.venue?.toLowerCase().includes(search) ||
      booking.event?.city?.toLowerCase().includes(search) ||
      booking.booking_reference?.toLowerCase().includes(search)
    )
  })

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    }
    return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }

  if (loading) {
    return <LoadingSpinner size="lg" />
  }

  if (bookings.length === 0 && !searchTerm) {
    return (
      <EmptyState
        icon="🎫"
        title="No Bookings Yet"
        description="You haven't booked any events yet. Start exploring and book your first event!"
        actionText="Browse Events"
        actionLink="/events"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            My Bookings
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {pagination.total} bookings found
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FaFilter />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border dark:border-gray-700"
        >
          <div className="flex flex-wrap gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
            <button
              onClick={() => {
                setStatusFilter('')
                setSearchTerm('')
              }}
              className="px-4 py-2 text-red-500 hover:text-red-600 transition-colors flex items-center gap-2"
            >
              <FaTimes />
              Clear Filters
            </button>
          </div>
        </motion.div>
      )}

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No Bookings Found"
          description="No bookings match your search criteria. Try adjusting your filters."
          actionText="Clear Filters"
          onAction={() => {
            setSearchTerm('')
            setStatusFilter('')
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  {/* Event Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.booking_status)}`}>
                        {booking.booking_status?.toUpperCase() || 'PENDING'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString() : 'N/A'}
                      </span>
                      {/* ✅ Payment Pending Badge */}
                      {booking.booking_status === 'pending' && booking.payment_status === 'pending' && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-full">
                          Payment Pending
                        </span>
                      )}
                    </div>
                    <Link to={`/events/${booking.event?.id}`} className="hover:text-primary-500 transition-colors">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {booking.event?.title || 'Event'}
                      </h3>
                    </Link>
                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {booking.event?.date && (
                        <span className="flex items-center gap-1">
                          <FaCalendar className="text-primary-500" />
                          {new Date(booking.event.date).toLocaleDateString()}
                        </span>
                      )}
                      {booking.event?.venue && (
                        <span className="flex items-center gap-1">
                          <FaMapMarkerAlt className="text-primary-500" />
                          {booking.event.venue}, {booking.event.city || ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {booking.quantity || 1} ticket{booking.quantity > 1 ? 's' : ''}
                    </p>
                    <p className="text-lg font-bold text-primary-500">
                      ${booking.total_amount?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Ref: {booking.booking_reference || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t dark:border-gray-700 flex flex-wrap gap-2">
                  <Link
                    to={`/bookings/${booking.id}`}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 text-sm"
                  >
                    <FaEye />
                    View Details
                  </Link>

                  {/* ✅ PAY NOW BUTTON - For Pending Bookings */}
                  {booking.booking_status === 'pending' && booking.payment_status === 'pending' && (
                    <button
                      onClick={() => handlePayNow(booking)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm animate-pulse"
                    >
                      <FaCreditCard />
                      Pay Now
                    </button>
                  )}
                  
                  {/* Download Ticket - For Confirmed */}
                  {booking.booking_status === 'confirmed' && (
                    <button
                      onClick={() => handleDownloadTicket(booking)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
                    >
                      <FaDownload />
                      Download Ticket
                    </button>
                  )}

                  {/* Cancel Button - For Pending and Confirmed */}
                  {(booking.booking_status === 'pending' || booking.booking_status === 'confirmed') && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancellingId === booking.id}
                      className={`px-4 py-2 border border-red-300 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 text-sm ${
                        cancellingId === booking.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {cancellingId === booking.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <FaTimes />
                          Cancel
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {pagination.pages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default BookingList