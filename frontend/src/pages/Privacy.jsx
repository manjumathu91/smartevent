// frontend/src/pages/Privacy.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaShieldAlt, FaLock, FaUserSecret, FaCookie,
  FaEnvelope, FaDatabase, FaMobile, FaGlobe,
  FaCheckCircle, FaArrowRight
} from 'react-icons/fa'
import Breadcrumb from '../components/common/Breadcrumb'

const Privacy = () => {
  const sections = [
    {
      id: 'information-collection',
      icon: FaDatabase,
      title: 'Information We Collect',
      content: `
        <p>We collect information you provide directly to us, such as when you create an account, make a booking, or contact us. This includes:</p>
        <ul>
          <li><strong>Personal Information:</strong> Name, email address, phone number, and profile information.</li>
          <li><strong>Payment Information:</strong> Payment details are processed securely through our payment providers.</li>
          <li><strong>Event Preferences:</strong> Your interests, event history, and preferences.</li>
          <li><strong>Device Information:</strong> IP address, browser type, and device information.</li>
        </ul>
      `
    },
    {
      id: 'how-we-use',
      icon: FaUserSecret,
      title: 'How We Use Your Information',
      content: `
        <p>We use your information to provide, maintain, and improve our services:</p>
        <ul>
          <li>Process your bookings and transactions</li>
          <li>Send you booking confirmations and updates</li>
          <li>Personalize your event recommendations</li>
          <li>Communicate with you about events and promotions</li>
          <li>Improve our platform and user experience</li>
          <li>Ensure platform security and prevent fraud</li>
        </ul>
      `
    },
    {
      id: 'information-sharing',
      icon: FaGlobe,
      title: 'Information Sharing',
      content: `
        <p>We share your information only in the following circumstances:</p>
        <ul>
          <li><strong>Event Organizers:</strong> When you book an event, we share necessary information with the organizer.</li>
          <li><strong>Service Providers:</strong> We work with trusted third parties for payment processing, email delivery, and analytics.</li>
          <li><strong>Legal Compliance:</strong> When required by law or to protect our rights.</li>
          <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
        </ul>
        <p class="mt-3">We never sell your personal information to third parties.</p>
      `
    },
    {
      id: 'data-security',
      icon: FaShieldAlt,
      title: 'Data Security',
      content: `
        <p>We take data security seriously and implement appropriate measures to protect your information:</p>
        <ul>
          <li>Industry-standard encryption (SSL/TLS) for data transmission</li>
          <li>Secure data storage with access controls</li>
          <li>Regular security audits and vulnerability assessments</li>
          <li>Secure payment processing through PCI-compliant providers</li>
          <li>Employee training on data protection and privacy</li>
        </ul>
      `
    },
    {
      id: 'cookies',
      icon: FaCookie,
      title: 'Cookies and Tracking',
      content: `
        <p>We use cookies and similar technologies to:</p>
        <ul>
          <li>Remember your preferences and settings</li>
          <li>Keep you logged in to your account</li>
          <li>Analyze how you use our platform</li>
          <li>Personalize your experience</li>
          <li>Show relevant event recommendations</li>
        </ul>
        <p class="mt-3">You can control cookie preferences through your browser settings. Note that disabling cookies may affect some features.</p>
      `
    },
    {
      id: 'your-rights',
      icon: FaCheckCircle,
      title: 'Your Rights',
      content: `
        <p>You have the following rights regarding your personal data:</p>
        <ul>
          <li><strong>Access:</strong> Request a copy of your personal data</li>
          <li><strong>Correction:</strong> Update or correct inaccurate information</li>
          <li><strong>Deletion:</strong> Request deletion of your data</li>
          <li><strong>Objection:</strong> Object to certain data processing</li>
          <li><strong>Data Portability:</strong> Receive your data in a portable format</li>
          <li><strong>Withdraw Consent:</strong> Withdraw consent at any time</li>
        </ul>
        <p class="mt-3">To exercise these rights, contact us at <a href="mailto:privacy@eventhub.com" class="text-primary-500 hover:underline">privacy@eventhub.com</a></p>
      `
    },
    {
      id: 'data-retention',
      icon: FaDatabase,
      title: 'Data Retention',
      content: `
        <p>We retain your personal information for as long as necessary to:</p>
        <ul>
          <li>Provide our services and fulfill transactions</li>
          <li>Comply with legal obligations</li>
          <li>Resolve disputes and enforce agreements</li>
          <li>Maintain business records</li>
        </ul>
        <p class="mt-3">When you delete your account, we will securely delete your personal information unless required for legal purposes.</p>
      `
    },
    {
      id: 'children-privacy',
      icon: FaUserSecret,
      title: 'Children\'s Privacy',
      content: `
        <p>Our services are not directed to individuals under 16 years of age. We do not knowingly collect personal information from children.</p>
        <p class="mt-3">If you are a parent or guardian and believe your child has provided us with personal information, please contact us and we will promptly delete it.</p>
      `
    },
    {
      id: 'third-party-links',
      icon: FaGlobe,
      title: 'Third-Party Links',
      content: `
        <p>Our platform may contain links to third-party websites and services. We are not responsible for the privacy practices of these third parties.</p>
        <p class="mt-3">We encourage you to review the privacy policies of any third-party websites you visit.</p>
      `
    },
    {
      id: 'updates',
      icon: FaEnvelope,
      title: 'Updates to This Policy',
      content: `
        <p>We may update this privacy policy from time to time. We will notify you of any significant changes by:</p>
        <ul>
          <li>Posting the updated policy on our website</li>
          <li>Sending email notifications to registered users</li>
          <li>Displaying a notice on our platform</li>
        </ul>
        <p class="mt-3">We encourage you to review this policy periodically for any updates.</p>
      `
    }
  ]

  return (
    <div className="space-y-8">
      <Breadcrumb />

      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full">
            <FaShieldAlt className="text-5xl text-primary-500" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
          Privacy Policy 🔒
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Your privacy matters to us. Learn how we collect, use, and protect your personal information.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          Last Updated: December 2024
        </p>
      </motion.section>

      {/* Quick Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
          Quick Navigation
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors flex items-center gap-1"
            >
              <section.icon size={14} />
              {section.title}
            </a>
          ))}
        </div>
      </div>

      {/* Privacy Sections */}
      <div className="space-y-4">
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            id={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-2xl text-primary-500">
                  <section.icon />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {section.title}
                </h2>
              </div>
              <div 
                className="prose prose-gray dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Contact Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 md:p-12 text-white text-center"
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Have Questions About Privacy? 🤝
        </h2>
        <p className="text-white/90 text-lg max-w-2xl mx-auto mb-6">
          If you have any questions about our privacy practices, please don't hesitate to contact us.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="mailto:privacy@eventhub.com"
            className="px-6 py-3 bg-white text-primary-500 rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
          >
            <FaEnvelope />
            privacy@eventhub.com
          </a>
          <Link
            to="/contact"
            className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors font-medium border border-white flex items-center gap-2"
          >
            Contact Us
            <FaArrowRight />
          </Link>
        </div>
      </motion.section>
    </div>
  )
}

export default Privacy