import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FiUser, FiLock, FiMail, FiPhone, FiUserPlus, FiEye, FiEyeOff } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import SupervisorDashboard from '../components/supervisor2/SupervisorDashboard'
import Footer from '../components/Footer'

const SupervisorPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [error, setError] = useState('')
  const [showSignup, setShowSignup] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'supervisor'
  })
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Check if already logged in
    const supervisorProfile = localStorage.getItem('userData');
    if (supervisorProfile) {
      try {
        const parsedData = JSON.parse(supervisorProfile);
        if (parsedData && parsedData._id && parsedData.role === 'supervisor') {
          setIsLoggedIn(true);
          navigate('/supervisor-dashboard');
        } else {
          localStorage.removeItem('userData');
        }
      } catch (error) {
        localStorage.removeItem('userData');
      }
    }
  }, [navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/supervisor/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: username,
          password: password
        }),
      });

      const data = await response.json();
      console.log('Supervisor login response:', data); // Debug log

      if (response.ok && data.token) {
        localStorage.setItem('userData', JSON.stringify({
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          assignedCenters: data.assignedCenters,
          token: data.token
        }));
        setIsLoggedIn(true);
        navigate('/supervisor-dashboard', { replace: true });
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };
  
  const handleSignupSubmit = (e) => {
    e.preventDefault()
    setError('')

    // Here you would implement the signup logic
    // For now, just show a success message
    alert('Signup request sent to main supervisor for approval')
    setShowSignup(false)
  }

  const handleSignupChange = (e) => {
    const { name, value } = e.target
    setSignupData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  if (isLoggedIn) {
    return <SupervisorDashboard />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 pt-24 pb-16 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-medium p-8 md:p-10">
          {!showSignup ? (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                  <FiUser size={32} />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Supervisor Login</h1>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                <div className="relative">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <FiUser size={18} />
                    </div>
                    <input
                      id="username"
                      type="email"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="supervisor@gmail.com"
                      required
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <FiLock size={18} />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>
                
                <motion.button
                  type="submit"
                  className="w-full btn bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-700 hover:to-secondary-700 py-3 rounded-lg text-lg font-medium transition-all duration-200 transform hover:scale-[1.02]"
                  whileTap={{ scale: 0.98 }}
                >
                  Login
                </motion.button>
              </form>


            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                  <FiUserPlus size={32} />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Request Supervisor Access</h1>
              </div>

              <form onSubmit={handleSignupSubmit} className="space-y-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={signupData.name}
                    onChange={handleSignupChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    required
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <FiMail size={18} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={signupData.email}
                      onChange={handleSignupChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <FiPhone size={18} />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={signupData.phone}
                      onChange={handleSignupChange}
                      pattern="[0-9]{10}"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <FiLock size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={signupData.password}
                      onChange={handleSignupChange}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <FiLock size={18} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={signupData.confirmPassword}
                      onChange={handleSignupChange}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowSignup(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    className="flex-1 btn bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-700 hover:to-secondary-700 py-3 rounded-lg text-lg font-medium transition-all duration-200 transform hover:scale-[1.02]"
                    whileTap={{ scale: 0.98 }}
                  >
                    Submit Request
                  </motion.button>
                </div>
              </form>
            </>
          )}
        </div>
      </motion.div>
      
    </div>
  )
}

export default SupervisorPage