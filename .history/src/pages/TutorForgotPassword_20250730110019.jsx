import { useState } from "react";
import { motion } from "framer-motion";
import { FiPhone, FiMail, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import { Link } from "react-router-dom";
import usePost from "../components/CustomHooks/usePost";

const TutorForgotPassword = () => {
  const [tutorNumber, setTutorNumber] = useState("");
  const [tutorMail, setTutorMail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { post, loading } = usePost();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const payload = {
        tutorNumber: tutorNumber,
        tutorMail: tutorMail
      };

      const result = await post(`${import.meta.env.VITE_API_URL}/auth/tutor/forgot-password`, payload);
      
      if (result && result.data) {
        setSuccess(result.data.message || "Password reset link has been sent to the given email");
        // Clear form fields on success
        setTutorNumber("");
        setTutorMail("");
      }
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setError(err.response.data.message || "Phone number and email do not match.");
      } else {
        setError(err.message || "Network error or server not responding.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 to-primary-50 pt-24 pb-16 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-medium p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-100 text-accent-600 mb-4">
              <FiMail size={32} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Reset Password
            </h1>
            <p className="text-gray-600 mt-2">
              Enter your phone number and email to receive a password reset link
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm flex items-center">
                <FiCheckCircle className="mr-2 flex-shrink-0" />
                {success}
              </div>
            )}

            <div className="relative">
              <label
                htmlFor="tutorNumber"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FiPhone size={18} />
                </div>
                <input
                  id="tutorNumber"
                  type="tel"
                  value={tutorNumber}
                  onChange={(e) => setTutorNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                  placeholder="Enter your phone number"
                  required
                  pattern="[0-9]{10}"
                />
              </div>
            </div>

            <div className="relative">
              <label
                htmlFor="tutorMail"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FiMail size={18} />
                </div>
                <input
                  id="tutorMail"
                  type="email"
                  value={tutorMail}
                  onChange={(e) => setTutorMail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>

            <motion.button
              type="submit"
              className="w-full btn bg-gradient-to-r from-accent-600 to-primary-600 text-white hover:from-accent-700 hover:to-primary-700 py-3 rounded-lg text-lg font-medium transition-all duration-200 transform hover:scale-[1.02]"
              whileTap={{ scale: 0.98 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending Reset Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/tutor"
              className="inline-flex items-center text-sm text-accent-600 hover:text-accent-700 transition-colors"
            >
              <FiArrowLeft className="mr-2" size={16} />
              Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TutorForgotPassword;