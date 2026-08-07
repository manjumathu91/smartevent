import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FaCreditCard, FaPaypal, FaWallet, FaTimes, FaCheckCircle } from 'react-icons/fa'
import toast from 'react-hot-toast'
import axios from '../../api/axios'

const PaymentModal = ({ isOpen, onClose, booking, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [loading, setLoading] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  if (!isOpen || !booking) return null

  const handlePayment = async () => {
    setLoading(true)
    try {
      // ✅ Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // ✅ Update booking payment status
      await axios.put(`/bookings/${booking.id}/payment`, {
        payment_status: 'completed',
        payment_method: paymentMethod
      })
      
      setPaymentSuccess(true)
      toast.success('Payment successful! 🎉')
      
      setTimeout(() => {
        if (onSuccess) onSuccess()
        onClose()
      }, 1500)
      
    } catch (error) {
      toast.error('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: <FaCreditCard /> },
    { id: 'paypal', name: 'PayPal', icon: <FaPaypal /> },
    { id: 'wallet', name: 'Wallet', icon: <FaWallet /> },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Complete Payment
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {paymentSuccess ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-green-500">Payment Successful!</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Your booking has been confirmed.
            </p>
          </div>
        ) : (
          <>
            {/* Booking Summary */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                Booking Summary
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Event</span>
                  <span className="font-medium">{booking.event?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Quantity</span>
                  <span className="font-medium">{booking.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total</span>
                  <span className="font-bold text-primary-500">
                    ${booking.total_amount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Booking Ref</span>
                  <span className="font-medium text-xs">{booking.booking_reference}</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Payment Method
              </label>
              <div className="grid grid-cols-3 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      paymentMethod === method.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-2xl mb-1 flex justify-center">
                      {method.icon}
                    </div>
                    <span className="text-xs text-center block">
                      {method.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Button */}
            <button
              type="button"
              onClick={handlePayment}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-70"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                `Pay $${booking.total_amount}`
              )}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              Your payment is secure. You will receive a confirmation email.
            </p>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default PaymentModal