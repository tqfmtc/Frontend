import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiCalendar, FiFilter } from 'react-icons/fi';
import useGet from '../CustomHooks/useGet';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const ReportManagement = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCenter, setSelectedCenter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { response: centers } = useGet('/centers');
  const { response: attendanceReport, loading, error: reportError } = useGet(
    `/attendance/report?month=${selectedMonth}&year=${selectedYear}${selectedCenter ? `&centerId=${selectedCenter}` : ''}`
  );

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to continue');
      }

      const response = await fetch(
        `https://mtc-backend-jn5y.onrender.com/api/attendance/report/download?month=${selectedMonth}&year=${selectedYear}${
          selectedCenter ? `&centerId=${selectedCenter}` : ''
        }`,
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
      a.download = `attendance-report-${selectedMonth}-${selectedYear}.xlsx`;
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
    // Generate array of all days in the selected month
    const daysInMonthArr = [];
    const date = new Date(selectedYear, selectedMonth - 1, 1);
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    
    for (let i = 1; i <= lastDay; i++) {
      date.setDate(i);
      daysInMonthArr.push(format(date, 'yyyy-MM-dd'));
    }
    
    // Create CSV headers with a column for each day
    const headers = {
      'Tutor Name': 'Tutor Name',
      'Center': 'Center'
    };
    
    // Add a column for each day in the month
    daysInMonthArr.forEach(day => {
      const displayDate = day.split('-')[2]; // Just the day part (DD)
      headers[`Day ${displayDate}`] = `Day ${displayDate}`;
    });
    
    // Add summary columns
    headers['Total Days'] = 'Total Days';
    headers['Present Days'] = 'Present Days';
    headers['Absent Days'] = 'Absent Days';
    headers['Attendance %'] = 'Attendance %';
    
    // Create rows for each tutor
    const rows = attendanceReport.map(report => {
      // Calculate days in the selected month
      const date = new Date(selectedYear, selectedMonth - 1, 1);
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const daysInMonth = lastDay; // Total days in month
      
      const presentDays = Object.values(report.attendance).filter(Boolean).length;
      const absentDays = daysInMonth - presentDays;
      const attendancePercentage = daysInMonth > 0 ? Math.round((presentDays / daysInMonth) * 100) : 0;
      
      const row = {
        'Tutor Name': report.tutor.name,
        'Center': report.center.name
      };
      
      // Add attendance status for each day
      daysInMonthArr.forEach(day => {
        const status = report.attendance[day];
        row[`Day ${day.split('-')[2]}`] = status ? 'Present' : 'Absent';
      });
      
      // Add summary data
      row['Total Days'] = daysInMonth;
      row['Present Days'] = presentDays;
      row['Absent Days'] = absentDays;
      row['Attendance %'] = `${attendancePercentage}%`;
      
      return row;
    });
    
    // Generate CSV from the prepared data
    const csv = Papa.unparse([headers, ...rows]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Report_${format(new Date(selectedYear, selectedMonth - 1, 1), 'MMM_yyyy')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Day-by-day attendance report downloaded successfully!');
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.text('Monthly Attendance Report', 14, 15);
    doc.setFontSize(12);
    doc.text(`Month: ${format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')}`, 14, 25);
    if (selectedCenter) {
      const centerName = centers.find(c => c._id === selectedCenter)?.name || '';
      doc.text(`Center: ${centerName}`, 14, 35);
    }

    // Create table data
    const tableData = attendanceReport.map(report => {
      // Calculate days in the selected month
      const date = new Date(selectedYear, selectedMonth - 1, 1);
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const daysInMonth = lastDay; // Total days in month
      
      const presentDays = Object.values(report.attendance).filter(Boolean).length;
      const absentDays = daysInMonth - presentDays;

      return [
        report.tutor.name,
        report.center.name,
        daysInMonth.toString(),
        presentDays.toString(),
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

    doc.save(`attendance_report_${format(new Date(), 'MMM_yyyy')}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading report...</span>
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
            {isLoading ? 'Downloading...' : 'Download Report'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Center
            </label>
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
        </div>

        {attendanceReport && attendanceReport.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Center
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Days
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Present Days
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Absent Days
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceReport.map((report) => {
                  // Calculate days in the selected month
                  const date = new Date(selectedYear, selectedMonth - 1, 1);
                  const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
                  const daysInMonth = lastDay; // Total days in month
                  
                  // Count present days
                  const presentDays = Object.values(report.attendance).filter(Boolean).length;
                  
                  // Determine if this is the current month and year
                  const now = new Date();
                  const isCurrentMonth = (selectedYear === now.getFullYear()) && (selectedMonth === now.getMonth() + 1);
                  const daysElapsed = isCurrentMonth ? now.getDate() : daysInMonth;
                  // Calculate absent days: only count days that have passed
                  const absentDays = daysElapsed - presentDays;

                  return (
                    <tr key={report.tutor._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {report.tutor.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{report.center.name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{daysInMonth}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{presentDays}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{absentDays}</div>
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
    </div>
  );
};

export default ReportManagement; 