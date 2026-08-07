import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaHome, FaArrowLeft } from 'react-icons/fa'

const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="text-8xl font-bold text-primary-500 mb-4">404</div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Page Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
          >
            <FaHome />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <FaArrowLeft />
            Go Back
          </button>
        </div>
        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Here are some useful links:</p>
          <div className="flex flex-wrap gap-4 justify-center mt-2">
            <Link to="/events" className="hover:text-primary-500 transition-colors">Events</Link>
            <Link to="/about" className="hover:text-primary-500 transition-colors">About</Link>
            <Link to="/contact" className="hover:text-primary-500 transition-colors">Contact</Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default NotFound