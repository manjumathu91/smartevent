
import React, { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import AdminRoute from './components/common/AdminRoute'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import LoadingSpinner from './components/common/LoadingSpinner'
import BackToTop from './components/common/BackToTop'
import Breadcrumb from './components/common/Breadcrumb'
import Careers from './pages/Careers' 
import Contact from './pages/Contact'
import Blog from './pages/Blog' 
import Help from './pages/Help' 
import BlogDetail from './pages/BlogDetail'  
import FAQ from './pages/FAQ'  
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Categories from './pages/Categories'
import AdminEventCreate from './components/admin/AdminEventCreate' 
import Notifications from './pages/Notifications'
// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'))
const Events = lazy(() => import('./pages/Events'))
const EventDetails = lazy(() => import('./pages/EventDetails'))
const Booking = lazy(() => import('./pages/Booking'))
const Profile = lazy(() => import('./pages/Profile'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const NotFound = lazy(() => import('./pages/NotFound'))
const About = lazy(() => import('./pages/About'))

// Admin Components
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('./components/admin/AdminUsers'))
const AdminEvents = lazy(() => import('./components/admin/AdminEvents'))
const AdminBookings = lazy(() => import('./components/admin/AdminBookings'))
const AdminCategories = lazy(() => import('./components/admin/AdminCategories'))
const AdminStats = lazy(() => import('./components/admin/AdminStats'))

// Payment Component
const RazorpayPayment = lazy(() => import('./components/payments/RazorpayPayment'))

function App() {
  const { user, loading } = useAuth()
  const { theme } = useTheme()
  const location = useLocation()

  // Apply theme to body
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }

  if (loading) {
    return <LoadingSpinner size="lg" fullScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        {/* Breadcrumb - Show on all pages except home */}
        {location.pathname !== '/' && <Breadcrumb />}
        
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={{ duration: 0.3 }}
            className="min-h-[calc(100vh-16rem)]"
          >
            <Suspense fallback={<LoadingSpinner size="lg" />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetails />} />
                <Route path="/about" element={<About />} />
                <Route path="/careers" element={<Careers />} /> 
                <Route path="/contact" element={<Contact />} /> 
                <Route path="/blog" element={<Blog />} /> 
                <Route path="/help" element={<Help />} /> 
                <Route path="/blog/:id" element={<BlogDetail />} /> 
                <Route path="/faq" element={<FAQ />} />  
                <Route path="/privacy" element={<Privacy />} /> 
                <Route path="/terms" element={<Terms />} />
                <Route path="/categories" element={<Categories />} /> 
                <Route path="/notifications" element={<Notifications />} />

                {/* Auth Routes - Redirect if already logged in */}
                <Route 
                  path="/login" 
                  element={!user ? <Login /> : <Navigate to="/" replace />} 
                />
                <Route 
                  path="/register" 
                  element={!user ? <Register /> : <Navigate to="/" replace />} 
                />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* Protected User Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/bookings" 
                  element={
                    <ProtectedRoute>
                      <Booking />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/bookings/:id" 
                  element={
                    <ProtectedRoute>
                      <Booking />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/payment" 
                  element={
                    <ProtectedRoute>
                      <RazorpayPayment />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Admin Routes */}
                <Route 
                  path="/admin" 
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/users" 
                  element={
                    <AdminRoute>
                      <AdminUsers />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/events" 
                  element={
                    <AdminRoute>
                      <AdminEvents />
                    </AdminRoute>
                  } 
                />
                 <Route path="/admin/events/create" element={<AdminRoute><AdminEventCreate /></AdminRoute>} />
                <Route 
                  path="/admin/bookings" 
                  element={
                    <AdminRoute>
                      <AdminBookings />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/categories" 
                  element={
                    <AdminRoute>
                      <AdminCategories />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/stats" 
                  element={
                    <AdminRoute>
                      <AdminStats />
                    </AdminRoute>
                  } 
                />
                
                {/* 404 - Catch all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
      <BackToTop />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#f3f4f6' : '#111827',
            border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          },
          success: {
            iconTheme: {
              primary: '#4ade80',
              secondary: '#ffffff'
            }
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff'
            }
          },
          loading: {
            iconTheme: {
              primary: '#6366f1',
              secondary: '#ffffff'
            }
          }
        }}
      />
    </div>
  )
}

export default App