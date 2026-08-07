// frontend/src/pages/Careers.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaBriefcase, FaUsers, FaRocket, FaHeart, 
  FaGraduationCap, FaGlobe, FaClock, FaCoffee
} from 'react-icons/fa'
import Breadcrumb from '../components/common/Breadcrumb'

const Careers = () => {
  const benefits = [
    {
      icon: FaRocket,
      title: 'Growth Opportunities',
      description: 'We invest in your professional development with training and mentorship.'
    },
    {
      icon: FaHeart,
      title: 'Great Culture',
      description: 'Work with passionate people in a collaborative and inclusive environment.'
    },
    {
      icon: FaGlobe,
      title: 'Remote Friendly',
      description: 'Work from anywhere with our flexible remote work policy.'
    },
    {
      icon: FaClock,
      title: 'Flexible Hours',
      description: 'Balance work and life with our flexible working hours.'
    },
    {
      icon: FaGraduationCap,
      title: 'Learning & Development',
      description: 'Access to courses, conferences, and learning resources.'
    },
    {
      icon: FaCoffee,
      title: 'Perks & Benefits',
      description: 'Competitive salary, health insurance, and awesome team events.'
    }
  ]

  const openPositions = [
    {
      title: 'Senior Full Stack Developer',
      department: 'Engineering',
      location: 'Remote / San Francisco',
      type: 'Full-time',
      description: 'Build and scale our event booking platform with modern technologies.'
    },
    {
      title: 'UX/UI Designer',
      department: 'Design',
      location: 'Remote / New York',
      type: 'Full-time',
      description: 'Design beautiful and intuitive user experiences for our platform.'
    },
    {
      title: 'Marketing Manager',
      department: 'Marketing',
      location: 'Remote / London',
      type: 'Full-time',
      description: 'Drive growth and brand awareness for EventHub.'
    },
    {
      title: 'DevOps Engineer',
      department: 'Engineering',
      location: 'Remote / Singapore',
      type: 'Full-time',
      description: 'Manage and optimize our cloud infrastructure and deployment pipelines.'
    },
    {
      title: 'Customer Success Manager',
      department: 'Support',
      location: 'Remote / Austin',
      type: 'Full-time',
      description: 'Help our customers succeed and grow with EventHub.'
    },
    {
      title: 'Content Writer',
      department: 'Marketing',
      location: 'Remote / Global',
      type: 'Contract',
      description: 'Create engaging content for our blog, social media, and marketing materials.'
    }
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
          Join Our Team 🚀
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Help us build the future of event discovery and booking. 
          We're looking for passionate people to join our team.
        </p>
      </motion.section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-md"
        >
          <div className="text-3xl text-primary-500 mb-2 flex justify-center">
            <FaUsers />
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">50+</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Team Members</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-md"
        >
          <div className="text-3xl text-primary-500 mb-2 flex justify-center">
            <FaGlobe />
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">10+</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Countries</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-md"
        >
          <div className="text-3xl text-primary-500 mb-2 flex justify-center">
            <FaRocket />
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">20+</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Open Positions</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-md"
        >
          <div className="text-3xl text-primary-500 mb-2 flex justify-center">
            <FaHeart />
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">95%</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Employee Satisfaction</div>
        </motion.div>
      </section>

      {/* Why Join Us */}
      <section className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 md:p-12 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Why Join EventHub?</h2>
          <p className="text-white/90 text-lg">
            We're building the world's leading event platform, and we need 
            talented people like you to help us get there.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white text-center mb-8">
          Benefits & Perks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl text-primary-500 mb-4">
                <benefit.icon />
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Open Positions */}
      <section>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white text-center mb-8">
          Open Positions
        </h2>
        <div className="space-y-4">
          {openPositions.map((position, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-l-4 border-primary-500"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    {position.title}
                  </h3>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded-full text-xs font-medium">
                      {position.department}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                      {position.location}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
                      {position.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {position.description}
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Handle apply action
                    window.location.href = 'mailto:careers@eventhub.com?subject=Application for ' + position.title
                  }}
                  className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap"
                >
                  Apply Now
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4">
          Don't See the Right Role?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We're always looking for talented people. Send us your resume and we'll keep you in mind!
        </p>
        <button
          onClick={() => {
            window.location.href = 'mailto:careers@eventhub.com?subject=General Application'
          }}
          className="inline-flex items-center px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FaBriefcase className="mr-2" />
          Send Your Resume
        </button>
      </section>
    </div>
  )
}

export default Careers