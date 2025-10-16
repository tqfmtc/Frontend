import React, { useEffect, useState } from "react";
import { FiActivity, FiCalendar, FiToggleLeft, FiToggleRight, FiLoader } from "react-icons/fi";

const AttendanceController = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toggleLoading, setToggleLoading] = useState(false);
    const [days, setDays] = useState("");

    // Get token from localStorage or wherever you store it
    const getToken = () => {
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                const parsedData = JSON.parse(userData);
                return parsedData.token;
            } catch (error) {
                console.error('Error parsing user data:', error);
                return null;
            }
        }
        return localStorage.getItem('token'); // Fallback
    };

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const token = getToken();
                const response = await fetch(`${import.meta.env.VITE_API_URL}/attendance/buttonStatus`, {
                    method: "GET",
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setStatus(data.status);
            } catch (err) {
                console.error(err);
                // You can replace alert with a toast notification if you have one
                alert("Failed to fetch status");
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    const handleToggle = async () => {
        setToggleLoading(true);
        try {
            const token = getToken();
            const payload = { status: !status };
            if (status === true && days) {
                payload.days = Number(days);
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL}/attendance/buttonToggle`, {
                method: "POST",
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setStatus(!status);
            setDays("");
        } catch (err) {
            console.error(err);
            alert("Failed to toggle attendance button");
        } finally {
            setToggleLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading attendance status...</span>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-full">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                            <FiActivity className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Attendance Control</h1>
                            <p className="text-gray-600">Manage attendance button availability for all users</p>
                        </div>
                    </div>
                </div>

                {/* Main Control Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Card Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-800">Button Status Control</h2>
                            <div className="flex items-center space-x-2">
                                {status ? (
                                    <FiToggleRight className="w-6 h-6 text-green-500" />
                                ) : (
                                    <FiToggleLeft className="w-6 h-6 text-red-500" />
                                )}
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    status 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {status ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6">
                        <div className="space-y-6">
                            {/* Status Display */}
                            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Current Status</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        Attendance button is currently{" "}
                                        <span className={status ? "text-green-600" : "text-red-600"}>
                                            {status ? "enabled" : "disabled"}
                                        </span>
                                    </p>
                                </div>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                    status ? 'bg-green-100' : 'bg-red-100'
                                }`}>
                                    <FiActivity className={`w-6 h-6 ${
                                        status ? 'text-green-600' : 'text-red-600'
                                    }`} />
                                </div>
                            </div>

                            {/* Days Input (only when status is enabled) */}
                            {status && (
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        <FiCalendar className="inline w-4 h-4 mr-2" />
                                        Number of days to keep disabled
                                    </label>
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="number"
                                            min="1"
                                            value={days}
                                            onChange={e => setDays(e.target.value)}
                                            disabled={toggleLoading}
                                            placeholder="Enter days..."
                                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        />
                                        <span className="text-sm text-gray-500">
                                            {days && `Will be disabled for ${days} day${days > 1 ? 's' : ''}`}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Action Button */}
                            <div className="flex justify-center pt-4">
                                <button
                                    onClick={handleToggle}
                                    disabled={toggleLoading || (status && !days)}
                                    className={`
                                        flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        ${status 
                                            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl' 
                                            : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
                                        }
                                    `}
                                >
                                    {toggleLoading ? (
                                        <>
                                            <FiLoader className="w-4 h-4 animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : status ? (
                                        <>
                                            <FiToggleLeft className="w-4 h-4" />
                                            <span>Disable Attendance Button</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiToggleRight className="w-4 h-4" />
                                            <span>Enable Attendance Button</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Info Message */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-blue-700">
                                            <strong>Note:</strong> When the attendance button is disabled, users will not be able to mark their attendance. 
                                            {status && " Specify the number of days to temporarily disable the button."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceController;
