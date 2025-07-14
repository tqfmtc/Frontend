import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { motion } from 'framer-motion';

const AnnouncementManagement = () => {
  const emptyForm = { title: '', body: '', startDate: null, endDate: null, priority: 3 };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Helper to compute if announcement is within last 1 year
  const isRecent = (a) => {
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    return new Date(a.endDate).getTime() >= oneYearAgo;
  };

  // Helper for dd/mm/yy format
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const fetchAll = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/announcements/all`, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('userData')||'{}').token}`
        }
      });
      const data = await res.json();
      if (!Array.isArray(data)) return;

      // Purge announcements older than 1 year
      const oldOnes = data.filter((a) => !isRecent(a));
      for (const o of oldOnes) {
        try {
          await fetch(`${import.meta.env.VITE_API_URL}/announcements/${o._id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${JSON.parse(localStorage.getItem('userData')||'{}').token}`
            }
          });
        } catch(e) { console.error('Failed to delete old announcement', e); }
      }

      const recent = data.filter(isRecent).sort((a,b)=>b.priority-a.priority);
      setAnnouncements(recent);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.body || !form.startDate || !form.endDate) {
      toast.error('Please fill all fields');
      return;
    }
    if (form.endDate < form.startDate) {
      toast.error('End date cannot be before start date');
      return;
    }
    setLoading(true);
    try {
      const url = editingId ?
        `${import.meta.env.VITE_API_URL}/announcements/${editingId}` :
        `${import.meta.env.VITE_API_URL}/announcements`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('userData')||'{}').token}`
        },
        body: JSON.stringify({
          ...form,
          startDate: form.startDate.toISOString(),
          endDate: form.endDate.toISOString(),
          priority: Number(form.priority) || 0,
        })
      });
      if (res.ok) {
        toast.success(editingId ? 'Announcement updated' : 'Announcement created');
        setForm(emptyForm);
        setEditingId(null);
        fetchAll();
      } else {
        const d = await res.json();
        toast.error(d.message || 'Error');
      }
    } catch (err) {
      console.error(err);
      toast.error('Request failed');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-10">
      <h2 className="text-2xl font-bold text-gray-800">Announcement Management</h2>
      {/* Live preview banner */}
      {(form.title || form.body) && (
        <div className="mb-4 overflow-hidden" style={{ backgroundColor: '#f97316', height: 40 }}>
          <div
            className="marquee-track px-4 text-white"
            style={{ animationDuration: '15s' }}
          >
            {[{ ...form, _id: 'draft' }, ...announcements]
              .sort((a, b) => b.priority - a.priority)
              .map((a) => `${a.title}: ${a.body}`)
              .join('   ')}
          </div>
        </div>
      )}
      <form onSubmit={submit} className="space-y-4 max-w-xl border p-4 rounded shadow">
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          name="title"
          placeholder="Title"
          className="w-full border p-2 rounded"
          value={form.title}
          onChange={handleChange}
        />
        <label className="block text-sm font-medium text-gray-700">Body</label>
        <textarea
          name="body"
          placeholder="Body"
          className="w-full border p-2 rounded"
          value={form.body}
          onChange={handleChange}
        />
        <div className="flex space-x-4">
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <DatePicker
              selected={form.startDate}
              onChange={(date) => setForm((p) => ({ ...p, startDate: date }))}
              placeholderText="Start Date"
              className="border p-2 rounded w-full"
              minDate={new Date()}
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <DatePicker
              selected={form.endDate}
              onChange={(date) => setForm((p) => ({ ...p, endDate: date }))}
              placeholderText="End Date"
              className="border p-2 rounded w-full"
              minDate={form.startDate || new Date()}
            />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Priority</p>
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: 5 }).map((_, idx) => {
              const val = 5 - idx; // 5 (Urgent) .. 1 (Info)
              const filled = form.priority >= val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, priority: val }))}
                  aria-label={`Set priority ${val}`}
                >
                  <span className={`text-2xl ${filled ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                </button>
              );
            })}
            <span className="ml-2 text-sm text-gray-600">
              {form.priority === 5 ? 'Urgent' : form.priority === 4 ? 'High' : form.priority === 3 ? 'Normal' : form.priority === 2 ? 'Low' : 'Info'}
            </span>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} disabled={loading} className="btn bg-primary-600 text-white px-4 py-2 rounded">
          {loading ? 'Saving...' : 'Publish'}
        </motion.button>
      </form>

      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-2">Existing Announcements</h3>
        <ul className="space-y-4">
          {announcements.map((a) => (
            <li key={a._id} className="border p-4 rounded shadow relative">
              <div className="absolute right-2 top-2 flex gap-2 text-xs">
                <button onClick={()=>{
                  setEditingId(a._id); setForm({
                    title:a.title,
                    body:a.body,
                    startDate:new Date(a.startDate),
                    endDate:new Date(a.endDate),
                    priority:a.priority
                  }); window.scrollTo({top:0,behavior:'smooth'});
                }} className="text-blue-600">Edit</button>
                <button onClick={()=>setConfirmDeleteId(a._id)} className="text-red-600">Delete</button>
                {confirmDeleteId===a._id && (
                  <div className="absolute right-2 top-6 bg-white border shadow-md p-3 rounded text-xs z-10">
                    <p>Delete this announcement?</p>
                    <div className="flex gap-2 mt-2">
                      <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={async ()=>{
                        await fetch(`${import.meta.env.VITE_API_URL}/announcements/${a._id}`,{
                          method:'DELETE',
                          headers:{Authorization:`Bearer ${JSON.parse(localStorage.getItem('userData')||'{}').token}`}
                        });
                        toast.success('Deleted');
                        setConfirmDeleteId(null);
                        fetchAll();
                      }}>Yes</button>
                      <button className="px-2 py-1 bg-gray-200 rounded" onClick={()=>setConfirmDeleteId(null)}>No</button>
                    </div>
                  </div>
                )}
              </div>
              <p className="font-semibold">{a.title}</p>
              <p className="text-sm mb-1 whitespace-pre-wrap">{a.body}</p>
              <p className="text-xs text-gray-500">{formatDate(a.startDate)} to {formatDate(a.endDate)} | Priority: {a.priority}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AnnouncementManagement;
