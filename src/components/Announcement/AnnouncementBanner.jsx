import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './AnnouncementBanner.css';


const BAR_HEIGHT = 40; // Height of banner

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [navHeight, setNavHeight] = useState(0);
  const [visible, setVisible] = useState(true);
  const location = useLocation();

  // Get navbar height for positioning
  useEffect(() => {
    const updateNavHeight = () => {
      const nav = document.querySelector('nav');
      if (nav) setNavHeight(nav.offsetHeight);
    };
    updateNavHeight();
    window.addEventListener('resize', updateNavHeight);
    return () => window.removeEventListener('resize', updateNavHeight);
  }, []);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch(`https://mtc-backend-jn5y.onrender.com/api/announcements`);
        const data = await res.json();
        if (Array.isArray(data) && data.length) setAnnouncements(data);
      } catch (err) {
        console.error('Failed to load announcements', err);
      }
    };
    fetchAnnouncements();
  }, []);

  // Hide banner after scrolling beyond hero section (only on home page)
  useEffect(() => {
    if (location.pathname !== '/') return;
    const onScroll = () => {
      const hero = document.getElementById('hero');
      const threshold = hero ? hero.offsetHeight : 500;
      setVisible(window.scrollY < threshold);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  // Do not render on non-home pages
  if (location.pathname !== '/') return null;

  if (!visible || !announcements.length) return null; // Hide when not needed



  return (
    <div
      className="fixed left-0 right-0 z-40 shadow-lg flex items-center"
      style={{ top: navHeight, height: BAR_HEIGHT, backgroundColor: '#f97316', overflow: 'hidden' }}
    >
      <div className="flex-1 h-full overflow-hidden">
        <div className="marquee-ltr px-4 text-white whitespace-nowrap">
          {announcements.map((a, idx) => (
            <span key={idx} className="mr-8 inline-block">
              <span className="font-semibold text-white mr-1">{a.title}:</span>
              <span className="text-white/90">{a.body}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBanner;