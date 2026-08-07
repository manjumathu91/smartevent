import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaCalendarAlt, FaUsers, FaTicketAlt, FaStar, 
  FaChevronRight, FaArrowRight, FaSearch, FaMapMarkerAlt,
  FaClock, FaEnvelope, FaPhone, FaFacebook, FaTwitter,
  FaInstagram, FaLinkedin, FaYoutube, FaQuoteLeft
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import axios from '../api/axios'
import EventCard from '../components/events/EventCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const Home = () => {
  const { user } = useAuth()
  const [featuredEvents, setFeaturedEvents] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [popularEvents, setPopularEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

 
  const fetchEvents = async () => {
  setLoading(true)
  try {
    console.log('🔍 Fetching events from API...')
    
    // Test 1: Check if API is reachable
    const testResponse = await axios.get('/events/', { params: { status: 'approved', per_page: 1 } })
    console.log('✅ API Response Status:', testResponse.status)
    console.log('✅ Total Events:', testResponse.data.total)
    console.log('✅ Events Data:', testResponse.data.events)
    
    // Test 2: Fetch Featured Events
    const featuredRes = await axios.get('/events/', { 
      params: { status: 'approved', is_featured: true, per_page: 6 } 
    })
    console.log('🔥 Featured Events:', featuredRes.data.events)
    
    // Test 3: Fetch Upcoming Events
    const upcomingRes = await axios.get('/events/', { 
      params: { status: 'approved', sort_by: 'date', per_page: 6 } 
    })
    console.log('📅 Upcoming Events:', upcomingRes.data.events)
    
    // Test 4: Fetch Popular Events
    const popularRes = await axios.get('/events/', { 
      params: { status: 'approved', sort_by: 'popularity', per_page: 6 } 
    })
    console.log('⭐ Popular Events:', popularRes.data.events)
    
    // Set states
    setFeaturedEvents(featuredRes.data.events || [])
    setUpcomingEvents(upcomingRes.data.events || [])
    setPopularEvents(popularRes.data.events || [])
    
    // If still no events, show warning
    if (!featuredRes.data.events?.length && !upcomingRes.data.events?.length) {
      console.warn('⚠️ No events found! Check database.')
    }
    
  } catch (error) {
    console.error('❌ Error fetching events:', error)
    console.error('❌ Error details:', error.response?.data || error.message)
    toast.error('Failed to load events')
  } finally {
    setLoading(false)
  }
}

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/events?search=${encodeURIComponent(searchQuery)}`
    }
  }
const handleNewsletter = async (e) => {
  e.preventDefault()
  if (!newsletterEmail) {
    toast.error('Please enter your email')
    return
  }
  setSubscribing(true)
  try {
    await axios.post('/newsletter/subscribe', { email: newsletterEmail })
    toast.success('Subscribed successfully! 🎉')
    setNewsletterEmail('')
  } catch (error) {
    toast.error(error.response?.data?.error || 'Failed to subscribe. Please try again.')
  } finally {
    setSubscribing(false)
  }
}
  

  const stats = [
    { icon: FaCalendarAlt, label: 'Active Events', value: '500+' },
    { icon: FaUsers, label: 'Happy Users', value: '10K+' },
    { icon: FaTicketAlt, label: 'Tickets Sold', value: '50K+' },
    { icon: FaStar, label: '5 Star Reviews', value: '4.8/5' },
  ]

  const testimonials = [
    {
      name: 'John Doe',
      role: 'Event Organizer',
      image: 'https://ui-avatars.com/api/?name=John+Doe&size=60',
      text: 'EventHub made organizing my event so easy! The platform is intuitive and the support team is amazing.'
    },
    {
      name: 'Jane Smith',
      role: 'Attendee',
      image: 'https://ui-avatars.com/api/?name=Jane+Smith&size=60',
      text: 'I love using EventHub to find events. The booking process is seamless and I always get my tickets instantly.'
    },
    {
      name: 'Bob Wilson',
      role: 'Event Organizer',
      image: 'https://ui-avatars.com/api/?name=Bob+Wilson&size=60',
      text: 'The best event management platform I\'ve used. Features are comprehensive and the user experience is top-notch.'
    }
  ]

  if (loading) {
    return <LoadingSpinner size="lg" />
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 md:p-12 text-white overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-4"
          >
            🎉 Discover Amazing Events
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find Your Next <br />Great Experience
          </h1>
          <p className="text-lg md:text-xl mb-6 text-white/90">
            Discover and book tickets for the best events in your city. From concerts to conferences, we've got you covered.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-lg">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-white text-primary-500 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Search
            </button>
          </form>
          
          <div className="flex flex-wrap gap-4 mt-6">
            <Link
              to="/events"
              className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-lg font-semibold hover:bg-white/30 transition-colors inline-flex items-center"
            >
              Explore Events
              <FaChevronRight className="ml-2" />
            </Link>
            {!user && (
              <Link
                to="/register"
                className="px-6 py-3 bg-white text-primary-500 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </motion.section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl text-primary-500 mb-2 flex justify-center">
              <stat.icon />
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              {stat.value}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </section>

      {/* Featured Events */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            🔥 Featured Events
          </h2>
          <Link
            to="/events"
            className="text-primary-500 hover:text-primary-600 font-semibold flex items-center"
          >
            View All
            <FaArrowRight className="ml-1" />
          </Link>
        </div>
        {featuredEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No featured events available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map((event) => (
              <EventCard key={event.id} event={event} featured />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Events */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            📅 Upcoming Events
          </h2>
          <Link
            to="/events?sort=date"
            className="text-primary-500 hover:text-primary-600 font-semibold flex items-center"
          >
            View All
            <FaArrowRight className="ml-1" />
          </Link>
        </div>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No upcoming events available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Popular Events */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            ⭐ Popular Events
          </h2>
          <Link
            to="/events?sort=popularity"
            className="text-primary-500 hover:text-primary-600 font-semibold flex items-center"
          >
            View All
            <FaArrowRight className="ml-1" />
          </Link>
        </div>
        {popularEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No popular events available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 md:p-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            What People Say
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Hear from our happy users
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
            >
              <FaQuoteLeft className="text-3xl text-primary-300 dark:text-primary-700 mb-4" />
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {testimonial.text}
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 md:p-12 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Subscribe to Our Newsletter
          </h2>
          <p className="text-white/90 mb-6">
            Get the latest updates on events, promotions, and more!
          </p>
          <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-white/50"
              required
            />
            <button
              type="submit"
              disabled={subscribing}
              className="px-6 py-3 bg-white text-primary-500 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-70"
            >
              {subscribing ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </section>

      {/* About Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4">
            About EventHub
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            EventHub is the leading platform for discovering and booking events. 
            We connect event organizers with attendees, making it easy to find, 
            book, and manage events of all types.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            With thousands of events and millions of happy users, EventHub is 
            the trusted choice for event management.
          </p>
          <Link
            to="/about"
            className="inline-flex items-center text-primary-500 hover:text-primary-600 font-semibold"
          >
            Learn More
            <FaArrowRight className="ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-bold text-gray-800 dark:text-white">Easy Booking</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Book tickets in seconds</p>
          </div>
          <div className="bg-secondary-50 dark:bg-secondary-900/20 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-bold text-gray-800 dark:text-white">Secure Payments</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">100% secure transactions</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">📱</div>
            <h3 className="font-bold text-gray-800 dark:text-white">Mobile Friendly</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Access anywhere</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">💬</div>
            <h3 className="font-bold text-gray-800 dark:text-white">24/7 Support</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">We're here to help</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home