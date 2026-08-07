
import React from 'react'
import { Link } from 'react-router-dom'  // ✅ Add this import
import { motion } from 'framer-motion'
import { 
  FaRocket, FaShieldAlt, FaUsers, FaHeart,  // ✅ Changed FaShield to FaShieldAlt
  FaCalendar, FaTicketAlt, FaStar, FaGlobe
} from 'react-icons/fa'
import Breadcrumb from '../components/common/Breadcrumb'

const About = () => {
  const features = [
    {
      icon: FaRocket,
      title: 'Easy to Use',
      description: 'Simple and intuitive interface for discovering and booking events.'
    },
    {
      icon: FaShieldAlt,  // ✅ Changed to FaShieldAlt
      title: 'Secure Payments',
      description: 'Your transactions are safe and secure with our payment system.'
    },
    {
      icon: FaUsers,
      title: 'Community Driven',
      description: 'Connect with event organizers and attendees from around the world.'
    },
    {
      icon: FaHeart,
      title: 'Personalized Experience',
      description: 'Get recommendations based on your interests and preferences.'
    }
  ]

  const stats = [
    { icon: FaCalendar, value: '500+', label: 'Events' },
    { icon: FaTicketAlt, value: '50K+', label: 'Tickets Sold' },
    { icon: FaUsers, value: '10K+', label: 'Users' },
    { icon: FaStar, value: '4.8/5', label: 'Rating' }
  ]

  return (
    <div className="space-y-12">
      <Breadcrumb />

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
          About EventHub
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          We're on a mission to help people discover and experience amazing events.
        </p>
      </motion.section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-md"
          >
            <div className="text-3xl text-primary-500 mb-2 flex justify-center">
              <stat.icon />
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              {stat.value}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </section>

      {/* Mission */}
      <section className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 md:p-12 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-white/90 text-lg">
            To create a seamless platform where event organizers can reach their audience
            and attendees can discover extraordinary experiences that enrich their lives.
          </p>
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white text-center mb-8">
          Why Choose EventHub?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl text-primary-500 mb-4">
                <feature.icon />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 md:p-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white text-center mb-8">
          Our Team
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[1, 2, 3].map((member) => (
            <div key={member} className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-md">
              <img
                src={`https://ui-avatars.com/api/?name=Team+Member+${member}&size=80`}
                alt={`Team Member ${member}`}
                className="w-20 h-20 rounded-full mx-auto mb-4"
              />
              <h4 className="font-bold text-gray-800 dark:text-white">Team Member {member}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Role Title</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4">
          Get In Touch
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Have questions or want to partner with us? We'd love to hear from you!
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Contact Us
        </Link>
      </section>
    </div>
  )
}

export default About