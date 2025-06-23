import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FiUser, FiPhone, FiAward, FiCalendar, FiSend, FiLoader, FiUserPlus } from 'react-icons/fi';
import { motion } from 'framer-motion';

const GuestTutorForm = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const [dateRange, setDateRange] = useState([null, null]);
    const [loading, setLoading] = useState(false);
    const [startDate, endDate] = dateRange;

    const handleDateChange = (update) => {
        const [start, end] = update;
        // If a start date is selected but no end date, it's a single-day selection.
        // We now allow the user to click a second time to select an end date.
        // The logic in onSubmit will handle the case where endDate is null.
        setDateRange(update);
    };

    const onSubmit = async (data) => {
        if (!startDate) {
            toast.error('Please select a date for your absence.');
            return;
        }

        setLoading(true);
        try {
            // If endDate is not selected, use startDate as the endDate for a single-day request.
            const finalEndDate = endDate || startDate;

            const requestData = {
                ...data,
                dateRange: {
                    startDate: startDate.toISOString(),
                    endDate: finalEndDate.toISOString()
                }
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/guest/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userData')||'{}').token}`
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error Response:', errorText);
                throw new Error(errorText);
            }

            const result = await response.json();

            if (response.ok) {
                toast.success('Guest tutor request submitted successfully');
                reset();
                setDateRange([null, null]);
            } else {
                toast.error(result.message || 'Failed to submit request');
            }
        } catch (error) {
            toast.error('An unexpected error occurred. Please try again.');
            console.error('Submission Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-8 max-w-lg mx-auto"
        >
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                    <FiUserPlus size={32} />
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Request a Substitute</h2>
                <p className="text-gray-500 mt-2">Fill out the form to request a guest tutor for your absence.</p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Guest's Full Name</label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                            <FiUser className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            id="name"
                            {...register('name', { required: 'Full name is required' })}
                            className="block w-full rounded-lg border-gray-300 pl-10 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm transition"
                            placeholder="e.g., Jane Doe"
                        />
                    </div>
                    {errors.name && <span className="text-red-500 text-xs mt-1">{errors.name.message}</span>}
                </div>

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Guest's Phone Number</label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                            <FiPhone className="text-gray-400" />
                        </div>
                        <input
                            type="tel"
                            id="phone"
                            {...register('phone', { 
                                required: 'Phone number is required',
                                pattern: { value: /^\d{10}$/, message: 'Enter a valid 10-digit phone number' }
                            })}
                            className="block w-full rounded-lg border-gray-300 pl-10 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm transition"
                            placeholder="e.g., 9876543210"
                        />
                    </div>
                    {errors.phone && <span className="text-red-500 text-xs mt-1">{errors.phone.message}</span>}
                </div>

                <div>
                    <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 mb-1">Guest's Qualification</label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                            <FiAward className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            id="qualification"
                            {...register('qualification', { required: 'Qualification is required' })}
                            className="block w-full rounded-lg border-gray-300 pl-10 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm transition"
                            placeholder="e.g., B.Sc. in Physics"
                        />
                    </div>
                    {errors.qualification && <span className="text-red-500 text-xs mt-1">{errors.qualification.message}</span>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Absence Duration</label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                            <FiCalendar className="text-gray-400" />
                        </div>
                        <DatePicker
                            selectsRange={true}
                            startDate={startDate}
                            endDate={endDate}
                            onChange={handleDateChange}
                            isClearable={true}
                            placeholderText="Select leave start and end date"
                            className="block w-full rounded-lg border-gray-300 pl-10 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm transition"
                            wrapperClassName="w-full"
                            minDate={new Date()}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!startDate || loading}
                    className="w-full flex justify-center items-center gap-2 bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <FiLoader className="animate-spin mr-2" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <FiSend />
                            Submit Request
                        </>
                    )}
                </button>
            </form>
        </motion.div>
    );
};

export default GuestTutorForm;
