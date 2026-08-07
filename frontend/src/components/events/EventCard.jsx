import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaMapMarkerAlt, FaCalendar, FaHeart, FaRegHeart, FaStar, FaStarHalfAlt, FaRegStar, FaUsers } from 'react-icons/fa'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const EventCard = ({ event, featured = false }) => {
  const { user } = useAuth()
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD'
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch {
      return 'TBD'
    }
  }

  const renderRating = (rating) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={`full-${i}`} className="text-yellow-400 text-xs" />
        ))}
        {hasHalfStar && <FaStarHalfAlt className="text-yellow-400 text-xs" />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaRegStar key={`empty-${i}`} className="text-gray-300 dark:text-gray-600 text-xs" />
        ))}
        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
          ({event.reviews_count || 0})
        </span>
      </div>
    )
  }

  const handleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      toast.error('Please login to save events')
      return
    }
    setIsWishlisted(!isWishlisted)
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
    >
      <Link to={`/events/${event.id}`}>
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
          <img
            src={event.image_url || `https://picsum.photos/seed/${event.id}/400/300`}
            alt={event.title}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {event.event_type === 'online' && (
              <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                Online
              </span>
            )}
            {featured && (
              <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full">
                Featured
              </span>
            )}
            {event.is_popular && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                Popular
              </span>
            )}
          </div>

          {/* Price */}
          <div className="absolute bottom-3 right-3">
            <span className="px-3 py-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg font-bold text-primary-600 dark:text-primary-400 shadow-lg">
              {event.price === 0 ? 'Free' : `$${event.price.toFixed(2)}`}
            </span>
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform"
          >
            {isWishlisted ? (
              <FaHeart className="text-red-500 text-lg" />
            ) : (
              <FaRegHeart className="text-gray-600 dark:text-gray-300 text-lg" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 line-clamp-1 group-hover:text-primary-500 transition-colors">
            {event.title}
          </h3>

          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
              {event.category?.name || 'Uncategorized'}
            </span>
          </div>

          <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-primary-500 flex-shrink-0" />
              <span className="truncate">{event.venue}, {event.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCalendar className="text-primary-500 flex-shrink-0" />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaUsers className="text-primary-500 flex-shrink-0" />
              <span>{event.available_seats || 0} seats left</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              {renderRating(event.average_rating || 0)}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
            >
              View Details
            </motion.button>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default EventCard