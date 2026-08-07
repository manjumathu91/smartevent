
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  FaArrowLeft, FaTicketAlt, FaCalendar, FaClock, FaMapMarkerAlt, 
  FaUser, FaEnvelope, FaPhone, FaDownload, FaTimes, FaCheckCircle,
  FaQrcode, FaPrint
} from 'react-icons/fa'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import axios from '../../api/axios'
import LoadingSpinner from '../common/LoadingSpinner'
import EmptyState from '../common/EmptyState'

const BookingDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qrCode, setQrCode] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    fetchBooking()
  }, [id])

  const fetchBooking = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`/bookings/${id}`)
      setBooking(response.data)
      fetchQrCode()
    } catch (error) {
      toast.error('Booking not found')
      navigate('/bookings')
    } finally {
      setLoading(false)
    }
  }

  const fetchQrCode = async () => {
    try {
      const response = await axios.get(`/bookings/${id}/qr`)
      setQrCode(response.data.qr_code)
    } catch (error) {
      console.error('Failed to load QR code:', error)
    }
  }

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return
    
    setCancelling(true)
    try {
      await axios.put(`/bookings/${id}/cancel`)
      toast.success('Booking cancelled successfully')
      fetchBooking()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel booking')
    } finally {
      setCancelling(false)
    }
  }

  const handleDownloadTicket = async () => {
    try {
      const response = await axios.get(`/bookings/${id}/pdf`, {
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

  const handlePrintTicket = () => {
    window.print()
  }

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

  if (!booking) {
    return (
      <EmptyState
        icon="❌"
        title="Booking Not Found"
        description="The booking you're looking for doesn't exist."
        actionText="View All Bookings"
        actionLink="/bookings"
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors mb-6"
      >
        <FaArrowLeft />
        Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">Booking Details</h1>
              <p className="text-white/80 text-sm">
                Reference: {booking.booking_reference}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(booking.booking_status)}`}>
              {booking.booking_status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="p-6">
          {/* Event Info */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {booking.event?.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm text-gray-600 dark:text-gray-400">
              <p className="flex items-center gap-2">
                <FaCalendar className="text-primary-500" />
                {new Date(booking.event?.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="flex items-center gap-2">
                <FaClock className="text-primary-500" />
                {booking.event?.time || 'TBD'}
              </p>
              <p className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-primary-500" />
                {booking.event?.venue}, {booking.event?.city}
              </p>
              <p className="flex items-center gap-2">
                <FaUser className="text-primary-500" />
                {booking.event?.organizers?.[0]?.username || 'N/A'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ticket Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <FaTicketAlt className="text-primary-500" />
                Ticket Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Ticket Number</span>
                  <span className="font-medium text-gray-800 dark:text-white">
                    {booking.ticket_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Quantity</span>
                  <span className="font-medium text-gray-800 dark:text-white">
                    {booking.quantity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Amount</span>
                  <span className="font-bold text-primary-500">
                    ${booking.total_amount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Payment Status</span>
                  <span className={`font-medium ${
                    booking.payment_status === 'completed' 
                      ? 'text-green-500' 
                      : 'text-yellow-500'
                  }`}>
                    {booking.payment_status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 flex flex-col items-center justify-center">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <FaQrcode className="text-primary-500" />
                QR Code
              </h3>
              {qrCode ? (
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              ) : (
                <div className="w-48 h-48 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center text-gray-400">
                  No QR Code
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Scan this QR code at the event
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 pt-6 border-t dark:border-gray-700">
            <div className="flex flex-wrap gap-3">
              <button                onClick={handleDownloadTicket}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
              >
                <FaDownload />
                Download Ticket
              </button>
              <button
                onClick={handlePrintTicket}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <FaPrint />
                Print
              </button>
              {booking.booking_status === 'confirmed' && (
                <button
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  className="px-6 py-2 border border-red-300 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                >
                  <FaTimes />
                  {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default BookingDetail