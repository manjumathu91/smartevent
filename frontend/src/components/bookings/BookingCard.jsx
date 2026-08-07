import React from 'react'
import { Link } from 'react-router-dom'
import { FaCalendar, FaMapMarkerAlt, FaTicketAlt, FaDownload, FaEye, FaTimes } from 'react-icons/fa'
import { motion } from 'framer-motion'

const BookingCard = ({ booking, onCancel, onDownload }) => {
  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    }
    return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return 'TBD'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
    >
      <Link to={`/bookings/${booking.id}`}>
        <div className="relative h-32 overflow-hidden">
          <img
            src={booking.event?.image_url || `https://picsum.photos/seed/${booking.event?.id}/400/200`}
            alt={booking.event?.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.booking_status)}`}>
                {booking.booking_status.toUpperCase()}
              </span>
              <span className="text-white font-bold">
                ${booking.total_amount}
              </span>
            </div>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/events/${booking.event?.id}`} className="hover:text-primary-500 transition-colors">
          <h3 className="font-semibold text-gray-800 dark:text-white line-clamp-1">
            {booking.event?.title}
          </h3>
        </Link>

        <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <p className="flex items-center gap-2">
            <FaCalendar className="text-primary-500 text-xs" />
            {formatDate(booking.event?.date)}
          </p>
          <p className="flex items-center gap-2">
            <FaMapMarkerAlt className="text-primary-500 text-xs" />
            {booking.event?.venue}, {booking.event?.city}
          </p>
          <p className="flex items-center gap-2">
            <FaTicketAlt className="text-primary-500 text-xs" />
            {booking.quantity} ticket{booking.quantity > 1 ? 's' : ''}
          </p>
        </div>

        <div className="mt-3 pt-3 border-t dark:border-gray-700 flex flex-wrap gap-2">
          <Link
            to={`/bookings/${booking.id}`}
            className="flex-1 px-3 py-1.5 bg-primary-500 text-white text-xs rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-1"
          >
            <FaEye className="text-xs" />
            View
          </Link>
          {booking.booking_status === 'confirmed' && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  onDownload(booking)
                }}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
              >
                <FaDownload className="text-xs" />
                Ticket
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  onCancel(booking.id)
                }}
                className="px-3 py-1.5 border border-red-300 text-red-500 text-xs rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1"
              >
                <FaTimes className="text-xs" />
                Cancel
              </button>
            </>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-2">
          Ref: {booking.booking_reference}
        </p>
      </div>
    </motion.div>
  )
}

export default BookingCard