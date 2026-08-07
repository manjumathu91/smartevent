
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FaTicketAlt, FaUsers, FaCreditCard, FaCalendar, FaClock, FaMapMarkerAlt, FaCheckCircle, FaArrowLeft } from 'react-icons/fa'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import axios from '../../api/axios'
import LoadingSpinner from '../common/LoadingSpinner'

const BookingForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingData, setBookingData] = useState(null)
  
  const [formData, setFormData] = useState({
    quantity: 1,
    specialRequests: '',
    paymentMethod: 'card'
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: `/bookings/${id}` } })
      return
    }
    fetchEvent()
  }, [id, user])

  const fetchEvent = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`/events/${id}`)
      setEvent(response.data)
    } catch (error) {
      toast.error('Event not found')
      navigate('/events')
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (change) => {
    const newQuantity = formData.quantity + change
    if (newQuantity >= 1 && newQuantity <= (event?.available_seats || 0)) {
      setFormData(prev => ({ ...prev, quantity: newQuantity }))
      if (errors.quantity) {
        setErrors(prev => ({ ...prev, quantity: '' }))
      }
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = 'Please select at least 1 ticket'
    }
    if (formData.quantity > (event?.available_seats || 0)) {
      newErrors.quantity = `Only ${event?.available_seats} seats available`
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const response = await axios.post('/bookings', {
        event_id: parseInt(id),
        quantity: formData.quantity,
        special_requests: formData.specialRequests,
        payment_method: formData.paymentMethod
      })
      setBookingData(response.data.booking)
      setBookingSuccess(true)
      toast.success('Booking confirmed successfully! 🎉')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Booking failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownloadTicket = async () => {
    try {
      const response = await axios.get(`/bookings/${bookingData.id}/pdf`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `ticket_${bookingData.ticket_number}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Ticket downloaded!')
    } catch (error) {
      toast.error('Failed to download ticket')
    }
  }

  if (loading) {
    return <LoadingSpinner size="lg" />
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Event not found</p>
      </div>
    )
  }

  if (bookingSuccess && bookingData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheckCircle className="text-5xl text-green-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Booking Confirmed! 🎉
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your booking has been confirmed. You will receive a confirmation email shortly.
          </p>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 text-left mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Booking Reference</p>
                <p className="font-semibold text-gray-800 dark:text-white">
                  {bookingData.booking_reference}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Ticket Number</p>
                <p className="font-semibold text-gray-800 dark:text-white">
                  {bookingData.ticket_number}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Quantity</p>
                <p className="font-semibold text-gray-800 dark:text-white">
                  {bookingData.quantity} tickets
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Total Amount</p>
                <p className="font-semibold text-gray-800 dark:text-white">
                  ${bookingData.total_amount}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={handleDownloadTicket}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Download Ticket
            </button>
            <button
              onClick={() => navigate('/bookings')}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              View My Bookings
            </button>
            <button
              onClick={() => navigate('/events')}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Browse More Events
            </button>
          </div>
        </div>
      </motion.div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-24">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4">Event Summary</h3>
            
            <div className="aspect-video rounded-lg overflow-hidden mb-4">
              <img
                src={event.image_url || `https://picsum.photos/seed/${event.id}/400/300`}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>

            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
              {event.title}
            </h4>

            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p className="flex items-center gap-2">
                <FaCalendar className="text-primary-500" />
                {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="flex items-center gap-2">
                <FaClock className="text-primary-500" />
                {event.time || 'TBD'}
              </p>
              <p className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-primary-500" />
                {event.venue}, {event.city}
              </p>
              <p className="flex items-center gap-2">
                <FaUsers className="text-primary-500" />
                {event.available_seats} seats available
              </p>
            </div>

            <div className="mt-4 pt-4 border-t dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Price per ticket</span>
                <span className="font-semibold text-gray-800 dark:text-white">
                  ${event.price.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold mt-2">
                <span>Total</span>
                <span className="text-primary-500 text-lg">
                  ${(event.price * formData.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Book Tickets
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Tickets
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 text-2xl"
                    disabled={formData.quantity <= 1}
                  >
                    -
                  </button>
                  <div className="text-center">
                    <span className="text-3xl font-bold text-gray-800 dark:text-white">
                      {formData.quantity}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Max {event.available_seats}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 text-2xl"
                    disabled={formData.quantity >= event.available_seats}
                  >
                    +
                  </button>
                </div>
                {errors.quantity && (
                  <p className="mt-2 text-sm text-red-500">{errors.quantity}</p>
                )}
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Special Requests (Optional)
                </label>
                <textarea
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="Any special requests or requirements?"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['card', 'paypal', 'wallet'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method }))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.paymentMethod === method
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <FaCreditCard className={`text-2xl mx-auto mb-1 ${
                        formData.paymentMethod === method
                          ? 'text-primary-500'
                          : 'text-gray-400'
                      }`} />
                      <span className="text-sm capitalize">
                        {method}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || event.available_seats === 0}
                className="w-full py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : event.available_seats === 0 ? (
                  'Sold Out'
                ) : (
                  `Confirm Booking - $${(event.price * formData.quantity).toFixed(2)}`
                )}
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                By confirming your booking, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingForm