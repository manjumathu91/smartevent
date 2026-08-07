
// frontend/src/pages/Categories.jsx
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaSearch, FaArrowRight, FaCalendar, FaUsers,
  FaTicketAlt, FaMapMarkerAlt, FaStar, FaClock,
  FaLaptop, FaMusic, FaPaintBrush, FaBriefcase,
  FaHeart, FaUtensils, FaRunning, FaFilm,
  FaBook, FaGraduationCap, FaHandshake, FaMicrophone,
  FaTheaterMasks, FaCamera, FaPaw, FaTree,
  FaWineGlass, FaGuitar, FaPalette, FaCode,
  FaVideo, FaGlobe, FaBuilding, FaRocket,
  FaChalkboardTeacher, FaUserGraduate
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import Breadcrumb from '../components/common/Breadcrumb'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import toast from 'react-hot-toast'
import axios from '../api/axios'

const Categories = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [eventCounts, setEventCounts] = useState({})

  // ✅ Category data with icons (Fallback if API fails)
  const categoryData = [
    {
      id: 1,
      name: 'Conference',
      slug: 'conference',
      icon: FaUsers,
      color: '#6366f1',
      description: 'Professional conferences, summits, and business events',
      popular: true,
      count: 0
    },
    {
      id: 2,
      name: 'Workshop',
      slug: 'workshop',
      icon: FaLaptop,
      color: '#8b5cf6',
      description: 'Hands-on workshops, training sessions, and masterclasses',
      popular: true,
      count: 0
    },
    {
      id: 3,
      name: 'Networking',
      slug: 'networking',
      icon: FaHandshake,
      color: '#3b82f6',
      description: 'Networking events, meetups, and social gatherings',
      popular: true,
      count: 0
    },
    {
      id: 4,
      name: 'Tech Talk',
      slug: 'tech-talk',
      icon: FaMicrophone,
      color: '#10b981',
      description: 'Tech talks, presentations, and knowledge sharing sessions',
      popular: true,
      count: 0
    },
    {
      id: 5,
      name: 'Social',
      slug: 'social',
      icon: FaHeart,
      color: '#f59e0b',
      description: 'Social events, parties, and community gatherings',
      popular: false,
      count: 0
    },
    {
      id: 6,
      name: 'Art & Culture',
      slug: 'art-culture',
      icon: FaPalette,
      color: '#ef4444',
      description: 'Art exhibitions, cultural events, and creative workshops',
      popular: true,
      count: 0
    },
    {
      id: 7,
      name: 'Health & Wellness',
      slug: 'health-wellness',
      icon: FaHeart,
      color: '#34d399',
      description: 'Health workshops, yoga sessions, and wellness retreats',
      popular: false,
      count: 0
    },
    {
      id: 8,
      name: 'Business',
      slug: 'business',
      icon: FaBriefcase,
      color: '#6b7280',
      description: 'Business events, seminars, and entrepreneurial workshops',
      popular: true,
      count: 0
    },
    {
      id: 9,
      name: 'Music',
      slug: 'music',
      icon: FaMusic,
      color: '#ec4899',
      description: 'Concerts, music festivals, and live performances',
      popular: true,
      count: 0
    },
    {
      id: 10,
      name: 'Food & Drink',
      slug: 'food-drink',
      icon: FaUtensils,
      color: '#f97316',
      description: 'Food festivals, wine tastings, and culinary events',
      popular: false,
      count: 0
    },
    {
      id: 11,
      name: 'Sports',
      slug: 'sports',
      icon: FaRunning,
      color: '#22d3ee',
      description: 'Sports events, tournaments, and fitness activities',
      popular: false,
      count: 0
    },
    {
      id: 12,
      name: 'Film & Media',
      slug: 'film-media',
      icon: FaFilm,
      color: '#8b5cf6',
      description: 'Film screenings, media events, and industry meetups',
      popular: false,
      count: 0
    },
    {
      id: 13,
      name: 'Education',
      slug: 'education',
      icon: FaBook,
      color: '#f472b6',
      description: 'Educational seminars, training, and learning events',
      popular: false,
      count: 0
    },
    {
      id: 14,
      name: 'Entrepreneurship',
      slug: 'entrepreneurship',
      icon: FaRocket,
      color: '#f59e0b',
      description: 'Startup events, pitch competitions, and entrepreneurial networking',
      popular: false,
      count: 0
    },
    {
      id: 15,
      name: 'Charity',
      slug: 'charity',
      icon: FaHeart,
      color: '#ef4444',
      description: 'Charity events, fundraisers, and community service events',
      popular: false,
      count: 0
    },
    {
      id: 16,
      name: 'Outdoor',
      slug: 'outdoor',
      icon: FaTree,
      color: '#34d399',
      description: 'Outdoor events, nature activities, and adventure experiences',
      popular: false,
      count: 0
    },
    {
      id: 17,
      name: 'Theater',
      slug: 'theater',
      icon: FaTheaterMasks,
      color: '#a78bfa',
      description: 'Theater performances, plays, and drama events',
      popular: false,
      count: 0
    },
    {
      id: 18,
      name: 'Photography',
      slug: 'photography',
      icon: FaCamera,
      color: '#60a5fa',
      description: 'Photography workshops, exhibitions, and photo walks',
      popular: false,
      count: 0
    }
  ]

  useEffect(() => {
    fetchCategoriesAndCounts()
  }, [])

  // ✅ Fetch categories and their event counts
  const fetchCategoriesAndCounts = async () => {
    setLoading(true)
    try {
      // Try to fetch categories from API
      const response = await axios.get('/events/categories/')
      
      if (response.data && response.data.categories) {
        // Map API categories with icons
        const apiCategories = response.data.categories.map(cat => {
          const defaultCat = categoryData.find(d => d.slug === cat.slug)
          return {
            ...cat,
            icon: defaultCat ? defaultCat.icon : FaCalendar,
            color: defaultCat ? defaultCat.color : '#6366f1',
            description: cat.description || (defaultCat ? defaultCat.description : ''),
            popular: cat.popular || (defaultCat ? defaultCat.popular : false),
            count: cat.event_count || 0
          }
        })
        setCategories(apiCategories)
        
        // Update counts
        const counts = {}
        apiCategories.forEach(cat => {
          counts[cat.id] = cat.count || 0
        })
        setEventCounts(counts)
      } else {
        // ✅ Fallback to default categories
        setCategories(categoryData)
        // Fetch real counts for each category
        await fetchCategoryCounts(categoryData)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      // ✅ Fallback to default categories
      setCategories(categoryData)
      // Fetch real counts for each category
      await fetchCategoryCounts(categoryData)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Fetch real event counts for each category
  const fetchCategoryCounts = async (categories) => {
    const counts = {}
    for (const cat of categories) {
      try {
        // Check if category has events
        const response = await axios.get('/events/', {
          params: {
            category: cat.slug,
            per_page: 1,
            status: 'approved'
          }
        })
        counts[cat.id] = response.data.total || 0
      } catch {
        counts[cat.id] = 0
      }
    }
    setEventCounts(counts)
  }

  // ✅ Handle category click - Navigate to events page with category filter
  const handleCategoryClick = (category) => {
    // Your Events.jsx expects 'category' parameter with slug
    navigate(`/events?category=${category.slug}`)
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Get category stats
  const totalEvents = Object.values(eventCounts).reduce((sum, count) => sum + count, 0)
  const popularCategories = categories.filter(cat => cat.popular)

  if (loading) {
    return <LoadingSpinner size="lg" />
  }

  return (
    <div className="space-y-8">
      <Breadcrumb />

      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
          Explore Categories 📂
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Discover events by category and find what interests you most.
        </p>
      </motion.section>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-md"
        >
          <div className="text-2xl font-bold text-primary-500">{categories.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Categories</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-md"
        >
          <div className="text-2xl font-bold text-primary-500">{totalEvents}+</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Events</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-md"
        >
          <div className="text-2xl font-bold text-primary-500">{popularCategories.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Popular Categories</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-md"
        >
          <div className="text-2xl font-bold text-primary-500">⭐ 4.8</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Average Rating</div>
        </motion.div>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-md"
      >
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </motion.div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No Categories Found"
          description="No categories match your search criteria."
          actionText="Clear Search"
          onAction={() => setSearchTerm('')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((category, index) => {
            const IconComponent = category.icon || FaCalendar
            const eventCount = eventCounts[category.id] || 0
            
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden group cursor-pointer"
                onClick={() => handleCategoryClick(category)}
              >
                <div className="p-6">
                  {/* Icon */}
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 text-white"
                    style={{ backgroundColor: category.color || '#6366f1' }}
                  >
                    <IconComponent className="text-2xl" />
                  </div>
                  
                  {/* Info */}
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-primary-500 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {category.description || `Explore ${category.name} events`}
                  </p>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {eventCount} events
                    </span>
                    {category.popular && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-full">
                        Popular
                      </span>
                    )}
                    <FaArrowRight className="text-gray-400 group-hover:text-primary-500 transition-colors" />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Popular Categories Highlight */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 md:p-12 text-white"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
          ⭐ Popular Categories
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {popularCategories.slice(0, 4).map((category) => {
            const IconComponent = category.icon || FaCalendar
            const eventCount = eventCounts[category.id] || 0
            return (
              <div 
                key={category.id} 
                className="text-center cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleCategoryClick(category)}
              >
                <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                  <IconComponent className="text-3xl mx-auto mb-2" />
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-white/80">{eventCount} events</p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="text-center mt-6">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-500 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Browse All Events
            <FaArrowRight />
          </Link>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-md"
      >
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Can't Find What You're Looking For?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          We're always adding new categories. Check back soon!
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/events"
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Browse Events
          </Link>
          <Link
            to="/contact"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Suggest a Category
          </Link>
        </div>
      </motion.section>
    </div>
  )
}

export default Categories