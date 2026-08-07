// frontend/src/pages/FAQ.jsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaSearch, FaChevronDown, FaChevronUp, FaTicketAlt, 
  FaUser, FaCreditCard, FaCalendar, FaShieldAlt,
  FaHeadset, FaEnvelope, FaComments, FaArrowRight,
  FaStar, FaHeart, FaGlobe, FaDownload, FaPrint
} from 'react-icons/fa'
import Breadcrumb from '../components/common/Breadcrumb'
import toast from 'react-hot-toast'

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [activeCategory, setActiveCategory] = useState('All')

  // FAQ Categories
  const categories = [
    { id: 'All', label: 'All Questions', icon: FaStar },
    { id: 'General', label: 'General', icon: FaGlobe },
    { id: 'Account', label: 'Account', icon: FaUser },
    { id: 'Bookings', label: 'Bookings & Tickets', icon: FaTicketAlt },
    { id: 'Payments', label: 'Payments', icon: FaCreditCard },
    { id: 'Events', label: 'Events', icon: FaCalendar }
  ]

  // FAQ Data
  const faqs = [
    // General
    {
      id: 1,
      category: 'General',
      question: 'What is EventHub?',
      answer: 'EventHub is a comprehensive event management platform that allows users to discover, book, and manage events. It connects event organizers with attendees, making it easy to create and participate in amazing events.'
    },
    {
      id: 2,
      category: 'General',
      question: 'Is EventHub free to use?',
      answer: 'EventHub is free for attendees to browse and book events. Organizers may have different pricing plans depending on their needs. Check our pricing page for more details.'
    },
    {
      id: 3,
      category: 'General',
      question: 'What types of events can I find on EventHub?',
      answer: 'You can find a wide variety of events including conferences, workshops, networking events, webinars, concerts, art exhibitions, sports events, and more. We have events for every interest!'
    },

    // Account
    {
      id: 4,
      category: 'Account',
      question: 'How do I create an account?',
      answer: 'Click on the "Sign Up" button in the top right corner. Fill in your details including name, email, and password. Verify your email address and you\'re ready to start using EventHub!'
    },
    {
      id: 5,
      category: 'Account',
      question: 'How do I reset my password?',
      answer: 'Click on "Forgot Password" on the login page. Enter your registered email address and we\'ll send you a password reset link. Follow the instructions in the email to set a new password.'
    },
    {
      id: 6,
      category: 'Account',
      question: 'How do I update my profile information?',
      answer: 'Go to your Dashboard, click on "Profile Settings". You can update your name, email, phone number, profile picture, and other personal information there.'
    },
    {
      id: 7,
      category: 'Account',
      question: 'How do I delete my account?',
      answer: 'To delete your account, go to Settings > Account > Delete Account. Please note this action is permanent and cannot be undone. All your data will be removed.'
    },

    // Bookings & Tickets
    {
      id: 8,
      category: 'Bookings',
      question: 'How do I book tickets for an event?',
      answer: 'Browse events, click on the event you\'re interested in, select the number of tickets you need, and click "Book Now". Complete the payment process to confirm your booking.'
    },
    {
      id: 9,
      category: 'Bookings',
      question: 'How do I view my bookings?',
      answer: 'Go to "My Bookings" from the navigation menu or your dashboard. There you can see all your past and upcoming bookings with their status.'
    },
    {
      id: 10,
      category: 'Bookings',
      question: 'Can I cancel my booking?',
      answer: 'Yes, you can cancel your booking from the "My Bookings" page. Find your booking and click "Cancel". Please check the event\'s cancellation policy as refunds may vary.'
    },
    {
      id: 11,
      category: 'Bookings',
      question: 'How do I download my ticket?',
      answer: 'After your booking is confirmed, go to "My Bookings", find your booking, and click "Download Ticket". You\'ll receive a PDF ticket with a QR code for entry.'
    },
    {
      id: 12,
      category: 'Bookings',
      question: 'What is a booking reference?',
      answer: 'A booking reference is a unique code assigned to each booking. You\'ll need this reference when contacting support about your booking or during check-in at the event.'
    },

    // Payments
    {
      id: 13,
      category: 'Payments',
      question: 'What payment methods do you accept?',
      answer: 'We accept Credit/Debit Cards (Visa, MasterCard, American Express), UPI, Net Banking, and popular digital wallets. All payments are processed securely through our payment gateway.'
    },
    {
      id: 14,
      category: 'Payments',
      question: 'Is my payment information secure?',
      answer: 'Yes! We use industry-standard SSL encryption and secure payment gateways. Your financial information is never stored on our servers and is transmitted securely.'
    },
    {
      id: 15,
      category: 'Payments',
      question: 'How do I get a refund?',
      answer: 'Refund policies vary by event. Please check the event\'s cancellation and refund policy before booking. For refund requests, contact the event organizer through our platform.'
    },
    {
      id: 16,
      category: 'Payments',
      question: 'What is the refund policy?',
      answer: 'The refund policy depends on the event organizer. Each event has its own cancellation and refund policy. Please review the policy before making a booking.'
    },

    // Events
    {
      id: 17,
      category: 'Events',
      question: 'How do I become an event organizer?',
      answer: 'Contact our support team or apply through the "Become an Organizer" page. We\'ll review your application and provide you with access to create and manage events.'
    },
    {
      id: 18,
      category: 'Events',
      question: 'How do I create an event?',
      answer: 'Once you\'re an approved organizer, go to your Dashboard and click "Create Event". Fill in the event details including title, description, date, venue, ticket pricing, and other information.'
    },
    {
      id: 19,
      category: 'Events',
      question: 'How are events approved?',
      answer: 'Events are reviewed by our team to ensure quality and compliance with our guidelines. The review process typically takes 24-48 hours. You\'ll receive a notification once approved.'
    },
    {
      id: 20,
      category: 'Events',
      question: 'Can I edit my event after publishing?',
      answer: 'Yes, you can edit your event details from your Dashboard. However, changes to certain fields like date or venue may require re-approval.'
    }
  ]

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  // Group FAQs by category for display
  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = []
    }
    acc[faq.category].push(faq)
    return acc
  }, {})

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
          Frequently Asked Questions ❓
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Find answers to the most common questions about EventHub.
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
            placeholder="Search for questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
          />
        </div>
      </motion.div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === category.id
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <category.icon className="inline mr-1" size={14} />
            {category.label}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      {filteredFaqs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No questions found matching your search.</p>
          <button
            onClick={() => {
              setSearchTerm('')
              setActiveCategory('All')
            }}
            className="mt-4 text-primary-500 hover:text-primary-600 font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFaqs).map(([category, faqs]) => (
            <div key={category}>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-primary-500">
                  {category === 'General' && <FaGlobe />}
                  {category === 'Account' && <FaUser />}
                  {category === 'Bookings' && <FaTicketAlt />}
                  {category === 'Payments' && <FaCreditCard />}
                  {category === 'Events' && <FaCalendar />}
                </span>
                {category}
              </h2>
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <h3 className="font-semibold text-gray-800 dark:text-white pr-4">
                        {faq.question}
                      </h3>
                      {expandedFaq === faq.id ? (
                        <FaChevronUp className="text-gray-400 flex-shrink-0" />
                      ) : (
                        <FaChevronDown className="text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    {expandedFaq === faq.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-6 pb-4"
                      >
                        <div className="pt-2 border-t dark:border-gray-700">
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Still Need Help? */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 md:p-12 text-white text-center"
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Still Have Questions? 🤝
        </h2>
        <p className="text-white/90 text-lg max-w-2xl mx-auto mb-6">
          Our support team is here to help. Get in touch with us and we'll get back to you quickly.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/contact"
            className="px-6 py-3 bg-white text-primary-500 rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
          >
            <FaEnvelope />
            Contact Us
          </Link>
          <Link
            to="/help"
            className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors font-medium border border-white flex items-center gap-2"
          >
            <FaHeadset />
            Help Center
          </Link>
          <button
            onClick={() => {
              toast.success('Chat support coming soon!')
            }}
            className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors font-medium border border-white flex items-center gap-2"
          >
            <FaComments />
            Live Chat
          </button>
        </div>
      </motion.section>
    </div>
  )
}

export default FAQ