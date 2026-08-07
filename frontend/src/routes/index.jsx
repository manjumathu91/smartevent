import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ProtectedRoute from '../components/common/ProtectedRoute'
import AdminRoute from '../components/common/AdminRoute'

// Lazy load pages for better performance
const Home = lazy(() => import('../pages/Home'))
const Events = lazy(() => import('../pages/Events'))
const EventDetails = lazy(() => import('../pages/EventDetails'))
const Booking = lazy(() => import('../pages/Booking'))
const Profile = lazy(() => import('../pages/Profile'))
const Dashboard = lazy(() => import('../pages/Dashboard'))
const Login = lazy(() => import('../pages/Login'))
const Register = lazy(() => import('../pages/Register'))
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'))
const ResetPassword = lazy(() => import('../pages/ResetPassword'))
const NotFound = lazy(() => import('../pages/NotFound'))
const About = lazy(() => import('../pages/About'))

// Admin Components
const AdminDashboard = lazy(() => import('../components/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('../components/admin/AdminUsers'))
const AdminEvents = lazy(() => import('../components/admin/AdminEvents'))
const AdminBookings = lazy(() => import('../components/admin/AdminBookings'))
const AdminCategories = lazy(() => import('../components/admin/AdminCategories'))
const AdminStats = lazy(() => import('../components/admin/AdminStats'))

// Route configuration
const routeConfig = {
  public: [
    { path: '/', element: <Home /> },
    { path: '/events', element: <Events /> },
    { path: '/events/:id', element: <EventDetails /> },
    { path: '/about', element: <About /> },
    { path: '/login', element: <Login /> },
    { path: '/register', element: <Register /> },
    { path: '/forgot-password', element: <ForgotPassword /> },
    { path: '/reset-password', element: <ResetPassword /> },
  ],
  protected: [
    { path: '/dashboard', element: <Dashboard /> },
    { path: '/profile', element: <Profile /> },
    { path: '/bookings', element: <Booking /> },
    { path: '/bookings/:id', element: <Booking /> },
  ],
  admin: [
    { path: '/admin', element: <AdminDashboard /> },
    { path: '/admin/users', element: <AdminUsers /> },
    { path: '/admin/events', element: <AdminEvents /> },
    { path: '/admin/bookings', element: <AdminBookings /> },
    { path: '/admin/categories', element: <AdminCategories /> },
    { path: '/admin/stats', element: <AdminStats /> },
  ]
}

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" fullScreen />}>
      <Routes>
        {/* Public Routes */}
        {routeConfig.public.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}

        {/* Protected Routes */}
        {routeConfig.protected.map((route) => (
          <Route 
            key={route.path} 
            path={route.path} 
            element={<ProtectedRoute>{route.element}</ProtectedRoute>} 
          />
        ))}

        {/* Admin Routes */}
        {routeConfig.admin.map((route) => (
          <Route 
            key={route.path} 
            path={route.path} 
            element={<AdminRoute>{route.element}</AdminRoute>} 
          />
        ))}

        {/* 404 - Catch all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes