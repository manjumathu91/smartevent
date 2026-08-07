import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const EmptyState = ({ 
  icon, 
  title, 
  description, 
  actionText, 
  actionLink, 
  onAction,
  variant = 'default' 
}) => {
  const variants = {
    default: {
      iconColor: 'text-gray-400 dark:text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-800/50',
      borderColor: 'border-gray-200 dark:border-gray-700',
    },
    warning: {
      iconColor: 'text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/10',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
    error: {
      iconColor: 'text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/10',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    success: {
      iconColor: 'text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/10',
      borderColor: 'border-green-200 dark:border-green-800',
    },
  }

  const variantStyles = variants[variant] || variants.default

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center py-12 px-4 rounded-2xl border-2 border-dashed ${variantStyles.borderColor} ${variantStyles.bgColor}`}
    >
      <div className={`text-6xl mb-4 ${variantStyles.iconColor}`}>
        {icon || '📭'}
      </div>
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
        {title || 'Nothing to see here'}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {description || 'There are no items to display at the moment.'}
      </p>
      {(actionText || actionLink || onAction) && (
        <div className="flex flex-wrap justify-center gap-3">
          {actionLink && (
            <Link
              to={actionLink}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              {actionText || 'Go Back'}
            </Link>
          )}
          {onAction && (
            <button
              onClick={onAction}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              {actionText || 'Refresh'}
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default EmptyState