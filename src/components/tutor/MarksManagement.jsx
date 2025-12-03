import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiTrash2, FiX, FiChevronLeft, FiDownload, FiPlus } from 'react-icons/fi'
import { toast } from 'react-hot-toast'

// Helper to format date from YYYY-MM-DD or Unix timestamp
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    return `${day}-${month}-${year}`
  } catch {
    return dateStr
  }
}

// Convert DD-MM-YY to YYYY-MM-DD for API
const convertToApiFormat = (ddmmyy) => {
  if (!ddmmyy) return ''
  const parts = ddmmyy.split('-')
  if (parts.length === 3) {
    const [d, m, y] = parts
    const fullYear = parseInt(y) < 30 ? 2000 + parseInt(y) : 1900 + parseInt(y)
    return `${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  if (ddmmyy.match(/^\d{4}-\d{2}-\d{2}$/)) return ddmmyy
  return ddmmyy
}

// Convert YYYY-MM-DD to DD-MM-YY for display
const convertToDisplayFormat = (yyyymmdd) => {
  if (!yyyymmdd) return ''
  if (yyyymmdd.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [y, m, d] = yyyymmdd.split('-')
    const shortYear = y.slice(-2)
    return `${d}-${m}-${shortYear}`
  }
  return yyyymmdd
}

const MarksManagement = () => {
  const [currentView, setCurrentView] = useState('students') // 'students' | 'subjects'
  
  // Students list
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [fetchError, setFetchError] = useState(null)

  // Subject list for selected student
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [subjectRecords, setSubjectRecords] = useState([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)

  // Subject details modal
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState(null)

  // Add marks modal and form state
  const [addMarksModalVisible, setAddMarksModalVisible] = useState(false)
  const [selectedSubjectForMarks, setSelectedSubjectForMarks] = useState(null)
  const [marksFormData, setMarksFormData] = useState({
    subjectId: '',
    marksPercentage: '',
    examDate: convertToDisplayFormat(new Date().toISOString().split('T')[0]),
  })
  const [isAddingMarks, setIsAddingMarks] = useState(false)

  // Delete marks
  const [isDeletingMarks, setIsDeletingMarks] = useState(false)

  const userData = JSON.parse(localStorage.getItem('userData') || '{}')
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userData.token}`,
  }

  // Fetch students list on mount
  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true)
      setFetchError(null)
      try {
        const url = `${import.meta.env.VITE_API_URL}/tutors/${userData._id}/students`
        const resp = await fetch(url, { headers: authHeaders })
        if (!resp.ok) throw new Error(`${resp.status}: ${await resp.text()}`)
        const data = await resp.json()
        // Handle both array response and object with students array
        const studentsList = Array.isArray(data) ? data : (Array.isArray(data.students) ? data.students : [])
        setStudents(studentsList)
      } catch (e) {
        setFetchError(e?.message || 'Failed to load students')
      } finally {
        setLoading(false)
      }
    }
    loadStudents()
  }, [userData._id])

  // Fetch subjects for a student
  const fetchSubjects = async (studentId) => {
    setSubjectsLoading(true)
    try {
      const url = `${import.meta.env.VITE_API_URL}/student-subjects/student/${studentId}`
      const resp = await fetch(url, { headers: authHeaders })
      if (!resp.ok) throw new Error('Failed to load subjects')
      const data = await resp.json()
      setSubjectRecords(Array.isArray(data) ? data : [])
    } catch (e) {
      toast.error(e?.message || 'Failed to load subjects')
      setSubjectRecords([])
    } finally {
      setSubjectsLoading(false)
    }
  }

  // Handle student selection
  const handleSelectStudent = (student) => {
    setSelectedStudent(student)
    setCurrentView('subjects')
    fetchSubjects(student._id)
  }

  // Handle back from subjects view
  const handleBackFromSubjects = () => {
    setCurrentView('students')
    setSelectedStudent(null)
    setSubjectRecords([])
  }

  // Open subject details modal
  const openSubjectDetails = (subject) => {
    setSelectedSubject(subject)
    setDetailModalVisible(true)
  }

  const closeSubjectDetails = () => {
    setDetailModalVisible(false)
    setSelectedSubject(null)
  }

  // Open add marks modal
  const openAddMarksModal = () => {
    if (!selectedStudent || subjectRecords.length === 0) {
      toast.error('No subjects available. Please select a student first.')
      return
    }
    setSelectedSubjectForMarks(subjectRecords[0])
    setMarksFormData({
      subjectId: subjectRecords[0]._id,
      marksPercentage: '',
      examDate: convertToDisplayFormat(new Date().toISOString().split('T')[0]),
    })
    setAddMarksModalVisible(true)
  }

  const closeAddMarksModal = () => {
    setAddMarksModalVisible(false)
    setSelectedSubjectForMarks(null)
    setMarksFormData({
      subjectId: '',
      marksPercentage: '',
      examDate: convertToDisplayFormat(new Date().toISOString().split('T')[0]),
    })
  }

  // Handle date change
  const handleDateChange = (text) => {
    setMarksFormData(prev => ({ ...prev, examDate: text }))
  }

  // Handle add marks submission
  const submitAddMarks = async () => {
    // Validation
    if (!marksFormData.subjectId) {
      toast.error('Please select a subject')
      return
    }
    if (!marksFormData.marksPercentage || isNaN(Number(marksFormData.marksPercentage))) {
      toast.error('Please enter valid marks percentage (0-100)')
      return
    }
    const percentage = Number(marksFormData.marksPercentage)
    if (percentage < 0 || percentage > 100) {
      toast.error('Marks must be between 0 and 100')
      return
    }
    if (!marksFormData.examDate) {
      toast.error('Please select exam date')
      return
    }

    setIsAddingMarks(true)
    try {
      const apiExamDate = convertToApiFormat(marksFormData.examDate)
      
      const url = `${import.meta.env.VITE_API_URL}/student-subjects/marks/${selectedStudent._id}/${marksFormData.subjectId}`
      
      const resp = await fetch(url, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          marksPercentage: percentage,
          examDate: apiExamDate,
        })
      })

      if (!resp.ok) {
        const errorData = await resp.json()
        throw new Error(errorData.message || 'Failed to add marks')
      }

      toast.success('Marks added successfully!')
      closeAddMarksModal()
      if (selectedStudent) {
        await fetchSubjects(selectedStudent._id)
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to add marks')
    } finally {
      setIsAddingMarks(false)
    }
  }

  // Handle delete marks
  const handleDeleteMarks = (mark, index) => {
    if (!selectedSubject) return

    // Show confirmation
    if (window.confirm(`Delete marks record? (${formatDate(mark.examDate || mark.recordedAt)} - ${mark.percentage}%)`)) {
      confirmDeleteMarks(index)
    }
  }

  // Confirm and execute delete
  const confirmDeleteMarks = async (markIndex) => {
    if (!selectedSubject) return

    try {
      setIsDeletingMarks(true)
      const url = `${import.meta.env.VITE_API_URL}/student-subjects/delete/${markIndex}/${selectedSubject._id}`
      
      const resp = await fetch(url, {
        method: 'DELETE',
        headers: authHeaders
      })

      if (!resp.ok) {
        throw new Error('Failed to delete marks')
      }

      toast.success('Marks record deleted successfully!')
      if (selectedStudent) {
        await fetchSubjects(selectedStudent._id)
      }
      closeSubjectDetails()
    } catch (e) {
      toast.error(e?.message || 'Failed to delete marks')
    } finally {
      setIsDeletingMarks(false)
    }
  }

  // Render student card
  const renderStudentCard = ({ item }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => handleSelectStudent(item)}
      className="bg-white rounded-2xl shadow-md hover:shadow-lg p-6 cursor-pointer transition-all duration-300 border border-gray-100 hover:border-accent-200"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
          <p className="text-sm text-gray-600">{item.fatherName}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          item.status === 'active' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-700'
        }`}>
          {item.status || 'Active'}
        </span>
      </div>
      <p className="text-sm text-gray-600">Contact: {item.contact}</p>
      <div className="mt-4 flex justify-end">
        <span className="text-accent-600 text-sm font-medium">View Subjects →</span>
      </div>
    </motion.div>
  )

  // Render subject card
  const renderSubjectCard = ({ item }) => {
    const subjectName = item.subject?.subjectName || item.subject?.name || 'Unknown Subject'
    const marksCount = item.marksPercentage?.length || 0

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => openSubjectDetails(item)}
        className="bg-white rounded-2xl shadow-md hover:shadow-lg p-6 cursor-pointer transition-all duration-300 border border-gray-100 hover:border-accent-200"
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-gray-900">{subjectName}</h3>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent-100 text-accent-700">
            {marksCount} record{marksCount !== 1 ? 's' : ''}
          </span>
        </div>

        {marksCount > 0 && (
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">
              <span className="font-medium">Latest:</span> {item.marksPercentage[marksCount - 1]?.percentage}%
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Date:</span> {formatDate(item.marksPercentage[marksCount - 1]?.examDate || item.marksPercentage[marksCount - 1]?.recordedAt)}
            </p>
          </div>
        )}

        {marksCount === 0 && (
          <p className="text-sm text-gray-500 italic">No marks recorded yet</p>
        )}

        <div className="mt-4 flex justify-end">
          <span className="text-accent-600 text-sm font-medium">View Details →</span>
        </div>
      </motion.div>
    )
  }

  // Render marks history table
  const renderMarksHistory = () => {
    if (!selectedSubject || !selectedSubject.marksPercentage || selectedSubject.marksPercentage.length === 0) {
      return <p className="text-center text-gray-500 py-8">No marks records found</p>
    }

    // Sort marks by exam date (ascending)
    const sortedMarks = [...selectedSubject.marksPercentage].sort((a, b) => {
      const dateA = new Date(a.examDate || a.recordedAt).getTime()
      const dateB = new Date(b.examDate || b.recordedAt).getTime()
      return dateA - dateB
    })

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Exam Date</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Percentage</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedMarks.map((mark, idx) => (
              <tr key={mark._id || idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{idx + 1}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{formatDate(mark.examDate || mark.recordedAt)}</td>
                <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900">{mark.percentage}%</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteMarks(mark, idx)
                    }}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // STUDENTS VIEW
  if (currentView === 'students') {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-accent-50 to-primary-50 py-6 px-4 sm:px-6 space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent mb-2">
            Marks Management
          </h1>
          <p className="text-gray-600">Select a student to manage their marks</p>
        </div>

        {/* Students Grid */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-600"></div>
            </div>
          ) : fetchError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
              <p>{fetchError}</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No students found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <div key={student._id} onClick={() => handleSelectStudent(student)}>
                  {renderStudentCard({ item: student })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // SUBJECTS VIEW
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-accent-50 to-primary-50 py-6 px-4 sm:px-6 space-y-6">
      {/* Header with Back Button */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackFromSubjects}
            className="flex items-center gap-2 px-4 py-2 text-accent-600 hover:bg-accent-50 rounded-lg transition-colors font-medium"
          >
            <FiChevronLeft size={20} /> Back
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent">
              {selectedStudent?.name}
            </h1>
            <p className="text-sm text-gray-600">Select a subject to view and manage marks</p>
          </div>
        </div>
        <button
          onClick={openAddMarksModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-600 to-primary-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
        >
          <FiPlus size={18} /> Add Marks
        </button>
      </div>

      {/* Subjects Grid */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        {subjectsLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-600"></div>
          </div>
        ) : subjectRecords.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No subjects found for this student</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectRecords.map((subject) => (
              <div key={subject._id} onClick={() => openSubjectDetails(subject)}>
                {renderSubjectCard({ item: subject })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subject Details Modal */}
      <AnimatePresence>
        {detailModalVisible && selectedSubject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeSubjectDetails}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-gray-200"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-accent-50 to-primary-50 sticky top-0">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedSubject.subject?.subjectName || selectedSubject.subject?.name || 'Subject'}
                </h2>
                <button
                  onClick={closeSubjectDetails}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <FiX size={24} className="text-gray-600" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Marks History Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Marks History</h3>
                  {renderMarksHistory()}
                </div>

                {/* Summary Section */}
                {selectedSubject.marksPercentage && selectedSubject.marksPercentage.length > 0 && (
                  <div className="bg-gradient-to-br from-accent-50 to-primary-50 rounded-xl p-6 border border-accent-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Total Records</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedSubject.marksPercentage.length}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Highest</p>
                        <p className="text-2xl font-bold text-green-600">
                          {Math.max(...selectedSubject.marksPercentage.map(m => m.percentage))}%
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Lowest</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {Math.min(...selectedSubject.marksPercentage.map(m => m.percentage))}%
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Average</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {(selectedSubject.marksPercentage.reduce((sum, m) => sum + m.percentage, 0) / selectedSubject.marksPercentage.length).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={closeSubjectDetails}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Marks Modal */}
      <AnimatePresence>
        {addMarksModalVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeAddMarksModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-accent-50 to-primary-50">
                <h2 className="text-2xl font-bold text-gray-900">Add Marks Record</h2>
                <button
                  onClick={closeAddMarksModal}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <FiX size={24} className="text-gray-600" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Subject
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {subjectRecords.map((subject) => (
                      <button
                        key={subject._id}
                        onClick={() => {
                          setSelectedSubjectForMarks(subject)
                          setMarksFormData(prev => ({ ...prev, subjectId: subject._id }))
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          marksFormData.subjectId === subject._id
                            ? 'bg-accent-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {subject.subject?.subjectName || subject.subject?.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Marks Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Marks Percentage (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={marksFormData.marksPercentage}
                    onChange={(e) => setMarksFormData(prev => ({ ...prev, marksPercentage: e.target.value }))}
                    placeholder="Enter marks"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all"
                  />
                </div>

                {/* Exam Date Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Exam Date (DD-MM-YY)
                  </label>
                  <input
                    type="text"
                    value={marksFormData.examDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    placeholder="e.g., 24-11-25"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: DD-MM-YY</p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50 justify-end">
                <button
                  onClick={closeAddMarksModal}
                  disabled={isAddingMarks}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAddMarks}
                  disabled={isAddingMarks}
                  className="px-4 py-2 bg-gradient-to-r from-accent-600 to-primary-600 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {isAddingMarks ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <FiPlus size={18} /> Add Marks
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MarksManagement
