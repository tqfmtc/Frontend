import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiInbox, FiUser, FiPhone, FiAward, FiCalendar, FiHash, FiLoader, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

const GuestTutorList = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/guest/my-requests`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || JSON.parse(localStorage.getItem('userData')||'{}').token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                // Backend returns { success, data: [...] }
                const list = Array.isArray(data) ? data : (data.data || []);
                setRequests(list);
            } else {
                toast.error(data.error || 'Failed to fetch requests');
            }
        } catch (error) {
            toast.error('Failed to fetch requests');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending':
                return { icon: <FiClock className="mr-2" />, class: 'bg-yellow-100 text-yellow-800' };
            case 'approved':
                return { icon: <FiCheckCircle className="mr-2" />, class: 'bg-green-100 text-green-800' };
            case 'rejected':
                return { icon: <FiXCircle className="mr-2" />, class: 'bg-red-100 text-red-800' };
            default:
                return { icon: <FiClock className="mr-2" />, class: 'bg-gray-100 text-gray-800' };
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FiLoader className="animate-spin text-primary-600 text-4xl" />
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-medium p-8"
        >
            <h2 className="text-2xl font-bold mb-6 text-gray-900">My Requests</h2>
            
            {requests.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg flex flex-col justify-center items-center">
                    <FiInbox className="mx-auto text-gray-400 text-5xl mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700">No Requests Yet</h3>
                    <p className="text-gray-500 mt-1">Your guest tutor requests will appear here.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {requests.map((request) => {
                        const statusInfo = getStatusInfo(request.status);
                        return (
                            <div key={request._id} className="border border-gray-200 bg-white p-6 rounded-xl transition-shadow hover:shadow-lg">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 flex items-center">
                                            <FiUser className="mr-3 text-primary-500" />
                                            {request.guest.name}
                                        </h3>
                                        <p className="text-gray-500 flex items-center mt-1">
                                            <FiPhone className="mr-3 text-gray-400" />
                                            {request.guest.phone}
                                        </p>
                                    </div>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.class}`}>
                                        {statusInfo.icon}
                                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 border-t border-gray-100 pt-4">
                                    <div className="flex items-center">
                                        <FiAward className="text-gray-400 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-500">Qualification</p>
                                            <p className="font-medium text-gray-800">{request.guest.qualification}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <FiCalendar className="text-gray-400 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-500">Duration</p>
                                            <p className="font-medium text-gray-800">
                                                {new Date(request.dateRange.startDate).toLocaleDateString('en-GB')} - {new Date(request.dateRange.endDate).toLocaleDateString('en-GB')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {request.status === 'approved' && request.pins && (
                                    <div className="mt-4 border-t border-gray-100 pt-4">
                                        <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                                            <FiHash className="mr-2" />
                                            Daily Login PINs
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {request.pins.map((pin, index) => (
                                                <div key={index} className="bg-primary-50 p-3 rounded-lg text-center">
                                                    <p className="text-xs text-primary-700">
                                                        {new Date(pin.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                    </p>
                                                    <p className="text-2xl font-mono font-bold text-primary-600 tracking-widest mt-1">
                                                        {pin.pin}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </motion.div>
    );
};

export default GuestTutorList;
