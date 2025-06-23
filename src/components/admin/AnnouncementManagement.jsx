import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { motion } from 'framer-motion';

const AnnouncementManagement = () => {
  const [form, setForm] = useState({
    title: '',
    body: '',
    startDate: null,
    endDate: null,
    priority: 0,
  });
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/announcements/all`, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('userData')||'{}').token}`
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) setAnnouncements(data);
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
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/announcements`, {
        method: 'POST',
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
        toast.success('Announcement created');
        setForm({ title: '', body: '', startDate: null, endDate: null, priority: 0 });
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
      <form onSubmit={submit} className="space-y-4 max-w-xl">
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
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <DatePicker
              selected={form.endDate}
              onChange={(date) => setForm((p) => ({ ...p, endDate: date }))}
              placeholderText="End Date"
              className="border p-2 rounded w-full"
            />
          </div>
        </div>
        <label className="block text-sm font-medium text-gray-700">Priority (higher number shows first)</label>
        <input
          name="priority"
          type="number"
          placeholder="Priority (higher = more prominent)"
          className="w-full border p-2 rounded"
          value={form.priority}
          onChange={handleChange}
        />
        <motion.button whileTap={{ scale: 0.97 }} disabled={loading} className="btn bg-primary-600 text-white px-4 py-2 rounded">
          {loading ? 'Saving...' : 'Publish'}
        </motion.button>
      </form>

      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-2">Existing Announcements</h3>
        <ul className="space-y-4">
          {announcements.map((a) => (
            <li key={a._id} className="border p-4 rounded shadow">
              <p className="font-semibold">{a.title}</p>
              <p className="text-sm mb-1">{a.body}</p>
              <p className="text-xs text-gray-500">{new Date(a.startDate).toLocaleDateString()} to {new Date(a.endDate).toLocaleDateString()} | Priority: {a.priority}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AnnouncementManagement;
