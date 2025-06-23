import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPhone, FiKey, FiEye, FiEyeOff } from 'react-icons/fi'; 

const GuestLogin = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const [showPin, setShowPin] = useState(false);
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/guest/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                const guestData = {
                    token: result.token,
                    name: result.name,
                    tutorId: result.tutorId,
                    centerCoordinates: result.centerCoordinates,
                    centerId: result.centerId
                };
                localStorage.setItem('guestData', JSON.stringify(guestData));
                localStorage.setItem('token', result.token); 
                toast.success(result.message || 'Login successful');
                navigate('/guest-dashboard'); 
            } else {
                toast.error(result.message || result.error || 'Invalid credentials or login failed');
            }
        } catch (error) {
            toast.error('Login request failed. Please try again.');
            console.error('Login Error:', error);
        }
        setLoading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
        >
            <div className="bg-white rounded-2xl shadow-medium p-8 md:p-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-100 text-accent-600 mb-4">
                        <FiKey size={32} />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        Guest Tutor Login
                    </h1>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Enter your phone number and 4-digit PIN.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label
                            htmlFor="phone"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Phone Number
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <FiPhone size={18} />
                            </div>
                            <input
                                id="phone"
                                type="tel"
                                {...register('phone', {
                                    required: 'Phone number is required',
                                    pattern: {
                                        value: /^[0-9]{10}$/,
                                        message: 'Phone number must be 10 digits'
                                    }
                                })}
                                className={`w-full pl-10 pr-4 py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 ${errors.phone ? 'focus:ring-red-500' : 'focus:ring-accent-500'} focus:border-transparent transition-colors`}
                                placeholder="Enter your phone number"
                            />
                        </div>
                        {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone.message}</p>}
                    </div>

                    <div>
                        <label
                            htmlFor="pin"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            4-Digit PIN
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <FiKey size={18} />
                            </div>
                            <input
                                id="pin"
                                type={showPin ? "text" : "password"}
                                {...register('pin', {
                                    required: 'PIN is required',
                                    pattern: {
                                        value: /^[0-9]{4}$/,
                                        message: 'PIN must be a 4-digit number'
                                    }
                                })}
                                className={`w-full pl-10 pr-12 py-3 border ${errors.pin ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 ${errors.pin ? 'focus:ring-red-500' : 'focus:ring-accent-500'} focus:border-transparent transition-colors`}
                                placeholder="Enter your 4-digit PIN"
                                maxLength={4}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPin(!showPin)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                {showPin ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                            </button>
                        </div>
                        {errors.pin && <p className="text-red-600 text-xs mt-1">{errors.pin.message}</p>}
                    </div>

                    <motion.button
                        type="submit"
                        className="w-full btn bg-gradient-to-r from-accent-600 to-primary-600 text-white hover:from-accent-700 hover:to-primary-700 py-3 rounded-lg text-lg font-medium transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center"
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Logging in...
                            </>
                        ) : (
                            'Login'
                        )}
                    </motion.button>
                </form>
            </div>
        </motion.div>
    );
};

export default GuestLogin;
