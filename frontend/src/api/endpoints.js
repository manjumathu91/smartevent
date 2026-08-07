/**
 * API Endpoints Configuration
 * Centralized location for all API endpoints
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const ENDPOINTS = {
  // ==================== AUTH ====================
  AUTH: {
    LOGIN: `${API_BASE}/auth/login`,
    REGISTER: `${API_BASE}/auth/register`,
    LOGOUT: `${API_BASE}/auth/logout`,
    REFRESH: `${API_BASE}/auth/refresh`,
    FORGOT_PASSWORD: `${API_BASE}/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE}/auth/reset-password`,
    VERIFY_EMAIL: (token) => `${API_BASE}/auth/verify-email/${token}`,
  },

  // ==================== USERS ====================
  USERS: {
    PROFILE: `${API_BASE}/users/profile`,
    UPDATE_PROFILE: `${API_BASE}/users/profile`,
    UPDATE_PASSWORD: `${API_BASE}/users/profile/password`,
    UPLOAD_AVATAR: `${API_BASE}/users/profile/avatar`,
    DELETE_AVATAR: `${API_BASE}/users/profile/avatar`,
    BOOKINGS: `${API_BASE}/users/bookings`,
    NOTIFICATIONS: `${API_BASE}/users/notifications`,
    NOTIFICATION_READ: (id) => `${API_BASE}/users/notifications/${id}/read`,
    NOTIFICATIONS_READ_ALL: `${API_BASE}/users/notifications/read-all`,
    NOTIFICATION_COUNT: `${API_BASE}/users/notifications/count`,
    ACTIVITY: `${API_BASE}/users/activity`,
    STATS: `${API_BASE}/users/stats`,
  },

  // ==================== EVENTS ====================
  EVENTS: {
    LIST: `${API_BASE}/events`,
    DETAIL: (id) => `${API_BASE}/events/${id}`,
    CREATE: `${API_BASE}/events`,
    UPDATE: (id) => `${API_BASE}/events/${id}`,
    DELETE: (id) => `${API_BASE}/events/${id}`,
    CATEGORIES: `${API_BASE}/events/categories`,
    REVIEWS: (id) => `${API_BASE}/events/${id}/reviews`,
    CREATE_REVIEW: (id) => `${API_BASE}/events/${id}/reviews`,
  },

  // ==================== BOOKINGS ====================
  BOOKINGS: {
    LIST: `${API_BASE}/bookings`,
    CREATE: `${API_BASE}/bookings`,
    DETAIL: (id) => `${API_BASE}/bookings/${id}`,
    CANCEL: (id) => `${API_BASE}/bookings/${id}/cancel`,
    QR_CODE: (id) => `${API_BASE}/bookings/${id}/qr`,
    PDF: (id) => `${API_BASE}/bookings/${id}/pdf`,
    CHECK_IN: (id) => `${API_BASE}/bookings/${id}/check-in`,
  },

  // ==================== PAYMENTS ====================
  PAYMENTS: {
    CREATE_ORDER: `${API_BASE}/payments/create-order`,
    VERIFY: `${API_BASE}/payments/verify`,
    STATUS: (bookingId) => `${API_BASE}/payments/booking/${bookingId}/status`,
    REFUND: `${API_BASE}/payments/refund`,
    WEBHOOK: `${API_BASE}/payments/webhook`,
  },

  // ==================== ADMIN ====================
  ADMIN: {
    DASHBOARD: `${API_BASE}/admin/dashboard`,
    USERS: `${API_BASE}/admin/users`,
    UPDATE_USER: (id) => `${API_BASE}/admin/users/${id}`,
    DELETE_USER: (id) => `${API_BASE}/admin/users/${id}`,
    EVENTS: `${API_BASE}/admin/events`,
    UPDATE_EVENT_STATUS: (id) => `${API_BASE}/admin/events/${id}/status`,
    BOOKINGS: `${API_BASE}/admin/bookings`,
    UPDATE_BOOKING: (id) => `${API_BASE}/admin/bookings/${id}`,
    EXPORT: (type) => `${API_BASE}/admin/export/${type}`,
    ACTIVITY_LOGS: `${API_BASE}/admin/activity-logs`,
  },

  // ==================== REVIEWS ====================
  REVIEWS: {
    LIST: (eventId) => `${API_BASE}/reviews/event/${eventId}`,
    MY_REVIEWS: `${API_BASE}/reviews/user`,
    CREATE: `${API_BASE}/reviews`,
    UPDATE: (id) => `${API_BASE}/reviews/${id}`,
    DELETE: (id) => `${API_BASE}/reviews/${id}`,
    HELPFUL: (id) => `${API_BASE}/reviews/${id}/helpful`,
    REPORT: (id) => `${API_BASE}/reviews/${id}/report`,
    RESPOND: (id) => `${API_BASE}/reviews/${id}/respond`,
    ANALYTICS: `${API_BASE}/reviews/analytics`,
    SEARCH: (query) => `${API_BASE}/reviews/search?q=${query}`,
  },

  // ==================== NOTIFICATIONS ====================
  NOTIFICATIONS: {
    LIST: `${API_BASE}/notifications`,
    MARK_READ: (id) => `${API_BASE}/notifications/${id}/read`,
    MARK_ALL_READ: `${API_BASE}/notifications/read-all`,
    DELETE: (id) => `${API_BASE}/notifications/${id}`,
    COUNT: `${API_BASE}/notifications/count`,
  },

  // ==================== CATEGORIES ====================
  CATEGORIES: {
    LIST: `${API_BASE}/categories`,
    CREATE: `${API_BASE}/categories`,
    UPDATE: (id) => `${API_BASE}/categories/${id}`,
    DELETE: (id) => `${API_BASE}/categories/${id}`,
  },

  // ==================== DASHBOARD ====================
  DASHBOARD: {
    STATS: `${API_BASE}/dashboard/stats`,
    MONTHLY_BOOKINGS: `${API_BASE}/dashboard/charts/monthly-bookings`,
    EVENT_CATEGORIES: `${API_BASE}/dashboard/charts/event-categories`,
    EVENT_STATUS: `${API_BASE}/dashboard/charts/event-status`,
    BOOKING_STATUS: `${API_BASE}/dashboard/charts/booking-status`,
    POPULAR_EVENTS: `${API_BASE}/dashboard/charts/popular-events`,
    REVENUE_OVERVIEW: `${API_BASE}/dashboard/charts/revenue-overview`,
    USER_ACTIVITY: `${API_BASE}/dashboard/charts/user-activity`,
    BOOKING_ANALYTICS: `${API_BASE}/dashboard/charts/booking-analytics`,
    ATTENDANCE_ANALYTICS: `${API_BASE}/dashboard/charts/attendance-analytics`,
    EVENT_PERFORMANCE: `${API_BASE}/dashboard/charts/event-performance`,
    RECENT_ACTIVITY: `${API_BASE}/dashboard/recent-activity`,
    NOTIFICATIONS: `${API_BASE}/dashboard/notifications`,
    EXPORT: `${API_BASE}/dashboard/export/dashboard-data`,
    CACHE_CLEAR: `${API_BASE}/dashboard/cache/clear`,
  },
}

// Export individual endpoints for easier imports
export const {
  AUTH,
  USERS,
  EVENTS,
  BOOKINGS,
  PAYMENTS,
  ADMIN,
  REVIEWS,
  NOTIFICATIONS,
  CATEGORIES,
  DASHBOARD,
} = ENDPOINTS

export default ENDPOINTS