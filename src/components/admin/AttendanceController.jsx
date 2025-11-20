import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiCalendar, FiFilter, FiSearch, FiX, FiActivity, FiLoader } from 'react-icons/fi';
import useGet from '../CustomHooks/useGet';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Helper function to check if a date is Sunday
const isSunday = (date) => {
  return new Date(date).getDay() === 0;
};

// Helper function to count ALL days (including Sundays) up to a specific date
const countAllDaysUpTo = (year, month, lastDay) => {
  return lastDay; // Simply return the number of days
};

// Helper function to count ALL days in a date range (including Sundays - they're auto-present)
const countAllDaysInRange = (fromYear, fromMonth, toYear, toMonth) => {
  let count = 0;
  let currentDate = new Date(fromYear, fromMonth - 1, 1);
  const endDate = new Date(toYear, toMonth, 0); // Last day of toMonth
  
  while (currentDate <= endDate) {
    count++;
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
};

const ReportManagement = () => {
  // Attendance Controller State
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Report Management State
  const [fromMonth, setFromMonth] = useState(new Date().getMonth() + 1);
  const [fromYear, setFromYear] = useState(new Date().getFullYear());
  const [toMonth, setToMonth] = useState(new Date().getMonth() + 1);
  const [toYear, setToYear] = useState(new Date().getFullYear());
  const [selectedCenter, setSelectedCenter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tutorQuery, setTutorQuery] = useState('');
  const [centerQuery, setCenterQuery] = useState('');
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapTutor, setMapTutor] = useState(null);
  const [mapPoints, setMapPoints] = useState([]);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const leafletRef = useRef(null);

  const { response: centers } = useGet('/centers');
  const { response: attendanceReport, loading, error: reportError } = useGet(
    `/attendance/report?month=${fromMonth}&year=${fromYear}${selectedCenter ? `&centerId=${selectedCenter}` : ''}&limit=10000`
  );

  // Get token from localStorage
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

  // Load attendance button status
  useEffect(() => {
    const fetchAttendanceStatus = async () => {
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
        setAttendanceStatus(data.status);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch attendance button status");
      } finally {
        setAttendanceLoading(false);
      }
    };
    fetchAttendanceStatus();
  }, []);

  // Handle attendance toggle
  const handleAttendanceToggle = async () => {
    setToggleLoading(true);
    try {
      const token = getToken();
      const payload = { status: !attendanceStatus };

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

      setAttendanceStatus(!attendanceStatus);
      toast.success(`Attendance button ${!attendanceStatus ? 'enabled' : 'disabled'} successfully!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle attendance button");
    } finally {
      setToggleLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    if (!attendanceReport) return [];
    const t = tutorQuery.trim().toLowerCase();
    const c = centerQuery.trim().toLowerCase();
    return attendanceReport.filter((r) => {
      const tutorMatch = !t || r.tutor.name.toLowerCase().includes(t);
      const centerMatch = !c || (r.center?.name || '').toLowerCase().includes(c);
      return tutorMatch && centerMatch;
    });
  }, [attendanceReport, tutorQuery, centerQuery]);

  const openMapForTutor = async (report) => {
    try {
      setIsMapOpen(true);
      setMapTutor(report.tutor);
      setMapPoints([]);
      const token = getToken();
      
      // Use the new getTutorCoordinatesRange endpoint with POST
      const payload = {
        fromMonth: fromMonth,
        fromYear: fromYear,
        toMonth: toMonth,
        toYear: toYear,
        tutorId: report.tutor._id,
        ...(selectedCenter && { centerId: selectedCenter })
      };
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/attendance/tutor-coordinates-range`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Failed to load coordinates');
      const data = await res.json();
      const points = (data?.[0]?.points) || [];
      setMapPoints(points);
    } catch (e) {
      toast.error(e.message || 'Failed to open map');
    }
  };

  useEffect(() => {
    if (!isMapOpen) return;
    let isCancelled = false;
    (async () => {
      try {
        if (!leafletRef.current) {
          const L = await import('leaflet');
          // Leaflet CSS (vite can handle CSS import dynamically)
          await import('leaflet/dist/leaflet.css');
          leafletRef.current = L;
        }
        if (isCancelled) return;
        const L = leafletRef.current;

        // Initialize map once
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const defaultCenter = mapPoints.length ? [mapPoints[0].lat, mapPoints[0].lng] : [20.5937, 78.9629]; // India center fallback
        const map = L.map(mapContainerRef.current).setView(defaultCenter, mapPoints.length ? 13 : 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        const markers = [];
        mapPoints.forEach((p) => {
          const marker = L.circleMarker([p.lat, p.lng], {
            radius: 6,
            color: '#2563eb',
            fillColor: '#3b82f6',
            fillOpacity: 0.7,
          }).addTo(map);
          marker.bindPopup(`${p.date} ${p.time}`);
          markers.push(marker);
        });

        if (markers.length) {
          const group = L.featureGroup(markers);
          map.fitBounds(group.getBounds().pad(0.2));
        }

        mapInstanceRef.current = map;
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isMapOpen, mapPoints]);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      const token = getToken();
      if (!token) {
        throw new Error('Please login to continue');
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/attendance/report/download?month=${fromMonth}&year=${fromYear}${selectedCenter ? `&centerId=${selectedCenter}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-${fromMonth}-${fromYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Report downloaded successfully!');
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    // Use filtered reports instead of all reports
    if (!filteredReports || filteredReports.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    // Generate array of all days in the selected date range
    const daysInRangeArr = [];
    let currentDate = new Date(fromYear, fromMonth - 1, 1);
    const endDate = new Date(toYear, toMonth, 0); // Last day of toMonth
    
    while (currentDate <= endDate) {
      daysInRangeArr.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Create CSV headers array (column names only)
    const headerRow = ['Tutor Name', 'Attendance %', 'Phone', 'Center'];
    
    // Add a column for each day in the range
    daysInRangeArr.forEach(day => {
      const dateObj = new Date(day);
      const displayDate = `${dateObj.getDate()} ${dateObj.toLocaleString('default', { month: 'short' })}`; 
      headerRow.push(displayDate);
    });
    
    // Add summary columns at the end
    headerRow.push('Total Days', 'Present Days', 'Absent Days', 'Final Attendance %');
    
    // Create rows for each tutor (using filteredReports)
    const rows = filteredReports.map(report => {
      // Count marked present days (excluding Sundays)
      const markedPresentDays = Object.entries(report.attendance || {})
        .filter(([date, present]) => present && !isSunday(new Date(date)))
        .length;
      
      // Determine if the range includes current date
      const now = new Date();
      const rangeEndDate = new Date(toYear, toMonth, 0);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      let actualEndYear = toYear;
      let actualEndMonth = toMonth;
      
      if (rangeEndDate > today) {
        actualEndYear = now.getFullYear();
        actualEndMonth = now.getMonth() + 1;
      }
      
      // Count ALL days in the range
      const totalDays = countAllDaysInRange(fromYear, fromMonth, actualEndYear, actualEndMonth);
      
      // Count Sundays in the range (auto-present)
      let sundayCount = 0;
      let currentDate = new Date(fromYear, fromMonth - 1, 1);
      const endDate = new Date(actualEndYear, actualEndMonth, 0);
      while (currentDate <= endDate) {
        if (isSunday(currentDate)) {
          sundayCount++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Total present = marked + Sundays
      const totalPresentDays = markedPresentDays + sundayCount;
      const absentDays = totalDays - totalPresentDays;
      const attendancePercentage = totalDays > 0 ? Math.round((totalPresentDays / totalDays) * 100) : 0;
      
      const row = [
        report.tutor.name,
        `${attendancePercentage}%`,
        report.tutor.phone || 'N/A',
        report.center.name
      ];
      
      // Add attendance status for each day
      daysInRangeArr.forEach(day => {
        const dayDate = new Date(day);
        // If it's a Sunday, mark as Present automatically
        if (isSunday(dayDate)) {
          row.push('Present (Sunday)');
        } else {
          const status = report.attendance?.[day];
          row.push(status ? 'Present' : 'Absent');
        }
      });
      
      // Add summary data at the end
      row.push(totalDays, totalPresentDays, absentDays, `${attendancePercentage}%`);
      
      return row;
    });
    
    // Generate CSV from the prepared data (header row + data rows)
    const csv = Papa.unparse({
      fields: headerRow,
      data: rows
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Report_${format(new Date(fromYear, fromMonth - 1, 1), 'MMM_yyyy')}_to_${format(new Date(toYear, toMonth - 1, 1), 'MMM_yyyy')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${filteredReports.length} tutor(s) successfully!`);
  };

  const handleDownloadPDF = () => {
    // Use filtered reports instead of all reports
    if (!filteredReports || filteredReports.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.text('Attendance Report', 14, 15);
    doc.setFontSize(12);
    const dateRangeText = fromMonth === toMonth && fromYear === toYear
      ? `Month: ${format(new Date(fromYear, fromMonth - 1), 'MMMM yyyy')}`
      : `Period: ${format(new Date(fromYear, fromMonth - 1), 'MMM yyyy')} to ${format(new Date(toYear, toMonth - 1), 'MMM yyyy')}`;
    doc.text(dateRangeText, 14, 25);
    if (selectedCenter) {
      const centerName = centers.find(c => c._id === selectedCenter)?.name || '';
      doc.text(`Center: ${centerName}`, 14, 35);
    }

    // Create table data (using filteredReports)
    const tableData = filteredReports.map(report => {
      // Count marked present days (excluding Sundays)
      const markedPresentDays = Object.entries(report.attendance || {})
        .filter(([date, present]) => present && !isSunday(new Date(date)))
        .length;
      
      // Determine if the range includes current date
      const now = new Date();
      const rangeEndDate = new Date(toYear, toMonth, 0);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      let actualEndYear = toYear;
      let actualEndMonth = toMonth;
      
      if (rangeEndDate > today) {
        actualEndYear = now.getFullYear();
        actualEndMonth = now.getMonth() + 1;
      }
      
      // Count ALL days in the range
      const totalDays = countAllDaysInRange(fromYear, fromMonth, actualEndYear, actualEndMonth);
      
      // Count Sundays (auto-present)
      let sundayCount = 0;
      let currentDate = new Date(fromYear, fromMonth - 1, 1);
      const endDate = new Date(actualEndYear, actualEndMonth, 0);
      while (currentDate <= endDate) {
        if (isSunday(currentDate)) {
          sundayCount++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Total present = marked + Sundays
      const totalPresentDays = markedPresentDays + sundayCount;
      const absentDays = totalDays - totalPresentDays;
      
      return [
        report.tutor.name,
        report.center.name,
        totalDays.toString(),
        totalPresentDays.toString(),
        absentDays.toString()
      ];
    });

    doc.autoTable({
      startY: selectedCenter ? 45 : 35,
      head: [['Tutor Name', 'Center', 'Total Days', 'Present Days', 'Absent Days']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    const fileName = fromMonth === toMonth && fromYear === toYear
      ? `attendance_report_${format(new Date(fromYear, fromMonth - 1, 1), 'MMM_yyyy')}.pdf`
      : `attendance_report_${format(new Date(fromYear, fromMonth - 1, 1), 'MMM_yyyy')}_to_${format(new Date(toYear, toMonth - 1, 1), 'MMM_yyyy')}.pdf`;
    doc.save(fileName);
    
    toast.success(`Exported ${filteredReports.length} tutor(s) successfully!`);
  };

  if (loading || attendanceLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (reportError) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{reportError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Attendance Controller - Small toggle at top with red glow when disabled */}
      <div 
        className={`
          bg-white rounded-lg border p-4 transition-all duration-300
          ${!attendanceStatus 
            ? 'shadow-lg shadow-red-500/50 border-red-300 animate-pulse bg-red-50' 
            : 'shadow-sm border-gray-200'
          }
        `}
        style={{
          boxShadow: !attendanceStatus 
            ? '0 0 20px 5px rgba(239, 68, 68, 0.3), 0 0 40px 10px rgba(239, 68, 68, 0.1)' 
            : undefined
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`
              flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300
              ${!attendanceStatus 
                ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/50' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600'
              }
            `}>
              <FiActivity className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className={`
                text-lg font-semibold transition-colors duration-300
                ${!attendanceStatus ? 'text-red-800' : 'text-gray-800'}
              `}>
                Attendance Button
              </h3>
              <p className={`
                text-sm transition-colors duration-300
                ${!attendanceStatus ? 'text-red-700' : 'text-gray-600'}
              `}>
                Currently <span className={`font-medium ${attendanceStatus ? 'text-green-600' : 'text-red-600'}`}>
                  {attendanceStatus ? 'enabled' : 'disabled'}
                </span>
                {!attendanceStatus && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                    ⚠️ Attention Required
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {toggleLoading && <FiLoader className="w-4 h-4 animate-spin text-gray-400" />}
            <button
              onClick={handleAttendanceToggle}
              disabled={toggleLoading}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2
                ${attendanceStatus 
                  ? 'bg-blue-600 focus:ring-blue-500' 
                  : 'bg-red-500 focus:ring-red-500 shadow-lg shadow-red-500/50'
                } 
                ${toggleLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              style={{
                boxShadow: !attendanceStatus 
                  ? '0 0 15px 3px rgba(239, 68, 68, 0.4)' 
                  : undefined
              }}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300
                  ${attendanceStatus ? 'translate-x-6' : 'translate-x-1'}
                  ${!attendanceStatus ? 'shadow-lg shadow-red-500/30' : ''}
                `}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Reports Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Attendance Reports
        </h1>
        <div className="flex gap-4">
          <button
            onClick={handleDownloadCSV}
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
          >
            <FiDownload className="mr-2" />
            {isLoading ? 'Exporting...' : 'Export to Excel'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Unified Filters Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <FiFilter className="mr-2" />
            Filters & Date Range
          </h3>
          
          {/* Date Range for Report and Map */}
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <div className="flex items-center mb-3">
              <FiCalendar className="mr-2 text-blue-600" />
              <h4 className="text-xs font-semibold text-gray-700">Date Range (Report & Map Coordinates)</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From Month</label>
                <select
                  value={fromMonth}
                  onChange={(e) => setFromMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {new Date(2000, month - 1).toLocaleString('default', { month: 'short' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From Year</label>
                <select
                  value={fromYear}
                  onChange={(e) => setFromYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To Month</label>
                <select
                  value={toMonth}
                  onChange={(e) => setToMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {new Date(2000, month - 1).toLocaleString('default', { month: 'short' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To Year</label>
                <select
                  value={toYear}
                  onChange={(e) => setToYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Center and Search Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Center</label>
              <select
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Centers</option>
                {centers?.map((center) => (
                  <option key={center._id} value={center._id}>
                    {center.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Tutors</label>
              <FiSearch className="absolute left-3 bottom-3 text-gray-400" />
              <input
                type="text"
                value={tutorQuery}
                onChange={(e) => setTutorQuery(e.target.value)}
                placeholder="Search by name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {filteredReports && filteredReports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Center
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => {
                  // Count present days from attendance records (excluding Sundays - they're auto-present)
                  const markedPresentDays = Object.entries(report.attendance || {})
                    .filter(([date, present]) => present && !isSunday(new Date(date)))
                    .length;
                  
                  // Determine if the range includes current date
                  const now = new Date();
                  const rangeEndDate = new Date(toYear, toMonth, 0); // Last day of toMonth
                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  
                  // If range end is in the future or is current month, limit to today
                  let actualEndYear = toYear;
                  let actualEndMonth = toMonth;
                  
                  if (rangeEndDate > today) {
                    actualEndYear = now.getFullYear();
                    actualEndMonth = now.getMonth() + 1;
                  }
                  
                  // Count ALL days in the date range (Sundays are auto-present)
                  const totalDays = countAllDaysInRange(fromYear, fromMonth, actualEndYear, actualEndMonth);
                  
                  // Count Sundays in the range (they're automatically present)
                  let sundayCount = 0;
                  let currentDate = new Date(fromYear, fromMonth - 1, 1);
                  const endDate = new Date(actualEndYear, actualEndMonth, 0);
                  while (currentDate <= endDate) {
                    if (isSunday(currentDate)) {
                      sundayCount++;
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                  }
                  
                  // Total present = marked present days + all Sundays
                  const totalPresentDays = markedPresentDays + sundayCount;
                  
                  // Calculate absent days
                  const absentDays = totalDays - totalPresentDays;

                  // Calculate percentages (handle division by zero)
                  const presentPercentage = totalDays > 0 ? (totalPresentDays / totalDays) * 100 : 0;
                  const absentPercentage = totalDays > 0 ? (absentDays / totalDays) * 100 : 0;

                  return (
                    <tr key={report.tutor._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openMapForTutor(report)}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {report.tutor.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{report.tutor.phone || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{report.center.name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm text-gray-900 mb-1">
                            {Math.round(presentPercentage)}% Present
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-green-600 h-2.5 rounded-full" 
                              style={{ width: `${presentPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try selecting a different month or center.
            </p>
          </div>
        )}
      </div>

      {isMapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-11/12 md:w-3/4 lg:w-2/3 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <div>
                <h2 className="text-lg font-semibold">Attendance Map</h2>
                <p className="text-sm text-gray-500">{mapTutor?.name} • {format(new Date(fromYear, fromMonth - 1, 1), 'MMMM yyyy')}</p>
              </div>
              <button onClick={() => setIsMapOpen(false)} className="p-2 rounded hover:bg-gray-100">
                <FiX />
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div ref={mapContainerRef} className="w-full h-[55vh] rounded-lg overflow-hidden border" />
              </div>
              <div className="space-y-2 overflow-y-auto max-h-[55vh]">
                <h3 className="font-medium">Marked locations ({mapPoints.length})</h3>
                <div className="text-xs text-gray-500">Only present days within selected month are shown.</div>
                <ul className="divide-y">
                  {mapPoints.map((p, idx) => (
                    <li key={idx} className="py-2 text-sm">
                      <div className="font-medium">{p.date} {p.time}</div>
                      <div className="text-gray-600">Lat: {p.lat.toFixed(6)}, Lng: {p.lng.toFixed(6)}</div>
                    </li>
                  ))}
                  {!mapPoints.length && (
                    <li className="py-6 text-sm text-gray-500">No coordinates for this month.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManagement;
