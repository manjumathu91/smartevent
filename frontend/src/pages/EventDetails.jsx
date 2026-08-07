
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  FaCalendar, FaMapMarkerAlt, FaClock, FaUser, FaEnvelope, FaPhone,
  FaStar, FaRegStar, FaShare, FaHeart, FaRegHeart, FaArrowLeft,
  FaUsers, FaTicketAlt, FaCheckCircle, FaExternalLinkAlt
} from 'react-icons/fa'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import toast from 'react-hot-toast'
import axios from '../api/axios'
import { format } from 'date-fns'

// ✅ Import your existing RazorpayPayment component
import RazorpayPayment from '../components/payments/RazorpayPayment'

const EventDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [reviews, setReviews] = useState([])
  
  // ✅ Payment states
  const [showPayment, setShowPayment] = useState(false)
  const [bookingData, setBookingData] = useState(null)

  useEffect(() => {
    fetchEvent()
    fetchReviews()
  }, [id])

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

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`/events/${id}/reviews`)
      setReviews(response.data.reviews || [])
    } catch (error) {
      console.error('Failed to load reviews:', error)
    }
  }

  // ✅ Updated handleBooking
  const handleBooking = async () => {
    if (!user) {
      toast.error('Please login to book tickets')
      navigate('/login', { state: { from: `/events/${id}` } })
      return
    }

    if (!event || event.available_seats <= 0) {
      toast.error('No seats available')
      return
    }

    setBookingLoading(true)
    try {
      const response = await axios.post('/bookings/', {
        event_id: parseInt(id),
        quantity: quantity
      })
      
      setBookingData(response.data.booking)
      setShowPayment(true)
      toast.success('Booking created! Please complete payment.')
      
    } catch (error) {
      toast.error(error.response?.data?.error || 'Booking failed')
    } finally {
      setBookingLoading(false)
    }
  }

  // ✅ Payment handlers
  const handlePaymentSuccess = () => {
    setShowPayment(false)
    fetchEvent()
    toast.success('Payment successful! Booking confirmed! 🎉')
  }

  const handlePaymentFailure = () => {
    toast.error('Payment failed. Please try again.')
  }

  const handlePaymentClose = () => {
    setShowPayment(false)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: `Check out this event: ${event.title}`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  const handleWishlist = () => {
    if (!user) {
      toast.error('Please login to save events')
      return
    }
    setIsWishlisted(!isWishlisted)
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }

  const renderRating = (rating) => {
    if (!rating) return null
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= rating ? 
          <FaStar key={i} className="text-yellow-400" /> :
          <FaRegStar key={i} className="text-yellow-400" />
      )
    }
    return stars
  }

  if (loading) {
    return <LoadingSpinner size="lg" />
  }

  if (!event) {
    return (
      <EmptyState
        icon="❌"
        title="Event Not Found"
        description="The event you're looking for doesn't exist or has been removed."
        actionText="Browse Events"
        actionLink="/events"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors"
      >
        <FaArrowLeft />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
          >
            <div className="relative h-80 overflow-hidden">
              <img
                src={event.banner_url || event.image_url || `https://picsum.photos/seed/${event.id}/1200/400`}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-primary-500 rounded-full text-sm">
                    {event.category?.name}
                  </span>
                  <span className="px-3 py-1 bg-green-500 rounded-full text-sm">
                    {event.event_type === 'online' ? 'Online' : 'Offline'}
                  </span>
                  <span className="px-3 py-1 bg-yellow-500 rounded-full text-sm">
                    {event.status}
                  </span>
                </div>
                <h1 className="text-3xl font-bold">{event.title}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-white/90">
                  <span className="flex items-center gap-1">
                    <FaCalendar />
                    {event.date ? format(new Date(event.date), 'MMMM d, yyyy') : 'TBD'}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaClock />
                    {event.time || 'TBD'}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaMapMarkerAlt />
                    {event.venue}, {event.city}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="border-b dark:border-gray-700">
              <div className="flex overflow-x-auto">
                {['details', 'schedule', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab
                        ? 'text-primary-500 border-b-2 border-primary-500'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">About This Event</h3>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {event.description}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t dark:border-gray-700">
                    <div>
                      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Organizer</h4>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <p className="flex items-center gap-2">
                          <FaUser className="text-primary-500" />
                          {event.organizers?.[0]?.username || 'N/A'}
                        </p>
                        <p className="flex items-center gap-2">
                          <FaEnvelope className="text-primary-500" />
                          {event.contact_email || 'N/A'}
                        </p>
                        <p className="flex items-center gap-2">
                          <FaPhone className="text-primary-500" />
                          {event.contact_phone || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Event Details</h4>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <p><strong>Duration:</strong> {event.duration || 'N/A'}</p>
                        <p><strong>Total Seats:</strong> {event.total_seats}</p>
                        <p><strong>Available:</strong> {event.available_seats}</p>
                        {event.registration_deadline && (
                          <p><strong>Register by:</strong> {format(new Date(event.registration_deadline), 'MMMM d, yyyy')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'schedule' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Event Schedule</h3>
                  {event.schedule && event.schedule.length > 0 ? (
                    <div className="space-y-3">
                      {event.schedule.map((item, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="w-16 text-sm font-medium text-primary-500">
                            {item.time || `Day ${index + 1}`}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800 dark:text-white">{item.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No schedule available</p>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Reviews</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex text-yellow-400">
                        {renderRating(event.average_rating || 0)}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({event.reviews_count || 0} reviews)
                      </span>
                    </div>
                  </div>

                  {reviews.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No reviews yet. Be the first to review!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <img
                                src={review.user?.profile_image || `https://ui-avatars.com/api/?name=${review.user?.username}`}
                                alt={review.user?.username}
                                className="w-8 h-8 rounded-full"
                              />
                              <span className="font-medium text-gray-800 dark:text-white">
                                {review.user?.username || 'Anonymous'}
                              </span>
                            </div>
                            <div className="flex text-yellow-400">
                              {renderRating(review.rating)}
                            </div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">{review.review}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {review.created_at ? format(new Date(review.created_at), 'MMM d, yyyy') : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Booking */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-24"
          >
            <div className="text-center mb-4">
              <span className="text-3xl font-bold text-primary-500">
                {event.price === 0 ? 'Free' : `$${event.price.toFixed(2)}`}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 block">
                per ticket
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Available Seats</span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {event.available_seats || 0}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(event.available_seats || 1, quantity + 1))}
                    className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    disabled={quantity >= (event.available_seats || 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex justify-between py-2 border-t dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Total</span>
                <span className="font-bold text-gray-800 dark:text-white">
                  ${(event.price * quantity).toFixed(2)}
                </span>
              </div>

              {booking ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <FaCheckCircle className="text-green-500 text-2xl mx-auto mb-2" />
                  <p className="text-green-600 dark:text-green-400 font-medium">Booking Confirmed!</p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Reference: {booking.booking_reference}
                  </p>
                  <Link
                    to={`/bookings/${booking.id}`}
                    className="mt-2 inline-block px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
                  >
                    View Booking
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleBooking}
                  disabled={bookingLoading || event.available_seats === 0}
                  className="w-full py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bookingLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Booking...
                    </div>
                  ) : event.available_seats === 0 ? (
                    'Sold Out'
                  ) : (
                    'Book Now'
                  )}
                </button>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleShare}
                  className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FaShare />
                  Share
                </button>
                <button
                  onClick={handleWishlist}
                  className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  {isWishlisted ? (
                    <>
                      <FaHeart className="text-red-500" />
                      Wishlisted
                    </>
                  ) : (
                    <>
                      <FaRegHeart />
                      Save
                    </>
                  )}
                </button>
              </div>

              {event.event_link && event.event_type === 'online' && (
                <a
                  href={event.event_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-primary-500 hover:text-primary-600 transition-colors text-sm"
                >
                  <FaExternalLinkAlt />
                  Join Event Online
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ✅ Razorpay Payment Modal */}
      {showPayment && bookingData && (
        <RazorpayPayment
          bookingId={bookingData.id}
          amount={bookingData.total_amount}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
          onClose={handlePaymentClose}
        />
      )}
    </div>
  )
}

export default EventDetail