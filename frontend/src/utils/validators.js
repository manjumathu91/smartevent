/**
 * Validation utilities for forms and data
 */

// ==================== EMAIL VALIDATION ====================

export const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

// ==================== PASSWORD VALIDATION ====================

export const validatePassword = (password) => {
  const errors = []
  const strength = {
    score: 0,
    level: 'weak',
    message: ''
  }

  if (!password || password.length === 0) {
    errors.push('Password is required')
    return { valid: false, errors, strength }
  }

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  } else {
    strength.score += 1
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  } else {
    strength.score += 1
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else {
    strength.score += 1
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  } else {
    strength.score += 1
  }

  // Special character check
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  } else {
    strength.score += 1
  }

  // Determine strength level
  if (strength.score >= 5) {
    strength.level = 'excellent'
    strength.message = 'Strong password'
  } else if (strength.score >= 4) {
    strength.level = 'good'
    strength.message = 'Good password'
  } else if (strength.score >= 3) {
    strength.level = 'fair'
    strength.message = 'Fair password'
  } else if (strength.score >= 1) {
    strength.level = 'weak'
    strength.message = 'Weak password'
  } else {
    strength.level = 'very-weak'
    strength.message = 'Very weak password'
  }

  return {
    valid: errors.length === 0,
    errors,
    strength
  }
}

// ==================== USERNAME VALIDATION ====================

export const isValidUsername = (username) => {
  if (!username || username.length === 0) {
    return { valid: false, error: 'Username is required' }
  }

  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' }
  }

  if (username.length > 30) {
    return { valid: false, error: 'Username must be at most 30 characters' }
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, dots, underscores, and hyphens' }
  }

  return { valid: true }
}

// ==================== PHONE VALIDATION ====================

export const isValidPhone = (phone) => {
  if (!phone) return { valid: true } // Phone is optional

  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '')
  
  if (!/^\+?[0-9]{10,15}$/.test(cleaned)) {
    return { valid: false, error: 'Invalid phone number format' }
  }

  return { valid: true }
}

// ==================== URL VALIDATION ====================

export const isValidUrl = (url) => {
  if (!url) return { valid: true }

  try {
    const parsed = new URL(url)
    return { valid: parsed.protocol === 'http:' || parsed.protocol === 'https:' }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
}

// ==================== DATE VALIDATION ====================

export const isValidDate = (dateString) => {
  if (!dateString) return { valid: false, error: 'Date is required' }

  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format' }
  }

  return { valid: true, date }
}

export const isFutureDate = (dateString) => {
  const result = isValidDate(dateString)
  if (!result.valid) return result

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  
  if (result.date < now) {
    return { valid: false, error: 'Date must be in the future' }
  }

  return { valid: true, date: result.date }
}

export const isPastDate = (dateString) => {
  const result = isValidDate(dateString)
  if (!result.valid) return result

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  
  if (result.date > now) {
    return { valid: false, error: 'Date must be in the past' }
  }

  return { valid: true, date: result.date }
}

// ==================== NUMBER VALIDATION ====================

export const isValidNumber = (value, options = {}) => {
  const { min, max, required = true, fieldName = 'Value' } = options

  if (required && (value === undefined || value === null || value === '')) {
    return { valid: false, error: `${fieldName} is required` }
  }

  const num = Number(value)
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a number` }
  }

  if (min !== undefined && num < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` }
  }

  if (max !== undefined && num > max) {
    return { valid: false, error: `${fieldName} must be at most ${max}` }
  }

  return { valid: true, value: num }
}

// ==================== RATING VALIDATION ====================

export const isValidRating = (rating) => {
  const result = isValidNumber(rating, { min: 1, max: 5, fieldName: 'Rating' })
  if (!result.valid) return result
  return { valid: true, value: Math.round(result.value) }
}

// ==================== SEAT VALIDATION ====================

export const isValidSeats = (seats, maxSeats = 10000) => {
  const result = isValidNumber(seats, { min: 1, max: maxSeats, fieldName: 'Seats' })
  if (!result.valid) return result
  return { valid: true, value: Math.floor(result.value) }
}

// ==================== PRICE VALIDATION ====================

export const isValidPrice = (price) => {
  const result = isValidNumber(price, { min: 0, fieldName: 'Price' })
  if (!result.valid) return result
  return { valid: true, value: Math.round(result.value * 100) / 100 }
}

// ==================== ZIP CODE VALIDATION ====================

export const isValidZipCode = (zipCode) => {
  if (!zipCode) return { valid: true }
  const cleaned = zipCode.replace(/\s/g, '')
  if (!/^[0-9]{5}(-[0-9]{4})?$/.test(cleaned)) {
    return { valid: false, error: 'Invalid zip code format' }
  }
  return { valid: true }
}

// ==================== NAME VALIDATION ====================

export const isValidName = (name, fieldName = 'Name') => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: `${fieldName} is required` }
  }

  if (name.trim().length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters` }
  }

  if (name.trim().length > 100) {
    return { valid: false, error: `${fieldName} must be at most 100 characters` }
  }

  if (!/^[a-zA-Z\s\-']+$/.test(name.trim())) {
    return { valid: false, error: `${fieldName} contains invalid characters` }
  }

  return { valid: true, value: name.trim() }
}

// ==================== DESCRIPTION VALIDATION ====================

export const isValidDescription = (description, options = {}) => {
  const { min = 10, max = 5000, required = true, fieldName = 'Description' } = options

  if (required && (!description || description.trim().length === 0)) {
    return { valid: false, error: `${fieldName} is required` }
  }

  if (description && description.trim().length < min) {
    return { valid: false, error: `${fieldName} must be at least ${min} characters` }
  }

  if (description && description.trim().length > max) {
    return { valid: false, error: `${fieldName} must be at most ${max} characters` }
  }

  return { valid: true, value: description ? description.trim() : '' }
}

// ==================== FORM VALIDATION ====================

export const validateForm = (data, rules) => {
  const errors = {}
  let isValid = true

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field]
    const result = rule(value)
    if (!result.valid) {
      errors[field] = result.error
      isValid = false
    }
  }

  return { isValid, errors }
}

// ==================== REGISTRATION VALIDATION ====================

export const validateRegistration = (data) => {
  const errors = {}

  // Username
  const usernameResult = isValidUsername(data.username)
  if (!usernameResult.valid) {
    errors.username = usernameResult.error
  }

  // Email
  if (!data.email) {
    errors.email = 'Email is required'
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address'
  }

  // Password
  const passwordResult = validatePassword(data.password)
  if (!passwordResult.valid) {
    errors.password = passwordResult.errors[0]
  }

  // Confirm Password
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }

  // Phone (optional)
  if (data.phone) {
    const phoneResult = isValidPhone(data.phone)
    if (!phoneResult.valid) {
      errors.phone = phoneResult.error
    }
  }

  // Terms
  if (!data.agreeTerms) {
    errors.agreeTerms = 'You must agree to the terms and conditions'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// ==================== EVENT VALIDATION ====================

export const validateEvent = (data) => {
  const errors = {}

  // Title
  if (!data.title || data.title.trim().length === 0) {
    errors.title = 'Event title is required'
  } else if (data.title.trim().length < 3) {
    errors.title = 'Event title must be at least 3 characters'
  } else if (data.title.trim().length > 200) {
    errors.title = 'Event title must be at most 200 characters'
  }

  // Description
  if (!data.description || data.description.trim().length === 0) {
    errors.description = 'Event description is required'
  } else if (data.description.trim().length < 20) {
    errors.description = 'Event description must be at least 20 characters'
  } else if (data.description.trim().length > 5000) {
    errors.description = 'Event description must be at most 5000 characters'
  }

  // Category
  if (!data.category_id) {
    errors.category_id = 'Please select a category'
  }

  // Venue
  if (!data.venue || data.venue.trim().length === 0) {
    errors.venue = 'Venue is required'
  }

  // City
  if (!data.city || data.city.trim().length === 0) {
    errors.city = 'City is required'
  }

  // Date
  if (!data.date) {
    errors.date = 'Event date is required'
  } else {
    const dateResult = isFutureDate(data.date)
    if (!dateResult.valid) {
      errors.date = dateResult.error
    }
  }

  // Total Seats
  if (!data.total_seats) {
    errors.total_seats = 'Total seats is required'
  } else {
    const seatsResult = isValidSeats(data.total_seats)
    if (!seatsResult.valid) {
      errors.total_seats = seatsResult.error
    }
  }

  // Price
  if (data.price !== undefined && data.price !== null) {
    const priceResult = isValidPrice(data.price)
    if (!priceResult.valid) {
      errors.price = priceResult.error
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// ==================== BOOKING VALIDATION ====================

export const validateBooking = (data) => {
  const errors = {}

  if (!data.event_id) {
    errors.event_id = 'Event ID is required'
  }

  if (!data.quantity) {
    errors.quantity = 'Quantity is required'
  } else {
    const quantityResult = isValidNumber(data.quantity, { min: 1, max: 10, fieldName: 'Quantity' })
    if (!quantityResult.valid) {
      errors.quantity = quantityResult.error
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// ==================== REVIEW VALIDATION ====================

export const validateReview = (data) => {
  const errors = {}

  if (!data.rating) {
    errors.rating = 'Rating is required'
  } else {
    const ratingResult = isValidRating(data.rating)
    if (!ratingResult.valid) {
      errors.rating = ratingResult.error
    }
  }

  if (data.review && data.review.trim().length > 2000) {
    errors.review = 'Review must be at most 2000 characters'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// ==================== EXPORT ALL ====================

export default {
  isValidEmail,
  validatePassword,
  isValidUsername,
  isValidPhone,
  isValidUrl,
  isValidDate,
  isFutureDate,
  isPastDate,
  isValidNumber,
  isValidRating,
  isValidSeats,
  isValidPrice,
  isValidZipCode,
  isValidName,
  isValidDescription,
  validateForm,
  validateRegistration,
  validateEvent,
  validateBooking,
  validateReview
}