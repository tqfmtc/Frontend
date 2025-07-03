import { useEffect, useState, useRef } from 'react';
import './AnnouncementBanner.css';
import { useLocation } from 'react-router-dom';


const BAR_HEIGHT = 40; // Height of banner

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [navHeight, setNavHeight] = useState(0);
  const [visible, setVisible] = useState(true);

  const containerRef = useRef(null);
  const contentRef = useRef(null);
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
        if (Array.isArray(data) && data.length) {
            const now = Date.now();
            const filtered = data.filter(a=>{
              const sd = new Date(a.startDate).getTime();
              const ed = new Date(a.endDate).getTime();
              const withinRange = now>=sd && now<=ed;
              const recent = ed >= now - 365*24*60*60*1000;
              return withinRange && recent;
            }).sort((a,b)=>b.priority-a.priority);
            setAnnouncements(filtered);
          }
      } catch (err) {
        console.error('Failed to load announcements', err);
      }
    };
    fetchAnnouncements();
  }, []);

  // After announcements load, compute animation duration & apply to track
  useEffect(() => {
    if (!announcements.length) return;
    const track = contentRef.current;
    if (!track) return;

    // Build the inner HTML once (duplicated to allow seamless loop)
    const msgs = announcements
      .map(a => `<span class='mr-8 inline-block'><span class='font-semibold mr-1'>${a.title}:</span><span>${a.body}</span></span>`)  
      .join('');
    contentRef.current.innerHTML = msgs + msgs; // duplicate

    // Set duration based on width for constant speed (~60px/s)
    const width = contentRef.current.scrollWidth / 2;
    const duration = width / 60; // seconds
    contentRef.current.style.animationDuration = `${duration}s`;
  }, [announcements]);

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
      <div className="flex-1 h-full overflow-hidden" ref={containerRef}>
        <div
          ref={contentRef}
          className="px-4 text-white flex items-center marquee-track"
          style={{ willChange: 'transform' }}
        />
      </div>
    </div>
  );
};

export default AnnouncementBanner;