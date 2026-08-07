
import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FaTimes } from 'react-icons/fa'
import toast from 'react-hot-toast'
import axios from '../../api/axios'

const RazorpayPayment = ({ bookingId, amount, onSuccess, onFailure, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const scriptLoadedRef = useRef(false)

  // ✅ Load Razorpay script when component mounts
  useEffect(() => {
    if (!scriptLoadedRef.current) {
      scriptLoadedRef.current = true
      loadRazorpayScript()
    }
  }, [])

  // ✅ Function to load Razorpay script
  const loadRazorpayScript = () => {
    // Check if already loaded
    if (window.Razorpay) {
      console.log('✅ Razorpay already loaded')
      setRazorpayLoaded(true)
      return
    }

    // Check if script is already added
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existingScript) {
      console.log('✅ Razorpay script exists, waiting...')
      existingScript.onload = () => {
        setRazorpayLoaded(true)
        console.log('✅ Razorpay loaded from existing script')
      }
      return
    }

    // Create and load script
    console.log('📥 Loading Razorpay script...')
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    
    script.onload = () => {
      setRazorpayLoaded(true)
      console.log('✅ Razorpay script loaded successfully')
    }
    
    script.onerror = () => {
      console.error('❌ Failed to load Razorpay script')
      toast.error('Failed to load payment gateway. Please refresh and try again.')
    }
    
    document.body.appendChild(script)
  }

  // 1. டெஸ்ட் பேமெண்ட் பொத்தான் (Test Button Logic)
  const handleSimplePayment = async () => {
    setLoading(true)
    try {
      const response = await axios.post('/payments/update', {
        booking_id: bookingId,
        payment_status: 'completed',
        payment_method: 'test'
      })
      
      if (response.data.success) {
        setPaymentSuccess(true)
        toast.success('Test Payment successful! 🎉')
        setTimeout(() => {
          if (onSuccess) onSuccess()
          onClose()
        }, 1500)
      }
    } catch (error) {
      console.error('Payment error:', error)
      const errorMsg = error.response?.data?.error || error.message || 'Payment failed'
      toast.error(errorMsg)
      if (onFailure) onFailure()
    } finally {
      setLoading(false)
    }
  }

  // 2. உண்மையான Razorpay கேட்வேயைத் திறக்கும் குறியீடு (Real Razorpay Logic)
  const handleRazorpayPayment = async () => {
    // ✅ Check if Razorpay is loaded
    if (!window.Razorpay) {
      toast.error('Payment gateway is loading. Please wait...')
      // Try to load script again
      loadRazorpayScript()
      return
    }

    setLoading(true)

    try {
      // அ) முதலில் பிளாஸ்க் பேக்கெண்டிற்கு கோரிக்கை அனுப்பி Razorpay Order ID-ஐப் பெறுதல்
      const orderResponse = await axios.post('/payments/create-order', {
        booking_id: bookingId,
        amount: amount
      })

      console.log('📦 Order response:', orderResponse.data)

      if (!orderResponse.data.success) {
        toast.error(orderResponse.data.error || 'Failed to create order')
        setLoading(false)
        return
      }

      const { order_id, amount: orderAmount, currency, razorpay_key_id } = orderResponse.data

      // ஆ) Razorpay கேட்வேயை ஆன்லைனில் இருந்து நேரடியாக லோட் செய்து பாப்அப் விண்டோவை திறத்தல்
      const options = {
        key: razorpay_key_id || "rzp_test_xxxxxxxxxxxxx", // ⚠️ உங்கள் உண்மையான Razorpay TEST KEY-ஐ இங்கே போடவும்
        amount: orderAmount || amount * 100,
        currency: currency || "INR",
        name: "EventHub",
        description: `Booking #${bookingId} Payment`,
        order_id: order_id,
        
        handler: async function (response) {
          setLoading(true)
          try {
            // இ) பேமெண்ட் விவரங்களை உறுதி செய்ய பேக்கெண்டிற்கு அனுப்புதல்
            const verifyResponse = await axios.post('/payments/verify', {
              order_id: order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              booking_id: bookingId
            })

            console.log('✅ Verify response:', verifyResponse.data)

            if (verifyResponse.data.success) {
              setPaymentSuccess(true)
              toast.success('Payment successful! 🎉')
              setTimeout(() => {
                if (onSuccess) onSuccess()
                onClose()
              }, 1500)
            } else {
              toast.error(verifyResponse.data.error || 'Payment verification failed')
              if (onFailure) onFailure()
            }
          } catch (error) {
            console.error('Verification error:', error)
            const errorMsg = error.response?.data?.error || 'Verification failed'
            toast.error(errorMsg)
            if (onFailure) onFailure()
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: localStorage.getItem('user_name') || "Test User",
          email: localStorage.getItem('user_email') || "testuser@example.com",
          contact: localStorage.getItem('user_phone') || "9999999999"
        },
        theme: {
          color: "#8B5CF6"
        },
        modal: {
          ondismiss: function () {
            console.log('❌ Payment cancelled by user')
            setLoading(false)
            toast.error('Payment cancelled')
            if (onFailure) onFailure()
          }
        }
      }

      // இ) பிரவுசரில் நேரடியாக Razorpay விண்டோவைத் திறக்கும் முக்கிய வரி
      const rzp = new window.Razorpay(options)
      
      // ✅ Handle payment failure
      rzp.on('payment.failed', function (response) {
        console.error('❌ Payment failed:', response)
        toast.error(response.error?.description || 'Payment failed')
        setLoading(false)
        if (onFailure) onFailure()
      })

      rzp.open()

    } catch (error) {
      console.error('Detailed Payment error:', error)
      
      // ஆப்ஜெக்ட்டாகக் காட்டாமல் அதனுள் இருக்கும் மெசேஜை மட்டும் பிரித்தெடுத்துக் காட்டுதல்
      const errorMsg = error.response?.data?.error || 
                       error.response?.data?.message || 
                       error.message || 
                       'Failed to initiate Razorpay'
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Payment failed')
      
      setLoading(false)
      if (onFailure) onFailure()
    }
  }

  if (paymentSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
        >
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-2xl font-bold text-green-500">Payment Successful!</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Your booking has been confirmed.
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Continue
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Complete Payment
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <FaTimes />
          </button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
              <p className="text-2xl font-bold text-primary-500">₹{amount}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Booking ID</p>
              <p className="font-medium">#{bookingId}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleSimplePayment}
            disabled={loading}
            className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all disabled:opacity-70"
          >
            {loading ? 'Processing...' : `Pay ₹${amount} (Test)`}
          </button>

          <button
            type="button"
            onClick={handleRazorpayPayment}
            disabled={loading || !razorpayLoaded}
            className="w-full py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-70"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : !razorpayLoaded ? (
              'Loading Razorpay...'
            ) : (
              `Pay ₹${amount} via Razorpay`
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          🔒 Your payment is secure. You will receive a confirmation email.
        </p>
      </motion.div>
    </div>
  )
}

export default RazorpayPayment