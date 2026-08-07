// frontend/src/pages/BlogDetail.jsx
import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaArrowLeft, FaCalendar, FaUser, FaClock, FaTag,
  FaHeart, FaRegHeart, FaComments, FaShare, FaFacebook,
  FaTwitter, FaLinkedin, FaLink
} from 'react-icons/fa'
import Breadcrumb from '../components/common/Breadcrumb'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const BlogDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    // Simulate fetching blog post
    setTimeout(() => {
      // Sample data - replace with API call
      const samplePost = {
        id: parseInt(id),
        title: '10 Tips for Hosting a Successful Virtual Event',
        content: `
          <p>Virtual events have become an essential part of the event industry. Here are 10 tips to make your virtual event a success:</p>
          
          <h3>1. Choose the Right Platform</h3>
          <p>Select a platform that suits your event type and audience size. Consider features like breakout rooms, Q&A, polling, and networking capabilities.</p>
          
          <h3>2. Engage Your Audience</h3>
          <p>Keep attendees engaged with interactive elements like polls, quizzes, chat, and Q&A sessions. Regular engagement helps maintain attention.</p>
          
          <h3>3. Professional Production</h3>
          <p>Invest in good audio and video equipment. Professional production quality makes a huge difference in attendee experience.</p>
          
          <h3>4. Rehearse and Test</h3>
          <p>Always do a full rehearsal before the event. Test all equipment, internet connection, and platform features.</p>
          
          <h3>5. Promote Effectively</h3>
          <p>Create a marketing plan that includes email campaigns, social media, and partnerships to drive attendance.</p>
          
          <h3>6. Provide Value</h3>
          <p>Ensure your content is valuable and relevant to your audience. Focus on solving their problems or educating them.</p>
          
          <h3>7. Networking Opportunities</h3>
          <p>Create opportunities for attendees to connect with each other through virtual networking sessions or breakout rooms.</p>
          
          <h3>8. Follow-up Strategy</h3>
          <p>Have a follow-up plan that includes session recordings, resources, and feedback surveys.</p>
          
          <h3>9. Sponsorship Opportunities</h3>
          <p>Offer sponsorship packages that provide value to sponsors and enhance the event experience.</p>
          
          <h3>10. Measure Success</h3>
          <p>Track key metrics like attendance, engagement, and satisfaction to measure event success.</p>
        `,
        category: 'Event Tips',
        author: 'Sarah Johnson',
        authorBio: 'Event planning expert with 10+ years of experience in corporate events.',
        authorImage: 'https://ui-avatars.com/api/?name=Sarah+Johnson&size=60',
        date: '2024-12-15',
        readTime: '5 min read',
        image: 'https://picsum.photos/seed/virtual/1200/600',
        likes: 45,
        comments: 12
      }
      setPost(samplePost)
      setLoading(false)
    }, 1000)
  }, [id])

  const handleLike = () => {
    setLiked(!liked)
    if (!liked) {
      setPost(prev => ({ ...prev, likes: prev.likes + 1 }))
      toast.success('Liked! ❤️')
    } else {
      setPost(prev => ({ ...prev, likes: prev.likes - 1 }))
      toast.success('Unliked')
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: `Check out this article: ${post.title}`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  if (loading) {
    return <LoadingSpinner size="lg" />
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Post not found</h2>
        <Link to="/blog" className="text-primary-500 hover:text-primary-600 mt-4 inline-block">
          ← Back to Blog
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Breadcrumb />

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors"
      >
        <FaArrowLeft />
        Back
      </button>

      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Featured Image */}
        <div className="relative h-80 overflow-hidden">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-primary-500 text-white text-sm font-medium rounded-full">
              {post.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <FaUser className="text-primary-500" />
                {post.author}
              </span>
              <span className="flex items-center gap-1">
                <FaCalendar className="text-primary-500" />
                {new Date(post.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <span className="flex items-center gap-1">
                <FaClock className="text-primary-500" />
                {post.readTime}
              </span>
            </div>
          </div>

          {/* Body */}
          <div 
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t dark:border-gray-700">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {liked ? (
                  <FaHeart className="text-red-500 text-xl" />
                ) : (
                  <FaRegHeart className="text-xl" />
                )}
                <span>{post.likes}</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <FaComments className="text-xl" />
                <span>{post.comments}</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Share"
              >
                <FaShare />
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${post.title}&url=${window.location.href}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FaTwitter />
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FaFacebook />
              </a>
              <a
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${window.location.href}&title=${post.title}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FaLinkedin />
              </a>
            </div>
          </div>

          {/* Author Bio */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center gap-4">
            <img
              src={post.authorImage}
              alt={post.author}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-white">
                {post.author}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {post.authorBio}
              </p>
            </div>
          </div>
        </div>
      </motion.article>
    </div>
  )
}

export default BlogDetail