import React, { useEffect, useState } from 'react';
import { FiCheck, FiSearch, FiX, FiInfo } from 'react-icons/fi';
import { toast } from 'react-toastify';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
];

const TIME_TABS = [
  { key: 'all', label: 'All Time' },
  { key: '3m', label: '3 Months' },
  { key: '6m', label: '6 Months' },
  { key: 'year', label: 'This Year' },
];

const PAGE_SIZE = 10;

const AdminGuestTableModern = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [timeframe, setTimeframe] = useState('all');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);

  const token = localStorage.getItem('token') || JSON.parse(localStorage.getItem('userData') || '{}').token;

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [status, timeframe, search]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const query = status !== 'all' ? `?status=${status}` : '';
      const res = await fetch(`${import.meta.env.VITE_API_URL}/guest/requests${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setRequests(Array.isArray(data) ? data : data.data || []);
      } else {
        toast.error(data.error || 'Failed to fetch requests');
      }
    } catch (err) {
      toast.error('Failed to fetch requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // timeframe filter
  const filterByTime = list => {
    if (timeframe === 'all') return list;
    const today = new Date();
    let start;
    switch (timeframe) {
      case '3m':
        start = new Date();
        start.setMonth(start.getMonth() - 3);
        break;
      case '6m':
        start = new Date();
        start.setMonth(start.getMonth() - 6);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        return list;
    }
    return list.filter(r => new Date(r.createdAt) >= start);
  };

  // search + time + local status filters combined
  const filtered = filterByTime(requests)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter(r => {
    const q = search.toLowerCase();
    return (
      r.guest.name.toLowerCase().includes(q) ||
      r.guest.qualification.toLowerCase().includes(q) ||
      r.tutor.name.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const approveRequest = async id => {
    setProcessingId(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/guest/approve/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setRequests(prev => prev.map(r => (r._id === id ? { ...r, status: 'approved' } : r)));
        toast.success('Request approved');
      } else {
        toast.error(data.error || 'Approval failed');
      }
    } catch (err) {
      toast.error('Approval failed');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };
  
  return (
    <div className="p-6 space-y-4 flex flex-col h-full">
      <h2 className="text-2xl font-bold text-gray-800">Guest Tutor Requests</h2>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl shadow ring-1 ring-gray-200 px-4 py-3">
        <div className="flex gap-2">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                status === t.key
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-indigo-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {TIME_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTimeframe(t.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                timeframe === t.key
                  ? 'bg-indigo-100 text-indigo-800 border-indigo-400'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-indigo-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
          <FiSearch className="text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search guest / tutor..."
            className="bg-transparent outline-none text-sm min-w-[160px]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-200 p-4 flex flex-col flex-grow overflow-hidden">
        <div className="flex-grow overflow-y-auto"><table className="min-w-full text-base">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Guest Name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Qualification</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Requesting Tutor</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Center</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-400">
                  No requests found
                </td>
              </tr>
            ) : (
              paginated.map(req => (
                <tr
                  key={req._id}
                  className="border-b hover:bg-indigo-50 transition cursor-pointer"
                  onClick={() => setSelected(req)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{req.guest.name}</td>
                  <td className="px-4 py-3 text-gray-800">{req.guest.qualification}</td>
                  <td className="px-4 py-3 text-gray-800">{req.tutor.name}</td>
                  <td className="px-4 py-3 text-gray-800">{req.tutor?.assignedCenter?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        req.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    {req.status === 'pending' && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          approveRequest(req._id);
                        }}
                        disabled={processingId === req._id}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium ${
                          processingId === req._id
                            ? 'bg-indigo-300 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <FiCheck /> Approve
                      </button>
                    )}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setSelected(req);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-indigo-50 text-xs font-medium"
                    >
                      <FiInfo /> Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table></div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-4">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className={`px-3 py-1 rounded border text-xs ${
                  page === 1
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-indigo-600 border-indigo-600'
                }`}
              >
                Prev
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className={`px-3 py-1 rounded border text-xs ${
                  page === totalPages
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-indigo-600 border-indigo-600'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail popover */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-xl ring-1 ring-gray-200 p-8 w-full max-w-md animate-fadeIn"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
              onClick={() => setSelected(null)}
            >
              <FiX size={22} />
            </button>
            <h3 className="text-xl font-semibold mb-3">{selected.guest.name}</h3>
            <div className="text-sm space-y-1">
              <p>
                <strong>Center:</strong> {selected.tutor?.assignedCenter?.name || '-'}
              </p>
              <p>
                <strong>Guest Phone:</strong> {selected.guest.phone}
              </p>
              <p>
                <strong>Qualification:</strong> {selected.guest.qualification}
              </p>
              <p>
                <strong>Requesting Tutor:</strong> {selected.tutor.name} ({selected.tutor.phone || '-'})
              </p>
              <p>
                <strong>Tutor Email:</strong> {selected.tutor.email || '-'}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    selected.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : selected.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {selected.status}
                </span>
              </p>
              <p>
                <strong>Absence:</strong>{' '}
                {new Date(selected.dateRange.startDate).toLocaleDateString('en-GB')} –{' '}
                {new Date(selected.dateRange.endDate).toLocaleDateString('en-GB')}
              </p>
              <p>
                <strong>Requested:</strong>{' '}
                {new Date(selected.createdAt).toLocaleDateString('en-GB')}
              </p>
            </div>
            {selected.status === 'pending' && (
              <button
                onClick={() => approveRequest(selected._id)}
                disabled={processingId === selected._id}
                className={`mt-5 w-full py-3 rounded-lg text-sm font-medium ${
                  processingId === selected._id
                    ? 'bg-indigo-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {processingId === selected._id ? 'Processing…' : 'Approve'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGuestTableModern;
