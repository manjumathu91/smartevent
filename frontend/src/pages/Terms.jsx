// frontend/src/pages/Terms.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaFileContract, FaGavel, FaUserCheck, FaCreditCard,
  FaShieldAlt, FaBan, FaCheckCircle, FaArrowRight
} from 'react-icons/fa'
import Breadcrumb from '../components/common/Breadcrumb'

const Terms = () => {
  return (
    <div className="space-y-8">
      <Breadcrumb />

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full">
            <FaFileContract className="text-5xl text-primary-500" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
          Terms of Service 📋
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Please read these terms carefully before using EventHub.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          Last Updated: December 2024
        </p>
      </motion.section>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 md:p-8 prose prose-gray dark:prose-invert max-w-none">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By using EventHub, you agree to these terms of service. If you don't agree, please don't use our platform.
        </p>

        <h2>2. Account Registration</h2>
        <ul>
          <li>You must be at least 16 years old to use EventHub</li>
          <li>You are responsible for maintaining account security</li>
          <li>You must provide accurate and complete information</li>
          <li>You are responsible for all activities under your account</li>
        </ul>

        <h2>3. Bookings and Payments</h2>
        <ul>
          <li>All bookings are subject to event availability</li>
          <li>Payment must be completed before ticket confirmation</li>
          <li>Refund policies are set by event organizers</li>
          <li>We reserve the right to cancel bookings for fraudulent activity</li>
        </ul>

        <h2>4. User Conduct</h2>
        <ul>
          <li>Use the platform for lawful purposes only</li>
          <li>Don't spam or harass other users</li>
          <li>Don't post offensive or harmful content</li>
          <li>Respect the rights of event organizers and attendees</li>
        </ul>

        <h2>5. Intellectual Property</h2>
        <ul>
          <li>All content on EventHub is our property or licensed to us</li>
          <li>You may not copy, distribute, or modify our content</li>
          <li>You retain rights to your user-generated content</li>
          <li>We may use your content for platform promotion</li>
        </ul>

        <h2>6. Termination</h2>
        <ul>
          <li>We reserve the right to suspend or terminate accounts</li>
          <li>You can delete your account at any time</li>
          <li>Termination doesn't affect existing bookings</li>
        </ul>

        <h2>7. Disclaimer</h2>
        <ul>
          <li>EventHub is provided "as is" without warranties</li>
          <li>We're not responsible for event organizer actions</li>
          <li>We don't guarantee event availability or quality</li>
        </ul>

        <h2>8. Limitation of Liability</h2>
        <ul>
          <li>We're not liable for indirect or consequential damages</li>
          <li>Our liability is limited to the amount you paid</li>
          <li>We're not responsible for third-party services</li>
        </ul>

        <h2>9. Changes to Terms</h2>
        <ul>
          <li>We may update these terms at any time</li>
          <li>Changes are effective immediately upon posting</li>
          <li>Continued use means you accept the changes</li>
        </ul>

        <h2>10. Contact Us</h2>
        <p>
          Questions about these terms? Contact us at{' '}
          <a href="mailto:support@eventhub.com" className="text-primary-500 hover:underline">
            support@eventhub.com
          </a>
        </p>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 md:p-12 text-white text-center"
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Have Questions? 🤝
        </h2>
        <p className="text-white/90 text-lg max-w-2xl mx-auto mb-6">
          If you have any questions about our terms, please contact us.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/contact"
            className="px-6 py-3 bg-white text-primary-500 rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
          >
            Contact Us
            <FaArrowRight />
          </Link>
          <Link
            to="/privacy"
            className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors font-medium border border-white flex items-center gap-2"
          >
            <FaShieldAlt />
            Privacy Policy
          </Link>
        </div>
      </motion.section>
    </div>
  )
}

export default Terms