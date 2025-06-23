import React, { useState, useEffect } from 'react';
import { FiSave, FiDownload, FiUsers, FiLock } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { authFetch } from '../../utils/auth';
import Papa from 'papaparse';

// API function to fetch all hadiya records
const fetchHadiyaReportAPI = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  try {
    return await authFetch(`https://mtc-backend-jn5y.onrender.com/api/hadiya/report?${queryString}`);
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// API function to record a hadiya payment
const recordHadiyaPaymentAPI = async (paymentData) => {
  try {
    return await authFetch('https://mtc-backend-jn5y.onrender.com/api/hadiya/record', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

const HadiyaManagement = () => {
  // Current month and year
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Basic state
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedCenter, setSelectedCenter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [centers, setCenters] = useState([]);
  
  // Data state
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Load centers once
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const data = await authFetch(`${import.meta.env.VITE_API_URL}/centers`);
        setCenters(data);
      } catch (error) {
        console.error('Error fetching centers:', error);
        toast.error('Could not load centers');
      }
    };
    fetchCenters();
  }, []);
  
  // Load tutors whenever filters change
  useEffect(() => {
    const fetchTutors = async () => {
      setLoading(true);
      try {
        const params = { 
          month: selectedMonth, 
          year: selectedYear
        };
        if (selectedCenter) params.centerId = selectedCenter;
        if (searchTerm) params.tutorName = searchTerm.trim();
        
        const data = await fetchHadiyaReportAPI(params);
        
        // First, fetch all tutors to get their status
        const allTutorsResponse = await authFetch(`${import.meta.env.VITE_API_URL}/tutors`);
        const activeTutorIds = allTutorsResponse
          .filter(tutor => tutor.status === 'active')
          .map(tutor => tutor._id);
        
        // Filter the hadiya report to only include active tutors
        const activeTutors = (data.report || []).filter(tutor => 
          activeTutorIds.includes(tutor.tutorId)
        );
        
        setTutors(activeTutors);
      } catch (error) {
        toast.error(error.message || 'Failed to fetch tutor data');
        setTutors([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTutors();
  }, [selectedMonth, selectedYear, selectedCenter, searchTerm]);
  
  // Handle payment amount change
  const handleAmountChange = (tutorId, amount) => {
    setTutors(current => 
      current.map(tutor => {
        const existingRecord = tutor.hadiyaRecords?.find(
          r => r.month === selectedMonth && r.year === selectedYear
        );
        // Allow update if not locked, or if forceEdit is true
        if (tutor.tutorId === tutorId && (!existingRecord || tutor.forceEdit)) {
          return {
            ...tutor,
            tempAmount: amount,
            tempStatus: parseFloat(amount) > 0 ? 'Paid' : 'Pending'
          };
        }
        return tutor;
      })
    );
  };
  
  // Handle notes change
  const handleNotesChange = (tutorId, notes) => {
    setTutors(current => 
      current.map(tutor => {
        const existingRecord = tutor.hadiyaRecords?.find(
          r => r.month === selectedMonth && r.year === selectedYear
        );
        // Allow update if not locked, or if forceEdit is true
        if (tutor.tutorId === tutorId && (!existingRecord || tutor.forceEdit)) {
          return {
            ...tutor,
            tempNotes: notes
          };
        }
        return tutor;
      })
    );
  };
  
  // Handle OK button click
  const handleConfirmAmount = (tutorId) => {
    const tutor = tutors.find(t => t.tutorId === tutorId);
    if (!tutor) return;
    
    // Check if payment record already exists
    const existingRecord = tutor.hadiyaRecords?.find(
      r => r.month === selectedMonth && r.year === selectedYear
    );
    
    // If record exists, show message and don't allow changes
    if (existingRecord) {
      toast.error(`Payment of ₹${existingRecord.amountPaid} already recorded for ${selectedMonth}/${selectedYear}. Cannot modify.`);
      return;
    }
    
    const amount = parseFloat(tutor.tempAmount);
    const notes = tutor.tempNotes || '';
    
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    // Update UI state
    setTutors(current => 
      current.map(t => 
        t.tutorId === tutorId ? {
          ...t,
          confirmedAmount: amount,
          paymentStatus: 'Paid',
          confirmedNotes: notes,
          forceEdit: false // After save, lock again
        } : t
      )
    );
    
    toast.success(`Payment of ₹${amount.toLocaleString('en-IN')} with notes saved successfully`);
    
    // Save immediately after confirming
    savePaymentForTutor(tutorId, amount, notes);
  };
  
  // Save payment for a single tutor
  const savePaymentForTutor = async (tutorId, amount, notes) => {
    setSaving(true);
    
    try {
      // Prepare payment data
      const payment = {
        tutorId,
        month: selectedMonth,
        year: selectedYear,
        amountPaid: amount,
        notes: notes || ''
      };
      
      console.log('Saving payment with notes:', payment);
      
      // Save to backend
      await recordHadiyaPaymentAPI(payment);
      
      // Refresh data to show saved state
      refreshData();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(`Failed to save payment: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };
  
  // Refresh data from server
  const refreshData = async () => {
    try {
      const params = { month: selectedMonth, year: selectedYear };
      if (selectedCenter) params.centerId = selectedCenter;
      if (searchTerm) params.tutorName = searchTerm.trim();
      
      const data = await fetchHadiyaReportAPI(params);
      setTutors(data.report || []);
    } catch (error) {
      toast.error('Failed to refresh data');
    }
  };
  
  // Export data to CSV
  const handleExportCSV = () => {
    if (!tutors.length) {
      toast.error('No data to export');
      return;
    }
    
    const csvData = tutors.map(tutor => {
      // Get the existing record for this month/year if any
      const existingRecord = tutor.hadiyaRecords?.find(
        r => r.month === selectedMonth && r.year === selectedYear
      );
      
      // Use confirmed amount if available, otherwise use existing record amount
      const amountPaid = existingRecord?.amountPaid || 0;
      
      return {
        'Tutor ID': tutor.tutorId,
        'Tutor Name': tutor.tutorName,
        'Center': tutor.assignedCenter?.name || 'N/A',
        'Assigned Amount (₹)': tutor.assignedHadiyaAmount || 0,
        'Paid Amount (₹)': amountPaid,
        'Notes': existingRecord?.notes || tutor.tempNotes || '-',  // Added notes column
        'Status': amountPaid > 0 ? 'Paid' : 'Pending',
        'Month': selectedMonth,
        'Year': selectedYear
      };
    });
    
    // Calculate and add total
    const totalPaid = tutors.reduce((sum, tutor) => {
      const record = tutor.hadiyaRecords?.find(r => r.month === selectedMonth && r.year === selectedYear);
      return sum + (record?.amountPaid || 0);
    }, 0);
    
    csvData.push({
      'Tutor ID': 'GRAND TOTAL',
      'Tutor Name': '',
      'Center': '',
      'Assigned Amount (₹)': '',
      'Paid Amount (₹)': totalPaid,
      'Notes': '',  // Added empty notes column for total row
      'Status': '',
      'Month': '',
      'Year': ''
    });
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `hadiya_report_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully');
  };
  
  // Filter options
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-cyan-500 bg-clip-text text-transparent">
          <FaRupeeSign className="inline-block mr-3 text-green-500" size={30}/> Hadiya Management
        </h1>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-lg space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Year Select */}
          <div>
            <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
            >
              {years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
          
          {/* Month Select */}
          <div>
            <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
            >
              {months.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}
            </select>
          </div>
          
          {/* Center Filter */}
          <div>
            <label htmlFor="center-filter" className="block text-sm font-medium text-gray-700 mb-1">Center</label>
            <select
              id="center-filter"
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Centers</option>
              {centers.map(center => (
                <option key={center._id} value={center._id}>{center.name}</option>
              ))}
            </select>
          </div>
          
          {/* Tutor Search */}
          <div>
            <label htmlFor="tutor-search" className="block text-sm font-medium text-gray-700 mb-1">Search Tutor</label>
            <input
              id="tutor-search"
              type="text"
              placeholder="Tutor name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportCSV}
            disabled={loading || tutors.length === 0}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
          >
            <FiDownload className="mr-2" /> Export CSV
          </button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-100 z-10">Tutor Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Center</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Assigned Hadiya (₹)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Notes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tutors.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <FiUsers size={48} className="mx-auto mb-4 text-gray-400"/>
                    <p className="text-xl font-semibold">No tutor data found.</p>
                    <p>Try adjusting the filters or ensure tutors have assigned Hadiya amounts.</p>
                  </td>
                </tr>
              ) : (
                tutors.map((tutor) => {
                  // Find existing payment record for this month/year
                  const existingRecord = tutor.hadiyaRecords?.find(
                    r => r.month === selectedMonth && r.year === selectedYear
                  );
                  
                  // Check if this month/year is already paid and frozen
                  const isLocked = !!existingRecord;
                  
                  // Display value (existing record amount)
                  const amountPaid = existingRecord ? existingRecord.amountPaid : 0;
                  const assignedAmount = tutor.assignedHadiyaAmount || 0;

                  return (
                    <tr key={tutor.tutorId} className={`hover:bg-gray-50 ${isLocked ? 'bg-gray-50' : ''}`}>
                      {/* Tutor Name Cell */}
                      <td className="px-4 py-3 sticky left-0 bg-white hover:bg-gray-50">
                        <div className="font-medium text-gray-900">{tutor.tutorName}</div>
                        <div className="text-sm text-gray-500">ID: ...{tutor.tutorId.slice(-6)}</div>
                      </td>
                      
                      {/* Center Cell */}
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {tutor.assignedCenter?.name || 'N/A'}
                      </td>
                      
                      {/* Assigned Amount Cell */}
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                        {assignedAmount.toLocaleString('en-IN')}
                      </td>
                      
                      {/* Payment Amount Cell */}
                      <td className="px-4 py-3">
                        {(isLocked && !tutor.forceEdit) ? (
                          // LOCKED - Display frozen amount (no lock icon/text)
                          <div className="w-full pl-2 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm flex items-center">
                            <span className="font-medium">₹ {amountPaid.toLocaleString('en-IN')}</span>
                          </div>
                        ) : (
                          // UNLOCKED - Allow new payment entry without button
                          <input
                            type="number"
                            placeholder="Enter amount"
                            value={tutor.tempAmount || ''}
                            onChange={(e) => handleAmountChange(tutor.tutorId, e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                            min="0"
                            max={assignedAmount}
                          />
                        )}
                      </td>
                      
                      {/* Notes Cell */}
                      <td className="px-4 py-3">
                        {(isLocked && !tutor.forceEdit) ? (
                           // Display saved notes for locked payments (no lock icon/text)
                           <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200 min-h-[48px]">
                             {existingRecord?.notes || '-'}
                           </div>
                         ) : (
                          // Notes input field for new payments
                          <textarea
                            placeholder="Add payment notes"
                            value={tutor.tempNotes || ''}
                            onChange={(e) => handleNotesChange(tutor.tutorId, e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded resize-none" 
                            rows="2"
                          />
                        )}
                      </td>
                      
                      {/* Status Cell */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${isLocked ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {isLocked ? (
                            'Paid'
                          ) : (
                            'Pending'
                          )}
                        </span>
                      </td>
                      
                      {/* Action Cell */}
                      <td className="px-4 py-3 text-center">
                        {isLocked ? (
                           <div className="text-xs text-gray-400 italic">Locked</div>
                         ) : (
                           <button 
                             onClick={() => handleConfirmAmount(tutor.tutorId)}
                             className="px-3 py-1.5 bg-primary-600 text-white rounded text-sm font-medium hover:bg-primary-700 transition-colors flex items-center mx-auto"
                           >
                             <FiSave className="mr-1" /> Save
                           </button>
                         )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {tutors.length > 0 && (
              <tfoot className="bg-gray-100">
                <tr>
                  <td colSpan="3" className="px-4 py-3 text-right text-sm font-bold text-gray-700 uppercase sticky left-0 bg-gray-100 z-10">Grand Total Paid:</td>
                  <td className="px-4 py-3 text-center text-sm font-bold text-gray-900" colSpan="4">
                    ₹ {
                      tutors.reduce((total, tutor) => {
                        const record = tutor.hadiyaRecords?.find(r => r.month === selectedMonth && r.year === selectedYear);
                        return total + (record?.amountPaid || 0);
                      }, 0).toLocaleString('en-IN')
                    }
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
};

export default HadiyaManagement;