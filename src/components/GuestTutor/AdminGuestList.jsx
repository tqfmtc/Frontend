import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const AdminGuestList = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const fetchPendingRequests = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/guest/pending`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || JSON.parse(localStorage.getItem('userData')||'{}').token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
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

    const handleApprove = async (requestId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/guest/approve/${requestId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || JSON.parse(localStorage.getItem('userData')||'{}').token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Request approved successfully');
                // Remove the approved request from the list
                setRequests(requests.filter(req => req._id !== requestId));
            } else {
                toast.error(data.error || 'Failed to approve request');
            }
        } catch (error) {
            toast.error('Failed to approve request');
            console.error('Error:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-700">Pending Guest Tutor Requests</h2>
            
            {requests.length === 0 ? (
                <div className="text-left py-8 bg-gray-50 rounded-lg px-6">
                    <p className="text-gray-500">No pending requests found</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tutor Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Phone Number
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Qualification
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Absence Duration
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.map((request) => (
                                <tr key={request._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.tutor.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.guest.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.guest.qualification}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(request.dateRange.startDate).toLocaleDateString('en-GB')} - {new Date(request.dateRange.endDate).toLocaleDateString('en-GB')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleApprove(request._id)}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Approve
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminGuestList;
