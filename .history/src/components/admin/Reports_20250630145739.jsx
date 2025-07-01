import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiDownload, FiCalendar, FiFilter, FiCheck, FiX } from 'react-icons/fi'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { format, isToday, isSunday, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import Papa from 'papaparse'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

const Reports = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedCenter, setSelectedCenter] = useState('')
  const [showAttendanceForm, setShowAttendanceForm] = useState(false)
  const [tutors, setTutors] = useState([])
  const [centers, setCenters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch centers
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const response = await fetch('https://mtc-backend-jn5y.onrender.com/api/centers', {
          headers: {
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userData')).token}`
          }
        })
        const data = await response.json()
        if (response.ok) {
          setCenters(data)
        } else {
          throw new Error(data.message || 'Failed to fetch centers')
        }
      } catch (err) {
        setError(err.message)
      }
    }
    fetchCenters()
  }, [])

  // Fetch attendance data when date or center changes
  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true)
      try {
        const month = selectedDate.getMonth() + 1
        const year = selectedDate.getFullYear()
        const centerId = selectedCenter || ''
        
        const response = await fetch(
          `https://mtc-backend-jn5y.onrender.com/api/attendance/report?month=${month}&year=${year}&centerId=${centerId}`,
          {
            headers: {
              'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userData')).token}`
            }
          }
        )
        
        const data = await response.json()
        if (response.ok) {
          setTutors(data)
        } else {
          throw new Error(data.message || 'Failed to fetch attendance data')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchAttendanceData()
  }, [selectedDate, selectedCenter])

  const handleExportCSV = () => {
    const monthDays = eachDayOfInterval({
      start: startOfMonth(selectedDate),
      end: endOfMonth(selectedDate)
    })

    const data = tutors.map(tutor => {
      // Calculate days in month for the selected month
      const daysInMonth = eachDayOfInterval({
        start: startOfMonth(selectedDate),
        end: endOfMonth(selectedDate)
      }).length;
      
      const presentDays = Object.values(tutor.attendance).filter(Boolean).length;
      
      const attendanceData = {
        'Tutor Name': tutor.tutor.name,
        'Center': tutor.center.name,
        'Total Days': daysInMonth,
        'Present Days': presentDays,
        'Absent Days': daysInMonth - presentDays,
      }

      // Add attendance for each day
      monthDays.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        attendanceData[format(day, 'dd MMM')] = tutor.attendance[dateStr] ? 'Present' : 'Absent'
      })

      return attendanceData
    })

    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `attendance_report_${format(selectedDate, 'MMM_yyyy')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(16)
    doc.text('Monthly Attendance Report', 14, 15)
    doc.setFontSize(12)
    doc.text(`Month: ${format(selectedDate, 'MMMM yyyy')}`, 14, 25)
    if (selectedCenter) {
      doc.text(`Center: ${selectedCenter}`, 14, 35)
    }

    // Create table data
    const tableData = tutors.map(tutor => {
      // Get the total days in the selected month
      const daysInMonth = eachDayOfInterval({
        start: startOfMonth(selectedDate),
        end: endOfMonth(selectedDate)
      }).length;
      
      const presentDays = Object.values(tutor.attendance).filter(Boolean).length;
      const totalDays = daysInMonth; // Use all days in month
      const absentDays = totalDays - presentDays;
      const absentPercentage = totalDays > 0 ? (absentDays / totalDays * 100).toFixed(1) : 0;
      
      return [
        tutor.tutor.name,
        tutor.center.name,
        totalDays,
        presentDays,
        absentDays,
        `${absentPercentage}%`
      ];
    })

    doc.autoTable({
      startY: selectedCenter ? 45 : 35,
      head: [['Tutor Name', 'Center', 'Total Days', 'Present Days', 'Absent Days', 'Absent %']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    })

    doc.save(`attendance_report_${format(selectedDate, 'MMM_yyyy')}.pdf`)
  }

  const handleMarkAttendance = async (tutorId, date, status) => {
    try {
      const response = await fetch('https://mtc-backend-jn5y.onrender.com/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userData')).token}`
        },
        body: JSON.stringify({
          tutorId,
          centerId: selectedCenter,
          date: format(date, 'yyyy-MM-dd'),
          status: status ? 'present' : 'absent'
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to mark attendance')
      }

      // Refresh attendance data
      const month = selectedDate.getMonth() + 1
      const year = selectedDate.getFullYear()
      const centerId = selectedCenter || ''
      
      const attendanceResponse = await fetch(
        `https://mtc-backend-jn5y.onrender.com/api/attendance/report?month=${month}&year=${year}&centerId=${centerId}`,
        {
          headers: {
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userData')).token}`
          }
        }
      )
      
      const attendanceData = await attendanceResponse.json()
      if (attendanceResponse.ok) {
        setTutors(attendanceData)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading Reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Attendance Reports
        </h1>
        <div className="flex gap-4">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
          >
            <FiDownload className="mr-2" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Month
            </label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <DatePicker
                selected={selectedDate}
                onChange={date => setSelectedDate(date)}
                dateFormat="MMMM yyyy"
                showMonthYearPicker
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Center
            </label>
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="">All Centers</option>
                {centers.map(center => (
                  <option key={center._id} value={center._id}>
                    {center.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Monthly Attendance Table */}
        <div className="overflow-x-auto mt-6">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutor Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Center
                </th>
                {/* Total Days Column - Updated May 2025 */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-bold">
                  Total Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Present Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Absent Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Absent %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tutors.map((tutor) => {
                // Get the total days in the selected month
                const daysInMonth = eachDayOfInterval({
                  start: startOfMonth(selectedDate),
                  end: endOfMonth(selectedDate)
                }).length;
                
                // Present days are those marked as present
                const presentDays = Object.values(tutor.attendance).filter(Boolean).length;
                
                // Total days are all days in the month (not just days with attendance records)
                const totalDays = daysInMonth;
                
                // Absent days are days without attendance or explicitly marked absent
                const absentDays = totalDays - presentDays;

                return (
                  <tr key={tutor.tutor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{tutor.tutor.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{tutor.center.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{totalDays}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{presentDays}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{absentDays}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {totalDays > 0 ? `${(absentDays / totalDays * 100).toFixed(1)}%` : '0%'}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {showAttendanceForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Mark Today's Attendance</h2>
              <button
                onClick={() => setShowAttendanceForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="space-y-4">
              {tutors.map(tutor => (
                <div key={tutor.tutor._id} className="flex items-center justify-between">
                  <span className="text-gray-700">{tutor.tutor.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkAttendance(tutor.tutor._id, new Date(), true)}
                      className={`px-3 py-1 rounded-lg ${
                        tutor.attendance[format(new Date(), 'yyyy-MM-dd')] === true
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => handleMarkAttendance(tutor.tutor._id, new Date(), false)}
                      className={`px-3 py-1 rounded-lg ${
                        tutor.attendance[format(new Date(), 'yyyy-MM-dd')] === false
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default Reports