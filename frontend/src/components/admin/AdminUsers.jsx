
import React, { useState, useEffect, useRef } from 'react'
import { FaSearch, FaEdit, FaTrash, FaUserPlus, FaBan, FaCheckCircle, FaTimes, FaSave } from 'react-icons/fa'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import axios from '../../api/axios'
import LoadingSpinner from '../common/LoadingSpinner'
import Pagination from '../common/Pagination'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    per_page: 20
  })
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [editFormErrors, setEditFormErrors] = useState({})

  // ✅ ADD FORM REFS
  const addUsernameRef = useRef(null)
  const addEmailRef = useRef(null)
  const addPhoneRef = useRef(null)
  const addPasswordRef = useRef(null)
  const addConfirmPasswordRef = useRef(null)
  const addRoleRef = useRef(null)
  const addStatusRef = useRef(null)

  // ✅ EDIT FORM REFS
  const editUsernameRef = useRef(null)
  const editEmailRef = useRef(null)
  const editPhoneRef = useRef(null)
  const editPasswordRef = useRef(null)
  const editConfirmPasswordRef = useRef(null)
  const editRoleRef = useRef(null)
  const editStatusRef = useRef(null)

  // ✅ Store edit user ID separately
  const [editUserId, setEditUserId] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [pagination.page, roleFilter, statusFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/admin/users', {
        params: {
          page: pagination.page,
          per_page: 20,
          role: roleFilter,
          status: statusFilter,
          search: searchTerm
        }
      })
      setUsers(response.data.users || [])
      setPagination({
        total: response.data.total || 0,
        page: response.data.page || 1,
        pages: response.data.pages || 1,
        per_page: response.data.per_page || 20
      })
    } catch (error) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchUsers()
  }

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ==================== ADD USER FUNCTIONS ====================

  const getAddFormData = () => ({
    username: addUsernameRef.current?.value || '',
    email: addEmailRef.current?.value || '',
    phone: addPhoneRef.current?.value || '',
    password: addPasswordRef.current?.value || '',
    confirmPassword: addConfirmPasswordRef.current?.value || '',
    role: addRoleRef.current?.value || 'user',
    status: addStatusRef.current?.value || 'active'
  })

  const resetAddForm = () => {
    if (addUsernameRef.current) addUsernameRef.current.value = ''
    if (addEmailRef.current) addEmailRef.current.value = ''
    if (addPhoneRef.current) addPhoneRef.current.value = ''
    if (addPasswordRef.current) addPasswordRef.current.value = ''
    if (addConfirmPasswordRef.current) addConfirmPasswordRef.current.value = ''
    if (addRoleRef.current) addRoleRef.current.value = 'user'
    if (addStatusRef.current) addStatusRef.current.value = 'active'
    setFormErrors({})
  }

  const validateAddForm = () => {
    const data = getAddFormData()
    const errors = {}
    
    const username = data.username || ''
    const email = data.email || ''
    const password = data.password || ''
    const confirmPassword = data.confirmPassword || ''
    
    if (!username || username.trim() === '') errors.username = 'Username is required'
    else if (username.length < 3) errors.username = 'Username must be at least 3 characters'
    
    if (!email || email.trim() === '') errors.email = 'Email is required'
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) errors.email = 'Enter valid email'
    
    if (!password || password === '') errors.password = 'Password is required'
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters'
    else if (!/[A-Z]/.test(password)) errors.password = 'Password needs at least 1 uppercase letter'
    else if (!/[a-z]/.test(password)) errors.password = 'Password needs at least 1 lowercase letter'
    else if (!/[0-9]/.test(password)) errors.password = 'Password needs at least 1 number'
    
    if (!confirmPassword || confirmPassword === '') errors.confirmPassword = 'Please confirm your password'
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match'
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddUser = () => {
    if (!validateAddForm()) {
      toast.error('Please fix the errors')
      return
    }

    const data = getAddFormData()
    setSubmitting(true)
    
    axios.post('/admin/users', {
      username: (data.username || '').trim(),
      email: (data.email || '').trim(),
      phone: data.phone || '',
      password: data.password || '',
      role: data.role || 'user',
      status: data.status || 'active'
    })
    .then(() => {
      toast.success('User added successfully! 🎉')
      setShowAddModal(false)
      resetAddForm()
      fetchUsers()
    })
    .catch((error) => {
      toast.error(error.response?.data?.error || 'Failed to add user')
    })
    .finally(() => setSubmitting(false))
  }

  // ==================== EDIT USER FUNCTIONS ====================

  const handleEditClick = (user) => {
    setEditUserId(user.id)
    // ✅ Set values in refs
    if (editUsernameRef.current) editUsernameRef.current.value = user.username || ''
    if (editEmailRef.current) editEmailRef.current.value = user.email || ''
    if (editPhoneRef.current) editPhoneRef.current.value = user.phone || ''
    if (editPasswordRef.current) editPasswordRef.current.value = ''
    if (editConfirmPasswordRef.current) editConfirmPasswordRef.current.value = ''
    if (editRoleRef.current) editRoleRef.current.value = user.role || 'user'
    if (editStatusRef.current) editStatusRef.current.value = user.status || 'active'
    setEditFormErrors({})
    setShowEditModal(true)
  }

  // ✅ FIXED: Get edit form data correctly
  const getEditFormData = () => {
    return {
      username: editUsernameRef.current?.value || '',
      email: editEmailRef.current?.value || '',
      phone: editPhoneRef.current?.value || '',
      password: editPasswordRef.current?.value || '',
      confirmPassword: editConfirmPasswordRef.current?.value || '',
      role: editRoleRef.current?.value || 'user',
      status: editStatusRef.current?.value || 'active'
    }
  }

  const validateEditForm = () => {
    const data = getEditFormData()
    const errors = {}
    
    const username = data.username || ''
    const email = data.email || ''
    const password = data.password || ''
    const confirmPassword = data.confirmPassword || ''
    
    if (!username || username.trim() === '') errors.username = 'Username is required'
    else if (username.length < 3) errors.username = 'Username must be at least 3 characters'
    
    if (!email || email.trim() === '') errors.email = 'Email is required'
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) errors.email = 'Enter valid email'
    
    if (password && password.length > 0) {
      if (password.length < 6) errors.password = 'Password must be at least 6 characters'
      if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match'
    }
    
    setEditFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ✅ FIXED: Edit User - Properly gets data and updates
  const handleUpdateUser = () => {
    if (!validateEditForm()) {
      toast.error('Please fix the errors')
      return
    }

    // ✅ Get data from refs
    const data = getEditFormData()
    console.log('📝 Edit Data:', data) // Debug log
    
    setSubmitting(true)
    
    const updateData = {
      username: (data.username || '').trim(),
      email: (data.email || '').trim(),
      phone: data.phone || '',
      role: data.role || 'user',
      status: data.status || 'active'
    }
    
    if (data.password) {
      updateData.password = data.password
    }
    
    console.log('📤 Sending update:', updateData) // Debug log
    
    axios.put(`/admin/users/${editUserId}`, updateData)
      .then((response) => {
        console.log('✅ Update response:', response.data) // Debug log
        toast.success('User updated successfully! ✅')
        setShowEditModal(false)
        // ✅ Refresh the list
        fetchUsers()
      })
      .catch((error) => {
        console.error('❌ Update error:', error) // Debug log
        toast.error(error.response?.data?.error || 'Failed to update user')
      })
      .finally(() => setSubmitting(false))
  }

  // ==================== BLOCK/UNBLOCK ====================

  const handleBlockUser = (userId) => {
    if (!window.confirm('Block this user?')) return
    axios.put(`/admin/users/${userId}`, { status: 'blocked' })
      .then(() => { toast.success('User blocked'); fetchUsers() })
      .catch(() => toast.error('Failed to block user'))
  }

  const handleUnblockUser = (userId) => {
    axios.put(`/admin/users/${userId}`, { status: 'active' })
      .then(() => { toast.success('User unblocked'); fetchUsers() })
      .catch(() => toast.error('Failed to unblock user'))
  }

  const handleDeleteUser = (userId) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return
    axios.delete(`/admin/users/${userId}`)
      .then(() => { toast.success('User deleted'); fetchUsers() })
      .catch(() => toast.error('Failed to delete user'))
  }

  const handleRoleChange = (userId, role) => {
    axios.put(`/admin/users/${userId}`, { role })
      .then(() => { toast.success('Role updated'); fetchUsers() })
      .catch(() => toast.error('Failed to update role'))
  }

  // ==================== ADD USER MODAL ====================

  const AddUserModal = () => {
    if (!showAddModal) return null

    return (
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowAddModal(false)
            resetAddForm()
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Add New User</h2>
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false)
                resetAddForm()
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <FaTimes />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                ref={addUsernameRef}
                defaultValue=""
                className={`w-full px-4 py-2 rounded-lg border ${
                  formErrors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500`}
                placeholder="e.g., john_doe"
              />
              {formErrors.username && <p className="mt-1 text-sm text-red-500">{formErrors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                ref={addEmailRef}
                defaultValue=""
                className={`w-full px-4 py-2 rounded-lg border ${
                  formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500`}
                placeholder="e.g., john@example.com"
              />
              {formErrors.email && <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="tel"
                ref={addPhoneRef}
                defaultValue=""
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., +1 234 567 8900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                ref={addPasswordRef}
                defaultValue=""
                className={`w-full px-4 py-2 rounded-lg border ${
                  formErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500`}
                placeholder="Min 6 chars, 1 uppercase, 1 lowercase, 1 number"
              />
              {formErrors.password && <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                ref={addConfirmPasswordRef}
                defaultValue=""
                className={`w-full px-4 py-2 rounded-lg border ${
                  formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500`}
                placeholder="Re-enter password"
              />
              {formErrors.confirmPassword && <p className="mt-1 text-sm text-red-500">{formErrors.confirmPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                ref={addRoleRef}
                defaultValue="user"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                ref={addStatusRef}
                defaultValue="active"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleAddUser}
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-70"
            >
              {submitting ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ==================== EDIT USER MODAL ====================

  const EditUserModal = () => {
    if (!showEditModal) return null

    return (
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowEditModal(false)
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Edit User</h2>
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false)
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <FaTimes />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                ref={editUsernameRef}
                defaultValue=""
                className={`w-full px-4 py-2 rounded-lg border ${
                  editFormErrors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500`}
                placeholder="Enter username"
              />
              {editFormErrors.username && <p className="mt-1 text-sm text-red-500">{editFormErrors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                ref={editEmailRef}
                defaultValue=""
                className={`w-full px-4 py-2 rounded-lg border ${
                  editFormErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500`}
                placeholder="Enter email"
              />
              {editFormErrors.email && <p className="mt-1 text-sm text-red-500">{editFormErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="tel"
                ref={editPhoneRef}
                defaultValue=""
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="password"
                ref={editPasswordRef}
                defaultValue=""
                className={`w-full px-4 py-2 rounded-lg border ${
                  editFormErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500`}
                placeholder="Leave blank to keep current"
              />
              {editFormErrors.password && <p className="mt-1 text-sm text-red-500">{editFormErrors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                ref={editConfirmPasswordRef}
                defaultValue=""
                className={`w-full px-4 py-2 rounded-lg border ${
                  editFormErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500`}
                placeholder="Confirm new password"
              />
              {editFormErrors.confirmPassword && <p className="mt-1 text-sm text-red-500">{editFormErrors.confirmPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                ref={editRoleRef}
                defaultValue="user"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                ref={editStatusRef}
                defaultValue="active"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleUpdateUser}
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-70"
            >
              {submitting ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ==================== RENDER ====================

  if (loading) {
    return <LoadingSpinner size="lg" />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Users</h1>
          <p className="text-gray-500">{pagination.total} users found</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2"
        >
          <FaUserPlus /> Add User
        </button>
      </div>

      <div className="flex gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300"
          />
        </form>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
          <option value="pending">Pending</option>
        </select>
        <button
          onClick={() => {
            setSearchTerm('')
            setRoleFilter('')
            setStatusFilter('')
            fetchUsers()
          }}
          className="px-4 py-2 text-red-500"
        >
          Clear
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.profile_image || `https://ui-avatars.com/api/?name=${user.username}&size=40`}
                      alt={user.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="px-2 py-1 border rounded-lg text-sm"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-green-100 text-green-700' :
                    user.status === 'blocked' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {user.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleEditClick(user)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                      <FaEdit />
                    </button>
                    {user.status === 'active' ? (
                      <button onClick={() => handleBlockUser(user.id)} className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg">
                        <FaBan />
                      </button>
                    ) : (
                      <button onClick={() => handleUnblockUser(user.id)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg">
                        <FaCheckCircle />
                      </button>
                    )}
                    <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={handlePageChange}
        />
      )}

      <AddUserModal />
      <EditUserModal />
    </div>
  )
}

export default AdminUsers