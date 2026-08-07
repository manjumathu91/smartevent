
/**
 * Complete useLocalStorage Hook
 * Comprehensive localStorage management with React
 * Supports multiple features: sync, expiration, encryption, etc.
 */

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Main useLocalStorage hook with all features
 * @param {string} key - localStorage key
 * @param {any} initialValue - Default value if key doesn't exist
 * @param {Object} options - Configuration options
 * @param {Function} options.serialize - Custom serialize function (default: JSON.stringify)
 * @param {Function} options.deserialize - Custom deserialize function (default: JSON.parse)
 * @param {boolean} options.sync - Sync across tabs/windows (default: true)
 * @param {number} options.expiration - Expiration time in milliseconds
 * @param {Function} options.onError - Error handler
 * @param {boolean} options.encrypt - Enable encryption (default: false)
 * @param {string} options.secretKey - Secret key for encryption
 * @returns {Object} { value, setValue, removeValue, exists, getRaw, refresh }
 */
export const useLocalStorage = (key, initialValue, options = {}) => {
  // Default options
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    sync = true,
    expiration = null,
    onError = (error) => console.error(`LocalStorage error (${key}):`, error),
    encrypt = false,
    secretKey = null
  } = options

  // Refs
  const initialValueRef = useRef(initialValue)
  const keyRef = useRef(key)

  // Simple encryption/decryption (for demo - use proper encryption in production)
  const encryptData = useCallback((data) => {
    if (!encrypt || !secretKey) return data
    // Simple XOR encryption (for demo only - use proper encryption library)
    try {
      const encoded = encodeURIComponent(data)
      let result = ''
      for (let i = 0; i < encoded.length; i++) {
        result += String.fromCharCode(
          encoded.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length)
        )
      }
      return btoa(result)
    } catch (error) {
      onError(error)
      return data
    }
  }, [encrypt, secretKey, onError])

  const decryptData = useCallback((data) => {
    if (!encrypt || !secretKey) return data
    try {
      const decoded = atob(data)
      let result = ''
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(
          decoded.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length)
        )
      }
      return decodeURIComponent(result)
    } catch (error) {
      onError(error)
      return data
    }
  }, [encrypt, secretKey, onError])

  // Get stored value with expiration check
  const getStoredValue = useCallback(() => {
    try {
      const item = localStorage.getItem(key)
      if (item === null) {
        return initialValueRef.current instanceof Function 
          ? initialValueRef.current() 
          : initialValueRef.current
      }

      let parsed
      try {
        parsed = deserialize(item)
      } catch {
        // If deserialization fails, try raw
        parsed = item
      }

      // Check expiration
      if (parsed && typeof parsed === 'object' && parsed._expiry) {
        if (Date.now() > parsed._expiry) {
          localStorage.removeItem(key)
          return initialValueRef.current instanceof Function 
            ? initialValueRef.current() 
            : initialValueRef.current
        }
        return parsed._value
      }

      // Decrypt if enabled
      if (encrypt && typeof parsed === 'string') {
        try {
          return deserialize(decryptData(parsed))
        } catch {
          return parsed
        }
      }

      return parsed
    } catch (error) {
      onError(error)
      return initialValueRef.current instanceof Function 
        ? initialValueRef.current() 
        : initialValueRef.current
    }
  }, [key, deserialize, onError, encrypt, decryptData])

  // State
  const [storedValue, setStoredValue] = useState(getStoredValue)
  const [loading, setLoading] = useState(true)

  // Update localStorage
  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function 
        ? value(storedValue) 
        : value
      
      setStoredValue(valueToStore)

      let valueToSave = valueToStore

      // Add expiration
      if (expiration) {
        valueToSave = {
          _value: valueToStore,
          _expiry: Date.now() + expiration
        }
      }

      // Serialize
      let serialized = serialize(valueToSave)

      // Encrypt if enabled
      if (encrypt && secretKey) {
        serialized = encryptData(serialized)
      }

      localStorage.setItem(key, serialized)

      // Dispatch event for sync
      if (sync) {
        window.dispatchEvent(new StorageEvent('storage', {
          key: key,
          newValue: serialized,
          oldValue: localStorage.getItem(key)
        }))
      }
    } catch (error) {
      onError(error)
    }
  }, [key, storedValue, serialize, expiration, encrypt, secretKey, encryptData, sync, onError])

  // Remove item
  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key)
      const defaultValue = initialValueRef.current instanceof Function 
        ? initialValueRef.current() 
        : initialValueRef.current
      setStoredValue(defaultValue)
      
      // Dispatch event for sync
      if (sync) {
        window.dispatchEvent(new StorageEvent('storage', {
          key: key,
          newValue: null,
          oldValue: localStorage.getItem(key)
        }))
      }
    } catch (error) {
      onError(error)
    }
  }, [key, sync, onError])

  // Check if key exists
  const exists = useCallback(() => {
    return localStorage.getItem(key) !== null
  }, [key])

  // Get raw value (without parsing)
  const getRaw = useCallback(() => {
    return localStorage.getItem(key)
  }, [key])

  // Refresh value from localStorage
  const refresh = useCallback(() => {
    setStoredValue(getStoredValue())
  }, [getStoredValue])

  // Set loading to false after initial load
  useEffect(() => {
    setLoading(false)
  }, [])

  // Sync across tabs/windows
  useEffect(() => {
    if (!sync) return

    const handleStorageChange = (event) => {
      if (event.key === key && event.newValue !== null) {
        try {
          let value = event.newValue
          
          // Decrypt if enabled
          if (encrypt && secretKey) {
            try {
              value = decryptData(value)
            } catch {
              // If decryption fails, use as is
            }
          }

          const parsed = deserialize(value)
          
          // Check expiration
          if (parsed && typeof parsed === 'object' && parsed._expiry) {
            if (Date.now() > parsed._expiry) {
              localStorage.removeItem(key)
              const defaultValue = initialValueRef.current instanceof Function 
                ? initialValueRef.current() 
                : initialValueRef.current
              setStoredValue(defaultValue)
              return
            }
            setStoredValue(parsed._value)
          } else {
            setStoredValue(parsed)
          }
        } catch (error) {
          onError(error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, deserialize, sync, encrypt, secretKey, decryptData, onError])

  // Return value with loading state
  return {
    value: storedValue,
    setValue,
    removeValue,
    exists,
    getRaw,
    refresh,
    loading,
    // Aliases for convenience
    set: setValue,
    remove: removeValue,
    get: getRaw
  }
}

// ==================== SIMPLE VERSION (For backward compatibility) ====================

/**
 * Simple useLocalStorage hook (original version)
 * @param {string} key - localStorage key
 * @param {any} initialValue - Default value
 * @returns {[any, function, function]} - [value, setValue, removeValue]
 */
export const useLocalStorageSimple = (key, initialValue) => {
  // Get stored value
  const getStoredValue = () => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  }

  const [storedValue, setStoredValue] = useState(getStoredValue)

  // Set value
  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  // Remove value
  const removeValue = () => {
    try {
      localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue, removeValue]
}

// ==================== USE LOCAL STORAGE WITH EXPIRATION ====================

/**
 * useLocalStorageWithExpiry - Auto-expiring localStorage
 * @param {string} key - localStorage key
 * @param {any} initialValue - Default value
 * @param {number} expiryTime - Expiry time in milliseconds
 * @returns {[any, function, function]} - [value, setValue, removeValue]
 */
export const useLocalStorageWithExpiry = (key, initialValue, expiryTime = 3600000) => {
  const getStoredValue = () => {
    try {
      const item = localStorage.getItem(key)
      if (!item) return initialValue
      
      const parsed = JSON.parse(item)
      const now = Date.now()
      
      // Check if expired
      if (parsed.expiry && now > parsed.expiry) {
        localStorage.removeItem(key)
        return initialValue
      }
      
      return parsed.value
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  }

  const [storedValue, setStoredValue] = useState(getStoredValue)

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      const data = {
        value: valueToStore,
        expiry: Date.now() + expiryTime
      }
      
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  const removeValue = () => {
    try {
      localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue, removeValue]
}

// ==================== USE LOCAL STORAGE ARRAY ====================

/**
 * useLocalStorageArray - Manage array in localStorage
 * @param {string} key - localStorage key
 * @param {Array} initialValue - Default array
 * @returns {Object} - Array operations
 */
export const useLocalStorageArray = (key, initialValue = []) => {
  const [items, setItems, removeItems] = useLocalStorageSimple(key, initialValue)

  const addItem = (item) => {
    setItems(prev => [...prev, item])
  }

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index, newItem) => {
    setItems(prev => prev.map((item, i) => i === index ? newItem : item))
  }

  const clearItems = () => {
    setItems([])
  }

  const findItem = (predicate) => {
    return items.find(predicate)
  }

  const filterItems = (predicate) => {
    return items.filter(predicate)
  }

  return {
    items,
    setItems,
    addItem,
    removeItem,
    updateItem,
    clearItems,
    findItem,
    filterItems,
    length: items.length,
    isEmpty: items.length === 0
  }
}

// ==================== USE LOCAL STORAGE OBJECT ====================

/**
 * useLocalStorageObject - Manage object in localStorage
 * @param {string} key - localStorage key
 * @param {Object} initialValue - Default object
 * @returns {Object} - Object operations
 */
export const useLocalStorageObject = (key, initialValue = {}) => {
  const [obj, setObj, removeObj] = useLocalStorageSimple(key, initialValue)

  const setField = (field, value) => {
    setObj(prev => ({ ...prev, [field]: value }))
  }

  const getField = (field) => {
    return obj[field]
  }

  const removeField = (field) => {
    const { [field]: _, ...rest } = obj
    setObj(rest)
  }

  const mergeObject = (newObj) => {
    setObj(prev => ({ ...prev, ...newObj }))
  }

  const clearObject = () => {
    setObj({})
  }

  return {
    obj,
    setObj,
    setField,
    getField,
    removeField,
    mergeObject,
    clearObject,
    removeObj,
    keys: Object.keys(obj),
    values: Object.values(obj),
    entries: Object.entries(obj)
  }
}

// ==================== USE LOCAL STORAGE BOOLEAN ====================

/**
 * useLocalStorageBoolean - Manage boolean in localStorage
 * @param {string} key - localStorage key
 * @param {boolean} initialValue - Default value
 * @returns {Object} - Boolean operations
 */
export const useLocalStorageBoolean = (key, initialValue = false) => {
  const [value, setValue, removeValue] = useLocalStorageSimple(key, initialValue)

  const toggle = () => {
    setValue(prev => !prev)
  }

  const setTrue = () => {
    setValue(true)
  }

  const setFalse = () => {
    setValue(false)
  }

  return {
    value,
    setValue,
    toggle,
    setTrue,
    setFalse,
    removeValue
  }
}

// ==================== USE LOCAL STORAGE NUMBER ====================

/**
 * useLocalStorageNumber - Manage number in localStorage
 * @param {string} key - localStorage key
 * @param {number} initialValue - Default value
 * @returns {Object} - Number operations
 */
export const useLocalStorageNumber = (key, initialValue = 0) => {
  const [value, setValue, removeValue] = useLocalStorageSimple(key, initialValue)

  const increment = (amount = 1) => {
    setValue(prev => Number(prev) + amount)
  }

  const decrement = (amount = 1) => {
    setValue(prev => Number(prev) - amount)
  }

  const reset = () => {
    setValue(initialValue)
  }

  return {
    value,
    setValue,
    increment,
    decrement,
    reset,
    removeValue
  }
}

// ==================== USE SESSION STORAGE ====================

/**
 * useSessionStorage - Same as localStorage but with sessionStorage
 * @param {string} key - sessionStorage key
 * @param {any} initialValue - Default value
 * @returns {[any, function, function]} - [value, setValue, removeValue]
 */
export const useSessionStorage = (key, initialValue) => {
  const getStoredValue = () => {
    try {
      const item = sessionStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error)
      return initialValue
    }
  }

  const [storedValue, setStoredValue] = useState(getStoredValue)

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      sessionStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error)
    }
  }

  const removeValue = () => {
    try {
      sessionStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.error(`Error removing sessionStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue, removeValue]
}

// ==================== DEFAULT EXPORT ====================

export default useLocalStorage