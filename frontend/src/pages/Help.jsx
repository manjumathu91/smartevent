// frontend/src/pages/Help.jsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaSearch, FaQuestionCircle, FaTicketAlt, FaUser, 
  FaCreditCard, FaCalendar, FaEnvelope, FaPhone,
  FaChevronDown, FaChevronUp, FaFileAlt, FaVideo,
  FaUsers, FaShieldAlt, FaGlobe, FaDownload,
  FaArrowRight, FaComments, FaBook, FaHeadset
} from 'react-icons/fa'
import Breadcrumb from '../components/common/Breadcrumb'
import toast from 'react-hot-toast'

const Help = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFaq, setExpandedFaq] = useState(null)

  // FAQ Data
  const faqs = [
    {
      id: 1,
      category: 'Getting Started',
      question: 'How do I create an account?',
      answer: 'Click on the "Sign Up" button in the top right corner. Fill in your details including name, email, and password. Verify your email and you\'re ready to go!'
    },
    {
      id: 2,
      category: 'Getting Started',
      question: 'How do I search for events?',
      answer: 'Use the search bar on the homepage or events page. You can filter by category, date, location, and price to find events that match your interests.'
    },
    {
      id: 3,
      category: 'Bookings & Tickets',
      question: 'How do I book a ticket?',
      answer: 'Browse events, click on an event you like, select the number of tickets, and click "Book Now". Complete the payment to confirm your booking.'
    },
    {
      id: 4,
      category: 'Bookings & Tickets',
      question: 'How do I cancel my booking?',
      answer: 'Go to "My Bookings", find your booking, and click "Cancel". Note that cancellation policies may apply based on the event organizer.'
    },
    {
      id: 5,
      category: 'Bookings & Tickets',
      question: 'Can I get a refund?',
      answer: 'Refund policies vary by event. Please check the event\'s cancellation policy before booking. Contact the organizer for specific refund requests.'
    },
    {
      id: 6,
      category: 'Payments',
      question: 'What payment methods are accepted?',
      answer: 'We accept Credit/Debit Cards, UPI, Net Banking, and popular wallets. All payments are processed securely.'
    },
    {
      id: 7,
      category: 'Payments',
      question: 'Is my payment information secure?',
      answer: 'Yes! We use industry-standard encryption and secure payment gateways to protect your financial information.'
    },
    {
      id: 8,
      category: 'Events & Organizers',
      question: 'How do I become an organizer?',
      answer: 'Contact our support team or apply through the "Become an Organizer" page. We\'ll review your application and get back to you.'
    },
    {
      id: 9,
      category: 'Events & Organizers',
      question: 'How do I create an event?',
      answer: 'Once you\'re an approved organizer, go to "Dashboard" and click "Create Event". Fill in the event details and submit for approval.'
    },
    {
      id: 10,
      category: 'Technical Support',
      question: 'What do I do if I encounter an error?',
      answer: 'Try refreshing the page or clearing your browser cache. If the issue persists, contact our support team with details about the error.'
    },
    {
      id: 11,
      category: 'Technical Support',
      question: 'How do I reset my password?',
      answer: 'Click on "Forgot Password" on the login page. Enter your email and follow the instructions sent to your inbox.'
    }
  ]

  // Help Categories
  const categories = [
    {
      title: 'Getting Started',
      icon: FaUser,
      description: 'Learn how to create an account and start using EventHub.',
      link: '#getting-started'
    },
    {
      title: 'Bookings & Tickets',
      icon: FaTicketAlt,
      description: 'Everything about booking, cancelling, and managing tickets.',
      link: '#bookings'
    },
    {
      title: 'Payments',
      icon: FaCreditCard,
      description: 'Payment methods, security, and refund information.',
      link: '#payments'
    },
    {
      title: 'Events & Organizers',
      icon: FaCalendar,
      description: 'Learn about creating and managing events as an organizer.',
      link: '#events'
    },
    {
      title: 'Technical Support',
      icon: FaHeadset,
      description: 'Get help with technical issues and troubleshooting.',
      link: '#technical'
    },
    {
      title: 'Account Settings',
      icon: FaUser,
      description: 'Manage your profile, preferences, and account settings.',
      link: '#account'
    }
  ]

  // Resources
  const resources = [
    {
      icon: FaBook,
      title: 'User Guide',
      description: 'Complete guide to using EventHub',
      link: '#'
    },
    {
      icon: FaVideo,
      title: 'Video Tutorials',
      description: 'Watch step-by-step tutorials',
      link: '#'
    },
    {
      icon: FaFileAlt,
      title: 'Terms of Service',
      description: 'Our terms and conditions',
      link: '#'
    },
    {
      icon: FaShieldAlt,
      title: 'Privacy Policy',
      description: 'How we protect your data',
      link: '#'
    }
  ]

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  return (
    <div className="space-y-8">
      <Breadcrumb />

      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
          Help Center ❓
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Find answers to your questions and learn how to make the most of EventHub.
        </p>
      </motion.section>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
          />
        </div>
      </motion.div>

      {/* Quick Contact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-md">
          <div className="text-3xl text-primary-500 mb-3 flex justify-center">
            <FaComments />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-white">Live Chat</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Chat with our support team</p>
          <button className="mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm">
            Start Chat
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-md">
          <div className="text-3xl text-primary-500 mb-3 flex justify-center">
            <FaEnvelope />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-white">Email Support</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">support@eventhub.com</p>
          <button className="mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm">
            Send Email
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-md">
          <div className="text-3xl text-primary-500 mb-3 flex justify-center">
            <FaPhone />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-white">Phone Support</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Mon-Fri, 9AM - 6PM</p>
          <button className="mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm">
            Call Now
          </button>
        </div>
      </motion.div>

      {/* Categories */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Browse by Category
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => toggleFaq(index + 1)}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl text-primary-500">
                  <category.icon />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 dark:text-white group-hover:text-primary-500 transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {category.description}
                  </p>
                </div>
                <FaArrowRight className="text-gray-400 group-hover:text-primary-500 transition-colors mt-1" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <div className="flex-1">
                  <span className="text-xs text-primary-500 font-medium">{faq.category}</span>
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {faq.question}
                  </h3>
                </div>
                {expandedFaq === faq.id ? (
                  <FaChevronUp className="text-gray-400 flex-shrink-0 ml-4" />
                ) : (
                  <FaChevronDown className="text-gray-400 flex-shrink-0 ml-4" />
                )}
              </button>
              {expandedFaq === faq.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-6 pb-4"
                >
                  <p className="text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Resources */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Helpful Resources
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {resources.map((resource, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-center"
            >
              <div className="text-3xl text-primary-500 mb-3 flex justify-center">
                <resource.icon />
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {resource.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {resource.description}
              </p>
              <Link
                to={resource.link}
                className="inline-block mt-3 text-primary-500 hover:text-primary-600 text-sm font-medium"
              >
                Learn More →
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Still Need Help? */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 md:p-12 text-white text-center"
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Still Need Help? 🤝
        </h2>
        <p className="text-white/90 text-lg max-w-2xl mx-auto mb-6">
          Our support team is here to help you. Choose the best way to reach us.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="px-6 py-3 bg-white text-primary-500 rounded-lg hover:bg-gray-100 transition-colors font-medium">
            <FaHeadset className="inline mr-2" />
            Live Chat
          </button>
          <button className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors font-medium border border-white">
            <FaEnvelope className="inline mr-2" />
            Email Support
          </button>
          <button className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors font-medium border border-white">
            <FaPhone className="inline mr-2" />
            Call Us
          </button>
        </div>
      </motion.section>
    </div>
  )
}

export default Help