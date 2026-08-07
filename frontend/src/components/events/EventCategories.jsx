import React from 'react'
import { motion } from 'framer-motion'

const EventCategories = ({ categories, selectedCategory, onSelectCategory }) => {
  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 py-2">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onSelectCategory('')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          !selectedCategory
            ? 'bg-primary-500 text-white shadow-md'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
      >
        All
      </motion.button>
      
      {categories.map((category) => (
        <motion.button
          key={category.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectCategory(category.slug)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
            selectedCategory === category.slug
              ? 'bg-primary-500 text-white shadow-md'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <span>{category.icon}</span>
          {category.name}
          <span className={`text-xs ${
            selectedCategory === category.slug
              ? 'text-white/80'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            ({category.event_count || 0})
          </span>
        </motion.button>
      ))}
    </div>
  )
}

export default EventCategories