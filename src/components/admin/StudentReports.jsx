import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiSearch, FiFilter, FiFileText, FiCalendar } from 'react-icons/fi';
import useGet from '../CustomHooks/useGet';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

const StudentReports = () => {
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [fromMonth, setFromMonth] = useState('January');
  const [toMonth, setToMonth] = useState('December');

  // State for students and reports
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Fetch data
  const { response: students, loading: studentsLoading } = useGet('/students');
  const { response: centers } = useGet('/centers');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Generate year options (current year and past 5 years)
  const yearOptions = Array.from({ length: 6 }, (_, i) =>
    (new Date().getFullYear() - i).toString(),
  );

  // Filter students based on criteria
  useEffect(() => {
    if (!students) return;

    let filtered = students;

    // Filter by search term (name)
    if (searchTerm) {
      filtered = filtered.filter((student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by center
    if (selectedCenter) {
      filtered = filtered.filter(
        (student) =>
          student.assignedCenter?._id === selectedCenter ||
          student.assignedCenter === selectedCenter,
      );
    }

    setFilteredStudents(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [students, searchTerm, selectedCenter]);

  // Handle student selection
  const toggleStudentSelection = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  // Select all filtered students
  const selectAllFiltered = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s._id)));
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const indexOfLastStudent = currentPage * itemsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  // Generate full report
  const handleGenerateReport = async () => {
    if (selectedStudents.size === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setIsGenerating(true);
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/students/FullReport/students`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${userData.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fromMonth,
            toMonth,
            year: parseInt(selectedYear),
            studentIds: Array.from(selectedStudents),
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate report');
      }

      const data = await response.json();
      setReportData(data);
      setShowReport(true);
      toast.success(`Report generated for ${data.count} student(s)`);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  // ✅ FIXED: Export uses ONLY reportData (no API call) + Proper Marks Export
  const handleExportReport = () => {
    if (!reportData || !reportData.students) {
      toast.error('No report data available. Please generate report first.');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // ---------- SUMMARY SHEET ----------
      const summaryRows = [];
      summaryRows.push(['Student Full Report Summary']);
      summaryRows.push([
        'Report Period:',
        `${reportData.dateRange.fromMonth} - ${reportData.dateRange.toMonth} ${reportData.dateRange.year}`,
      ]);
      summaryRows.push(['Generated On:', new Date().toLocaleString()]);
      summaryRows.push(['Total Students:', reportData.count]);
      summaryRows.push([]);

      summaryRows.push([
        'S.No',
        'Student Name',
        "Father's Name",
        'Gender',
        'Center',
        'Tutor',
        'Contact',
        'School',
        'Class',
        'Medium',
        'Remarks',
        'Attendance %',
        'Average Marks',
        'Overall Grade',
      ]);

      reportData.students.forEach((student, idx) => {
        // Calculate attendance %
        const totalPresent = (student.attendance || []).reduce(
          (sum, att) => sum + (att.presentDays || 0),
          0,
        );
        const totalDays = (student.attendance || []).reduce(
          (sum, att) => sum + (att.totalDays || 0),
          0,
        );
        const attendancePercent =
          totalDays > 0 ? ((totalPresent / totalDays) * 100).toFixed(1) : null;

        // Calculate average marks + grade
        let totalMarks = 0;
        let marksCount = 0;
        if (student.subjectMarks && student.subjectMarks.length > 0) {
          student.subjectMarks.forEach((subjectRecord) => {
            if (subjectRecord.marksPercentage && subjectRecord.marksPercentage.length > 0) {
              subjectRecord.marksPercentage.forEach((mark) => {
                totalMarks += mark.percentage;
                marksCount++;
              });
            }
          });
        }
        const avg = marksCount > 0 ? Number((totalMarks / marksCount).toFixed(1)) : null;
        const grade = avg == null
          ? 'N/A'
          : avg >= 75 ? 'A'
          : avg >= 60 ? 'B'
          : avg >= 50 ? 'C'
          : avg >= 40 ? 'D'
          : 'F';

        summaryRows.push([
          idx + 1,
          student.name || '',
          student.fatherName || '',
          student.gender || '',
          student.assignedCenter?.name || 'Not Assigned',
          student.assignedTutor?.name || 'Not Assigned',
          student.contact || '',
          student.schoolInfo?.name || (student.isNonSchoolGoing ? 'Non-School Going' : ''),
          student.schoolInfo?.class || '',
          student.medium || '',
          student.remarks || '',
          attendancePercent != null ? `${attendancePercent}%` : 'No records',
          avg != null ? `${avg}%` : 'No records',
          grade,
        ]);
      });

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
      summarySheet['!cols'] = [
        { wch: 6 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 20 },
        { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 12 },
        { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      // ---------- PER-STUDENT DETAIL SHEETS ----------
      reportData.students.forEach((student, idx) => {
        const rows = [];

        rows.push([`Student ${idx + 1}: ${student.name || ''}`]);
        rows.push([]);

        // Personal Info
        rows.push(['PERSONAL INFORMATION']);
        rows.push(['Field', 'Value']);
        rows.push(['Name', student.name || '']);
        rows.push(["Father's Name", student.fatherName || '']);
        rows.push(['Gender', student.gender || '']);
        rows.push(['Contact', student.contact || '']);
        rows.push(['Medium', student.medium || '']);
        rows.push([
          'School',
          student.schoolInfo?.name || (student.isNonSchoolGoing ? 'Non-School Going' : ''),
        ]);
        rows.push(['Class', student.schoolInfo?.class || '']);
        rows.push(['Center', student.assignedCenter?.name || 'Not Assigned']);
        rows.push(['Tutor', student.assignedTutor?.name || 'Not Assigned']);
        rows.push(['Aadhar Number', student.aadharNumber || '']);
        rows.push(['Is Orphan', student.isOrphan ? 'Yes' : 'No']);
        if (student.isOrphan && student.guardianInfo) {
          rows.push(['Guardian Name', student.guardianInfo.name || '']);
          rows.push(['Guardian Contact', student.guardianInfo.contact || '']);
        }
        if (student.remarks) {
          rows.push(['Remarks', student.remarks]);
        }
        rows.push([]);

        // Attendance
        rows.push(['ATTENDANCE RECORDS']);
        if (student.attendance && student.attendance.length > 0) {
          rows.push(['Month', 'Present Days', 'Total Days', 'Percentage']);
          student.attendance.forEach((att) => {
            const pct = att.totalDays > 0
              ? ((att.presentDays / att.totalDays) * 100).toFixed(1)
              : '0.0';
            rows.push([att.month, att.presentDays, att.totalDays, `${pct}%`]);
          });
          const totalPresent = student.attendance.reduce((sum, att) => sum + att.presentDays, 0);
          const totalDays = student.attendance.reduce((sum, att) => sum + att.totalDays, 0);
          const pct = totalDays > 0 ? ((totalPresent / totalDays) * 100).toFixed(1) : '0.0';
          rows.push([]);
          rows.push(['TOTAL', totalPresent, totalDays, `${pct}%`]);
        } else {
          rows.push(['No attendance records for this period']);
        }
        rows.push([]);

        // ✅ MARKS - FIXED to properly capture all marks data
        rows.push(['MARKS RECORDS']);
        if (student.subjectMarks && student.subjectMarks.length > 0) {
          let anyMarks = false;
          student.subjectMarks.forEach((subjectRecord, sIdx) => {
            const subjectName = subjectRecord.subject?.name || `Subject ${sIdx + 1}`;
            const list = subjectRecord.marksPercentage || [];

            rows.push([subjectName]);
            if (list && list.length > 0) {
              anyMarks = true;
              rows.push(['Exam Date', 'Percentage']);
              list.forEach((mark) => {
                rows.push([formatDate(mark.examDate), `${mark.percentage}%`]);
              });
              rows.push([]);
            } else {
              rows.push(['No marks records for this subject']);
              rows.push([]);
            }
          });

          rows.push([]);

          // Calculate and add totals
          if (anyMarks) {
            let totalMarks = 0;
            let marksCount = 0;
            student.subjectMarks.forEach((subjectRecord) => {
              if (subjectRecord.marksPercentage && subjectRecord.marksPercentage.length > 0) {
                subjectRecord.marksPercentage.forEach((mark) => {
                  totalMarks += mark.percentage;
                  marksCount++;
                });
              }
            });
            const avgMarks = marksCount > 0 ? (totalMarks / marksCount).toFixed(1) : '0.0';
            const overallGrade = avgMarks >= 75 ? 'A'
              : avgMarks >= 60 ? 'B'
              : avgMarks >= 50 ? 'C'
              : avgMarks >= 40 ? 'D'
              : 'F';
            rows.push(['AVERAGE MARKS', `${avgMarks}%`]);
            rows.push(['OVERALL GRADE', overallGrade]);
          }
        } else {
          rows.push(['No marks records available']);
        }

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];

        const baseName = (student.name || `Student ${idx + 1}`)
          .replace(/[:/\\?*\[\]]/g, '')
          .substring(0, 28);
        const sheetName = `${idx + 1}. ${baseName}`;
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      // ---------- FLAT DATA SHEETS ----------
      // All Students Data
      const flatRows = [];
      flatRows.push([
        'S.No', 'Name', 'Father Name', 'Gender', 'Contact', 'Aadhar Number', 'Medium',
        'Center', 'Tutor', 'School Name', 'Class', 'Is Orphan', 'Guardian Name',
        'Guardian Contact', 'Remarks', 'Total Present Days', 'Total Days', 'Attendance %',
      ]);

      reportData.students.forEach((student, idx) => {
        const totalPresent = (student.attendance || []).reduce((sum, att) => sum + (att.presentDays || 0), 0);
        const totalDays = (student.attendance || []).reduce((sum, att) => sum + (att.totalDays || 0), 0);
        const attendancePercent = totalDays > 0 ? ((totalPresent / totalDays) * 100).toFixed(1) : '0.0';

        flatRows.push([
          idx + 1, student.name || '', student.fatherName || '', student.gender || '',
          student.contact || '', student.aadharNumber || '', student.medium || '',
          student.assignedCenter?.name || 'Not Assigned', student.assignedTutor?.name || 'Not Assigned',
          student.schoolInfo?.name || (student.isNonSchoolGoing ? 'Non-School Going' : ''),
          student.schoolInfo?.class || '', student.isOrphan ? 'Yes' : 'No',
          student.guardianInfo?.name || '', student.guardianInfo?.contact || '',
          student.remarks || '', totalPresent, totalDays, `${attendancePercent}%`,
        ]);
      });

      const flatSheet = XLSX.utils.aoa_to_sheet(flatRows);
      flatSheet['!cols'] = [
        { wch: 6 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 18 }, { wch: 10 },
        { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 20 },
        { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, flatSheet, 'All Students Data');

      // All Attendance Data
      const attRows = [];
      attRows.push(['S.No', 'Student Name', 'Month', 'Present Days', 'Total Days', 'Percentage']);
      reportData.students.forEach((student, idx) => {
        if (student.attendance && student.attendance.length > 0) {
          student.attendance.forEach((att, aIdx) => {
            const pct = att.totalDays > 0 ? ((att.presentDays / att.totalDays) * 100).toFixed(1) : '0.0';
            attRows.push([
              aIdx === 0 ? idx + 1 : '',
              aIdx === 0 ? student.name : '',
              att.month,
              att.presentDays,
              att.totalDays,
              `${pct}%`,
            ]);
          });
        } else {
          attRows.push([idx + 1, student.name, 'No records', 0, 0, '0.0%']);
        }
      });
      const attSheet = XLSX.utils.aoa_to_sheet(attRows);
      attSheet['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, attSheet, 'All Attendance Data');

      // All Marks Data
      const marksRows = [];
      marksRows.push(['S.No', 'Student Name', 'Subject', 'Exam Date', 'Percentage']);
      reportData.students.forEach((student, idx) => {
        if (student.subjectMarks && student.subjectMarks.length > 0) {
          let first = true;
          student.subjectMarks.forEach((subjectRecord) => {
            const subjectName = subjectRecord.subject?.name || 'Unknown Subject';
            const list = subjectRecord.marksPercentage || [];
            if (list.length > 0) {
              list.forEach((mark) => {
                marksRows.push([
                  first ? idx + 1 : '',
                  first ? student.name : '',
                  subjectName,
                  formatDate(mark.examDate),
                  mark.percentage,
                ]);
                first = false;
              });
            } else {
              marksRows.push([first ? idx + 1 : '', first ? student.name : '', subjectName, 'No marks', '']);
              first = false;
            }
          });
        } else {
          marksRows.push([idx + 1, student.name, 'No subjects', '', '']);
        }
      });
      const marksSheet = XLSX.utils.aoa_to_sheet(marksRows);
      marksSheet['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 22 }, { wch: 16 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, marksSheet, 'All Marks Data');

      // Generate filename and download
      const fileName = `Student_Report_${reportData.dateRange.fromMonth}_to_${reportData.dateRange.toMonth}_${reportData.dateRange.year}_${new Date()
        .toISOString()
        .split('T')[0]}.xlsx`;

      XLSX.writeFile(wb, fileName);
      toast.success('Report exported to Excel successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export report');
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <FiFileText className="text-blue-600" />
            Student Full Reports
          </h1>
          <p className="text-gray-600">
            Generate comprehensive reports for students with filtered attendance and marks data
          </p>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <FiFilter className="text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search by name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Name
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter student name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter by center */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Center
              </label>
              <select
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Centers</option>
                {centers?.map((center) => (
                  <option key={center._id} value={center._id}>
                    {center.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* From Month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Month
              </label>
              <select
                value={fromMonth}
                onChange={(e) => setFromMonth(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {monthNames.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* To Month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Month
              </label>
              <select
                value={toMonth}
                onChange={(e) => setToMonth(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {monthNames.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selection Info and Actions */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={selectAllFiltered}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                {selectedStudents.size === filteredStudents.length
                  ? 'Deselect All'
                  : 'Select All Filtered'}
              </button>
              <span className="text-sm text-gray-600">
                {selectedStudents.size} of {filteredStudents.length} students selected
              </span>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={isGenerating || selectedStudents.size === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <FiFileText />
              {isGenerating ? 'Generating...' : 'Get Full Report'}
            </button>
          </div>
        </motion.div>

        {/* Students List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Students ({filteredStudents.length})
          </h2>
          {studentsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No students found matching the criteria
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            selectedStudents.size === filteredStudents.length &&
                            filteredStudents.length > 0
                          }
                          onChange={selectAllFiltered}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gender
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Center
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tutor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentStudents.map((student) => (
                      <tr
                        key={student._id}
                        className={`hover:bg-gray-50 transition-colors ${
                          selectedStudents.has(student._id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedStudents.has(student._id)}
                            onChange={() => toggleStudentSelection(student._id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.fatherName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.gender}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.assignedCenter?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.assignedTutor?.name || 'Not Assigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.contact}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {filteredStudents.length > 0 && (
                <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-gray-50 border-t border-gray-200 space-y-4 md:space-y-0">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-medium">{indexOfFirstStudent + 1}</span> to <span className="font-medium">{Math.min(indexOfLastStudent, filteredStudents.length)}</span> of <span className="font-medium">{filteredStudents.length}</span> students
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Previous
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Next
                  </button>
                </div>
                
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            )}
            </>
          )}
        </motion.div>

        {/* Report Display Modal */}
        <AnimatePresence>
          {showReport && reportData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowReport(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Student Full Report</h2>
                      <p className="text-blue-100 text-sm">
                        {reportData.dateRange.fromMonth} - {reportData.dateRange.toMonth}{' '}
                        {reportData.dateRange.year}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExportReport}
                        className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 font-medium"
                      >
                        <FiDownload />
                        Export to Excel
                      </button>
                      <button
                        onClick={() => setShowReport(false)}
                        className="text-white hover:text-gray-200 text-2xl"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                  <div className="space-y-6">
                    {reportData.students.map((student, idx) => (
                      <div key={student._id} className="border rounded-lg p-6 bg-gray-50">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                          {idx + 1}. {student.name}
                        </h3>

                        {/* Student Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div>
                            <p className="text-sm text-gray-500">Father's Name</p>
                            <p className="font-medium">{student.fatherName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Gender</p>
                            <p className="font-medium">{student.gender}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Center</p>
                            <p className="font-medium">
                              {student.assignedCenter?.name || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Tutor</p>
                            <p className="font-medium">
                              {student.assignedTutor?.name || 'Not Assigned'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Contact</p>
                            <p className="font-medium">{student.contact}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Medium</p>
                            <p className="font-medium">{student.medium}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">School</p>
                            <p className="font-medium">
                              {student.schoolInfo?.name ||
                                (student.isNonSchoolGoing ? 'Non-School Going' : '-')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Class</p>
                            <p className="font-medium">
                              {student.schoolInfo?.class || '-'}
                            </p>
                          </div>
                        </div>

                        {/* Remarks */}
                        {student.remarks && (
                          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                            <h4 className="font-semibold text-gray-900 mb-2">Remarks:</h4>
                            <p className="text-gray-700">{student.remarks}</p>
                          </div>
                        )}

                        {/* Attendance */}
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FiCalendar className="text-blue-600" />
                            Attendance
                          </h4>
                          {student.attendance.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                      Month
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                      Present Days
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                      Total Days
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                      Percentage
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {student.attendance.map((att, attIdx) => (
                                    <tr key={attIdx}>
                                      <td className="px-4 py-2 text-sm">{att.month}</td>
                                      <td className="px-4 py-2 text-sm">
                                        {att.presentDays}
                                      </td>
                                      <td className="px-4 py-2 text-sm">
                                        {att.totalDays}
                                      </td>
                                      <td className="px-4 py-2 text-sm">
                                        <span
                                          className={`px-2 py-1 rounded ${
                                            (att.presentDays / att.totalDays) * 100 >= 75
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-yellow-100 text-yellow-800'
                                          }`}
                                        >
                                          {((att.presentDays / att.totalDays) * 100).toFixed(1)}%
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">
                              No attendance records for this period
                            </p>
                          )}
                        </div>

                        {/* Marks */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FiFileText className="text-purple-600" />
                            Marks
                          </h4>
                          {student.subjectMarks && student.subjectMarks.length > 0 ? (
                            <div className="space-y-4">
                              {student.subjectMarks.map((subjectRecord, subIdx) => (
                                <div
                                  key={subIdx}
                                  className="bg-white rounded-lg p-4"
                                >
                                  <h5 className="font-medium text-gray-900 mb-2">
                                    {subjectRecord.subject?.name ||
                                      `Subject ${subIdx + 1}`}
                                  </h5>
                                  {subjectRecord.marksPercentage.length > 0 ? (
                                    <div className="overflow-x-auto">
                                      <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                          <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                              Exam Date
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                              Percentage
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                          {subjectRecord.marksPercentage.map((mark, mIdx) => (
                                            <tr key={mIdx}>
                                              <td className="px-4 py-2 text-sm">
                                                {formatDate(mark.examDate)}
                                              </td>
                                              <td className="px-4 py-2 text-sm font-medium">
                                                {mark.percentage}%
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-500">
                                      No marks records for this subject
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">
                              No marks records available
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StudentReports;