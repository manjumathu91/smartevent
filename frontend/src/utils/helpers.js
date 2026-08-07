/**
 * Helper utilities for common operations
 */

import { format, formatDistance, parseISO, differenceInDays } from 'date-fns'

// ==================== DATE HELPERS ====================

export const formatDate = (date, formatStr = 'MMM d, yyyy') => {
  if (!date) return 'N/A'
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, formatStr)
  } catch {
    return 'N/A'
  }
}

export const formatDateTime = (date, formatStr = 'MMM d, yyyy h:mm a') => {
  if (!date) return 'N/A'
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, formatStr)
  } catch {
    return 'N/A'
  }
}

export const timeAgo = (date) => {
  if (!date) return 'N/A'
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return formatDistance(dateObj, new Date(), { addSuffix: true })
  } catch {
    return 'N/A'
  }
}

export const daysUntil = (date) => {
  if (!date) return null
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return differenceInDays(dateObj, new Date())
  } catch {
    return null
  }
}

export const isToday = (date) => {
  if (!date) return false
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    const today = new Date()
    return dateObj.getDate() === today.getDate() &&
           dateObj.getMonth() === today.getMonth() &&
           dateObj.getFullYear() === today.getFullYear()
  } catch {
    return false
  }
}

export const isTomorrow = (date) => {
  if (!date) return false
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return dateObj.getDate() === tomorrow.getDate() &&
           dateObj.getMonth() === tomorrow.getMonth() &&
           dateObj.getFullYear() === tomorrow.getFullYear()
  } catch {
    return false
  }
}

// ==================== STRING HELPERS ====================

export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + suffix
}

export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const capitalizeWords = (str) => {
  if (!str) return ''
  return str.split(' ').map(word => capitalize(word)).join(' ')
}

export const slugify = (text) => {
  if (!text) return ''
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const generateSlug = (text, id = null) => {
  let slug = slugify(text)
  if (id) {
    slug = `${slug}-${id}`
  }
  return slug
}

// ==================== RANDOM GENERATORS ====================

export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const generateReference = (prefix = 'REF') => {
  const timestamp = new Date().getTime().toString(36).toUpperCase()
  const random = generateId(4)
  return `${prefix}-${timestamp}-${random}`
}

export const generateOTP = (length = 6) => {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += digits.charAt(Math.floor(Math.random() * digits.length))
  }
  return otp
}

// ==================== COLOR HELPERS ====================

export const getRandomColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#FF8A5C', '#A8E6CF', '#FFD93D', '#6C5CE7',
    '#FD79A8', '#00B894', '#0984E3', '#FDCB6E', '#E17055'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// ==================== ARRAY HELPERS ====================

export const chunkArray = (array, size) => {
  if (!array || !Array.isArray(array)) return []
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export const groupBy = (array, key) => {
  if (!array || !Array.isArray(array)) return {}
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key]
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {})
}

export const sortByKey = (array, key, ascending = true) => {
  if (!array || !Array.isArray(array)) return []
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    if (aVal < bVal) return ascending ? -1 : 1
    if (aVal > bVal) return ascending ? 1 : -1
    return 0
  })
}

export const uniqueArray = (array) => {
  if (!array || !Array.isArray(array)) return []
  return [...new Set(array)]
}

// ==================== OBJECT HELPERS ====================

export const pick = (obj, keys) => {
  if (!obj || !keys) return {}
  return keys.reduce((result, key) => {
    if (obj.hasOwnProperty(key)) {
      result[key] = obj[key]
    }
    return result
  }, {})
}

export const omit = (obj, keys) => {
  if (!obj || !keys) return {}
  const result = { ...obj }
  keys.forEach(key => delete result[key])
  return result
}

export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

// ==================== MONEY HELPERS ====================

export const formatMoney = (amount, currency = 'USD') => {
  if (amount === undefined || amount === null) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export const formatCurrency = (amount, currency = '$') => {
  if (amount === undefined || amount === null) return 'N/A'
  return `${currency}${Number(amount).toFixed(2)}`
}

// ==================== FILE HELPERS ====================

export const getFileExtension = (filename) => {
  if (!filename) return ''
  return filename.split('.').pop().toLowerCase()
}

export const isImageFile = (filename) => {
  const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico']
  return extensions.includes(getFileExtension(filename))
}

export const isVideoFile = (filename) => {
  const extensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm']
  return extensions.includes(getFileExtension(filename))
}

export const isDocumentFile = (filename) => {
  const extensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt']
  return extensions.includes(getFileExtension(filename))
}

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// ==================== BROWSER HELPERS ====================

export const getDeviceType = () => {
  const ua = navigator.userAgent
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile'
  }
  return 'desktop'
}

export const isMobile = () => {
  return getDeviceType() === 'mobile'
}

export const isTablet = () => {
  return getDeviceType() === 'tablet'
}

export const isDesktop = () => {
  return getDeviceType() === 'desktop'
}

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// ==================== SCROLL HELPERS ====================

export const scrollToTop = (behavior = 'smooth') => {
  window.scrollTo({ top: 0, behavior })
}

export const scrollToElement = (id, behavior = 'smooth') => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior, block: 'start' })
  }
}

// ==================== EXPORT ALL ====================

export default {
  formatDate,
  formatDateTime,
  timeAgo,
  daysUntil,
  isToday,
  isTomorrow,
  truncateText,
  capitalize,
  capitalizeWords,
  slugify,
  generateSlug,
  generateId,
  generateReference,
  generateOTP,
  getRandomColor,
  getInitials,
  chunkArray,
  groupBy,
  sortByKey,
  uniqueArray,
  pick,
  omit,
  deepClone,
  formatMoney,
  formatCurrency,
  getFileExtension,
  isImageFile,
  isVideoFile,
  isDocumentFile,
  formatFileSize,
  getDeviceType,
  isMobile,
  isTablet,
  isDesktop,
  copyToClipboard,
  scrollToTop,
  scrollToElement
}