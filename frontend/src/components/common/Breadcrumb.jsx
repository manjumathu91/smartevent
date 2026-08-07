import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FaHome, FaChevronRight } from 'react-icons/fa'
import { motion } from 'framer-motion'

const Breadcrumb = () => {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  const getLabel = (path) => {
    const labels = {
      '': 'Home',
      'events': 'Events',
      'dashboard': 'Dashboard',
      'profile': 'Profile',
      'bookings': 'Bookings',
      'admin': 'Admin',
      'users': 'Users',
      'categories': 'Categories',
      'login': 'Login',
      'register': 'Register',
    }
    return labels[path] || path.charAt(0).toUpperCase() + path.slice(1)
  }

  if (pathnames.length === 0) return null

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-6 overflow-x-auto"
    >
      <Link
        to="/"
        className="flex items-center hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
      >
        <FaHome className="text-lg" />
      </Link>

      {pathnames.map((path, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1

        return (
          <React.Fragment key={path}>
            <FaChevronRight className="text-xs mx-1 text-gray-400" />
            {isLast ? (
              <span className="text-gray-800 dark:text-white font-medium">
                {getLabel(path)}
              </span>
            ) : (
              <Link
                to={routeTo}
                className="hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
              >
                {getLabel(path)}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </motion.nav>
  )
}

export default Breadcrumb