
/**
 * Application constants
 */

// ==================== API CONSTANTS ====================

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },
  // Users
  USERS: {
    PROFILE: '/users/profile',
    UPDATE: '/users/profile',
    UPDATE_PASSWORD: '/users/profile/password',
    AVATAR: '/users/profile/avatar',
    BOOKINGS: '/users/bookings',
    NOTIFICATIONS: '/users/notifications',
    STATS: '/users/stats',
    ACTIVITY: '/users/activity',
  },
  // Events
  EVENTS: {
    LIST: '/events',
    DETAIL: (id) => `/events/${id}`,
    CREATE: '/events',
    UPDATE: (id) => `/events/${id}`,
    DELETE: (id) => `/events/${id}`,
    CATEGORIES: '/events/categories',
    REVIEWS: (id) => `/events/${id}/reviews`,
  },
  // Bookings
  BOOKINGS: {
    LIST: '/bookings',
    CREATE: '/bookings',
    DETAIL: (id) => `/bookings/${id}`,
    CANCEL: (id) => `/bookings/${id}/cancel`,
    QR: (id) => `/bookings/${id}/qr`,
    PDF: (id) => `/bookings/${id}/pdf`,
    CHECK_IN: (id) => `/bookings/${id}/check-in`,
  },
  // Admin
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    EVENTS: '/admin/events',
    BOOKINGS: '/admin/bookings',
    CATEGORIES: '/admin/categories',
    STATS: '/admin/stats',
    EXPORT: (type) => `/admin/export/${type}`,
  },
}

// ==================== ROUTE CONSTANTS ====================

export const ROUTES = {
  HOME: '/',
  EVENTS: '/events',
  EVENT_DETAIL: (id) => `/events/${id}`,
  BOOKINGS: '/bookings',
  BOOKING_DETAIL: (id) => `/bookings/${id}`,
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  ABOUT: '/about',
  CONTACT: '/contact',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_EVENTS: '/admin/events',
  ADMIN_BOOKINGS: '/admin/bookings',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_STATS: '/admin/stats',
}

// ==================== USER ROLES ====================

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  ORGANIZER: 'organizer',
}

// ==================== EVENT STATUS ====================

export const EVENT_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
}

export const EVENT_STATUS_LABELS = {
  [EVENT_STATUS.DRAFT]: 'Draft',
  [EVENT_STATUS.PENDING]: 'Pending',
  [EVENT_STATUS.APPROVED]: 'Approved',
  [EVENT_STATUS.REJECTED]: 'Rejected',
  [EVENT_STATUS.CANCELLED]: 'Cancelled',
  [EVENT_STATUS.COMPLETED]: 'Completed',
}

export const EVENT_STATUS_COLORS = {
  [EVENT_STATUS.DRAFT]: 'gray',
  [EVENT_STATUS.PENDING]: 'yellow',
  [EVENT_STATUS.APPROVED]: 'green',
  [EVENT_STATUS.REJECTED]: 'red',
  [EVENT_STATUS.CANCELLED]: 'red',
  [EVENT_STATUS.COMPLETED]: 'blue',
}

// ==================== BOOKING STATUS ====================

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
}

export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUS.PENDING]: 'Pending',
  [BOOKING_STATUS.CONFIRMED]: 'Confirmed',
  [BOOKING_STATUS.CANCELLED]: 'Cancelled',
  [BOOKING_STATUS.COMPLETED]: 'Completed',
}

export const BOOKING_STATUS_COLORS = {
  [BOOKING_STATUS.PENDING]: 'yellow',
  [BOOKING_STATUS.CONFIRMED]: 'green',
  [BOOKING_STATUS.CANCELLED]: 'red',
  [BOOKING_STATUS.COMPLETED]: 'blue',
}

// ==================== EVENT TYPES ====================

export const EVENT_TYPES = {
  ONLINE: 'online',
  OFFLINE: 'offline',
}

export const EVENT_TYPE_LABELS = {
  [EVENT_TYPES.ONLINE]: 'Online',
  [EVENT_TYPES.OFFLINE]: 'Offline',
}

// ==================== PAYMENT STATUS ====================

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
}

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]: 'Pending',
  [PAYMENT_STATUS.COMPLETED]: 'Completed',
  [PAYMENT_STATUS.FAILED]: 'Failed',
  [PAYMENT_STATUS.REFUNDED]: 'Refunded',
}

// ==================== NOTIFICATION TYPES ====================

export const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMATION: 'booking_confirmation',
  BOOKING_CANCELLATION: 'booking_cancellation',
  EVENT_REMINDER: 'event_reminder',
  EVENT_UPDATE: 'event_update',
  EVENT_CANCELLED: 'event_cancelled',
  PAYMENT_CONFIRMATION: 'payment_confirmation',
  PAYMENT_FAILED: 'payment_failed',
  PASSWORD_RESET: 'password_reset',
  EMAIL_VERIFICATION: 'email_verification',
  WELCOME: 'welcome',
  SYSTEM: 'system',
  REVIEW_RESPONSE: 'review_response',
}

// ==================== THEME ====================

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
}

// ==================== STORAGE KEYS ====================

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  WISHLIST: 'wishlist',
}

// ==================== PAGINATION ====================

export const DEFAULT_PAGE_SIZE = 12
export const DEFAULT_ADMIN_PAGE_SIZE = 20

// ==================== FILE UPLOAD ====================

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

// ==================== MESSAGES ====================

export const MESSAGES = {
  // Auth
  AUTH: {
    LOGIN_SUCCESS: 'Login successful! Welcome back.',
    LOGIN_FAILED: 'Invalid email or password.',
    REGISTER_SUCCESS: 'Registration successful! Please login.',
    REGISTER_FAILED: 'Registration failed. Please try again.',
    LOGOUT_SUCCESS: 'Logged out successfully.',
    PASSWORD_RESET_SENT: 'Password reset link sent to your email.',
    PASSWORD_RESET_SUCCESS: 'Password reset successful! Please login.',
    EMAIL_VERIFICATION_SENT: 'Verification email sent. Please check your inbox.',
    EMAIL_VERIFICATION_SUCCESS: 'Email verified successfully!',
  },
  // Events
  EVENTS: {
    CREATE_SUCCESS: 'Event created successfully!',
    CREATE_FAILED: 'Failed to create event.',
    UPDATE_SUCCESS: 'Event updated successfully!',
    UPDATE_FAILED: 'Failed to update event.',
    DELETE_SUCCESS: 'Event deleted successfully!',
    DELETE_FAILED: 'Failed to delete event.',
    NOT_FOUND: 'Event not found.',
  },
  // Bookings
  BOOKINGS: {
    CREATE_SUCCESS: 'Booking confirmed! 🎉',
    CREATE_FAILED: 'Booking failed. Please try again.',
    CANCEL_SUCCESS: 'Booking cancelled successfully.',
    CANCEL_FAILED: 'Failed to cancel booking.',
    NOT_FOUND: 'Booking not found.',
  },
  // Profile
  PROFILE: {
    UPDATE_SUCCESS: 'Profile updated successfully!',
    UPDATE_FAILED: 'Failed to update profile.',
    PASSWORD_CHANGE_SUCCESS: 'Password changed successfully!',
    PASSWORD_CHANGE_FAILED: 'Failed to change password.',
    DELETE_SUCCESS: 'Account deleted successfully.',
    DELETE_FAILED: 'Failed to delete account.',
  },
  // General
  GENERAL: {
    SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',
    NO_INTERNET: 'No internet connection. Please check your network.',
    SESSION_EXPIRED: 'Session expired. Please login again.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
  },
}

// ==================== EXPORT ALL ====================

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  ROUTES,
  USER_ROLES,
  EVENT_STATUS,
  EVENT_STATUS_LABELS,
  EVENT_STATUS_COLORS,
  BOOKING_STATUS,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  PAYMENT_STATUS,
  PAYMENT_STATUS_LABELS,
  NOTIFICATION_TYPES,
  THEMES,
  STORAGE_KEYS,
  DEFAULT_PAGE_SIZE,
  DEFAULT_ADMIN_PAGE_SIZE,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MESSAGES,
}