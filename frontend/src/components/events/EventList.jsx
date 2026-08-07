import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import EventCard from './EventCard'
import EventFilters from './EventFilters'
import EventSearch from './EventSearch'
import EventCategories from './EventCategories'
import LoadingSpinner from '../common/LoadingSpinner'
import EmptyState from '../common/EmptyState'
import Pagination from '../common/Pagination'
import { motion, AnimatePresence } from 'framer-motion'
import { FaTh, FaList, FaSlidersH } from 'react-icons/fa'
import axios from '../../api/axios'
import toast from 'react-hot-toast'

const EventList = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    per_page: 12
  })

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || '',
    event_type: searchParams.get('event_type') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    sort_by: searchParams.get('sort_by') || 'date',
    sort_order: searchParams.get('sort_order') || 'asc'
  })

  useEffect(() => {
    fetchEvents()
    fetchCategories()
  }, [filters])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const params = {
        ...filters,
        page: searchParams.get('page') || 1,
        per_page: 12
      }
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key]
        }
      })

      const response = await axios.get('/events', { params })
      setEvents(response.data.events || [])
      setPagination({
        total: response.data.total || 0,
        page: response.data.page || 1,
        pages: response.data.pages || 1,
        per_page: response.data.per_page || 12
      })
    } catch (error) {
      toast.error('Failed to load events')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/events/categories')
      setCategories(response.data.categories || [])
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setSearchParams({ ...searchParams, [key]: value, page: 1 })
  }

  const handleSearch = (searchTerm) => {
    handleFilterChange('search', searchTerm)
  }

  const handlePageChange = (page) => {
    setSearchParams({ ...searchParams, page })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      city: '',
      event_type: '',
      min_price: '',
      max_price: '',
      sort_by: 'date',
      sort_order: 'asc'
    })
    setSearchParams({})
  }

  if (loading) {
    return <LoadingSpinner size="lg" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            All Events
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {pagination.total} events found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FaSlidersH />
            Filters
          </button>
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-500 text-white'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <FaTh />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-500 text-white'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <FaList />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <EventSearch onSearch={handleSearch} initialValue={filters.search} />

      {/* Categories */}
      <EventCategories 
        categories={categories} 
        selectedCategory={filters.category}
        onSelectCategory={(category) => handleFilterChange('category', category)}
      />

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <EventFilters 
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
              categories={categories}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events Grid */}
      {events.length === 0 ? (
        <EmptyState
          icon="🎫"
          title="No Events Found"
          description="We couldn't find any events matching your criteria. Try adjusting your filters or search terms."
          actionText="Clear Filters"
          onAction={clearFilters}
        />
      ) : (
        <>
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {events.map((event) => (
              <EventCard key={event.id} event={event} featured={event.is_featured} />
            ))}
          </div>

          {pagination.pages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  )
}

export default EventList