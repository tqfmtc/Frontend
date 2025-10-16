import React, { useEffect, useState } from "react";
import { FiActivity, FiCalendar, FiToggleLeft, FiToggleRight, FiLoader, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const AttendanceController = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toggleLoading, setToggleLoading] = useState(false);
    const [selectedDays, setSelectedDays] = useState(1); // Default to 1 day
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState(null);
    const [selectionEnd, setSelectionEnd] = useState(null);

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
            if (status === true && selectedDays > 0) {
                payload.days = selectedDays;
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
            setSelectedDays(1); // Reset to default
            setSelectionStart(null);
            setSelectionEnd(null);
        } catch (err) {
            console.error(err);
            alert("Failed to toggle attendance button");
        } finally {
            setToggleLoading(false);
        }
    };

    // Calendar utility functions
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const isSameDay = (date1, date2) => {
        if (!date1 || !date2) return false;
        return date1.getDate() === date2.getDate() && 
               date1.getMonth() === date2.getMonth() && 
               date1.getFullYear() === date2.getFullYear();
    };

    const isInRange = (date, start, end) => {
        if (!start || !end || !date) return false;
        const dateTime = date.getTime();
        const startTime = Math.min(start.getTime(), end.getTime());
        const endTime = Math.max(start.getTime(), end.getTime());
        return dateTime >= startTime && dateTime <= endTime;
    };

    const calculateDaysDifference = (start, end) => {
        if (!start || !end) return 0;
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
    };

    const handleDateMouseDown = (date) => {
        if (!status) return; // Only allow selection when status is enabled
        setIsSelecting(true);
        setSelectionStart(date);
        setSelectionEnd(date);
        setSelectedDays(1);
    };

    const handleDateMouseEnter = (date) => {
        if (!isSelecting || !selectionStart || !status) return;
        setSelectionEnd(date);
        setSelectedDays(calculateDaysDifference(selectionStart, date));
    };

    const handleMouseUp = () => {
        setIsSelecting(false);
    };

    // Navigation functions
    const previousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const today = new Date();
        
        const days = [];
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isPast = date < today.setHours(0, 0, 0, 0);
            const isSelected = selectionStart && selectionEnd && isInRange(date, selectionStart, selectionEnd);

            days.push(
                <div
                    key={day}
                    className={`
                        h-10 flex items-center justify-center text-sm cursor-pointer select-none transition-colors
                        ${isPast ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-blue-100'}
                        ${isSelected ? 'bg-blue-500 text-white' : ''}
                        ${!status ? 'cursor-not-allowed opacity-50' : ''}
                    `}
                    onMouseDown={() => !isPast && handleDateMouseDown(date)}
                    onMouseEnter={() => !isPast && handleDateMouseEnter(date)}
                >
                    {day}
                </div>
            );
        }

        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={previousMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={!status}
                    >
                        <FiChevronLeft className="w-4 h-4" />
                    </button>
                    <h3 className="text-lg font-medium text-gray-800">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h3>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={!status}
                    >
                        <FiChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map(dayName => (
                        <div key={dayName} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                            {dayName}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div 
                    className="grid grid-cols-7 gap-1"
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {days}
                </div>

                {/* Selection Info */}
                {status && selectedDays > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Selected:</strong> {selectedDays} day{selectedDays > 1 ? 's' : ''}
                            {selectionStart && selectionEnd && (
                                <span className="ml-2 text-blue-600">
                                    ({selectionStart.toLocaleDateString()} 
                                    {selectedDays > 1 && ` - ${selectionEnd.toLocaleDateString()}`})
                                </span>
                            )}
                        </p>
                    </div>
                )}
            </div>
        );
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

                            {/* Calendar Selector (only when status is enabled) */}
                            {status && (
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        <FiCalendar className="inline w-4 h-4 mr-2" />
                                        Select days to keep disabled (click and drag on calendar)
                                    </label>
                                    {renderCalendar()}
                                </div>
                            )}

                            {/* Action Button */}
                            <div className="flex justify-center pt-4">
                                <button
                                    onClick={handleToggle}
                                    disabled={toggleLoading || (status && selectedDays === 0)}
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
                                            <strong>Instructions:</strong> When attendance is enabled, click and drag on the calendar to select the range of days to disable the attendance button. 
                                            Past dates cannot be selected. Default selection is 1 day.
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
