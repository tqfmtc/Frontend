import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';

const AnnouncementCard = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch(`https://mtc-backend-jn5y.onrender.com/api/announcements`);
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
          // pick highest priority (already sorted in backend)
          setAnnouncement(data[0]);
        }
      } catch (e) {
        console.error('Unable to load announcement', e);
      }
    };
    fetchAnnouncements();
  }, []);

  if (!announcement || dismissed) return null;

  return (
    <div className="bg-primary-600/90 text-white rounded-lg shadow-lg p-4 backdrop-blur-md relative overflow-hidden max-w-sm w-full mx-auto lg:mx-0">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-white/80 hover:text-white"
        aria-label="Dismiss"
      >
        <FiX />
      </button>
      <h3 className="text-lg font-semibold mb-1 leading-none">{announcement.title}</h3>
      <p className="text-sm opacity-90 leading-snug">{announcement.body}</p>
    </div>
  );
};

export default AnnouncementCard;