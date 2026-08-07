// frontend/src/pages/Blog.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaCalendar, FaUser, FaTag, FaSearch, FaClock,
  FaArrowRight, FaComments, FaShare, FaHeart,
  FaRegHeart, FaEye
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import Breadcrumb from '../components/common/Breadcrumb'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import toast from 'react-hot-toast'
import axios from '../api/axios'

const Blog = () => {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [likedPosts, setLikedPosts] = useState({})

  // Sample blog data (replace with API data later)
  const blogPosts = [
    {
      id: 1,
      title: '10 Tips for Hosting a Successful Virtual Event',
      excerpt: 'Learn the best practices for organizing and hosting virtual events that engage your audience.',
      category: 'Event Tips',
      author: 'Sarah Johnson',
      authorImage: 'https://ui-avatars.com/api/?name=Sarah+Johnson&size=40',
      date: '2024-12-15',
      readTime: '5 min read',
      image: 'https://picsum.photos/seed/virtual/800/400',
      likes: 45,
      comments: 12,
      views: 230
    },
    {
      id: 2,
      title: 'The Future of Event Technology: 2025 Trends',
      excerpt: 'Explore the latest trends and technologies shaping the event industry in 2025.',
      category: 'Technology',
      author: 'Mike Chen',
      authorImage: 'https://ui-avatars.com/api/?name=Mike+Chen&size=40',
      date: '2024-12-10',
      readTime: '7 min read',
      image: 'https://picsum.photos/seed/technology/800/400',
      likes: 78,
      comments: 23,
      views: 450
    },
    {
      id: 3,
      title: 'How to Network Effectively at Conferences',
      excerpt: 'Master the art of networking at conferences and events with these proven strategies.',
      category: 'Networking',
      author: 'Emily Rodriguez',
      authorImage: 'https://ui-avatars.com/api/?name=Emily+Rodriguez&size=40',
      date: '2024-12-05',
      readTime: '6 min read',
      image: 'https://picsum.photos/seed/networking/800/400',
      likes: 34,
      comments: 8,
      views: 180
    },
    {
      id: 4,
      title: 'Event Marketing Strategies That Drive Ticket Sales',
      excerpt: 'Discover effective marketing strategies to boost ticket sales for your events.',
      category: 'Marketing',
      author: 'David Park',
      authorImage: 'https://ui-avatars.com/api/?name=David+Park&size=40',
      date: '2024-11-28',
      readTime: '8 min read',
      image: 'https://picsum.photos/seed/marketing/800/400',
      likes: 56,
      comments: 15,
      views: 320
    },
    {
      id: 5,
      title: 'Creating Memorable Event Experiences',
      excerpt: 'Learn how to create unforgettable experiences that keep attendees coming back.',
      category: 'Event Planning',
      author: 'Lisa Thompson',
      authorImage: 'https://ui-avatars.com/api/?name=Lisa+Thompson&size=40',
      date: '2024-11-20',
      readTime: '4 min read',
      image: 'https://picsum.photos/seed/experience/800/400',
      likes: 67,
      comments: 19,
      views: 290
    },
    {
      id: 6,
      title: 'Sustainable Event Planning Guide',
      excerpt: 'Learn how to plan eco-friendly events that reduce environmental impact.',
      category: 'Sustainability',
      author: 'Alex Green',
      authorImage: 'https://ui-avatars.com/api/?name=Alex+Green&size=40',
      date: '2024-11-15',
      readTime: '6 min read',
      image: 'https://picsum.photos/seed/sustainable/800/400',
      likes: 42,
      comments: 11,
      views: 210
    }
  ]

  const categories = ['All', 'Event Tips', 'Technology', 'Networking', 'Marketing', 'Event Planning', 'Sustainability']

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPosts(blogPosts)
      setLoading(false)
    }, 1000)
  }, [])

  const handleLike = (postId) => {
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
    // Update likes count
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, likes: post.likes + (likedPosts[postId] ? -1 : 1) }
        : post
    ))
    toast.success(likedPosts[postId] ? 'Unliked post' : 'Liked post! ❤️')
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory
    return matchesSearch && matchesCategory
  })

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
          Our Blog 📝
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Insights, tips, and stories from the EventHub community.
        </p>
      </motion.section>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      {filteredPosts.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No Articles Found"
          description="No blog posts match your search criteria."
          actionText="Clear Search"
          onAction={() => {
            setSearchTerm('')
            setSelectedCategory('All')
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden group"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-primary-500 text-white text-xs font-medium rounded-full">
                    {post.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <FaCalendar className="text-primary-500" size={12} />
                    {new Date(post.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaClock className="text-primary-500" size={12} />
                    {post.readTime}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2 hover:text-primary-500 transition-colors">
                  <Link to={`/blog/${post.id}`}>{post.title}</Link>
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {post.excerpt}
                </p>

                {/* Author */}
                <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <img
                      src={post.authorImage}
                      alt={post.author}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {post.author}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1 hover:text-primary-500 transition-colors"
                    >
                      {likedPosts[post.id] ? (
                        <FaHeart className="text-red-500" />
                      ) : (
                        <FaRegHeart />
                      )}
                      <span>{post.likes}</span>
                    </button>
                    <span className="flex items-center gap-1">
                      <FaComments />
                      <span>{post.comments}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <FaEye />
                      <span>{post.views}</span>
                    </span>
                  </div>
                </div>

                {/* Read More */}
                <Link
                  to={`/blog/${post.id}`}
                  className="inline-flex items-center gap-1 text-primary-500 hover:text-primary-600 font-medium text-sm mt-3 group-hover:gap-2 transition-all"
                >
                  Read More
                  <FaArrowRight size={12} />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      {/* Newsletter Section */}
      <section className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 md:p-12 text-white text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          📬 Subscribe to Our Newsletter
        </h2>
        <p className="text-white/90 text-lg mb-6 max-w-2xl mx-auto">
          Get the latest blog posts and event updates delivered to your inbox.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-2 rounded-lg text-gray-800 focus:outline-none"
          />
          <button className="px-6 py-2 bg-white text-primary-500 rounded-lg hover:bg-gray-100 transition-colors font-medium">
            Subscribe
          </button>
        </div>
      </section>
    </div>
  )
}

export default Blog