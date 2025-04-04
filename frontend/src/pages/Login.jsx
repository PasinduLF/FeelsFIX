import React, { useContext, useState, useEffect } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const Login = () => {
  const { backendUrl, token, setToken } = useContext(AppContext)
  const navigate = useNavigate()

  const [state, setState] = useState('Sign Up')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token, navigate])

  // Handle input changes with strict name validation
  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Strict validation for name field - only letters and spaces
    if (name === 'name') {
      // Remove any non-alphabetic characters and extra spaces
      const cleanedValue = value.replace(/[^a-zA-Z\s]/g, '')
                             .replace(/\s{2,}/g, ' ')
                             .trimStart()
      setFormData({
        ...formData,
        [name]: cleanedValue
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
  }

  // Form validation
  const validate = () => {
    const newErrors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
    const nameRegex = /^[a-zA-Z\s]+$/ // Only letters and single spaces

    // Name validation (only for sign up)
    if (state === 'Sign Up') {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required'
      } else if (!nameRegex.test(formData.name)) {
        newErrors.name = 'Name should only contain letters and spaces'
      } else if (formData.name.trim().length < 2) {
        newErrors.name = 'Name should be at least 2 characters'
      } else if (formData.name.length > 50) {
        newErrors.name = 'Name should be less than 50 characters'
      }
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with at least one letter and one number'
    }

    // Confirm password validation (only for sign up)
    if (state === 'Sign Up' && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Form submission
  const onSubmitHandler = async (event) => {
    event.preventDefault()
    
    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      const endpoint = state === 'Sign Up' ? '/api/user/register' : '/api/user/login'
      const payload = state === 'Sign Up' 
        ? { 
            name: formData.name.replace(/\s{2,}/g, ' ').trim(), // Clean name before submission
            email: formData.email, 
            password: formData.password 
          }
        : { email: formData.email, password: formData.password }

      const { data } = await axios.post(backendUrl + endpoint, payload)
      
      if (data.success) {
        localStorage.setItem('token', data.token)
        setToken(data.token)
        toast.success(state === 'Sign Up' ? 'Account created successfully!' : 'Logged in successfully!')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle between login and signup
  const toggleState = () => {
    setState(prev => prev === 'Sign Up' ? 'Login' : 'Sign Up')
    setErrors({})
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
  }

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg'>
        <p className='text-2xl font-semibold'>{state === 'Sign Up' ? "Create Account" : "Login"}</p>
        <p>Please {state === 'Sign Up' ? "sign up" : "log in"} to book appointment</p>
        
        {/* Name Field (Sign Up only) */}
        {state === "Sign Up" && (
          <div className='w-full'>
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              className={`border ${errors.name ? 'border-red-500' : 'border-zinc-300'} rounded w-full p-2 mt-1`}
              type="text"
              onChange={handleChange}
              value={formData.name}
              placeholder="Enter your full name (letters only)"
              pattern="[a-zA-Z\s]+" // HTML5 pattern validation
              title="Only alphabetic characters and spaces allowed"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
        )}
        
        {/* Email Field */}
        <div className='w-full'>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            className={`border ${errors.email ? 'border-red-500' : 'border-zinc-300'} rounded w-full p-2 mt-1`}
            type="email"
            onChange={handleChange}
            value={formData.email}
            placeholder="Enter your email"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        
        {/* Password Field */}
        <div className='w-full'>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            className={`border ${errors.password ? 'border-red-500' : 'border-zinc-300'} rounded w-full p-2 mt-1`}
            type="password"
            onChange={handleChange}
            value={formData.password}
            placeholder="Enter your password"
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          {state === 'Sign Up' && (
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters with at least one letter and one number
            </p>
          )}
        </div>
        
        {/* Confirm Password Field (Sign Up only) */}
        {state === "Sign Up" && (
          <div className='w-full'>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              className={`border ${errors.confirmPassword ? 'border-red-500' : 'border-zinc-300'} rounded w-full p-2 mt-1`}
              type="password"
              onChange={handleChange}
              value={formData.confirmPassword}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>
        )}
        
        {/* Submit Button */}
        <button
          type='submit'
          disabled={isSubmitting}
          className={`bg-primary text-white w-full py-2 rounded-md text-base ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'Processing...' : (state === 'Sign Up' ? "Create Account" : "Login")}
        </button>
        
        {/* Toggle Link */}
        <p className="text-sm">
          {state === "Sign Up"
            ? "Already have an account? "
            : "Don't have an account? "}
          <span
            onClick={toggleState}
            className='text-primary underline cursor-pointer hover:text-primary-dark'
          >
            {state === "Sign Up" ? "Login here" : "Sign up here"}
          </span>
        </p>
      </div>
    </form>
  )
}

export default Login