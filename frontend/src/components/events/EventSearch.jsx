import React, { useState, useRef, useEffect } from 'react'
import { FaSearch, FaTimes } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

const EventSearch = ({ onSearch, initialValue = '', suggestions = [] }) => {
  const [query, setQuery] = useState(initialValue)
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(query)
    setShowSuggestions(false)
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
    inputRef.current?.focus()
  }

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion)
    onSearch(suggestion)
    setShowSuggestions(false)
  }

  const defaultSuggestions = [
    'Music Festival', 'Tech Conference', 'Art Exhibition',
    'Business Summit', 'Sports Event', 'Workshop'
  ]

  const displaySuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (e.target.value.length > 0) {
                setShowSuggestions(true)
              } else {
                setShowSuggestions(false)
              }
            }}
            onFocus={() => {
              setIsFocused(true)
              if (query.length > 0) {
                setShowSuggestions(true)
              }
            }}
            onBlur={() => setIsFocused(false)}
            placeholder="Search events by name, venue, city..."
            className="w-full px-12 py-3.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <FaTimes />
            </button>
          )}
        </div>
        
        <button
          type="submit"
          className="absolute right-14 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Suggestions */}
      <AnimatePresence>
        {showSuggestions && query.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 overflow-hidden z-50"
          >
            <div className="py-2">
              <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                Suggestions
              </div>
              {displaySuggestions
                .filter(s => s.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 8)
                .map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <FaSearch className="text-gray-400 text-xs" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {suggestion}
                    </span>
                  </button>
                ))}
              {displaySuggestions.filter(s => s.toLowerCase().includes(query.toLowerCase())).length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  No suggestions found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default EventSearch